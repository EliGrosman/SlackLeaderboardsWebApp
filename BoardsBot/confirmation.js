'use strict';

require('dotenv').config()
const axios = require('axios');
const qs = require('qs');
const users = require('./users');
const apiUrl = 'https://slack.com/api';
const fs = require('fs');
const tourney = require('./tourney');

const slackapi = require('simple-slack-api')
const slack = new slackapi(process.env.SLACK_ACCESS_TOKEN, process.env.SLACK_SIGNING_SECRET, process.env.SLACK_VERIFICATION_TOKEN)


function addPlayerToJSON(name, players, names) {
   if(!names.includes(name)) {
      let newPlayer = {
         name:name,
         wins:0,
         losses:0,
         elo:1000
      }
      players.push(newPlayer);
   }
}

function updatePlayerJSON(name, oppo, type, score, game) {
   let fileName = "./players/" + name.replace(' ', '') + ".json";
   let json = {};
   fs.readFile(fileName, function(error) {
      if(error) {
         fs.writeFileSync(fileName, "");
         json["games"] = [];
      } else {
         json = JSON.parse(fs.readFileSync(fileName));
      }
      let newGame = {
         type: type,
         score: score,
         oppo: oppo,
         game: game
      }
      json["games"].unshift(newGame);
      
      fs.writeFileSync(fileName, JSON.stringify(json));
   });
   
}

function sendLast(channelID, userID, userName, game, numGames) {
   var file = fs.readFile("./players/" + userName.replace(' ', '') + ".json", function(error) {
      if(error) {
         slack.sendEphemeral("Something went wrong... You might not be on that board.", channelID, userID);
         return;
      } else {
         let retText = "```"  + "\n";
         let json = JSON.parse(fs.readFileSync("./players/" + userName.replace(' ', '') + ".json"))["games"];
         let games = [];
         let thegame = game.replace(' ', '');
         json.forEach(function(player) {
            games.push(player["game"].replace(' ', ''));
         });
         if(numGames === 0){
            slack.sendEphemeral("Please ask for more than 0 games.", channelID, userID);
            return;
         }
         if(!games.includes(thegame)){
            slack.sendEphemeral("Something went wrong... You might not be on that board.", channelID, userID);
            return;
         }
         let arr = getLast(userName, numGames, game);
         arr.forEach(function(game) {
            let emoji = "✅ ";
            if(game["type"] === "Loss") {
               emoji = "❌ ";
            }
            retText += " - " + emoji + game["type"] + " against " + game["oppo"] + " (score: " + game["score"] + ") \n";
            
         });
         slack.sendEphemeral(`<@${userID}> here are your past ${numGames} games in ${game}:`, channelID, userID, function(){
            slack.sendEphemeral(retText + "```", channelID, userID);
         });
      }
   })
}

function whoNext(channelID, userID, userName, game) {
   let file = fs.readFile("./players/" + userName.replace(' ', '') + ".json", function(error) {
      if(error) {
         slack.sendEphemeral("Something went wrong... You might not be on that board.", channelID, userID);
         return;
      } else {
         let retText = "```"  + "\n";
         let json = JSON.parse(fs.readFileSync("./players/" + userName.replace(' ', '') + ".json"))["games"];
         let games = [];
         json.forEach(function(player) {
            games.push(player["game"]);
         });
         if(!games.includes(game)){
            slack.sendEphemeral("Something went wrong... You might not be on that board.", channelID, userID);
            return;
         }
         let rawGame = fs.readFileSync("./" + game + ".json");
         let gameJSON = JSON.parse(rawGame);
         let playersNames = [];
         let players = [];
         gameJSON.players.forEach(function(player) {
            players.push(player);
            playersNames.push(player.name);
         });
         let myElo = players[playersNames.indexOf(userName)]["elo"];
         let potPlayers = [];
         gameJSON.players.forEach(function(player) {
            let guyElo = player["elo"];
            if(Math.abs(myElo - guyElo) <= 50 && player["name"] !== userName) {
               potPlayers.push(player["name"]);
            }
         });
         let actualPotPlayers = [];
         let arr = getLast(userName, 3, game);
         console.log(arr);
         let oppos = [];
         arr.forEach(function(game) {
            oppos.push(game["oppo"]);
         })
         potPlayers.forEach(function(name) {
            if(!oppos.includes(name)) {
               actualPotPlayers.push(name);
            }
         })
         let setPlayer = [... new Set(actualPotPlayers)]
         if(setPlayer.length === 0) {
            slack.sendEphemeral(`<@${userID}> you're too good! There isn't anyone for you to challenge! Try again later.`, channelID, userID);
         } else {
            slack.sendEphemeral(`<@${userID}> you should play someone off this list: ${setPlayer.join(', ')}`, channelID, userID);
         }
      }
   })
}

