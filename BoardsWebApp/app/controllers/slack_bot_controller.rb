class SlackBotController < ApplicationController
  
  def create
    return render json: {}, status: 403 unless valid_slack_token?
    CommandWorker.new.perform(command_params.to_h)
    render json: {response_type: "in_channel"}, status: :created
  end

  private
    def valid_slack_token?
      params[:token] == ENV["SLACK_ACCESS_TOKEN"]
    end
    def command_params
      params.permit(:text, :token, :user_id, :response_url)
    end

    
end

