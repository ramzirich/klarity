import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { AuthResponse, LoginInput, RegisterInput, UserRow } from '../models/userRow';
import { ResultSetHeader } from 'mysql2';

export const registerUser = async ({email, password, role="client"}: RegisterInput): Promise<AuthResponse> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO auth (email, password, role) VALUES (?, ?, ?)',
    [email, hashedPassword, role]
  ) as unknown as [ResultSetHeader];

  const token = jwt.sign(
    { id: result.insertId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  return {
    id: result.insertId,
    email,
    token,
    role,
  };
};

export const loginUser = async ({ email, password }: LoginInput): Promise<AuthResponse & { id: number }> => {
  const [rows] = await db.query('SELECT * FROM auth WHERE email = ?', [email]);
  const typedRows = rows as UserRow[];
  const user = typedRows[0];

  if (!user) throw new Error('User not found');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid password');

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  return {
    id: user.id,
    email: user.email,
    role: user.role as 'client' | 'admin',
    token,
  };
};

export const loginEmailOnlyService = async (email: string): Promise<{ email: string }> => {
  const [rows] = await db.query(
    'SELECT email FROM auth WHERE email = ?',
    [email]
  ) as unknown as [{ email: string }[]];

  if (rows.length > 0) {
    return { email: rows[0].email };
  }

  await db.query(
    'INSERT INTO auth (email) VALUES (?)',
    [email]
  );

  return { email };
};

