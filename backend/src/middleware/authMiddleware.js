const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '❌ Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '❌ Not authorized, user not found'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: '❌ Not authorized, invalid token'
    });
  }
};