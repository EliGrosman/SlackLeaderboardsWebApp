require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
//const confirmation = require('./confirmation');
const signature = require('./verifySignature');
const app = express();
//const tourney = require('./tourney.js');
var fs = require('fs');
const apiUrl = 'https://slack.com/api';

const slackapi = require('simple-slack-api')
const slack = new slackapi(process.env.SLACK_ACCESS_TOKEN, "", process.env.SLACK_VERIFICATION_TOKEN)

const rawBodyBuffer = (req, res, buf, encoding) => {
   if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
   }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));



app.post('/leaderboard', (req, res) => {
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   res.send('');
   if(typeof req.body.text === 'undefined' || !games.includes(req.body.text.toLowerCase().split(' ')[0])) {
      slack.sendEphemeral("That board was not found. Make sure your command is formatted /leaderboard <board> (ex. /leaderboard ultimate).", req.body.channel_id, req.body.user_id);
   } else {
      //confirmation.sendLeaderboard(req.body.channel_id, req.body.user_id, req.body.text.toLowerCase().split(' ')[0]);
   }

})

app.post('/past', (req, res) => {
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   res.send('');
   let board = req.body.text.toLowerCase().split(' ')[0];
   let numGames = req.body.text.toLowerCase().split(' ')[1];

   if(typeof req.body.text === 'undefined' || !games.includes(file)) {
      slack.sendEphemeral("That board was not found. Make sure your command is formatted /leaderboard <board> (ex. /leaderboard ultimate).", req.body.channel_id, req.body.user_id);
   } else {
    const getUserInfo = new Promise((resolve, reject) => {
      // confirmation.sendLast(req.body.channel_id, req.body.user_id, name, file, numGames);
    }).catch((err) => { reject(err); });
   }
})


app.post('/report', (req, res) => {
  openDialog(req.body);
})

app.post('/actions', (req, res) => {
   const payload = JSON.parse(req.body.payload);
   const {type, user, submission} = payload;
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   if (type === 'dialog_submission') {
   if(payload.callback_id === 'reportdialog') {
      res.send('');
      //confirmation.send1v1(payload.channel.id, payload.user, submission, submission.game);
   }
}
});


const openDialog = (payload) => {
   const dialogData = {
      token: process.env.SLACK_ACCESS_TOKEN,
      trigger_id: payload.trigger_id,
      dialog: JSON.stringify({
         title: 'Report a match',
         callback_id: 'reportdialog',
         submit_label: 'Report',
         elements: [
         {
            label: 'Opponent',
            type: 'select',
            name: 'user',
            data_source: 'users',
            placeholder: 'Opponent Name'
         },
         {
            label: 'Win or Loss',
            type: 'select',
            name: 'winloss',
            placeholder: 'Win or loss',
            options: [
            { label: 'Win', value: 'Win' },
            { label: 'Loss', value: 'Loss' }
            ],
         },
         {
            label: 'Score',
            type: 'text',
            name: 'score',
            placeholder: '2-1',
            hint: '(e.x. \"2-1\" or \"2-0\")'
         },
         {
            label: 'Which game',
            type: 'select',
            name: 'game',
            placeholder: 'Game',
            options: [
            { label: 'Smash 4', value: 'smash 4' },
            {label: 'Smash Ultimate', value: 'ultimate' },
            {label: 'Spring Tournament', value: 'tournament' }

            ],
         }
         ]
      })
   };
   
   const promise = axios.post(`${apiUrl}/dialog.open`, qs.stringify(dialogData));
   return promise;
};


const server = app.listen(process.env.PORT || 5000, () => {
   console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});