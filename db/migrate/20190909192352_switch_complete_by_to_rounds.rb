class SwitchCompleteByToRounds < ActiveRecord::Migration[6.0]
  def change
    add_column :tournament_matches, :round, :integer
  end
end
