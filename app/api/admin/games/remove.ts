import { NextApiRequest, NextApiResponse } from 'next';
// TODO: Import service modules for game and spread logic

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // TODO: Parse request body for game and week identifiers
    // TODO: Remove game and spread from DB
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
