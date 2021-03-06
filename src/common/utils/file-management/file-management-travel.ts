import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { Express } from 'express';
import { FileManagement, WebpFile } from './file-management';

export class FileManagementTravel extends FileManagement {
  static async removeTravelDir(userId: string, travelId: string) {
    const filePath = this.getTravelDirPath(userId, travelId);
    try {
      await rm(filePath, { recursive: true });
    } catch (e) {
      console.error(e);
    }
  }
  static async saveTravelPhoto(
    userId: string,
    travelId: string,
    file: Express.Multer.File,
  ): Promise<WebpFile> {
    const travelDir = this.getTravelDirPath(userId, travelId);
    await this.createTravelDir(userId, travelId);

    return this.convertToWebp(file, travelDir);
  }

  static async removeTravelPhoto(userId: string, travelId: string, photoName: string) {
    const filePath = join(this.getTravelDirPath(userId, travelId), photoName);

    try {
      await rm(filePath);
    } catch (e) {
      console.error(e);
    }
  }

  static getTravelPhoto(userId: string, travelId: string, photoName: string) {
    return join(this.getTravelDirPath(userId, travelId), photoName);
  }

  static getTravelDirPath(userId: string, travelId: string) {
    const target = join('/users', userId, travelId);
    return this.storageDir(target);
  }

  static async createTravelDir(userId: string, travelId: string) {
    try {
      const target = join('/users', userId, travelId);
      const userDir = this.storageDir(target);
      await mkdir(userDir, { recursive: true });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}
