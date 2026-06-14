
export default async function handler(req, res) {
    try {
        const { reqHandler } = await import('./dist/BillsManager.UI/server/server.mjs');
        return reqHandler(req, res);
    } catch (error) {
        console.error('Error occurred while handling request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}