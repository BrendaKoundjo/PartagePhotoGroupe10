const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
  s3: {
    endpoint: 'http://localhost:4566',
    s3ForcePathStyle: true,
  },
  dynamodb: {
    endpoint: 'http://localhost:4566',
  },
  lambda: {
    endpoint: 'http://localhost:4566',
  },
});

module.exports = AWS;