function getLast(userName, numGames, game) {
   let json = JSON.parse(fs.readFileSync("./players/" + userName.replace(' ', '') + ".json"))["games"];
   var iterator = json[Symbol.iterator]();
   let result = iterator.next();
   let ret = [];
   for(let i = 0; i < numGames; i++) {
      if(!result.done) {
         var arr = result.value;
         if(arr["game"].replace(' ', '') === game.replace(' ', '')) {
            ret.push(arr);
         } else {
            i--;
         }
         result = iterator.next();
      }
   }
   return ret;
}

function sendTourneyBoard(channelId)  {
  let lbText = "```" + "Rank".padEnd(6, " ") + "Name".padEnd(11, " ") + "W".padEnd(4, " ") + "L".padEnd(4, " ") + "Score" +  "\n";
  tourney.getPlayers(function(players){
  let rank = 1;
  players.forEach(function(player) {
    let rankTxt = rank + ".";
    lbText += rankTxt.padEnd(6, " ") + player.name.padEnd(11, " ") + player.wins.toString().padEnd(4, " ") + player.losses.toString().padEnd(4, " ") + player.score.toString() +  "\n";
    rank++;
  })
   lbText += "```";
   let leaderboard = {
      token: process.env.SLACK_ACCESS_TOKEN,
      channel: channelId,
      as_user: false,
      text: lbText
   }
   slack.sendMessage("Leaderboards for the tournament" + ":", channelId, function(){
     slack.sendMessage(qs.stringify(leaderboard), channelID)
   })
        
  });
}

function sendRVPPoints(channelId) {
    let lbText = "```" + "Rank".padEnd(6, " ") + "Name".padEnd(11, " ") + "Points" + "\n";
  tourney.getRVPPlayers(function(players){
  let rank = 1;
  players.forEach(function(player) {

    let rankTxt = rank + ".";
    lbText += rankTxt.padEnd(6, " ") + player.name.padEnd(11, " ") + player.sumPoints.toString() + "\n";
    rank++;
  })
   lbText += "```";
   let leaderboard = {
      token: process.env.SLACK_ACCESS_TOKEN,
      channel: channelId,
      as_user: false,
      text: lbText
   }
   slack.sendMessage("RVP Points leaderboard" + ":", channelId, function(){
     slack.sendMessage(qs.stringify(leaderboard), channelId)
   })
        
  });
  
}

function sendLeaderboardText(channelId, userID, file) {
  if(file === "tournament") {
   sendTourneyBoard(channelId );
  } else if (file === "rvppoints") {
    sendRVPPoints(channelId);
  }else {
   let rawdata = fs.readFileSync('./' + file.replace(' ', '') + '.json');
   let players = JSON.parse(rawdata);
   let lbText = "```" + "Rank".padEnd(6, " ") + "Name".padEnd(11, " ") + "W".padEnd(4, " ") + "L".padEnd(4, " ") + "Elo" + "\n";
   let rank = 1;
   if(players.players.length === 0) {
      slack.sendEphemeral("Nobody is on that leaderboard yet!", channelId, userID);
      return;
   }
   players.players.forEach(function(player) {
      let rankTxt = rank + ".";
      lbText += rankTxt.padEnd(6, " ") + player.name.padEnd(11, " ") + player.wins.toString().padEnd(4, " ") + player.losses.toString().padEnd(4, " ") + player.elo + "\n";
      rank++;
   })
   lbText += "```";
   let leaderboard = {
      token: process.env.SLACK_ACCESS_TOKEN,
      channel: channelId,
      as_user: false,
      text: lbText
   }
   slack.sendMessage("Leaderboards for " + file + ":", channelId, function(){
     slack.sendMessage(qs.stringify(leaderboard), channelId)

   })
  }
}

function calcElo(eloP1, eloP2, K) {
   let T1 = 10**(eloP1/400);
   let T2 = 10**(eloP2/400);
   let E1 = T1 / (T1 + T2);
   let E2 = T2 / (T1 + T2);
   return [E1, E2]
}

function updatePlayers(winner, loser, eloWin, eloLose, K, players, names) {
   let elo = calcElo(eloWin, eloLose, K);
   players.players[names.indexOf(loser)].losses++;
   players.players[names.indexOf(winner)].wins++;
   players.players[names.indexOf(winner)].elo = Math.round(eloWin + K * (1 - elo[0]));
   players.players[names.indexOf(loser)].elo = Math.round(eloLose + K * (0 - elo[1]));
}

