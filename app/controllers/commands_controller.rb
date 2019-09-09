class CommandsController < ApplicationController
skip_before_action :verify_authenticity_token

  def report
    if params[:score].nil? || params[:user].nil? || params[:opponent].nil? || params[:game].nil? || params[:winloss].nil?
      render json: nil, :status => :bad_request
    else
      if params[:user] == params[:opponent]
        render json: nil, :status => :conflict
      else
        @scorePos = params[:score].split("-")[0]
        @scoreNeg = params[:score].split("-")[1]
        @board = Board.find_by(board_name: params[:game])
        if(params[:winloss] == "Win")
          @match = Match.new(winner: params[:user], loser: params[:opponent], score_pos: @scorePos, score_neg: @scoreNeg, board: @board)
        else 
          @match = Match.new(winner: params[:opponent], loser: params[:user], score_pos: @scorePos, score_neg: @scoreNeg, board: @board)
        end
        if @match.save
          users = []
          if(@board.elo_enabled)
            @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY elo DESC", @board.board_name]))         
            @leaderboard.each do |row| 
              users << {player: Slackapi.getRealName(row["player"]), wins: row["wins"], losses: row["losses"], elo: row["elo"]}
            end
          else
            @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY (wins-losses) DESC", @board.board_name]))
            @leaderboard.each do |row| 
              users << {player: Slackapi.getRealName(row["player"]), wins: row["wins"], losses: row["losses"]}
            end
          end
          render json: users.to_json, :status => :created
        else
          render json: nil, :status => :bad_request
        end
      end
    end
  end

  def leaderboard
    @board = Board.where("lower(board_name) LIKE ?", params[:board].downcase).first
    if(@board.nil?)
      render json: nil, :status => :bad_request
      return
    end
    users = []
    if(@board.elo_enabled)
      @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY elo DESC", @board.board_name]))         
      @leaderboard.each do |row| 
        users << {player: Slackapi.getRealName(row["player"]), wins: row["wins"], losses: row["losses"], elo: row["elo"]}
      end
    else
      @leaderboard = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY (wins-losses) DESC", @board.board_name]))
      @leaderboard.each do |row| 
        users << {player: Slackapi.getRealName(row["player"]), wins: row["wins"], losses: row["losses"]}
      end
    end
    render json: users.to_json, :status => :ok
  end

  def getboards
    @boards = Board.all
    render json: @boards, :status => :ok
  end
end
