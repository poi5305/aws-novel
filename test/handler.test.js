
'use strict';

const should = require('chai').should();
const expect = require('chai').expect;
const fp = require('../function_pipe.js');

const handler = require('../handler.js');

const apiWapper = (apiFunc, event) => new Promise((resolve) => {
  apiFunc(event, {}, (_, response) => {
    resolve(response);
  });
});

describe('Handler', () => {
  const event = {};

  it('should get book list', (done) => {
    fp
    .pipe(fp.bind(apiWapper, handler.getBooks, event))
    .pipe(response => JSON.parse(response.body))
    .pipe(body => body.LastEvaluatedKey.bookId)
    .pipe((lastKey) => {
      event.queryStringParameters = { lastBookId: lastKey };
      return event;
    })
    .pipe(fp.bind(apiWapper, handler.getBooks))
    .pipe((response) => {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should get book info', (done) => {
    event.pathParameters = { bookId: '3729819' };
    fp
    .pipe(fp.bind(apiWapper, handler.getBooksInfo, event))
    .pipe((response) => {
      console.log(response);
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should get book txt', (done) => {
    event.pathParameters = { bookId: '3729819' };
    fp
    .pipe(fp.bind(apiWapper, handler.getBooksTXT, event))
    .pipe((response) => {
      console.log(response);
      // expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should get book txt', (done) => {
    event.pathParameters = { bookId: '3729819' };
    fp
    .pipe(fp.bind(apiWapper, handler.getBooksEBook, event))
    .pipe((response) => {
      console.log(response);
      // expect(response.statusCode).to.equal(200);
      done();
    });
  }).timeout(120000);
});
