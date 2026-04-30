import { pool } from '../utils/db';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  password: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const users = rows as User[];
  return users[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  return users[0] || null;
}

export async function findUsersByEmails(emails: string[]): Promise<User[]> {
  if (emails.length === 0) {
    return [];
  }

  const placeholders = emails.map(() => '?').join(', ');
  const [rows] = await pool.query(`SELECT * FROM users WHERE email IN (${placeholders})`, emails);
  return rows as User[];
}

export async function createUser(email: string, password: string, displayName: string): Promise<User> {
  const hash = await bcrypt.hash(password, 10);
  const [result]: any = await pool.query(
    'INSERT INTO users (email, password, display_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [email, hash, displayName]
  );
  return {
    id: result.insertId,
    email,
    password: hash,
    display_name: displayName,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export async function updateUser(id: number, updates: Partial<Pick<User, 'display_name'>>): Promise<User | null> {
  const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  if (!fields) {
    return findUserById(id);
  }

  await pool.query(`UPDATE users SET ${fields}, updated_at = NOW() WHERE id = ?`, [...values, id]);
  return findUserById(id);
}
