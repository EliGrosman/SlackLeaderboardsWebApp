var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const qs = require('qs');
const users = require('./users');
const apiUrl = 'https://slack.com/api';
const slackapi = require('simple-slack-api');


const slack = new slackapi(process.env.SLACK_ACCESS_TOKEN, process.env.SLACK_SIGNING_SECRET, process.env.SLACK_VERIFICATION_TOKEN);


var dbFile = './data/database.db';
var db = new sqlite3.Database(dbFile);

function getPlayer(slackid) {
  db.each(`SELECT name FROM Player WHERE slackid=\"${slackid}\"`, function(err, row) {
    if (row) {
      return true;
    }
  })
  return false;
}

function addNewPlayer(dmid, userid, name) {
    db.run(`INSERT INTO Player(dmid, userid, name, wins, losses, mapWins, mapLosses) VALUES (\"${dmid}\", \"${userid}\", \"${name}\", 0, 0, 0, 0)`);
}

function addMatchup(player1, player2) {
    db.run(`INSERT INTO Match(player1, player2, completed, winner, scorePos, scoreNeg) VALUES (\"${player1}\", \"${player2}\", 0, 0, 0, 0)`);
    db.run(`INSERT INTO Match(player1, player2, completed, winner, scorePos, scoreNeg) VALUES (\"${player2}\", \"${player1}\", 0, 0, 0, 0)`);

}

function updateWinnerName(winner, loser, scorePos, scoreNeg) {
  console.log(winner + loser + scorePos + scoreNeg);
    db.run(`UPDATE Match set scorePos=${scorePos}, scoreNeg=${scoreNeg}, completed=1, winner=\"${winner}\" WHERE player1 = \"${winner}\" AND player2 = \"${loser}\"`);    
    db.run(`UPDATE Match set scorePos=${scorePos}, scoreNeg=${scoreNeg}, completed=1, winner=\"${winner}\" WHERE player1 = \"${loser}\" AND player2 = "${winner}\"`);    
    db.run(`UPDATE Player SET wins=wins+1, mapWins=mapWins+${scorePos}, mapLosses=mapLosses+${scoreNeg} WHERE name=\"${winner}\"`);
    db.run(`UPDATE Player SET losses=losses+1, mapWins=mapWins+${scoreNeg}, mapLosses=mapLosses+${scorePos} WHERE name=\"${loser}\"`);
}

function updateWinner(winner, loser, scorePos, scoreNeg, callback) {
  console.log(winner + loser + scorePos + scoreNeg);
    db.run(`UPDATE Match set scorePos=${scorePos}, scoreNeg=${scoreNeg}, completed=1, winner=\"${winner}\" WHERE player1 = (SELECT name FROM Player WHERE userid=\"${winner}\") AND player2 = (SELECT name FROM Player WHERE userid=\"${loser}\")`);    
    db.run(`UPDATE Match set scorePos=${scorePos}, scoreNeg=${scoreNeg}, completed=1, winner=\"${winner}\" WHERE player1 = (SELECT name FROM Player WHERE userid=\"${loser}\") AND player2 = (SELECT name FROM Player WHERE userid=\"${winner}\")`);    
    db.run(`UPDATE Player SET wins=wins+1, mapWins=mapWins+${scorePos}, mapLosses=mapLosses+${scoreNeg} WHERE userid=\"${winner}\"`);
    db.run(`UPDATE Player SET losses=losses+1, mapWins=mapWins+${scoreNeg}, mapLosses=mapLosses+${scorePos} WHERE userid=\"${loser}\"`);
    callback();
}

function sendMatches() {
  //db.each(`SELECT P.name AS name, P.dmid dmid FROM Player AS P`, function(err, row) {
  //  slack.sendMessage('Announcement: The number of matches each week are dying down unless you face Ian since he jumped into the tourney a week late. Please get your matches done ASAP so you don\'t have to cram them in before dead week.', row.dmid);
  //});
  db.each(`SELECT P1.name AS p1name, P1.dmid AS dmid, P2.name AS name FROM Match AS M JOIN Player AS P2 JOIN Player AS P1 ON M.Player2 = P2.name AND M.Player1 = P1.name WHERE M.completed=0`, function(err, row2) {
    slack.sendMessage("You have a match against *" + row2.name + "*. Please report this to the \'Spring Tournament\' game using \/report1v1.", row2.dmid);
  });
}

function getPlayers(callback) {
  db.all('SELECT P.name AS name, P.wins AS wins, P.losses AS losses, P.mapWins AS mapWins, P.mapLosses AS mapLosses, (P.wins-P.losses) AS score, (P.mapWins-P.mapLosses) AS mapScore FROM Player P WHERE name<>"Sam S" ORDER BY score DESC, mapScore DESC', function(err, row) {
    callback(row);
  })
}

function getRVPPlayers(callback) {
  db.all('SELECT people.name AS name, SUM(points.value) AS sumPoints FROM rvppeople people INNER JOIN rvppoints points ON people.slackid = points.person GROUP BY people.name ORDER BY sumPoints DESC', function(err, row) {
    console.log(row);
    callback(row);
  })
}

function updateRVPPoints(userid, code, desc, callback) {
  var ret;
  db.each('SELECT * FROM rvppoints WHERE code = \'' + code + '\' AND person != \'null\'', function(err, row) {
    callback('That code does not exist or was already redeemed. If this is an error, contact Eli.');
  });
  db.each('SELECT * FROM rvppoints WHERE code = \'' + code + '\' AND person = \'null\'', function(err, row) {
    db.run('UPDATE rvppoints SET description = \'' + desc + '\', person = \'' + userid + '\' WHERE code = \'' + code + '\'');
    db.each('SELECT SUM(value) AS sum FROM rvppoints WHERE person = \'' + userid + '\'', function(err, row2) {
      callback('Your RVP points were successfully redeemed! You are now at ' + row2.sum + ' points');
    });
  });
}

module.exports = {addNewPlayer, addMatchup, updateWinner, sendMatches, getPlayer , getPlayers, updateWinnerName, getRVPPlayers, updateRVPPoints};


