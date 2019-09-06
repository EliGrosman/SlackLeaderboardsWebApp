class HomeController < ApplicationController

  def index
    @boards = Board.left_outer_joins(:match).group(:board_name).select("boards.id, boards.board_name, boards.elo_enabled, boards.rr_tournament, COALESCE(COUNT(matches.winner), 0) AS count_matches").order("count_matches DESC")
  end

  def newboard
    @board = Board.new
  end

  def createboard
    @board = Board.new(board_params)
    begin
      ActiveRecord::Base.transaction do
      sql = "CREATE TABLE '" + board_params[:board_name] + "' (player varchar(50) NOT NULL, wins INT, losses INT"
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
    @matches = Match.where(board: @board)
  end

  def deleteboard
    @board = Board.find(params[:id])
    @matches = Match.where(board: @board)
    begin 
      ActiveRecord::Base.transaction do
        sql = "DROP TABLE " + @board.board_name
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
      @players = ActiveRecord::Base.connection.execute('SELECT * FROM ' + @board.board_name + ' ORDER BY elo DESC')
    else
      @players = ActiveRecord::Base.connection.execute('SELECT * FROM ' + @board.board_name + ' ORDER BY (wins-losses) DESC')
    end
  end

  def edit
    @match = Match.find(params[:id])
  end

  private
    def board_params
      params.require(:board).permit(:board_name, :elo_enabled, :rr_tournament)
    end
end
