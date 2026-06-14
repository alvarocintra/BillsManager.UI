import { join } from 'path';

export default async function handler(req, res) {
  const serverPath = join(process.cwd(), 'dist', 'BillsManager.UI', 'server', 'server.mjs');
  
  const { reqHandler } = await import(serverPath);
  
  return reqHandler(req, res);
}