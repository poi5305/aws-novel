const https = require('https');
const cheerio = require('cheerio');
const _ = require('lodash');
const sscanf = require('scanf').sscanf;

function getHttpsContent(path) {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'ck101.com',
      port: 443,
      path: `/${path}`,
      method: 'GET',
    };
    const req = https.request(options, (res) => {
      let html = '';
      res.on('data', (chunk) => {
        html += chunk;
      });
      res.on('end', () => {
        resolve(html);
      });
    });
    req.end();
    req.on('error', (e) => {
      reject(e);
    });
  });
}

function ParserCK101() {}

ParserCK101.getUrl = path => getHttpsContent(path);

ParserCK101.getForumHtml = (forumId, page) => {
  const URL = ParserCK101.toForumURL(forumId, page);
  return getHttpsContent(URL);
};

ParserCK101.getThreadHtml = (threadId, page) => {
  const URL = ParserCK101.toThreadURL(threadId, page);
  return getHttpsContent(URL);
};

ParserCK101.getPageCount = (postCount) => {
  if (postCount === 0) {
    return 0;
  }
  return Math.floor(postCount / 10) + 1;
};

ParserCK101.isFinish = (title) => {
  if (title.indexOf('已完') !== -1) {
    return true;
  }
  return false;
};

ParserCK101.toThreadURL = (bookId, page) => `thread-${bookId}-${page}-1.html`;

ParserCK101.toForumURL = (forumId, page) => `forum-${forumId}-${page}.html`;

ParserCK101.parseThreadURL = URL => sscanf(URL, '%s://ck101.com/thread-%d-%d-%d.html');

ParserCK101.parseForumURL = URL => sscanf(URL, '%s://ck101.com/forum-%d-%d.html');

ParserCK101.parseForum = (html) => {
  const $ = cheerio.load(html);
  const [, , maxPage] = ParserCK101.parseForumURL($('.pg a.last').eq(0).attr('href'));
  const threadRows = $('*[id^=normalthread]');
  const bookList = [];
  threadRows.each((idx, e) => {
    const $e = $(e);
    const bookId = _.toNumber($e.attr('tid'));
    const imgURL = $e.find('img').eq(0).attr('src');
    const classify = $e.find('div.blockTitle em').eq(0).text();
    const title = $e.find('div.blockTitle a').eq(1).text();
    const pageCount = _.toNumber($e.find('.postInfo .tps a').last().text());
    const isFinish = ParserCK101.isFinish(title);

    if (classify !== '[版務公告]') {
      bookList.push({
        bookId,
        title,
        classify,
        pageCount: (pageCount === 0 ? 1 : pageCount),
        isFinish,
        imgURL,
        // web: 'ck101',
      });
    }
  });
  return {
    bookList,
    maxPage,
  };
};

ParserCK101.parseThreadBody = (html) => {
  const $ = cheerio.load(html);
  const updatedPage = _.toNumber($('.pg strong').eq(0).text());
  const updatedPost = _.toNumber($('.postNum a em').last().text());

  const posts = $('*[id^=postmessage_]');
  const postPositions = [];
  let content = '';
  posts.each((idx, e) => {
    postPositions.push(content.length);
    content += _.replace($(e).text(), /&nbsp;/g, '');
  });
  const wordsCount = content.length;
  return {
    content,
    updatedPage,
    updatedPost,
    postPositions,
    wordsCount,
    checksum: wordsCount,
  };
};

ParserCK101.parseThreadHeader = (html) => {
  const $ = cheerio.load(html);
  const $postList = $('#postlist').eq(0);

  const title = $postList.find('h1').eq(0).text();
  const classify = $postList.find('h2').eq(0).text();
  const isFinish = ParserCK101.isFinish(title);

  // $url = trim($html->find("link", 0)->href);
  const URL = $('link').eq(0).attr('href');
  const [, bookId] = ParserCK101.parseThreadURL(URL);

  const looksCount = _.toNumber($('.viewNum').text());
  const likesCount = _.toNumber($('.thankNum').text());
  const postCount = _.toNumber($('.replayNum').text());
  const pageCount = ParserCK101.getPageCount(postCount);

  const bookInfo = {
    bookId,
    title,
    classify,
    isFinish,
  };

  if (looksCount !== 0) {
    bookInfo.looksCount = looksCount;
    bookInfo.likesCount = likesCount;
    bookInfo.postCount = postCount;
    bookInfo.pageCount = pageCount;
  }

  return bookInfo;
};

module.exports = ParserCK101;
