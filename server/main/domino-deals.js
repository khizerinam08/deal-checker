import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function Dominos_Deals() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  console.log(__dirname)
  const dataPath = path.join(__dirname, '../output-of-scrapers/Dominos/dominos_deals.json');

  try {
    const rawData = await readFile(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading data file:', err);
    throw err;
  }
}
