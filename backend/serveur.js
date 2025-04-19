const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Configuration AWS pour LocalStack
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
  s3ForcePathStyle: true,
  endpoint: 'http://localhost:4566'
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbStandard = new AWS.DynamoDB();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration Multer pour S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'photo-bucket',
    acl: 'public-read',
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => cb(null, `original/${uuidv4()}-${file.originalname}`)
  })
});

// Initialisation des ressources
async function initializeResources() {
  try {
    // Création du bucket S3
    try {
      await s3.createBucket({ Bucket: 'photo-bucket' }).promise();
      console.log('Bucket S3 créé');
    } catch (s3Err) {
      if (s3Err.code === 'BucketAlreadyOwnedByYou') {
        console.log('Bucket existe déjà');
      } else throw s3Err;
    }

    // Création de la table DynamoDB
    const tableParams = {
      TableName: 'Photos',
      KeySchema: [{ AttributeName: 'photoId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'photoId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    };

    try {
      await dynamodbStandard.createTable(tableParams).promise();
      console.log('Table DynamoDB créée');
    } catch (ddbErr) {
      if (ddbErr.code === 'ResourceInUseException') {
        console.log('ℹ️ Table existe déjà');
      } else throw ddbErr;
    }
  } catch (err) {
    console.error('Erreur initialisation:', err.message);
  }
}

// Endpoint d'upload
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const { originalname, mimetype, size, location } = req.file;
    const { eventId } = req.body;
    const photoId = uuidv4();

    // Génération miniature
    const thumbnailKey = `thumbnails/${photoId}-${originalname}`;
    const thumbnailBuffer = await sharp(req.file.buffer).resize(200).toBuffer();
    
    await s3.putObject({
      Bucket: 'photo-bucket',
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: mimetype,
      ACL: 'public-read'
    }).promise();

    const thumbnailUrl = `http://localhost:4566/photo-bucket/${thumbnailKey}`;

    // Enregistrement en base
    await dynamodb.put({
      TableName: 'Photos',
      Item: {
        photoId,
        eventId,
        originalName: originalname,
        mimeType: mimetype,
        size,
        originalUrl: location,
        thumbnailUrl,
        createdAt: new Date().toISOString()
      }
    }).promise();

    res.status(201).json({
      photoId,
      originalUrl: location,
      thumbnailUrl
    });
  } catch (err) {
    console.error('Erreur upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// Récupération des photos
app.get('/photos/:eventId', async (req, res) => {
  try {
    const result = await dynamodb.scan({
      TableName: 'Photos',
      FilterExpression: 'eventId = :eventId',
      ExpressionAttributeValues: { ':eventId': req.params.eventId }
    }).promise();
    res.json(result.Items || []);
  } catch (err) {
    console.error('Erreur récupération:', err);
    res.status(500).json({ error: err.message });
  }
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, async () => {
  await initializeResources();
  console.log(`🚀 Serveur prêt sur http://localhost:${PORT}`);
});