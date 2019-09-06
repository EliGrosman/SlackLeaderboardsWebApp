class Match < ApplicationRecord
  belongs_to :board
  before_save {
    con = ActiveRecord::Base.connection
    winnerObj = con.execute("SELECT * FROM '" + board.board_name + "' WHERE player = '" + winner + "'").first
    loserObj = con.execute("SELECT * FROM '" + board.board_name + "' WHERE player = '" + loser + "'").first
    if(winnerObj.nil?) 
      con.execute("INSERT INTO '" + board.board_name + "'(player, wins, losses) VALUES('" + winner + "', 1, 0)")
    else
      wins = winnerObj[1] + 1
      con.execute("UPDATE '" + board.board_name + "' SET wins = " + wins.to_s + " WHERE player = '" + winner + "'")
    end
    if(loserObj.nil?)
      con.execute("INSERT INTO '" + board.board_name + "'(player, wins, losses) VALUES('" + loser + "', 0, 1)")
    else
      losses = loserObj[2] + 1
      con.execute("UPDATE '" + board.board_name + "' SET losses = " + losses.to_s + " WHERE player = '" + loser + "'")
    end
  }
end
