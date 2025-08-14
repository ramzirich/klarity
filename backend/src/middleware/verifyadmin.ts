import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  id: number;
  email: string;
  role: 'admin' | 'client';
}

export const verifyAdmin = (
  req: Request & { user?: JwtPayload },
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admins only' });
    return;
  }

  next();
};
