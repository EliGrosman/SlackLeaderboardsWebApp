class AddEloChangeToMatch < ActiveRecord::Migration[6.0]
  def change
    add_column :matches, :winner_elo_change, :int
    add_column :matches, :loser_elo_change, :int
  end
end