function updatePlayers2v2(winner1, winner2, loser1, loser2, eloWin1, eloWin2, eloLose1, eloLose2, K, players, names) {
   let elo = calcElo((eloWin1 + eloWin2)/2, (eloLose1 + eloLose2) / 2, K);
   players.players[names.indexOf(loser1)].losses++;
   players.players[names.indexOf(loser2)].losses++;
   players.players[names.indexOf(winner1)].wins++;
   players.players[names.indexOf(winner2)].wins++;
   players.players[names.indexOf(winner1)].elo = Math.round(eloWin1 + K * (1 - elo[0]));
   players.players[names.indexOf(loser1)].elo = Math.round(eloLose1 + K * (0 - elo[1]));
   players.players[names.indexOf(winner2)].elo = Math.round(eloWin2 + K * (1 - elo[0]));
   players.players[names.indexOf(loser2)].elo = Math.round(eloLose2 + K * (0 - elo[1]));
}

function sendTourney(channelId, user, data) {
  let winner = '';
  let loser = '';
  let scorePos = 0;
  let scoreNeg = 0;
  if(data.winloss === 'Win') {
    winner = user.id;
    loser = data.user;
  } else {
     winner = data.user;
    loser = user.id;
  }
  if(data.score === '2-1') {
     scorePos = 2;
    scoreNeg = 1;
  } else {
     scorePos = 2;
    scoreNeg = 0;
  }
  tourney.updateWinner(winner, loser, scorePos, scoreNeg, function() {
    //sendTourneyBoard(channelId);    
      slack.sendEphemeral("Your match went through! Gl on your next matches!", channelId, user.id);
  });
  
}

const addRVPPoints = (channelId, user, data) => {
  console.log('a');
  let userid = user.id;
  let code = data.code;
  let desc = data.desc;
  tourney.updateRVPPoints(userid, code, desc, function(message) {
    slack.sendEphemeral(message, channelId, user.id);
  });
}

const send1v1 = (channelId, user, data, file) => {
   if(file === 'tournament') {
     sendTourney(channelId, user, data);
     
   } else {
   let rawdata = fs.readFileSync('./' + file.replace(' ', '') +'.json');
   let players = JSON.parse(rawdata);
   let names = [];
   players.players.forEach(function(player) {
      names.push(player.name);
   });
   
   let opponame;
   let myname;
   users.find(data.user).then((result) => {
      users.find(user.id).then((result2) => {
        let oppoFirst = "";
        let oppoLast = "";
        if(result.data.user.real_name === "Whelan") {
          oppoFirst = "Noah";
          oppoLast = "Whelan";
        } else {
         oppoFirst = result.data.user.profile.real_name.split(' ')[0];
         oppoLast = result.data.user.profile.real_name.split(' ')[1];
        } 
        let myFirst = result2.data.user.profile.real_name.split(' ')[0];
        let myLast = result2.data.user.profile.real_name.split(' ')[1];
        opponame = oppoFirst + " " + oppoLast.substring(0, 1).trim();
        myname = myFirst + " " + myLast.substring(0, 1).trim();
         if (opponame === myname) {
            slack.sendEphemeral("Congratulations, you played yourself. You can\'t do that.", channelId, user.id);
            return;
         }
         addPlayerToJSON(myname, players.players, names);
         addPlayerToJSON(opponame, players.players, names);
         names = [];
         players.players.forEach(function(player) {
            names.push(player.name);
         });
         let eloP1 = players.players[names.indexOf(myname)].elo;
         let eloP2 = players.players[names.indexOf(opponame)].elo;
         let K = 32;
         if(data.score === "2-1" && file === "smash") {
            K = 32;
         } else if (data.score === "2-0" && file === "smash"){
            K = 50;
         }
         if(data.winloss === ("Loss")) {
            updatePlayerJSON(opponame, myname, "Win", data.score, file);
            updatePlayerJSON(myname, opponame, "Loss", data.score, file);
            
            updatePlayers(opponame, myname, eloP2, eloP1, K, players, names);
            slack.sendMessage(`<@${user.id}> lost to <@${data.user}> in ${file}!`, channelId, function() {sendLeaderboardText(channelId, user.id, file)});
         } else {
            updatePlayerJSON(myname, opponame, "Win", data.score, file);
            updatePlayerJSON(opponame, myname, "Loss", data.score, file);
            updatePlayers(myname, opponame, eloP1, eloP2, K, players, names);
            slack.sendMessage(`<@${user.id}> won against <@${data.user}> in ${file}!`, channelId, function() {sendLeaderboardText(channelId, user.id, file)});
         }
         players.players.sort(function(a, b) {
            return parseFloat(b.elo) - parseFloat(a.elo);
         })
         fs.writeFileSync('./' + file.replace(' ', '') + '.json', JSON.stringify(players));
      });
   })
   }
}

