class Match < ApplicationRecord
  @T1 = @T2 = @E1 = @E2 = 0
  belongs_to :board
  belongs_to :tournament_match, optional: true
  validates :winner, presence: true
  validates :loser, presence: true
  
  before_create {
    if(board.elo_enabled)
      @eloWinnerPos = Match.where(board: board, winner: winner).pluck("SUM(winner_elo_change)").first
      @eloWinnerNeg = Match.where(board: board, loser: winner).pluck("SUM(loser_elo_change)").first
      @eloLoserPos = Match.where(board: board, winner: loser).pluck("SUM(winner_elo_change)").first
      @eloLoserNeg = Match.where(board: board, loser: loser).pluck("SUM(loser_elo_change)").first

      eloWinner = 1000 + ((@eloWinnerPos||0) + (@eloWinnerNeg||0))
      eloLoser = 1000 + ((@eloLoserPos||0) + (@eloLoserNeg||0))

      calcElo(eloWinner, eloLoser)
      newEloWinner = (eloWinner.to_f + 32.0 * (1.0 - @E1)).ceil
      newEloLoser = (eloLoser.to_f + 32.0 * (0.0  - @E2)).ceil
      self.winner_elo_change = newEloWinner - eloWinner
      self.loser_elo_change = newEloLoser - eloLoser    
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
