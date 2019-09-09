class TournamentMatch < ApplicationRecord
  belongs_to :board
  has_one :match
end
