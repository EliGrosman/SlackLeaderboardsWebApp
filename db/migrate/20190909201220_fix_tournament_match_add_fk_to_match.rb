class FixTournamentMatchAddFkToMatch < ActiveRecord::Migration[6.0]
  def change
    remove_column :tournament_matches, :completeby
    change_table :matches do |t|
      t.references :tournament_match
    end
  end
end
