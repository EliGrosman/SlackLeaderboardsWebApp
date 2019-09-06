const axios = require('axios');
const qs = require('qs');

const apiUrl = 'https://slack.com/api';

function find(ACCESS_TOKEN, userId) {
  const data = {
    token: ACCESS_TOKEN,
    user: userId
  };
  const promise = axios.post(`${apiUrl}/users.info`, qs.stringify(data));
  return promise;
}

module.exports = {find};
