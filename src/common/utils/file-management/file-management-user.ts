import { mkdir, rm } from 'fs/promises';
import { Express } from 'express';
import { join } from 'path';
import { FileManagement, WebpFile } from './file-management';

export class FileManagementUser extends FileManagement {
  static async removeUserDir(userId: string) {
    const filePath = this.getUserDirPath(userId);
    try {
      await rm(filePath, { recursive: true });
    } catch (e) {
      console.error(e);
    }
  }

  static async saveUserPhoto(userId: string, file: Express.Multer.File): Promise<WebpFile> {
    const userDir = this.getUserDirPath(userId);
    await this.createUserDir(userId);

    return this.convertToWebp(file, userDir);
  }

  static async removeUserPhoto(userId: string, photoName: string) {
    const filePath = join(this.getUserDirPath(userId), photoName);
    try {
      await rm(filePath);
    } catch (e) {
      console.error(e);
    }
  }

  static getUserPhoto(userId: string, photoName: string) {
    return join(this.getUserDirPath(userId), photoName);
  }

  static getUserDirPath(userId: string) {
    const target = join('/users', userId);
    return this.storageDir(target);
  }

  static async createUserDir(userId: string) {
    try {
      const target = join('/users', userId);
      const userDir = this.storageDir(target);
      await mkdir(userDir, { recursive: true });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}
