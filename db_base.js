const AWS = require('./db_aws_with_config.js');

const _ = require('lodash');

const docClient = new AWS.DynamoDB.DocumentClient();


function BaseTable() {}

BaseTable.addItem = (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  };
  return BaseTable.getPutPromise(params);
};

BaseTable.updateItem = (tableName, key, item, allowUpadateParameters) => {
  const expression = BaseTable.getExpressionValues(item, allowUpadateParameters);
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: `set ${expression.expression}`,
    ExpressionAttributeValues: expression.expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  };
  return BaseTable.getUpdatePromise(params);
};

BaseTable.getItem = (tableName, key) => {
  const params = {
    TableName: tableName,
    Key: key,
  };
  return BaseTable.getGetPromise(params);
};

BaseTable.deleteItem = (tableName, key) => {
  const params = {
    TableName: tableName,
    Key: key,
  };
  return BaseTable.getDeletePromise(params);
};

BaseTable.queryItems = (tableName, key) => {
  const expression = BaseTable.getExpressionValues(key, Object.keys(key));
  const params = {
    TableName: tableName,
    KeyConditionExpression: expression.expression,
    ExpressionAttributeValues: expression.expressionAttributeValues,
  };
  return BaseTable.getQueryPromise(params);
};

BaseTable.queryIndexItems = (tableName, indexName, key) => {
  const expression = BaseTable.getExpressionValues(key, Object.keys(key));
  const params = {
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: expression.expression,
    ExpressionAttributeValues: expression.expressionAttributeValues,
  };
  return BaseTable.getQueryPromise(params);
};

BaseTable.scan = (tableName, limit, lastKey) => {
  const params = {
    TableName: tableName,
  };
  if (!_.isUndefined(limit)) {
    params.Limit = limit;
  }
  if (!_.isUndefined(lastKey)) {
    params.ExclusiveStartKey = lastKey;
  }
  return BaseTable.getScanPromise(params);
};

BaseTable.getExpressionValues = (item, allowParameters) => {
  let expression = '';
  const expressionAttributeValues = {};
  for (const paramName of allowParameters) {
    if (Object.prototype.hasOwnProperty.call(item, paramName)) {
      const shortParamName = `:${paramName.toLowerCase()}`;
      if (expression === '') {
        expression = `${paramName} = ${shortParamName}`;
      } else {
        expression += `, ${paramName} = ${shortParamName}`;
      }
      expressionAttributeValues[shortParamName] = item[paramName];
    }
  }
  return {
    expression,
    expressionAttributeValues,
  };
};

BaseTable.promiseCallBack = (resolve, reject, data, err) => {
  if (err) {
    reject(err);
  } else if (data === undefined || data === null) {
    reject('Item not exist');
  } else {
    resolve(data);
  }
};

BaseTable.getCreateTablePromise = params => new Promise((resolve, reject) => {
  const dynamodb = new AWS.DynamoDB();
  dynamodb.createTable(params, (err, data) => {
    BaseTable.promiseCallBack(resolve, reject, data, err);
  });
});

BaseTable.getPutPromise = params => new Promise((resolve, reject) => {
  docClient.put(params, (err, data) => {
    BaseTable.promiseCallBack(resolve, reject, data, err);
  });
});

BaseTable.getUpdatePromise = params => new Promise((resolve, reject) => {
  docClient.update(params, (err, data) => {
    BaseTable.promiseCallBack(resolve, reject, data, err);
  });
});

BaseTable.getGetPromise = params => new Promise((resolve, reject) => {
  docClient.get(params, (err, data) => {
    if (data == null) {
      BaseTable.promiseCallBack(resolve, reject, null, err);
    } else {
      BaseTable.promiseCallBack(resolve, reject, data.Item, err);
    }
  });
});

BaseTable.getDeletePromise = params => new Promise((resolve, reject) => {
  docClient.delete(params, (err, data) => {
    BaseTable.promiseCallBack(resolve, reject, data, err);
  });
});

BaseTable.getQueryPromise = params => new Promise((resolve, reject) => {
  docClient.query(params, (err, data) => {
    if (data == null) {
      BaseTable.promiseCallBack(resolve, reject, null, err);
    } else {
      BaseTable.promiseCallBack(resolve, reject, data.Items, err);
    }
  });
});

BaseTable.getScanPromise = params => new Promise((resolve, reject) => {
  docClient.scan(params, (err, data) => {
    BaseTable.promiseCallBack(resolve, reject, data, err);
  });
});

BaseTable.pickItem = (item, allowUpdateParameters) => _.pick(item, allowUpdateParameters);

module.exports = BaseTable;
