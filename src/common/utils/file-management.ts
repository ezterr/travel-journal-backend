import { rename } from 'fs/promises';

export class FileManagement {
  static async moveFile(from: string, to: string) {
    try {
      await rename(from, to);
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
}
