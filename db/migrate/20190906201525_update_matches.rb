class UpdateMatches < ActiveRecord::Migration[6.0]
  def change
    remove_column :matches, :player
    remove_column :matches, :opponent
    remove_column :matches, :win
    add_column :matches, :winner, :string
    add_column :matches, :loser, :string
  end
end