const send2v2 = (channelId, user, data, file) => {
   let rawdata = fs.readFileSync('./' + file.replace(' ', '') +'.json');
   let players = JSON.parse(rawdata);
   let names = [];
   players.players.forEach(function(player) {
      names.push(player.name);
   });
   
   let oppo1name;
   let myname;
   let oppo2name;
   let teammatename;
   users.find(data.oppo1).then((result) => {
      users.find(user.id).then((result2) => {
         users.find(data.oppo2).then((result3) => {
            users.find(data.teammate).then((result4) => {
               myname = (result2.data.user.profile.first_name + " " + result2.data.user.profile.last_name.substring(0, 1)).trim();
               oppo1name = (result.data.user.profile.first_name + " " + result.data.user.profile.last_name.substring(0, 1)).trim();
               oppo2name = (result3.data.user.profile.first_name + " " + result3.data.user.profile.last_name.substring(0, 1)).trim();
               teammatename = (result4.data.user.profile.first_name + " " + result4.data.user.profile.last_name.substring(0, 1)).trim();
               if (oppo1name === myname || oppo2name === myname) {
                  slack.sendEphemeral("Congratulations, you played yourself. You can\'t do that.", channelId, user.id);
                  return;
               }
               if (teammatename === myname) {
                  slack.sendEphemeral("You can\'t play with yourself here sorry. :( ", channelId, user.id);
                  return;
               }
               if (oppo1name === teammatename || oppo2name === teammatename) {
                  slack.sendEphemeral("You can\'t play against your teammate.", channelId, user.id);
                  return;
               }
               if (oppo1name === oppo2name) {
                  slack.sendEphemeral("2v1? Oof gang. Can\'t do that.", channelId, user.id);
                  return;
               }
               addPlayerToJSON(myname, players.players, names);
               addPlayerToJSON(oppo1name, players.players, names);
               addPlayerToJSON(oppo2name, players.players, names);
               addPlayerToJSON(teammatename, players.players, names);
               names = [];
               players.players.forEach(function(player) {
                  names.push(player.name);
               });
               let eloP1 = players.players[names.indexOf(myname)].elo;
               let eloP2 = players.players[names.indexOf(teammatename)].elo;
               let eloP3 = players.players[names.indexOf(oppo1name)].elo;
               let eloP4 = players.players[names.indexOf(oppo2name)].elo;
               let K = 32;
               if(data.winloss === ("Loss")) {
                  updatePlayerJSON(myname, oppo1name + " and " + oppo2name, "Loss", "N/A", file);
                  updatePlayerJSON(teammatename, oppo1name + " and " + oppo2name, "Loss", "N/A", file);
                  updatePlayerJSON(oppo1name, myname + " and " + teammatename, "Win", "N/A", file);
                  updatePlayerJSON(oppo2name, myname + " and " + teammatename, "Win", "N/A", file);
                  updatePlayers2v2(oppo1name, oppo2name, myname, teammatename, eloP3, eloP4, eloP1, eloP2, K, players, names);
                  slack.sendMessage(`<@${user.id}> and <@${data.teammate}> lost to <@${data.oppo1}> and <@${data.oppo2}> in a ${file.substring(0, file.length - 3)} 2v2!`, channelId, function() {sendLeaderboardText(channelId, user.id, file)});
               } else {
                  updatePlayerJSON(myname, oppo1name + " and " + oppo2name, "Win", "N/A", file);
                  updatePlayerJSON(teammatename, oppo1name + " and " + oppo2name, "Win", "N/A", file);
                  updatePlayerJSON(oppo1name, myname + " and " + teammatename, "Loss", "N/A", file);
                  updatePlayerJSON(oppo2name, myname + " and " + teammatename, "Loss", "N/A", file);
                  updatePlayers2v2(myname, teammatename, oppo1name, oppo2name, eloP1, eloP2, eloP3, eloP4, K, players, names);
                  slack.sendMessage(`<@${user.id}> and <@${data.teammate}> won against <@${data.oppo1}> and <@${data.oppo2}> in a ${file.substring(0, file.length - 3)} 2v2!`, channelId, function() {sendLeaderboardText(channelId, user.id, file)});
               }
               players.players.sort(function(a, b) {
                  return parseFloat(b.elo) - parseFloat(a.elo);
               })
               fs.writeFileSync('./' + file.replace(' ', '') + '.json', JSON.stringify(players));
            });
         })
      })
   })
}

const sendLeaderboard = (channelId, userID, file) => {
   sendLeaderboardText(channelId, userID, file);
}

module.exports = { send1v1, sendLeaderboard, send2v2, sendLast, whoNext, addRVPPoints };