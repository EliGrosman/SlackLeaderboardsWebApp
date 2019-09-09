class Slackapi

  def self.getRealName(userid)
    uri = URI.parse("https://slack.com/api/users.info")
    params = {"token" => ENV["SLACK_ACCESS_TOKEN"], "user" => userid}
    response = Net::HTTP.post_form(uri, params)
    if JSON.load(response.body)["error"]
      return nil
    else
      profile = JSON.load(response.body)["user"]["profile"]
      return profile["first_name"] + " " + profile["last_name"][0].upcase
    end
  end
end