const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Validated environment configuration.
 * Fails fast if required variables are missing.
 */
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    console.error('   Please check your .env file. See .env.example for reference.');
    process.exit(1);
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50MB
  dockerTimeout: parseInt(process.env.DOCKER_TIMEOUT, 10) || 10000, // 10s
};

module.exports = config;
