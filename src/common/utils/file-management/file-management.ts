import { rename, rm } from 'fs/promises';
import { join } from 'path';
import { safeJoin } from '../safe-join';
import { Express } from 'express';
import path from 'path';
import sharp from 'sharp';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';
import imageSize from 'image-size';
const sizeOf = promisify(imageSize);

export interface WebpFile {
  filename: string;
  dirname: string;
  path: string;
}

export class FileManagement {
  static async moveFile(from: string, to: string) {
    try {
      await rename(from, to);
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  static storageDir(target: string) {
    const basePath = join(__dirname, '../../../../storage');
    return safeJoin(basePath, target);
  }

  static async removeFromTmp(filename) {
    const path = join(this.storageDir('/tmp'), filename);
    try {
      await rm(path);
    } catch (e) {
      console.error(e);
    }
  }

  static async convertToWebp(file: Express.Multer.File, saveDir?: string): Promise<WebpFile> {
    const fileParse = path.parse(file.path);
    const newFilename = fileParse.name + '.webp';
    const newDirname = saveDir || fileParse.dir;
    const newPath = join(newDirname, fileParse.name) + '.webp';
    const { height, width } = await sizeOf(file.path);

    const proportions = height / width;
    const newWidth = 1000;
    const newHeight = parseInt((width * proportions).toFixed(0));

    const imageConverter = sharp().resize(newWidth, newHeight, { fit: 'cover' }).webp();

    const readableStream = createReadStream(file.path);
    const writeStream = createWriteStream(newPath);
    readableStream.pipe(imageConverter).pipe(writeStream);

    return {
      filename: newFilename,
      dirname: newDirname,
      path: newPath,
    };
  }
}
