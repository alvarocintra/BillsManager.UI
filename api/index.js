import { join } from 'path';
import { pathToFileURL } from 'url';

export default async function handler(req, res) {
  try {
    // 1. Encontra o caminho absoluto do arquivo do servidor Angular
    const absolutePath = join(process.cwd(), 'dist', 'BillsManager.UI', 'server', 'server.mjs');
    
    // 2. Converte o caminho para o formato de URL exigido pelo ESM (file://...)
    const fileUrl = pathToFileURL(absolutePath).href;

    // 3. Importa dinamicamente o handler do Angular
    const { reqHandler } = await import(fileUrl);
    
    // 4. Executa a requisição
    return reqHandler(req, res);
  } catch (error) {
    console.error('Erro crítico na Serverless Function:', error);
    return res.status(500).json({ 
      message: 'Falha ao inicializar o servidor Angular SSR.', 
      error: error.message 
    });
  }
}