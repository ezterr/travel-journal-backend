import { hash } from 'bcrypt';

export async function createHashPwd(password: string) {
  return hash(password, 13);
}
