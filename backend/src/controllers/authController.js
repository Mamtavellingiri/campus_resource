const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config/env');

const JWT_SECRET = config.JWT_SECRET;

const register = async (req, res) => {
  try {
    const { name, email, password, department, phone, role, year, section } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const assignedRole = role && ['STUDENT', 'FACULTY', 'ADMIN'].includes(role.toUpperCase())
      ? role.toUpperCase()
      : 'STUDENT';

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: assignedRole,
        department: department || 'General',
        phone: phone || null,
        year: assignedRole === 'STUDENT' ? year || null : null,
        section: assignedRole === 'STUDENT' ? section || null : null
      },
      select: {
        id: true, name: true, email: true, role: true, department: true,
        phone: true, year: true, section: true, createdAt: true
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      year: user.year,
      section: user.section,
      createdAt: user.createdAt
    };

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userResponse
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error fetching user profile.', error: error.message });
  }
};

module.exports = { register, login, getMe };
