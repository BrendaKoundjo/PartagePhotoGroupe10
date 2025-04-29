// aws-config.js
const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const localConfig = {
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    },
    endpoint: 'http://localhost:4566',
    forcePathStyle: true // uniquement pour S3
};

const s3Client = new S3Client(localConfig);
const dynamoClient = new DynamoDBClient(localConfig);

module.exports = { s3Client, dynamoClient };
