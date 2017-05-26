
const BaseTable = require('./db_base.js');

const tableName = 'luke_pages';

function PagesTable() {}

PagesTable.create = () => {
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'bookId', KeyType: 'HASH' },
      { AttributeName: 'page', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'bookId', AttributeType: 'N' },
      { AttributeName: 'page', AttributeType: 'N' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };
  return BaseTable.getCreateTablePromise(params);
};

PagesTable.addItem = (bookId, page, wordsCount, checksum) => BaseTable.addItem(tableName, {
  bookId,
  page,
  wordsCount,
  checksum,
});

PagesTable.updateItem = (bookId, page, item) => {
  const allowUpdateParameters = [
    'wordsCount', 'checksum', 'updateTime',
  ];

  return BaseTable.updateItem(tableName, {
    bookId,
    page,
  }, item, allowUpdateParameters);
};

PagesTable.getItem = (bookId, page) => BaseTable.getItem(tableName, {
  bookId,
  page,
});

PagesTable.deleteItem = (bookId, page) => BaseTable.deleteItem(tableName, {
  bookId,
  page,
});

module.exports = PagesTable;
