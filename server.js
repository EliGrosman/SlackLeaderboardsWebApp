require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const users = require('./users');
const confirmation = require('./confirmation');
const signature = require('./verifySignature');
const app = express();
const tourney = require('./tourney.js');

var fs = require('fs');
var dbFile = './data/database.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
const apiUrl = 'https://slack.com/api';
let games = ["smash4", "smash2v2", "ultimate", "tournament", 'rvppoints'];

const rawBodyBuffer = (req, res, buf, encoding) => {
   if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
   }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));




app.get('/addPlayer', function(request, response) {
   tourney.addNewPlayer(request.body.dmid, request.body.userid, request.body.name);
   response.send(`Added ${request.body.name}`);
});

app.get('/updateMatch', function(request, response) {
   tourney.updateWinnerName(request.body.winner, request.body.loser, request.body.scorePos, request.body.scoreNeg);
   response.send(`Updated`);
});

app.get('/addMatch', function(request, response) {
   tourney.addMatchup(request.body.player1, request.body.player2);
   response.send('Added matchup');
});

app.get('/sendMatches', function(request, response) {
   tourney.sendMatches();
   response.send('Sent');
})

app.get('/getMatches', function(request, response) {
  db.all('SELECT * from Match', function(err, rows) {
    console.log(rows);
    response.send(JSON.stringify(rows));
  });
});

app.post('/recordMatch', function(request, response) {
  console.log(request.body.test);
  db.run(`INSERT INTO Match VALUES ('${request.body.player1}', '${request.body.player2}', '${request.body.completed}', '${request.body.winner}')`);
  response.send(request.body.test);

});


app.post('/leaderboard', (req, res) => {
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   res.send('');
   if(typeof req.body.text === 'undefined' || !games.includes(req.body.text.toLowerCase().split(' ')[0])) {
      let message2 = {
         token: process.env.SLACK_ACCESS_TOKEN,
         channel: req.body.channel_id,
         as_user: false,
         user: req.body.user_id,
         text: "Game name not found. Games supported: " + games.join(', ') + ". Make sure your command is formatted /leaderboard <board> (ex. /leaderboard ultimate)."
         
      };
      axios.post(`${apiUrl}/chat.postEphemeral`, qs.stringify(message2))
      .then((result => {}))
      .catch((err) => {
         console.log(err);
      });
   } else {
      confirmation.sendLeaderboard(req.body.channel_id, req.body.user_id, req.body.text.toLowerCase().split(' ')[0]);
   }

})

app.post('/last', (req, res) => {
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   res.send('');
   let file = req.body.text.toLowerCase().split(' ')[0];
   let numGames = req.body.text.toLowerCase().split(' ')[1];

   if(typeof req.body.text === 'undefined' || !games.includes(file)) {
      let message2 = {
         token: process.env.SLACK_ACCESS_TOKEN,
         channel: req.body.channel_id,
         as_user: false,
         user: req.body.user_id,
         text: "Game name not found. Games supported: " + games.join(', ') + ". Make sure your command is formatted /past <board> <numGames> (ex. /whonext ultimate 5)."        
      };
      axios.post(`${apiUrl}/chat.postEphemeral`, qs.stringify(message2))
      .then((result => {
      }))
      .catch((err) => {
         console.log(err);
      });
   } else {
    const getUserInfo = new Promise((resolve, reject) => {
      users.find(req.body.user_id).then((result) => {
       resolve(result.data.user.profile.real_name);
       let name = (result.data.user.profile.first_name + " " + result.data.user.profile.last_name.substring(0, 1)).trim();
       confirmation.sendLast(req.body.channel_id, req.body.user_id, name, file, numGames);
    }).catch((err) => { reject(err); });
   });
 }
})

app.post('/whonext', (req, res) => {
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   res.send('');
   let file = req.body.text.toLowerCase();
   if(typeof req.body.text === 'undefined' || !games.includes(file)) {
      let message2 = {
         token: process.env.SLACK_ACCESS_TOKEN,
         channel: req.body.channel_id,
         as_user: false,
         user: req.body.user_id,
         text: "Game name not found. Games supported: " + games.join(', ') + ". Make sure your command is formatted /whonext <board> (ex. /whonext ultimate)."
      };
      axios.post(`${apiUrl}/chat.postEphemeral`, qs.stringify(message2))
      .then((result => {
      }))
      .catch((err) => {
         console.log(err);
      });
   } else {
    const getUserInfo = new Promise((resolve, reject) => {
      users.find(req.body.user_id).then((result) => {
       resolve(result.data.user.profile.real_name);
       let name = (result.data.user.profile.first_name + " " + result.data.user.profile.last_name.substring(0, 1)).trim();
       confirmation.whoNext(req.body.channel_id, req.body.user_id, name, file);
    }).catch((err) => { reject(err); });
   });
 }
})

app.post('/redeemrvppoints', (req, res) => {
 const payload = req.body;
 const getUserInfo = new Promise((resolve, reject) => {
   users.find(payload.user_id).then((result) => {
      resolve(result.data.user.profile.real_name);
   }).catch((err) => { reject(err); });
});

      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         openRVPPointDialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.send('');
            } else {
               res.send('');
            }
         }).catch((err) => {
            res.sendStatus(500);
         });     
      })
      .catch((err) => { console.error(err); });
   })

