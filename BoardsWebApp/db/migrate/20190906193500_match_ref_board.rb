class MatchRefBoard < ActiveRecord::Migration[6.0]
  def change
    remove_column :matches, :board
    change_table :matches do |t|
      t.references :board
    end
  end
end
