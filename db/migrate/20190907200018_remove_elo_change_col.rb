class RemoveEloChangeCol < ActiveRecord::Migration[6.0]
  def change
    remove_column :matches, :winner_elo_change
    remove_column :matches, :loser_elo_change
  end
end
