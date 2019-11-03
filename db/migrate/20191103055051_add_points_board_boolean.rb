class AddPointsBoardBoolean < ActiveRecord::Migration[6.0]
  def change
    add_column :boards, :points_board, :boolean
  end
end
