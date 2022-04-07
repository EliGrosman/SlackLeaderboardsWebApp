class Slackapi

  def self.getRealName(userid)
    uri = URI.parse("https://slack.com/api/users.info?user=#{userid}")

    res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      req = Net::HTTP::Get.new(uri)
      req['Authorization'] = "Bearer #{ENV["SLACK_ACCESS_TOKEN"]}"

      http.request(req)
    end

    if JSON.load(res.body)["error"]
      return nil
    else
      profile = JSON.load(res.body)["user"]["profile"]
      if profile["first_name"].nil? && profile["last_name"].nil?
        return profile["real_name"]
      else
          return profile["first_name"] + " " + (profile["last_name"][0]||" ").upcase
      end
    end
  end

  def self.getAllUsers()
    url = URI.parse("https://slack.com/api/users.list")

    res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) do |http|
      req = Net::HTTP::Get.new(uri)
      req['Authorization'] = "Bearer #{ENV["SLACK_ACCESS_TOKEN"]}"

      http.request(req)
    end
    if JSON.load(res.body)["error"]
      return nil
    else
      users = []
      ids = []
      JSON.load(res.body)["members"].each do |user|
        if(!user["is_bot"] && user["real_name"] != "Slackbot")
          users << user["real_name"]
          ids << user["id"]
        end
      end
      return users, ids
    end
  end
end