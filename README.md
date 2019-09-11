# Slack leaderboards

Slack leaderboards is a web application that manages leaderboards and tournaments. The application also has multiple endpoints that allow other applications to interface with the leaderboards. *An example application that uses these endpoints is provided below*.

## Getting Started
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

### Prerequisites for the web application
You will first need a server to host the web application. If you do not have a server of your own I personally reccommend using [Heroku](https://heroku.com). The following instructions will be on how to host the web application on heroku.

If you are using your own server, be sure to have the following installed:
* [Ruby](https://www.ruby-lang.org/en/downloads/) 
* Rails (once ruby is installed run ```gem install rails```)
* [Sqlite3](https://www.sqlite.org/download.html) if running the development environment
* [PostgreSQL](https://www.postgresql.org/download/) if running the production environment

If you are using Heroku, be sure to have the following installed:
* [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
* [Git](https://git-scm.com/downloads)

### Installing on Heroku
 
1. Create an account on [Heroku](https://heroku.com) and create a new app (name it something memorable and unique)
2. On your Heroku dashboard, go to your new app. Then go to settings and click "Reveal Config Vars"
3. Add the following configuation values copied from creating the slack bot earlier:
* ```Key: SLACK_ACCESS_TOKEN, Value: YOUR_SLACK_BOT'S_OAUTH_TOKEN```
* ```Key: SLACK_VERIFICATION_TOKEN, Value: YOUR_SLACK_BOT'S_VERIFICATION_TOKEN```
4. Clone this repository using the command ```git clone https://github.com/EliGrosman/TriangleUWSlackLeaderboards.git```
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
