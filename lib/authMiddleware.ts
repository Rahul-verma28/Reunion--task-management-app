import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

export interface AuthenticatedRequest extends NextApiRequest {
    user?: string;
}

type APIHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

export const protect = (handler: APIHandler) => async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        req.user = decoded.id;
        return handler(req, res); // Call the original handler
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
