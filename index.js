// index.js
import handlerServer from './dist/BillsManager.UI/server/server.mjs';

export default async function handler(req, res) {
  try {
    // Ao exportar o request handler como default no server.ts, 
    // ele é mapeado diretamente no import acima
    if (handlerServer && handlerServer.reqHandler) {
      return handlerServer.reqHandler(req, res);
    }
    
    // Se o import veio direto como a função:
    return handlerServer(req, res);
  } catch (error) {
    return res.status(500).json({
      message: 'Falha no runtime do servidor Angular SSR.',
      error: error.message
    });
  }
}