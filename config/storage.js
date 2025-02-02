const path = require('path');
const fs = require('fs').promises;

const createUploadDir = async () => {
  const uploadDir = path.join(__dirname, '../uploads');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

module.exports = {
  createUploadDir,
  getFilePath: (filename) => path.join(__dirname, '../uploads', filename)
};
