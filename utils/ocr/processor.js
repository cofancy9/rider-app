const tesseract = require('node-tesseract-ocr');
const logger = require('../logger');
const { rcPatterns, requiredFields } = require('./config');

const config = {
  lang: 'eng',
  oem: 1,
  psm: 3,
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '
};

class RcOcrProcessor {
  static async extractText(imagePath) {
    try {
      const text = await tesseract.recognize(imagePath, config);
      return text;
    } catch (error) {
      logger.error('OCR Error:', error);
      throw new Error('Failed to process document');
    }
  }

  static extractFields(text) {
    const lines = text.split('\n').map(line => line.trim());
    const fields = {
      registrationNumber: null,
      ownerName: null,
      vehicleClass: null,
      maker: null,
      engineNumber: null,
      chassisNumber: null
    };

    lines.forEach(line => {
      // Registration Number
      if (line.match(rcPatterns.registrationNumber)) {
        fields.registrationNumber = line;
      }
      // Engine Number
      else if (line.match(rcPatterns.engineNumber)) {
        fields.engineNumber = line;
      }
      // Chassis Number
      else if (line.match(rcPatterns.chassisNumber)) {
        fields.chassisNumber = line;
      }
      // Owner Name (typically follows "NAME:" or similar pattern)
      else if (line.toLowerCase().includes('name:')) {
        fields.ownerName = line.split(':')[1]?.trim();
      }
      // Vehicle Class
      else if (line.toLowerCase().includes('class:')) {
        fields.vehicleClass = line.split(':')[1]?.trim();
      }
      // Maker/Manufacturer
      else if (line.toLowerCase().includes('maker:')) {
        fields.maker = line.split(':')[1]?.trim();
      }
    });

    return fields;
  }

  static validateFields(fields) {
    const missingFields = requiredFields.filter(field => !fields[field]);
    const isValid = missingFields.length === 0;

    return {
      isValid,
      missingFields,
      fields
    };
  }
}

module.exports = RcOcrProcessor;
