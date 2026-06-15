import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryGet } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sabeel_e_aliasgar_secret_jwt_key_2026';

export const login = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Lookup user in DB
    const user = await queryGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // If a role filter is requested, ensure role match
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied: Account is not registered as a ${role}` });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        contributionAmount: user.contribution_amount,
        settled: user.settled
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await queryGet(
      'SELECT id, username, full_name, role, contribution_amount, settled FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      contributionAmount: user.contribution_amount,
      settled: user.settled
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
