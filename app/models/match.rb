class Match < ApplicationRecord
  @T1 = @T2 = @E1 = @E2 = 0
  belongs_to :board
  belongs_to :tournament_match, optional: true
  before_create {
    con = ActiveRecord::Base.connection
    winnerObj = con.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" WHERE player = ?", board.board_name, winner])).first
    loserObj = con.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" WHERE player = ?", board.board_name, loser])).first
    if(board.elo_enabled)
      if(winnerObj.nil?)
        eloWinner = 1000
      else 
        eloWinner = winnerObj["elo"]
      end
      if(loserObj.nil?)
        eloLoser = 1000
      else 
        eloLoser = loserObj["elo"]
      end
      calcElo(eloWinner, eloLoser)
      newEloWinner = (eloWinner.to_f + 32.0 * (1.0 - @E1)).ceil
      newEloLoser = (eloLoser.to_f + 32.0 * (0.0  - @E2)).ceil
      self.winner_elo_change = newEloWinner - eloWinner
      self.loser_elo_change = newEloLoser - eloLoser    
    end
    if(winnerObj.nil?) 
      if(board.elo_enabled)
        con.execute(ActiveRecord::Base::sanitize_sql(["INSERT INTO \"?\" (player, wins, losses, elo) VALUES(?, 1, 0, ?)", board.board_name, winner, newEloWinner.to_s]))        
      else
        con.execute(ActiveRecord::Base::sanitize_sql(["INSERT INTO \"?\" (player, wins, losses) VALUES(?, 1, 0)", board.board_name, winner]))
      end
      else
      wins = winnerObj["wins"] + 1
      if(board.elo_enabled)
        con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET wins = ?, elo = ? WHERE player = ?", board.board_name, wins.to_s, newEloWinner.to_s, winner]))
      else
        con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET wins = ? WHERE player = ?", board.board_name, wins.to_s, winner]))
      end
    end
    if(loserObj.nil?)
      if(board.elo_enabled)
        con.execute(ActiveRecord::Base::sanitize_sql(["INSERT INTO \"?\" (player, wins, losses, elo) VALUES(?, 0, 1, ?)", board.board_name, loser, newEloLoser.to_s]))        
      else
        con.execute(ActiveRecord::Base::sanitize_sql(["INSERT INTO \"?\" (player, wins, losses) VALUES(?, 0, 1)", board.board_name, loser]))
      end
      else
      losses = loserObj["losses"] + 1
      if(board.elo_enabled)
        con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET losses = ?, elo = ? WHERE player = ?", board.board_name, losses.to_s, newEloLoser.to_s, loser]))
      else
        con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET losses = ? WHERE player = ?", board.board_name, losses.to_s, loser]))
      end
    end
  }

  after_create {
    if(board.rr_tournament) 
      t_match = TournamentMatch.where("completed = false AND ((player1 = ? AND player2 = ?) OR (player1 = ? AND player2 = ?))", winner, loser, loser, winner).order("round ASC").first
      if(t_match.nil?)
        self.destroy
      else
        self.tournament_match = t_match
        t_match.completed = true
        t_match.save
      end
    end
  }

  before_destroy {
    con = ActiveRecord::Base.connection
    winnerObj = con.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" WHERE player = ?", board.board_name, winner])).first
    loserObj = con.execute(ActiveRecord::Base::sanitize_sql(["SELECT * FROM \"?\" WHERE player = ?", board.board_name, loser])).first
    wins = winnerObj["wins"] - 1
    losses = loserObj["losses"] - 1
    if board.elo_enabled
      currentEloWinner = winnerObj["elo"]
      currentEloLoser = loserObj["elo"]
      oldEloWinner = currentEloWinner - self.winner_elo_change
      oldEloLoser = currentEloLoser - self.loser_elo_change
      con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET wins = ?, elo = ? WHERE player = ?", board.board_name, wins.to_s, oldEloWinner.to_s, winner]))
      con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET losses = ?, elo = ? WHERE player = ?", board.board_name, losses.to_s, oldEloLoser.to_s, loser]))
    else
      con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET wins = ? WHERE player = ?", board.board_name, wins.to_s, winner]))
      con.execute(ActiveRecord::Base::sanitize_sql(["UPDATE \"?\" SET losses = ? WHERE player = ?", board.board_name, losses.to_s, loser]))
    end
    if (!tournament_match.nil?)
      tournament_match.completed = false
      tournament_match.save
    end
  }

  def calcElo(eloP1, eloP2)
    @T1 = 10.0**(eloP1.to_f/400.0)
    @T2 = 10.0**(eloP2.to_f/400.0)
    @E1 = @T1 / (@T1 + @T2)
    @E2 = @T2 / (@T1 + @T2)
    return @E1, @E2
  end
end
