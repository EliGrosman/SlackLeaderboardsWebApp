class CreateMatches < ActiveRecord::Migration[6.0]
  def change
    create_table :matches do |t|
      t.string :player
      t.string :opponent
      t.boolean :win
      t.string :board

      t.timestamps
    end
  end
end
