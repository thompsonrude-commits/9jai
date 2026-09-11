// Vercel serverless function for health endpoint
const handler = require('../functions/lib/index').aiHealth;
module.exports = handler;
