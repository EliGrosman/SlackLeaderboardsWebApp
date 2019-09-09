class CreateTournamentMatches < ActiveRecord::Migration[6.0]
  def change
    create_table :tournament_matches do |t|
      t.string :player1
      t.string :player2
      t.boolean :completed
      t.datetime :completeby
      t.belongs_to :board, null: false, foreign_key: true

      t.timestamps
    end
  end
end
