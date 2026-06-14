
export default async function handler(req, res) {
  const { reqHandler } = await import('./dist/BillsManager.UI/server/server.mjs');
  return reqHandler(req, res);
}