app.post('/report1v1', (req, res) => {
 const payload = req.body;
 const getUserInfo = new Promise((resolve, reject) => {
   users.find(payload.user_id).then((result) => {
      resolve(result.data.user.profile.real_name);
   }).catch((err) => { reject(err); });
});

      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         openDialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.send('');
            } else {
               res.send('');
            }
         }).catch((err) => {
            res.sendStatus(500);
         });     
      })
      .catch((err) => { console.error(err); });
   })

app.post('/report2v2', (req, res) => {
 const payload = req.body;
 const getUserInfo = new Promise((resolve, reject) => {
   users.find(payload.user_id).then((result) => {
      resolve(result.data.user.profile.real_name);
   }).catch((err) => { reject(err); });
});

      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         open2v2Dialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.send('');
            } else {
               res.send('');
            }
         }).catch((err) => {
            res.sendStatus(500);
         });
         
      })
      .catch((err) => { console.error(err); });

   })

app.post('/actions', (req, res) => {
   const payload = JSON.parse(req.body.payload);
   const {type, user, submission} = payload;
   if (!signature.isVerified(req)) {
      res.sendStatus(404);
      return;
   }
   if(type === 'message_action') {
    if(payload.callback_id === 'report') {
      // Get user info of the person who posted the original message from the payload
      const getUserInfo = new Promise((resolve, reject) => {
         users.find(payload.user.id).then((result) => {
            resolve(result.data.user.profile.real_name);
         }).catch((err) => { reject(err); });
      });
      
      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         openDialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.sendStatus(500);
            } else {
               res.sendStatus(200);
            }
         }).catch((err) => {
            res.sendStatus(500);
         });
         
      })
      .catch((err) => { console.error(err); });
   } else if(payload.callback_id === 'report_2v2') {
      const getUserInfo = new Promise((resolve, reject) => {
         users.find(payload.user.id).then((result) => {
            resolve(result.data.user.profile.real_name);
         }).catch((err) => { reject(err); });
      });
      
      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         open2v2Dialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.sendStatus(500);
            } else {
               res.sendStatus(200);
            }
         }).catch((err) => {
            res.sendStatus(500);
         });
         
      })
      .catch((err) => { console.error(err); });
   } else if(payload.callback_id === 'redeem_rvppoints') {
      const getUserInfo = new Promise((resolve, reject) => {
         users.find(payload.user.id).then((result) => {
            resolve(result.data.user.profile.real_name);
         }).catch((err) => { reject(err); });
      });
      
      // Once successfully get the user info, open a dialog with the info
      getUserInfo.then((userInfoResult) => {
         openRVPPointDialog(payload, userInfoResult).then((result) => {
            if(result.data.error) {
               res.sendStatus(500);
            } else {
               res.sendStatus(200);
            }
         }).catch((err) => {
            res.sendStatus(500);
         });
         
      })
      .catch((err) => { console.error(err); });
   }

} else if (type === 'dialog_submission') {
   if(payload.callback_id === 'game') {
      confirmation.sendLeaderboard(payload.channel_id);
   }else if(payload.callback_id === 'reportdialog') {
      res.send('');
      confirmation.send1v1(payload.channel.id, payload.user, submission, submission.game);
   } else if(payload.callback_id === 'report2v2dialog') {
      res.send('');
      confirmation.send2v2(payload.channel.id, payload.user, submission, submission.game);
   } else if(payload.callback_id === 'rvppointdialog') {
      res.send('');
      confirmation.addRVPPoints(payload.channel.id, payload.user, submission, submission.game);
   } 
}
});

const open2v2Dialog = (payload, real_name) => {
   const dialogData = {
      token: process.env.SLACK_ACCESS_TOKEN,
      trigger_id: payload.trigger_id,
      dialog: JSON.stringify({
         title: 'Report a 2v2',
         callback_id: 'report2v2dialog',
         submit_label: 'Report',
         elements: [
         {
            label: 'First Opponent',
            type: 'select',
            name: 'oppo1',
            data_source: 'users',
            placeholder: 'First Opponent Name'
         },
         {
            label: 'Second Opponent',
            type: 'select',
            name: 'oppo2',
            data_source: 'users',
            placeholder: 'Second Opponent Name'
         },
         {
            label: 'Teammate',
            type: 'select',
            name: 'teammate',
            data_source: 'users',
            placeholder: 'Teammate Name'
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
            label: 'Which game',
            type: 'select',
            name: 'game',
            placeholder: 'Game',
            options: [
            { label: 'Smash 2v2', value: 'smash 2v2' }
            ],
         }
         ]
      })
   };
   
   const promise = axios.post(`${apiUrl}/dialog.open`, qs.stringify(dialogData));
   return promise;
};

const openDialog = (payload, real_name) => {

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


const openRVPPointDialog = (payload, real_name) => {

   const dialogData = {
      token: process.env.SLACK_ACCESS_TOKEN,
      trigger_id: payload.trigger_id,
      dialog: JSON.stringify({
         title: 'Redeem RVP points',
         callback_id: 'rvppointdialog',
         submit_label: 'Submit',
         elements: [
         {
            label: 'Code',
            type: 'text',
            name: 'code',
            placeholder: '123',
            hint: 'The code Eli gave you'
         },
         {
            label: 'Description',
            type: 'text',
            name: 'desc',
            placeholder: 'Getting Eli a GF',
            hint: 'What you did to get these points',
            optional: 'true'
         }
         ]
      })
   };
   
   const promise = axios.post(`${apiUrl}/dialog.open`, qs.stringify(dialogData));
   return promise;
};

const server = app.listen(process.env.PORT || 5000, () => {
   console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
   console.log(process.env.SLACK_ACCESS_TOKEN)
});