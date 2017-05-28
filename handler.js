const AWS = require('aws-sdk');
const fs = require('fs');
const _ = require('lodash');
const co = require('co');
const zlib = require('zlib');
const Epub = require('epub-gen');
const fp = require('./function_pipe.js');
const bookTable = require('./db_books.js');

const novelBucket = 'ck101-novels';
const folder = 'novels';

function doResponse(callback, statusCode, body) {
  const response = {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
  callback(null, response);
}

function doResponseData(callback, statusCode, filename, body) {
  const response = {
    statusCode,
    body,
    headers: {
      'Content-Type': 'application/force-download',
      'Content-Transfer-Encoding': 'Binary',
      'Content-Disposition': `filename*=UTF-8''${encodeURI(filename)}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
  };
  callback(null, response);
}

function getBookHeaderText(book) {
  let bookHeader = `書名: ${book.title}\n`;
  bookHeader += `分類: ${book.classify}\n`;
  bookHeader += '程式作者: Andy\n';
  bookHeader += `總章數: ${book.updatedPost}\n`;
  bookHeader += `總頁數: ${book.updatedPage}\n\n`;
  return bookHeader;
}

module.exports.getBooks = (event, context, callback) => {
  const limit = 10;
  const lastBookId = _.toNumber(_.get(event, 'queryStringParameters.lastBookId', 0));
  let lastKey;
  if (lastBookId !== 0) {
    lastKey = { bookId: lastBookId };
  }
  fp
  .pipe(fp.bind(bookTable.scan, limit, lastKey))
  .pipe(fp.bind(doResponse, callback, 200))
  .catch(fp.bind(doResponse, callback, 400))
  ;
};

module.exports.getBooksInfo = (event, context, callback) => {
  const bookId = _.toNumber(_.get(event, 'pathParameters.bookId', 0));
  fp
  .pipe(() => new Promise((resolve) => {
    const s3 = new AWS.S3();
    const key = `${folder}/${bookId}/1.gzip`;
    fp
    .pipe(() => s3.getObject({ Bucket: novelBucket, Key: key }).promise())
    .pipe(obj => obj.Body)
    .pipe(zlib.gunzipSync)
    .pipe(txtBuf => resolve(txtBuf.toString('utf8')))
    ;
  }))
  .pipe(fp.bind(doResponse, callback, 200))
  .catch(fp.bind(doResponse, callback, 400))
  ;
};

module.exports.getBooksTXT = (event, context, callback) => {
  const s3 = new AWS.S3();
  const compress = _.get(event, 'queryStringParameters.compress', false);
  const bookId = _.toNumber(_.get(event, 'pathParameters.bookId', 0));
  fp
  .pipe(fp.bind(bookTable.getItem, bookId), null, [1, 2])
  .pipe(book => `${book.title}.txt`, null, 3)
  .pipe(book => co(function* () {
    const maxPage = _.get(book, 'updatedPage', 0);

    let buffer = new Buffer(getBookHeaderText(book));
    for (let page = 1; page <= maxPage; page += 1) {
      const key = `${folder}/${bookId}/${page}.gzip`;
      yield fp
      .pipe(() => s3.getObject({ Bucket: novelBucket, Key: key }).promise())
      .pipe(obj => obj.Body)
      .pipe(zlib.gunzipSync)
      .pipe(txtBuf => new Promise((resolve) => {
        buffer = Buffer.concat([buffer, txtBuf]);
        resolve(buffer);
      }))
      .promise;
    }
    return buffer;
  }))
  .pipe((b) => {
    if (compress) {
      return zlib.gzipSync(b).toString('base64');
    }
    return b.toString('utf8');
  })
  .pipe(fp.bind(doResponseData, callback, 200))
  .catch(fp.bind(doResponse, callback, 400))
  ;
};

module.exports.getBooksEBook = (event, context, callback) => {
  const s3 = new AWS.S3();
  const bookId = _.toNumber(_.get(event, 'pathParameters.bookId', 0));
  fp
  .pipe(fp.bind(bookTable.getItem, bookId), null, [1, 2])
  .pipe(book => `${book.title}.epub`, null, 3)
  .pipe(book => co(function* () {
    const maxPage = _.get(book, 'updatedPage', 0);
    const header = _.replace(getBookHeaderText(book), /\n/g, '<br />');
    const epubOption = {
      title: book.title,
      author: 'aws-novel (程式作者 Andy)',
      publisher: 'Andy',
      content: [{
        title: '資訊',
        data: `<p>${header}</p>`,
      }],
      tempDir: '/tmp/',
    };

    for (let page = 1; page <= maxPage; page += 1) {
      const key = `${folder}/${bookId}/${page}.gzip`;
      yield fp
      .pipe(() => s3.getObject({ Bucket: novelBucket, Key: key }).promise())
      .pipe(obj => obj.Body)
      .pipe(zlib.gunzipSync)
      .pipe(txtBuf => new Promise((resolve) => {
        const content = _.replace(txtBuf.toString('utf8'), /\n/g, '<br />');
        epubOption.content.push({
          title: `Page: ${page}`,
          data: `<p>${content}</p>`,
        });
        resolve();
      }))
      .promise;
    }
    return new Epub(epubOption, '/tmp/tmp.epub').promise;
  }))
  .pipe(() => fs.readFileSync('/tmp/tmp.epub').toString('base64'))
  .pipe(fp.bind(doResponseData, callback, 200))
  .catch(fp.bind(doResponse, callback, 400))
  ;
};

