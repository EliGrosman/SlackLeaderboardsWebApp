class TournamentMatch < ApplicationRecord
  belongs_to :board
  has_one :match

  validates :player1, presence: true
  validates :player2, presence: true
end
