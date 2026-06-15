import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, '../../uploads');

export const getUploadsPath = () => uploadsPath;

export const saveUploadToDisk = async (file) => {
  if (!file?.buffer || !file?.filename) return;

  await fs.mkdir(uploadsPath, { recursive: true });
  await fs.writeFile(path.join(uploadsPath, file.filename), file.buffer);
};

export const deleteUploadFromDisk = async (filename) => {
  if (!filename) return;

  try {
    await fs.unlink(path.join(uploadsPath, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not delete local upload ${filename}:`, error.message);
    }
  }
};
