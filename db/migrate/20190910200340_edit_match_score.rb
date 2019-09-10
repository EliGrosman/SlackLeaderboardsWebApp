class EditMatchScore < ActiveRecord::Migration[6.0]
  def change
    remove_column :matches, :score_pos
    remove_column :matches, :score_neg
    add_column :matches, :score, :string
  end
end
