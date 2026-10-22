import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { staffRepository } from '../repositories/staffRepository.js';
import { AppError } from '../utils/appError.js';

export const authService = {
  login: async (email, password) => {
    const staff = await staffRepository.findByEmail(email);

    if (!staff) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const payload = {
      id: staff.id,
      email: staff.email,
      name: staff.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '8h',
    });

    return {
      token,
      user: payload,
    };
  },
};
