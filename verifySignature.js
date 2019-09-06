const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');

const isVerified = (req) => { 
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
  const [version, hash] = signature.split('=');
  const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) return false;
  hmac.update(`${version}:${timestamp}:${req.rawBody}`);
  return timingSafeCompare(hmac.digest('hex'), hash);
}; 
  
module.exports = { isVerified };