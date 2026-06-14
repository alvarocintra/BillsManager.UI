import { resolve } from 'path';
import { pathToFileURL } from 'url';

export default async function handler(req, res) {
  try {
    // resolve garante o caminho absoluto correto a partir da raiz da função no Vercel
    const serverPath = resolve(process.cwd(), 'dist/BillsManager.UI/server/server.mjs');
    const fileUrl = pathToFileURL(serverPath).href;

    const { reqHandler } = await import(fileUrl);
    return reqHandler(req, res);
  } catch (error) {
    console.error('Erro ao carregar o servidor Angular SSR:', error);
    return res.status(500).json({
      message: 'Falha ao inicializar o servidor Angular SSR.',
      error: error.message,
      stack: error.stack
    });
  }
}
