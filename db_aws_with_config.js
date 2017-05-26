const AWS = require('aws-sdk');

AWS.config.update({
  region: 'ap-northeast-1', // Asia Pacific (Tokyo)
});

module.exports = AWS;
