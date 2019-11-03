class Board < ApplicationRecord
  has_many :match
  has_many :tournament_match
  has_many :point
  
  validates :board_name, presence: true

  before_destroy {
    TournamentMatch.where(board: self).delete_all
    Match.where(board: self).delete_all
  }
end
