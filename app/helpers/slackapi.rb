class Slackapi

  def self.getRealName(userid)
    uri = URI.parse("https://slack.com/api/users.info")
    params = {"token" => ENV["SLACK_ACCESS_TOKEN"], "user" => userid}
    response = Net::HTTP.post_form(uri, params)
    if JSON.load(response.body)["error"]
      return nil
    else
      profile = JSON.load(response.body)["user"]["profile"]
      return profile["first_name"] + " " + (profile["last_name"][0]||" ").upcase
    end
  end

  def self.getAllUsers()
    uri = URI.parse("https://slack.com/api/users.list")
    params = {"token" => ENV["SLACK_ACCESS_TOKEN"]}
    response = Net::HTTP.post_form(uri, params)
    if JSON.load(response.body)["error"]
      return nil
    else
      users = []
      ids = []
      JSON.load(response.body)["members"].each do |user|
        if(!user["is_bot"])
          users << user["real_name"]
          ids << user["id"]
        end
      end
      return users, ids
    end
  end
end