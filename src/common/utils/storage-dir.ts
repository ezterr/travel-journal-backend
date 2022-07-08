import { safeJoin } from './safe-join';
import { join } from 'path';

export function storageDir(target: string) {
  const basePath = join(__dirname, '../../../storage');
  return safeJoin(basePath, target);
}
