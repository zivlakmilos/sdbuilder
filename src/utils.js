import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const getDirName = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return __dirname;
}
