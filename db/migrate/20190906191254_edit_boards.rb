class EditBoards < ActiveRecord::Migration[6.0]
  def change
    add_column :boards, :board_name, :string
    add_column :boards, :rr_tournament, :boolean
    add_column :boards, :elo_enabled, :boolean
  end
end
