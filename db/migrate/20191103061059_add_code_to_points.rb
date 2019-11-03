class AddCodeToPoints < ActiveRecord::Migration[6.0]
  def change
    add_column :points, :code, :string
  end
end
