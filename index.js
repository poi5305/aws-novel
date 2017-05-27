#!/usr/bin/env node --harmony
const AWS = require('aws-sdk');
const zlib = require('zlib');
const _ = require('lodash');
const co = require('co');
const program = require('commander');
const parser = require('./parser_ck101.js');
const sleep = require('sleep');
const fp = require('./function_pipe.js');
const bookTable = require('./db_books.js');

const novelBucket = 'ck101-novels';
const folder = 'novels';
const delayTime = 6;

function spiderBookListRunner(forumId, maxPage) {
  return co(function* () {
    for (let page = 1; page <= maxPage; page += 1) {
      console.log('Get forum page', page);
      yield fp
      .pipe(fp.bind(parser.getForumHtml, forumId, page))
      .pipe(parser.parseForum)
      .pipe(item => item.bookList)
      .pipeMap(bookItem => bookTable.addItem(bookItem.bookId, bookItem))
      .pipe(() => { sleep.sleep(delayTime); })
      .catch((v) => { console.log('Error', v); })
      .promise
      ;
    }
  });
}

function spiderBookBodys(bookHeader) {
  const bookId = bookHeader.bookId;
  const maxPage = bookHeader.pageCount;
  let currentPage = _.get(bookHeader, 'updatedPage', 1);
  const currentPost = _.get(bookHeader, 'updatedPost', 1);
  if (currentPage * 10 === currentPost) {
    currentPage += 1;
  }
  return co(function* () {
    const s3 = new AWS.S3();
    for (let page = currentPage; page <= maxPage; page += 1) {
      console.log('Get book', bookId, 'page', page);
      yield fp
      .pipe(fp.bind(parser.getThreadHtml, bookId, page))
      .pipe(parser.parseThreadBody)
      .pipe((item) => {
        const key = `${folder}/${bookId}/${page}.gzip`;
        const gzipBuffer = zlib.gzipSync(Buffer.from(item.content, 'utf8'));
        const updateItem = {
          updatedPage: item.updatedPage,
          updatedPost: item.updatedPost,
          updateTime: Date.now(),
        };
        return s3
        .putObject({ Bucket: novelBucket, Key: key, Body: gzipBuffer, ContentType: 'binary/octet-stream' })
        .promise()
        .then(() => bookTable.updateItem(bookId, updateItem));
      })
      .pipe(() => { sleep.sleep(delayTime); })
      .catch((err) => { console.log('Error', err); })
      .promise
      ;
    }
  });
}

function spiderBooks(bookList) {
  console.log('spiderBooks', bookList);
  return co(function* () {
    for (const bookId of bookList) {
      yield fp
      .pipe(fp.bind(parser.getThreadHtml, bookId, 1))
      .pipe(parser.parseThreadHeader, null, [1])
      .pipe(fp.bind(bookTable.updateItem, _.toNumber(bookId)))
      .pipe(updateItem => updateItem.Attributes)
      .pipe((bookHeader) => {
        const postCount = _.get(bookHeader, 'postCount', 0);
        const currentPost = _.get(bookHeader, 'updatedPost', 1);
        if (postCount === currentPost) {
          console.log('This book is update to date', bookId);
          return Promise.resolve();
        }
        return spiderBookBodys(bookHeader);
      })
      .catch((err) => { console.log('Error', err); })
      .promise
      ;
    }
  });
}

function loopAllBooks() {
  return co(function* () {
    const limit = 3;
    let lastKey;
    let running = true;
    while (running) {
      yield fp
      .pipe(fp.bind(bookTable.scan, limit, lastKey))
      .pipe((result) => {
        lastKey = result.LastEvaluatedKey;
        running = limit === result.Count;
        const bookList = _.map(result.Items, item => item.bookId);
        return spiderBooks(bookList);
      })
      .pipe(() => { sleep.sleep(delayTime); })
      .promise
      ;
    }
  });
}

program
.command('spiderBookList <forumId>')
.description('parse all books info from a forum. 237 or 3419')
.action((id) => {
  const forumId = _.toNumber(id);
  fp
  .pipe(fp.bind(parser.getForumHtml, forumId, 1))
  .pipe(parser.parseForum)
  .pipe((forumResult) => {
    spiderBookListRunner(forumId, forumResult.maxPage);
  })
  .catch((err) => { console.log('Error', err); });
});

program
.command('updateAllBooks')
.description('update all books content in db')
.action(() => {
  console.log('Update all books');
  loopAllBooks().catch((e) => { console.log(e); });
});

program
.command('updateBook <bookId>')
.description('update a book with bookId')
.action((bookId) => {
  console.log(`Update book: ${bookId}`);
  spiderBooks([bookId]);
});

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}

