const dotenv = require('dotenv');

dotenv.config();

const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

module.exports = { getRequiredEnv };
