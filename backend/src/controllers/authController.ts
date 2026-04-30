import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, findUserById, updateUser } from '../models/user';

function toProfile(user: { id: number; email: string; display_name: string; created_at: Date; updated_at: Date }) {
  return {
    id: String(user.id),
    user_id: String(user.id),
    email: user.email,
    display_name: user.display_name,
    avatar_url: null,
    push_subscription: null,
    notifications_enabled: false,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
  };
}

export async function signup(req: Request, res: Response) {
  const { email, password, display_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const resolvedDisplayName = display_name?.trim() || email.split('@')[0];
  const user = await createUser(email, password, resolvedDisplayName);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.status(201).json({ token, user: toProfile(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ token, user: toProfile(user) });
}

export async function profile(req: any, res: Response) {
  const user = await findUserById(Number(req.user.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: toProfile(user) });
}

export async function updateProfile(req: any, res: Response) {
  const { display_name } = req.body;
  const user = await updateUser(Number(req.user.id), { display_name });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: toProfile(user) });
}
