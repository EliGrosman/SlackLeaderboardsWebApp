class HomeController < ApplicationController

  def index
    @boards = Board.left_outer_joins(:match).group(:board_name, :id, :elo_enabled, :rr_tournament, :points_board).select("boards.id, boards.board_name, boards.elo_enabled, boards.rr_tournament, boards.points_board, COALESCE(COUNT(matches.winner), 0) AS count_matches").order("count_matches DESC")
  end

  def newboard
    @board = Board.new
  end

  def createboard
    @board = Board.new(board_params)
    if @board.save
      flash[:success] = "Board was successfully created"
      redirect_to root_path
    else 
      flash.now[:danger] = "Board could not be created"
      render :newboard
    end
  end
  
  def show
    @board = Board.find(params[:id])
    @matches = Match.where(board: @board).order('created_at DESC')
  end

  def showpoints
    @board = Board.find(params[:id])
    @used_points = Point.where(board: @board).where.not(user: nil)
    @unused_points = Point.where(board: @board  , user: nil)
  end

  def editpoints
    @point = Point.find(params[:id])
  end

  def updatepoints
    @point = Point.find(params[:id])
    if (@point.update(point_params))
      flash[:success] = "Points were updated successfully"
      redirect_to points_path(@point.board)
    else
      flash.now[:danger] = "Could not update points"
      render edit_point_path(@point)
    end
  end

  def destroypoints
    @point = Point.find(params[:id])
    @board = @point.board
    if @point.destroy
      flash[:success] = "Points were deleted successfully"
      redirect_to points_path(@board)
    else
      flash[:danger] = "Could not delete points"
      redirect_to points_path(@match)
    end
  end
  
  def deleteboard
    @board = Board.find(params[:id])
    if @board.destroy
      flash[:success] = "Board was deleted successfully"
      redirect_to root_path
    else
      flash[:danger] = "Board was not deleted"
      redirect_to root_path
    end
  end

  def viewleaderboard
    @board = Board.find(params[:id])
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
    if(@board.elo_enabled)
      @players = @players.sort_by {|name, key| key[:elo]}.reverse
    else
      @players = @players.sort_by {|name, key| key[:wins] - key[:losses]}.reverse
    end
  end

  def edit
    @match = Match.find(params[:id])
  end

  def update
    @match = Match.find(params[:id])
    if (@match.update(match_params))
      flash[:success] = "Match was updated successfully"
      redirect_to match_path(@match.board)
    else
      flash.now[:danger] = "Could not update match"
      redirect_to edit_match_path(@match)
    end
  end

  def destroy
    @match = Match.find(params[:id])
    @board = @match.board
    if @match.destroy
      flash[:success] = "Match was deleted successfully"
      redirect_to match_path(@board)
    else
      flash.now[:danger] = "Could not update match"
      redirect_to edit_match_path(@match)
    end
  end

  def managetournament
    @board = Board.where(id: params[:id]).first
    if(@board.nil? || !@board.rr_tournament) 
      flash[:danger] = "Tournament not found"
      redirect_to root_path
    else
      @matches = TournamentMatch.where(board: @board).order("round ASC")
      @rounds = TournamentMatch.where(board: @board).group(:round).order("round ASC").select(:round)
      apiRequest = Slackapi.getAllUsers()
      @players = apiRequest.first
      @ids = apiRequest.last
    end
  end

  def createtournament
    @board = Board.find(params[:id])
    players = Hash.new
    seeded = params[:seeded]
    numGames = params[:numGames]
    params.each do |id, attrs|
      if(id.starts_with?('player'))
        players[id] = attrs
      end
    end
    if(seeded.nil?)
      puts players
      players = Hash[players.to_a.shuffle]
      puts players
    end
    if(players.size < 3 || players.group_by{|h| h[1]}.values.select{|players| players.size > 1}.flatten.size > 0)
      flash[:danger] = "You need more unique players to start a tournament."
      redirect_to manage_tournament_path(@board)
      return
    end 
    if(numGames.to_i < 1)
      flash[:danger] = "You need more rounds in the tournament."
      redirect_to manage_tournament_path(@board)
      return
    end
    q1 = Queue.new
    q2 = Queue.new
    if(players.size % 2 != 0) 
      players["player" + players.size.to_s] = "Bye"
    end
    if(!seeded.nil?)
      puts "not seeded"
      players = Hash[players.to_a.shuffle]
    end

    for i in 0..(players.size/2)-1
      q1 << players["player" + i.to_s]
    end

    for i in players.size/2..players.size-1
      q2 << Hash[players.to_a.reverse]["player" + i.to_s]
    end

    generateTourneyRounds(q1, q2, numGames.to_i, @board)

    flash[:success] = "Tournament created!"
    redirect_to manage_tournament_path(@board)
  end

  def generateTourneyRounds(q1, q2, n, board)
    for x in 1..n
      for y in 1..(q1.size + q2.size)-1
        puts "Week " + x.to_s + " Round " + y.to_s
        temp1 = Queue.new
        temp2 = Queue.new
        for i in 0..q1.size-1
          p1 = q1.pop
          p2 = q2.pop
          temp1 << p1
          temp2 << p2
          puts p1.to_s + " v. " + p2.to_s
          if (p1 != "Bye" && p2 != "Bye")
            TournamentMatch.create!(player1: p1, player2: p2, completed: false, board: board, round: x)
          end
        end
        q1 << temp1.pop
        q1 << temp2.pop
        for i in 0..temp2.size-2
          q1 << temp1.pop
          q2 << temp2.pop
        end
        q2 << temp2.pop
        q2 << temp1.pop
      end
      q2 << q1.pop
      q1 << q2.pop
    end
  end

  private
    def board_params
      params.require(:board).permit(:board_name, :elo_enabled, :rr_tournament, :points_board)
    end

    def match_params
      params.require(:match).permit(:winner, :loser, :score)
    end

    def point_params
      params.require(:point).permit(:user, :points, :code)
    end

end
