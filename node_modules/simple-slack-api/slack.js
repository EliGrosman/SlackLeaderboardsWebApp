const axios = require('axios');
const qs = require('qs');
const apiUrl = 'https://slack.com/api';
const crypto = require('crypto');
const timingSafeCompare = require('tsscmp');
const users = require('./users.js');

let ACCESS_TOKEN, SIGNING_SECRET, VERIFICATION_TOKEN; // eslint-disable-line no-unused-vars
let isInit = false; // eslint-disable-line no-unused-vars

function Slack(ACCESS_TOKEN, SIGNING_SECRET, VERIFICATION_TOKEN) {
	this.ACCESS_TOKEN = ACCESS_TOKEN;
	this.SIGNING_SECRET = SIGNING_SECRET;
	this.VERIFICATION_TOKEN = VERIFICATION_TOKEN;
	this.isInit = true;
}

Slack.prototype.isVerified = function isVerified(req) { 
  const signature = req.headers['x-slack-signature'];
  const timestamp = req.headers['x-slack-request-timestamp'];
  const hmac = crypto.createHmac('sha256', this.SIGNING_SECRET);
  const [version, hash] = signature.split('=');
  const fiveMinutesAgo = ~~(Date.now() / 1000) - (60 * 5);
  if (timestamp < fiveMinutesAgo) return false;
  hmac.update(`${version}:${timestamp}:${req.rawBody}`);
  return timingSafeCompare(hmac.digest('hex'), hash);
}

Slack.prototype.sendMessage = function sendMessage(text, channelID, callback) {
	if(!this.isInit) {
		throw new Error('Slack not initialized properly. Be sure to provide your slack details.');
	} 
  let message = {
    token: this.ACCESS_TOKEN,
    channel: channelID,
    as_user: false,
    text: text,
	}
   axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(message))
   .then(function(callback){
    if (typeof callback === "function") {
      callback();
    }
   })
   .catch((err) => {
      throw new Error(err)
   });

}

Slack.prototype.sendEphemeral = function sendEphemeral(text, channelID, userID) {
	let message = {
      token: this.ACCESS_TOKEN,
      channel: channelID,
      as_user: false,
      text: text,
      user: userID
      
   };
   axios.post(`${apiUrl}/chat.postEphemeral`, qs.stringify(message))
   .then(function(callback){
    if (typeof callback === "function") {
      callback();
    }
   })
   .catch((err) => {
      throw new Error(err)
   });
}


Slack.prototype.getUserInfo = function getUserInfo(userid, callback) { 
    const getUserInfo = new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
      users.find(this.ACCESS_TOKEN, userid).then((result) => {
       resolve(result.data.user.profile.real_name);
       callback(result.data.user.profile);
    }).catch((err) => { reject(err); });
    })
}

module.exports =  Slack;
