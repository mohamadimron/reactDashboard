const { getRequiredEnv } = require('./env');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = getRequiredEnv('JWT_SECRET');

const generateToken = (userId, role, sessionId) => {
  return jwt.sign({ userId, role, sessionId }, JWT_SECRET, {
    expiresIn: '1d',
  });
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { generateToken, hashPassword, comparePassword };
