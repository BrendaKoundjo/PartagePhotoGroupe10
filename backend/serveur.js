const express = require('express');
const multer = require('multer');
const {  S3Client,CreateBucketCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CreateTableCommand, PutItemCommand, ScanCommand, DeleteItemCommand, GetItemCommand} = require('@aws-sdk/client-dynamodb');
const { Upload } = require('@aws-sdk/lib-storage');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const sharp = require('sharp');
const { s3Client, dynamoClient } = require('./aws-config');



const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors());
app.use(express.json());

// Initialisation des ressources
async function initializeResources() {
  try {
    // Création du bucket S3
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: 'photo-bucket' }));
      console.log('Bucket S3 créé avec succès');
    } catch (s3Err) {
      if (s3Err.name === 'BucketAlreadyOwnedByYou' || s3Err.name === 'BucketAlreadyExists') {
        console.log('Bucket existe déjà');
      } else throw s3Err;
    }

    // Création de la table DynamoDB
    const tableParams = {
      TableName: 'Photos',
      AttributeDefinitions: [
        { AttributeName: 'photoId', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'photoId', KeyType: 'HASH' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };

    try {
      await dynamoClient.send(new CreateTableCommand(tableParams));
      console.log('Table DynamoDB créée avec succès');
    } catch (ddbErr) {
      if (ddbErr.name === 'ResourceInUseException') {
        console.log('Table existe déjà');
      } else throw ddbErr;
    }
  } catch (err) {
    console.error('Erreur initialisation:', err);
  }
}

// Endpoint d'upload
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const { eventId } = req.body;
    if (!eventId || eventId.trim() === '') {
      return res.status(400).json({ error: 'eventId est requis' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const photoId = uuidv4();

    // Upload original
    const originalKey = `original/${photoId}-${originalname}`;
    const uploader = new Upload({
      client: s3Client,
      params: {
        Bucket: 'photo-bucket',
        Key: originalKey,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read'
      }
    });
    await uploader.done();
    const originalUrl = `http://localhost:4566/photo-bucket/${originalKey}`;

    // Création miniature
    const thumbnailKey = `thumbnails/${photoId}-${originalname}`;
    const thumbnailBuffer = await sharp(buffer).resize(200).toBuffer();
    await s3Client.send(new PutObjectCommand({
      Bucket: 'photo-bucket',
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: mimetype,
      ACL: 'public-read'
    }));
    const thumbnailUrl = `http://localhost:4566/photo-bucket/${thumbnailKey}`;

    // Enregistrement dans DynamoDB
    const dbParams = {
      TableName: 'Photos',
      Item: {
        photoId: { S: photoId },
        eventId: { S: eventId },
        originalName: { S: originalname },
        mimeType: { S: mimetype },
        size: { N: buffer.length.toString() },
        originalUrl: { S: originalUrl },
        originalKey: { S: originalKey },
        thumbnailUrl: { S: thumbnailUrl },
        thumbnailKey: { S: thumbnailKey },
        createdAt: { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new PutItemCommand(dbParams));

    res.status(201).json({
      photoId,
      originalUrl,
      thumbnailUrl
    });

  } catch (err) {
    console.error('Erreur upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// Récupération des photos par événement
app.get('/photos/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || eventId.trim() === '') {
      return res.status(400).json({ error: 'eventId est requis' });
    }

    const params = {
      TableName: 'Photos',
      FilterExpression: 'eventId = :eventId',
      ExpressionAttributeValues: {
        ':eventId': { S: eventId }
      }
    };

    const result = await dynamoClient.send(new ScanCommand(params));
    const items = (result.Items || []).map(item => ({
      photoId: item.photoId.S,
      eventId: item.eventId.S,
      originalName: item.originalName.S,
      mimeType: item.mimeType.S,
      size: parseInt(item.size.N),
      originalUrl: item.originalUrl.S,
      thumbnailUrl: item.thumbnailUrl.S,
      createdAt: item.createdAt.S
    }));

    res.json(items);
  } catch (err) {
    console.error('Erreur récupération:', err);
    res.status(500).json({ error: err.message });
  }
});

// Suppression d'une photo
app.delete('/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    if (!photoId) {
      return res.status(400).json({ error: 'photoId est requis' });
    }

    // Récupérer la photo
    const params = {
      TableName: 'Photos',
      FilterExpression: 'photoId = :photoId',
      ExpressionAttributeValues: {
        ':photoId': { S: photoId }
      }
    };
    const result = await dynamoClient.send(new GetItemCommand({
      TableName: 'Photos',
      Key: { photoId: { S: photoId } }
    }));
    const item = result.Item;

    if (!item) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    // Supprimer original et miniature du bucket
    await s3Client.send(new DeleteObjectCommand({ Bucket: 'photo-bucket', Key: item.originalKey.S }));

    // Supprimer de DynamoDB
    await dynamoClient.send(new DeleteItemCommand({
      TableName: 'Photos',
      Key: {
        photoId: { S: photoId }
      }
    }));

    res.json({ message: 'Photo supprimée avec succès' });

  } catch (err) {
    console.error('Erreur suppression:', err);
    res.status(500).json({ error: err.message });
  }
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, async () => {
  await initializeResources();
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
