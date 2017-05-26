const _ = require('lodash');

const BaseTable = require('./db_base.js');

const tableName = 'luke_books';

function BooksTable() {}

BooksTable.create = () => {
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'bookId', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'bookId', AttributeType: 'N' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  return BaseTable.getCreateTablePromise(params);
};

BooksTable.addItem = (bookId, item) => {
  const allowUpdateParameters = [
    'title', 'classify', 'imageURL', 'postCount', 'pageCount', 'updatedPost', 'updatedPage', 'looksCount', 'likesCount', 'downloadCount', 'isFinish', 'web', 'updateTime',
  ];
  const filteredItem = BaseTable.pickItem(item, allowUpdateParameters);
  return BaseTable.addItem(tableName, _.merge({
    bookId,
    createdTime: Date.now(),
  }, filteredItem));
};

BooksTable.updateItem = (bookId, item) => {
  const allowUpdateParameters = [
    'title', 'classify', 'imageURL', 'postCount', 'pageCount', 'updatedPost', 'updatedPage', 'looksCount', 'likesCount', 'downloadCount', 'isFinish', 'web', 'updateTime',
  ];

  return BaseTable.updateItem(tableName, {
    bookId,
  }, item, allowUpdateParameters);
};

BooksTable.getItem = bookId => BaseTable.getItem(tableName, {
  bookId,
});

BooksTable.deleteItem = bookId => BaseTable.deleteItem(tableName, {
  bookId,
});

module.exports = BooksTable;
