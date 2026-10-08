require('dotenv').config();

const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 5000,
  TIMEZONE: process.env.TIMEZONE || 'Asia/Kolkata',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

if (!config.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
}

module.exports = config;
