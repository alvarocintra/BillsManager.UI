// api/index.js
export default async function handler(req, res) {
  try {
    // Usando uma string literal fixa para forçar a Vercel a rastrear e incluir o arquivo no build
    const { reqHandler } = await import('../dist/BillsManager.UI/server/server.mjs');
    
    return reqHandler(req, res);
  } catch (error) {
    console.error('Erro crítico no servidor Angular SSR:', error);
    return res.status(500).json({
      message: 'Falha ao inicializar o servidor Angular SSR.',
      error: error.message,
      stack: error.stack
    });
  }
}
