class HomeController < ApplicationController

  def index
    @boards = Board.left_outer_joins(:match).group(:board_name, :id, :elo_enabled, :rr_tournament).select("boards.id, boards.board_name, boards.elo_enabled, boards.rr_tournament, COALESCE(COUNT(matches.winner), 0) AS count_matches").order("count_matches DESC")
  end

  def newboard
    @board = Board.new
  end

  def createboard
    @board = Board.new(board_params)
    begin
      ActiveRecord::Base.transaction do
      sql = ActiveRecord::Base::sanitize_sql(["CREATE TABLE \"?\" (player varchar(50) NOT NULL, wins INT, losses INT", board_params[:board_name]])
      if(board_params[:elo_enabled]) 
        sql += ", elo INT"
      end
      sql += ")"
      logger.error(board_params[:elo_enabled] == true)
      ActiveRecord::Base.connection.execute(sql)
      if @board.save
        flash[:success] = "Board was successfully created"
        redirect_to root_path
      else 
        flash.now[:danger] = "Board could not be created"
        render :newboard
      end
    end
    rescue Exception => exc
      logger.error(exc.message)
        flash.now[:danger] = "Board could not be created"
        render :newboard
    end
  end
  
  def show
    @board = Board.find(params[:id])
    @matches = Match.where(board: @board).order('created_at DESC')
  end

  def deleteboard
    @board = Board.find(params[:id])
    @matches = Match.where(board: @board)
    begin 
      ActiveRecord::Base.transaction do
        sql = ActiveRecord::Base::sanitize_sql(["DROP TABLE \"?\"", @board.board_name])
        ActiveRecord::Base.connection.execute(sql)
        if @board.destroy && @matches.delete_all
          flash[:success] = "Board was deleted successfully"
          redirect_to root_path
        else
          flash[:danger] = "Board was not deleted"
          redirect_to root_path
        end
      end
      rescue Exception => exc
        logger.error(exc.message)
        flash[:danger] = "Board was not deleted"
        redirect_to root_path
      end
    end

  def viewleaderboard
    @board = Board.find(params[:id])
    if(@board.elo_enabled)
      @players = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY elo DESC", @board.board_name]))
    else
      @players = ActiveRecord::Base.connection.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" ORDER BY (wins-losses) DESC", @board.board_name]))
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

  private
    def board_params
      params.require(:board).permit(:board_name, :elo_enabled, :rr_tournament)
    end

    def match_params
      params.require(:match).permit(:winner, :loser, :score_pos, :score_neg)
    end
end
