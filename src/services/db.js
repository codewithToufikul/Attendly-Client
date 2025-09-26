import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src', 'data');

const ensureDir = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
};

const resolveFile = (name) => {
  ensureDir();
  return path.join(dataDir, `${name}.json`);
};

export const readJson = (name, fallback) => {
  try {
    const file = resolveFile(name);
    if (!fs.existsSync(file)) {
      if (fallback !== undefined) {
        fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
        return fallback;
      }
      return null;
    }
    const raw = fs.readFileSync(file, 'utf-8') || 'null';
    return JSON.parse(raw);
  } catch (e) {
    console.error('readJson error:', name, e);
    return fallback ?? null;
  }
};

export const writeJson = (name, data) => {
  try {
    const file = resolveFile(name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('writeJson error:', name, e);
    return false;
  }
};
