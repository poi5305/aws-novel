
'use strict';

const should = require('chai').should();
const expect = require('chai').expect;

const BooksTable = require('../db_books.js');

describe('BooksDB', () => {
  it('should create Books table', (done) => {
    BooksTable.create().then(() => {
      done();
    }, (err) => {
      expect(err.message).to.equal('Table already exists: luke_books');
      done();
    });
  });

  const bookId = 123456789;
  const title = 'title';
  const classify = 'classify';
  const imageURL = 'imageURL';
  const postCount = 'postCount';
  const pageCount = 'pageCount';
  const updatedPost = 'updatedPost';
  const updatedPage = 'updatedPage';
  const looksCount = 'looksCount';
  const likesCount = 'likesCount';
  const downloadCount = 'downloadCount';
  const isFinish = 'isFinish';
  const web = 'web';
  const updateTime = 'updateTime';


  it('should create new Books item', (done) => {
    BooksTable.addItem(bookId).then(() => {
      done();
    }, (err) => {
      console.log(err);
    });
  });

  const updateItem = {
    title,
    classify,
    imageURL,
    postCount,
    pageCount,
    updatedPost,
    updatedPage,
    looksCount,
    likesCount,
    downloadCount,
    isFinish,
    web,
    updateTime,
  };

  // it('should update Books item', (done) => {
  //   BooksTable.updateItem(bookId, updateItem).then(() => {
  //     done();
  //   }, (err) => {
  //     console.log(err);
  //   });
  // });

  // it('should get Books item', (done) => {
  //   BooksTable.getItem(bookId).then((item) => {
  //     expect(item.noUseMessage).to.equal(undefined);
  //     expect(item.bookId).to.equal(bookId);
  //     expect(item.title).to.equal(title);
  //     expect(item.classify).to.equal(classify);
  //     expect(item.imageURL).to.equal(imageURL);
  //     expect(item.postCount).to.equal(postCount);
  //     expect(item.pageCount).to.equal(pageCount);
  //     expect(item.updatedPost).to.equal(updatedPost);
  //     expect(item.updatedPage).to.equal(updatedPage);
  //     expect(item.looksCount).to.equal(looksCount);
  //     expect(item.likesCount).to.equal(likesCount);
  //     expect(item.downloadCount).to.equal(downloadCount);
  //     expect(item.isFinish).to.equal(isFinish);
  //     expect(item.web).to.equal(web);
  //     expect(item.updateTime).to.equal(updateTime);

  //     done();
  //   }, (err) => {
  //     console.log(err);
  //   });
  // });


  // it('should delete Books item', (done) => {
  //   BooksTable.deleteItem(bookId).then(() => {
  //     done();
  //   }, (err) => {
  //     console.log(err);
  //   });
  // });

  it('should scan Books item', (done) => {
    BooksTable.scanTitle('歷史', 100).then((itmes) => {
      console.log(itmes);
      done();
    }, (err) => {
      console.log(err);
    });
  });
});
