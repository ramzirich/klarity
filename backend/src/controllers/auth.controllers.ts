import { Request, Response } from 'express';
import { registerUser, loginUser, loginEmailOnlyService } from '../services/auth.services';
import jwt, { JwtPayload } from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRES_IN = '7d';

const createAccessToken = (user: any) => {
  return jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const accessToken = createAccessToken({ id: decoded.id, email: decoded.email });

    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  try {
    const response = await registerUser({ email, password, role });

    const refreshToken = jwt.sign(
      { id: response.id ,email: response.email, role: response.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      id: response.id,
      accessToken: response.token,
      email: response.email,
      role: response.role,
    });
  } catch (err: any) {
    const errorMessage =
    err.message?.includes('Duplicate entry') 
      ? 'Email already exists'
      : err?.message;
  res.status(400).json({ error: errorMessage });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const response = await loginUser({email, password});

    const refreshToken = jwt.sign(
      { email: response.email, role: response.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: response.token,
      id: response.id,
      email: response.email,
      role: response.role,
    });
  } catch (err: any) {
    const msg = err?.message?.toString?.() || '';
    
    if (
      msg.includes('Invalid password') ||
      msg.includes('User not found')
    ) {
    
      res.status(401).json({ error: 'Wrong credentials' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginEmailOnly = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
  }

  try {
    const result = await loginEmailOnlyService(email);
    res.status(200).json(result);
  } catch (err:any) {
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
};

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

export const refreshAccessToken = (req:Request, res:Response) => {
  try {
    // 1. Get refresh token from cookie or headers
    const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token'];

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found' });
    }

    // 2. Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, (err:any, decoded:any) => {
      if (err || !decoded || !decoded.id) {
        console.error('Invalid refresh token or missing ID');
        res.status(403).json({ message: 'Invalid refresh token' });
      }

      // 3. Create new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // 4. Optionally send back new refresh token if you want to rotate it
      const newRefreshToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // 5. Set refresh token in cookie again (optional)
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error('Error in refreshAccessToken:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};



