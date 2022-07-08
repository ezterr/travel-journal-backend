import { normalize, resolve } from 'path';

export function safeJoin(base: string, target: string): string {
  const targetPath = `.${normalize(`///${target}`)}`;
  return resolve(base, targetPath);
}
