# Slack leaderboards

Slack leaderboards is a web application that manages leaderboards and tournaments. The application also has multiple endpoints that allow other applications to interface with the leaderboards. *An premade slack-bot that uses these endpoints is provided below*.

I made this under pressure in a couple days and didn't do a lot of testing so there are definitely bugs that I haven't found. Please let me know if you find something.

## Setup
Instructions on how to install and use this application are below:

### Creating a Slack Bot
These instructions will detail how to create a slack bot and get the required configuration values. Instructions on how to set up the commands will be provided later.

1. Visit the [Slack API portal](https://api.slack.com/apps) and log in
2. Click "Create New App" and name it whatever you want. Then click which workspace you wish to have the leaderboards in.
3. Click "OAuth & Permissions" on the left side and scroll down to "Scopes"
4. Add the following permissions to the bot and click "Save Changes":
* channels:read
* chat:write:bot
* bot
* commands
* users:read
5. Click "Bot Users" on the left side and then click "Add a Bot User". Fill out the form and finish adding the bot user. 
6. Go back to "OAuth & Permissions" and then click "Install Bot User" and finally click "Allow"
7. IMPORTANT: Copy the "OAuth Access Token" and "Verification Token" from the "Basic Information" tab. You will need these to set up the web application.

### Prerequisites for the Web Application
You will first need a server to host the web application. If you do not have a server of your own I personally reccommend using [Heroku](https://heroku.com) because it is free. The following instructions will be on how to host the web application on heroku.

If you are using your own server, be sure to have the following installed:
* [Ruby](https://www.ruby-lang.org/en/downloads/) 
* Rails (once ruby is installed run ```gem install rails```)
* [Sqlite3](https://www.sqlite.org/download.html) if running the development environment
* [PostgreSQL](https://www.postgresql.org/download/) if running the production environment
All you need to do to start the app is to run ```rake db:create db:migrate RAILS_ENV=production``` and ```rails s -e production``` on your server.

If you are using Heroku, be sure to have the following installed:
* [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
* [Git](https://git-scm.com/downloads)

### Installing on Heroku
 The web application provides a clean UI to create/manage leaderboards and has multiple endpoints that can be used by other applications to access the leaderboards and tournaments. Follow these instructions to install the web app.
 
1. Create an account on [Heroku](https://heroku.com) and create a new app (name it something memorable and unique)
2. On your Heroku dashboard, go to your new app. Then go to settings and click "Reveal Config Vars"
3. Add the following configuation values copied from creating the slack bot earlier:
* ```Key: SLACK_ACCESS_TOKEN, Value: YOUR_SLACK_BOT'S_OAUTH_TOKEN```
* ```Key: SLACK_VERIFICATION_TOKEN, Value: YOUR_SLACK_BOT'S_VERIFICATION_TOKEN```
4. Clone this repository using the command ```git clone https://github.com/EliGrosman/SlackLeaderboardsWebApp.git```
5. Open the downloaded directory ```/TriangleUWSlackLeaderboards``` in your command prompt and run the following commands:
* ```heroku login``` (You will need to provide your heroku credentials)
* ```git init```
* ```heroku git:remote -a YOUR_HEROKU_APP_NAME```
* ```git add .```
* ```git commit -m "upload to heroku"```
* ```git push heroku master```
6. After some time, Heorku will upload the web app and install all the required packages. 
7. When Heroku has finished, type the following command to finish up setting the web app: ```heroku run rake db:migrate```
8. Now the web app is set up and you can visit it in a browser.

### The Web Application's Endpoints
 Here are the web app's HTTP endpoints:
 * ```GET /getboards``` Gets a list of all the leaderboards stored in the database
 * ```GET /leaderboard``` Gets the rankings of all the players on a leaderboard
 * ```GET /tournamentmatches``` Gets the tournament matches for a specific board and round of the tournament
 * ```POST /report``` Reports a match 
 
### Installing the Slack-Bot
 This Slack-bot uses the endpoints provided by the web application to display the information to users on Slack. In order for leaderboards and tournaments to be avaliable on slack, both the slack-bot and web application need to be running. Follow these instructions to install the slack-bot.
 
If you are running the bot on your own server, have the following installed:
* [Node.js](https://nodejs.org/en/download/)
To start the bot, clone [this repository](https://github.com/EliGrosman/SlackLeaderboardsBot) and run ```npm install``` and ```node .```

I personally like to host this bot on [Glitch](https://glitch.com/) which is free to use. Follow these instructions on how to get it running on Glitch:
1. Create a Glitch account and create a new project. Instead of using one of the presets, click "Clone from Git Repo" and paste this url in: ```https://github.com/EliGrosman/SlackLeaderboardsBot```
2. Glitch will now install all the required packages and run the bot.
3. Edit ```.env``` and fill in all the config variables from the Slack API portal. The web app url is the url to the web app on Heroku or your own server.
4. Click "Show" and "In a new window" and copy the URL for this page. You will need it in the next section
4. Return to the Slack API portal to set up the commands.


### Setting up the Bot's Commands
This section will be all on the Slack API portal

1. Go to "Interactive Components" and click the switch to turn it on. Under "Request URL" paste your Glicth app's URL (or your own server's URL) followed by ```/actions```
2. Go to "Slash Commands" and create the following commands:
* ```Command: /leaderboard    Request URL: YOUR_GLITCH_URL/leaderboard   Description: Prints a leaderboard    Usage: /leaderboard <board name>```
* ```Command: /report    Request URL: YOUR_GLITCH_URL/report    Description: Reports a match    Usage: /report```
* ```Command: /getmatches    Request URL: YOUR_GLITCH_URL/getmatches    Description: Prints round robin tournmaent matches    Usage: /getmatches```


# Final notes

After following these steps, your bot and web app should be properly configured and ready to be used. If you have any questions, suggestions, or found a bug please email me at eligrosman1@gmail.com. I will probably update this repository so please check back to see if any of the changes/additions seem useful.

