class Slackapi

  def self.getRealName(userid)
    url = URI.parse("https://slack.com/api/users.info")
    params = {"user" => userid}
    headers = {"Authorization" => "Bearer #{ENV["SLACK_ACCESS_TOKEN"]}"}

    http = Net::HTTP.new(url.host, url.port)
    response = http.post(url.path, params.to_json, headers)
    if JSON.load(response.body)["error"]
      return nil
    else
      profile = JSON.load(response.body)["user"]["profile"]
      return profile["first_name"] + " " + (profile["last_name"][0]||" ").upcase
    end
  end

  def self.getAllUsers()
    url = URI.parse("https://slack.com/api/users.list")
    params = {"token" => ENV["SLACK_ACCESS_TOKEN"]}
    headers = {"Authorization" => "Bearer #{ENV["SLACK_ACCESS_TOKEN"]}"}

    http = Net::HTTP.new(url.host, url.port)
    response = http.post(url.path, params.to_json, headers)
    if JSON.load(response.body)["error"]
      return nil
    else
      users = []
      ids = []
      JSON.load(response.body)["members"].each do |user|
        if(!user["is_bot"] && user["real_name"] != "Slackbot")
          users << user["real_name"]
          ids << user["id"]
        end
      end
      return users, ids
    end
  end
end