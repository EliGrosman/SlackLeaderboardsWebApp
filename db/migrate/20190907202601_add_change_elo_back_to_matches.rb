class AddChangeEloBackToMatches < ActiveRecord::Migration[6.0]
  def change
    add_column :matches, :winner_elo_change, :integer
    add_column :matches, :loser_elo_change, :integer
  end
end
