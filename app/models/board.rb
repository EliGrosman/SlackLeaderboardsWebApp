class Board < ApplicationRecord
  has_many :match
  has_many :tournament_match
end
