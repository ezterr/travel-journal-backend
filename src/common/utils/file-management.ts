import { rename, rm } from 'fs/promises';
import { join } from 'path';
import { safeJoin } from './safe-join';
import { Express } from 'express';

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
    const basePath = join(__dirname, '../../../storage');
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
}
