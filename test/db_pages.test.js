
'use strict';

const should = require('chai').should();
const expect = require('chai').expect;

const PagesTable = require('../db_pages.js');

describe('PagesDB', () => {
  it('should create Pages table', (done) => {
    PagesTable.create().then(() => {
      done();
    }, (err) => {
      expect(err.message).to.equal('Table already exists: luke_pages');
      done();
    });
  });

  const bookId = 123456789;
  const page = 123456789;
  const wordsCount = 'wordsCount';
  const checksum = 'checksum';
  const updateTime = 'updateTime';


  it('should create new Pages item', (done) => {
    PagesTable.addItem(bookId, page, wordsCount, checksum).then(() => {
      done();
    }, (err) => {
      console.log(err);
    });
  });

  const updateItem = {
    wordsCount,
    checksum,
    updateTime,
  };

  it('should update Pages item', (done) => {
    PagesTable.updateItem(bookId, page, updateItem).then(() => {
      done();
    }, (err) => {
      console.log(err);
    });
  });

  it('should get Pages item', (done) => {
    PagesTable.getItem(bookId, page).then((item) => {
      expect(item.noUseMessage).to.equal(undefined);
      expect(item.bookId).to.equal(bookId);
      expect(item.page).to.equal(page);
      expect(item.wordsCount).to.equal(wordsCount);
      expect(item.checksum).to.equal(checksum);
      expect(item.updateTime).to.equal(updateTime);

      done();
    }, (err) => {
      console.log(err);
    });
  });


  it('should delete Pages item', (done) => {
    PagesTable.deleteItem(bookId, page).then(() => {
      done();
    }, (err) => {
      console.log(err);
    });
  });
});
