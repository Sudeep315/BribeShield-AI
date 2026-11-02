import { getPrisma } from '../config/db.js';
import { hashPassword, comparePassword, generateTokens } from '../middleware/auth.middleware.js';
import { auditService } from '../services/audit.service.js';
import { hashIpAddress } from '../utils/crypto.util.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const tokens = generateTokens(user);

    // Audit log login
    await auditService.logEvent({
      entityType: 'USER',
      entityId: user.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      user,
      ipAddressHash: hashIpAddress(req.ip),
      details: { email: user.email, role: user.role }
    });

    return res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department
      },
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(rToken, config.jwt.refreshSecret);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account no longer valid.' });
    }

    const tokens = generateTokens(user);
    return res.json({ success: true, tokens });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Token refresh failed.' });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
};

export const listUsers = async (req, res) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, fullName, role, department } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Email, password, and full name are required.' });
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        role: role || 'INVESTIGATOR',
        department: department || null
      }
    });

    await auditService.logEvent({
      entityType: 'USER',
      entityId: newUser.id,
      action: 'ADMIN_USER_CREATED',
      user: req.user,
      details: { email: newUser.email, role: newUser.role, department: newUser.department }
    });

    return res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

