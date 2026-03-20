const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (userId, role, sessionId) => {
  return jwt.sign({ userId, role, sessionId }, process.env.JWT_SECRET || 'secret', {
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
