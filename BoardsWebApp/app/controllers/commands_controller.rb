class CommandsController < ApplicationController
skip_before_action :verify_authenticity_token

  def report
    @scorePos = params[:score].split("-")[0]
    @scoreNeg = params[:score].split("-")[1]
    @board = Board.find_by(board_name: params[:game])
    if(params[:winloss] == "Win")
      @match = Match.new(winner: params[:user], loser: params[:opponent], score_pos: @scorePos, score_neg: @scoreNeg, board: @board)
    else 
      @match = Match.new(winner: params[:opponent], loser: params[:user], score_pos: @scorePos, score_neg: @scoreNeg, board: @board)
    end

    if(@board.elo_enabled)
      @leaderboard = ActiveRecord::Base.connection.execute("SELECT * FROM " + @board.board_name + " ORDER BY elo DESC")
    else
      @leaderboard = ActiveRecord::Base.connection.execute("SELECT * FROM " + @board.board_name + " ORDER BY (wins-losses) DESC")
    end
    if @match.save
      render json: @leaderboard, :status => :created
    else
      render json: @leaderboard, :status => :bad_request
    end
  end
end
