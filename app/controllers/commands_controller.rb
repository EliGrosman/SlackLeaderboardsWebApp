class CommandsController < ApplicationController
skip_before_action :verify_authenticity_token

  def report
    if params[:score].nil? || params[:user].nil? || params[:opponent].nil? || params[:game].nil? || params[:winloss].nil?
      render json: nil, :status => :bad_request
    else
      if params[:user] == params[:opponent]
        render json: nil, :status => :conflict
      else
        @board = Board.find_by(board_name: params[:game])
        if(params[:winloss] == "Win")
          @match = Match.new(winner: params[:user], loser: params[:opponent], score: params[:score], board: @board)
        else 
          @match = Match.new(winner: params[:opponent], loser: params[:user], score: params[:score], board: @board)
        end
        if @match.save
          sendBoard(params[:game])
        else
          render json: nil, :status => :bad_request
        end
      end
    end
  end

  def leaderboard
    sendBoard(params[:board])
  end

  def sendBoard(boardName)
    @board = Board.where("lower(board_name) LIKE ?", boardName.downcase).first
    if(@board.nil?)
      render json: nil, :status => :bad_request
      return
    end
    @matchWins = Match.where(board: @board).group(:winner).select("winner, COUNT(matches.winner) AS count_wins, SUM(winner_elo_change) AS elo")
    @matchLosses = Match.where(board: @board).group(:loser).select("loser, COUNT(matches.loser) AS count_losses, SUM(loser_elo_change) AS elo")
    @players = Hash.new{|hsh,key| hsh[key] = []}
    @matchWins.each do |match|
      if(!@board.elo_enabled)
        @players[match.winner] = {wins: match.count_wins, losses: 0}
      else
        @players[match.winner] = {wins: match.count_wins, losses: 0, elo: 1000 + match.elo}
      end
    end

    @matchLosses.each do |match|
      if(@players[match.loser].empty?)
        if(!@board.elo_enabled)
          @players[match.loser] = {wins: 0, losses: match.count_losses}
        else
          @players[match.loser] = {wins: 0, losses: match.count_losses, elo: 1000 + match.elo}
        end
      else
        if(!@board.elo_enabled)
          @players[match.loser][:losses] = match.count_losses
        else
          @players[match.loser][:losses] = match.count_losses
          @players[match.loser][:elo] += match.elo
        end 
      end
    end  
    render json: @players, :status => :ok
  end
  def getboards
    @boards = Board.all
    render json: @boards, :status => :ok
  end
end
