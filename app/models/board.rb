class Board < ApplicationRecord
  has_many :match
  has_many :tournament_match

  before_delete {
    TournamentMatch.where(board: self).delete_all
  }
end
