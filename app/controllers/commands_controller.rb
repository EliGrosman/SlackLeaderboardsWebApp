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
      winnerName = Slackapi.getRealName(match.winner)||match.winner
      if(!@board.elo_enabled)
        @players[winnerName] = {wins: match.count_wins, losses: 0}
      else
        @players[winnerName] = {wins: match.count_wins, losses: 0, elo: 1000 + match.elo}
      end
    end

    @matchLosses.each do |match|
      loserName = Slackapi.getRealName(match.loser)||match.loser
      if(@players[loserName].empty?)
        if(!@board.elo_enabled)
          @players[loserName] = {wins: 0, losses: match.count_losses}
        else
          @players[loserName] = {wins: 0, losses: match.count_losses, elo: 1000 + match.elo}
        end
      else
        if(!@board.elo_enabled)
          @players[loserName][:losses] = match.count_losses
        else
          @players[loserName][:losses] = match.count_losses
          @players[loserName][:elo] += match.elo
        end 
      end
    end  
    if(@board.elo_enabled)
      @players = @players.sort_by {|name, key| key[:elo]}.reverse
    else
      @players = @players.sort_by {|name, key| key[:wins] - key[:losses]}.reverse
    end
    render json: @players, :status => :ok
  end

  def getboards
    @boards = Board.all
    render json: @boards, :status => :ok
  end

  def tournamentmatches
    js = {params[:game]=> params[:round]}
    @board = Board.where("lower(board_name) LIKE ?", params[:game].downcase).first
    @matches = TournamentMatch.where(board: @board, round: params[:round].to_i, completed: false)
    if(!@matches.empty?)
      render json: @matches, :status => :ok
    else
      render json: nil, :status => :bad_request
    end
  end

end
