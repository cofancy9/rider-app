const path = require('path');
const { Storage } = require('@google-cloud/storage');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET || 'rider-user-documents';
const bucket = storage.bucket(bucketName);

const uploadDocument = async (req, res) => {
  const startTime = process.hrtime();
  try {
    logger.info('Upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({
        status: 'error',
        message: 'Document type is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${userId}-${Date.now()}${fileExtension}`;
    const cloudPath = `documents/${userId}/${filename}`;

    // Upload to Google Cloud Storage
    if (process.env.NODE_ENV === 'production') {
      const blob = bucket.file(cloudPath);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalname: req.file.originalname,
            userId: userId,
            documentType: type
          }
        }
      });

      blobStream.on('error', (error) => {
        logger.error('Cloud storage upload error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Error uploading to cloud storage'
        });
      });

      blobStream.on('finish', async () => {
        // Make the file public
        try {
          await blob.makePublic();
        } catch (error) {
          logger.error('Error making blob public:', error);
        }

        // Add document reference to user
        user.documents.push({
          type,
          documentId: cloudPath,
          verificationStatus: 'pending'
        });

        await user.save();

        const endTime = process.hrtime(startTime);
        logger.info(`Document upload completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

        res.status(200).json({
          status: 'success',
          data: {
            document: user.documents[user.documents.length - 1],
            filename: cloudPath,
            size: req.file.size,
            url: `https://storage.googleapis.com/${bucketName}/${cloudPath}`
          }
        });
      });

      blobStream.end(req.file.buffer);
    } else {
      // Development environment - store locally
      const localPath = path.join(__dirname, '../uploads', filename);
      await require('fs').promises.writeFile(localPath, req.file.buffer);

      user.documents.push({
        type,
        documentId: filename,
        verificationStatus: 'pending'
      });

      await user.save();

      res.status(200).json({
        status: 'success',
        data: {
          document: user.documents[user.documents.length - 1],
          filename: filename,
          size: req.file.size
        }
      });
    }
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error uploading document'
    });
  }
};

const listDocuments = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('documents');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Add signed URLs for production environment
    if (process.env.NODE_ENV === 'production' && user.documents.length > 0) {
      const documentsWithUrls = await Promise.all(user.documents.map(async (doc) => {
        const file = bucket.file(doc.documentId);
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        });
        return {
          ...doc.toObject(),
          url
        };
      }));

      const endTime = process.hrtime(startTime);
      logger.info(`Document listing completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

      return res.status(200).json({
        status: 'success',
        data: {
          documents: documentsWithUrls
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        documents: user.documents
      }
    });
  } catch (error) {
    logger.error('Document list error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving documents'
    });
  }
};

const downloadDocument = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const document = user.documents.find(doc => doc.documentId === documentId);
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (process.env.NODE_ENV === 'production') {
      const file = bucket.file(document.documentId);
      const [exists] = await file.exists();
      
      if (!exists) {
        return res.status(404).json({
          status: 'error',
          message: 'Document file not found in storage'
        });
      }

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      const endTime = process.hrtime(startTime);
      logger.info(`Document download URL generation completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

      return res.status(200).json({
        status: 'success',
        data: {
          url
        }
      });
    } else {
      // Development environment - serve local file
      const filePath = path.join(__dirname, '../uploads', document.documentId);
      
      try {
        await require('fs').promises.access(filePath);
      } catch (error) {
        return res.status(404).json({
          status: 'error',
          message: 'Document file not found'
        });
      }

      res.download(filePath);
    }
  } catch (error) {
    logger.error('Document download error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error downloading document'
    });
  }
};

const deleteDocument = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const documentIndex = user.documents.findIndex(doc => doc.documentId === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Document not found'
      });
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        await bucket.file(documentId).delete();
      } catch (error) {
        logger.error('Cloud storage deletion error:', error);
      }
    } else {
      try {
        await require('fs').promises.unlink(
          path.join(__dirname, '../uploads', documentId)
        );
      } catch (error) {
        logger.error('Local file deletion error:', error);
      }
    }

    user.documents.splice(documentIndex, 1);
    await user.save();

    const endTime = process.hrtime(startTime);
    logger.info(`Document deletion completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Document deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting document'
    });
  }
};

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument
};