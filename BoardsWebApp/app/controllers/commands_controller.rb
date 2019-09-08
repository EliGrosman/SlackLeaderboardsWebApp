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
      @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY elo DESC", @board.board_name]))
    else
      @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY (wins-losses) DESC", @board.board_name]))
    end
    if @match.save
      render json: @leaderboard, :status => :created
    else
      render json: @leaderboard, :status => :bad_request
    end
  end
end
