import { readFile, writeFile, rename, mkdir, rm } from 'fs/promises';
import { storageDir } from './storage-dir';
import { join } from 'path';
import { Express } from 'express';

export class FileManagement {
  static async userFilesRemove(userId: string) {
    const filePath = FileManagement.getUserDirPath(userId);
    try {
      await rm(filePath, { recursive: true });
    } catch (e) {
      console.error(e);
    }
  }

  static async userAvatarSave(userId: string, file: Express.Multer.File) {
    await FileManagement.createUserDir(userId);
    const userDir = FileManagement.getUserDirPath(userId);
    await FileManagement.moveFile(file.path, `${join(userDir, file.filename)}`);
  }

  static async userAvatarRemove(userId: string, avatarName: string) {
    const filePath = join(FileManagement.getUserDirPath(userId), avatarName);
    try {
      await rm(filePath);
    } catch (e) {
      console.error(e);
    }
  }

  static userAvatarGet(userId: string, avatarName: string) {
    return join(FileManagement.getUserDirPath(userId), avatarName);
  }

  static getUserDirPath(userId: string) {
    return storageDir(`/user/${userId}`);
  }

  static async createUserDir(userId: string) {
    try {
      const userDir = storageDir(`/user/${userId}`);
      await mkdir(userDir, { recursive: true });
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }

  static async moveFile(from: string, to: string) {
    try {
      await rename(from, to);
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}
