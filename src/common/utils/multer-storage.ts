import { diskStorage } from 'multer';
import * as mime from 'mime';
import { v4 as uuid } from 'uuid';

export function multerStorage(dest: string) {
  return diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      return cb(null, `${uuid()}.${(mime as any).getExtension(file.mimetype)}`);
    },
  });
}
