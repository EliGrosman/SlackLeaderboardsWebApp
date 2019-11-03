class CreatePoints < ActiveRecord::Migration[6.0]
  def change
    create_table :points do |t|
      t.string :user
      t.integer :points
      t.references :board
      t.string :description

      t.timestamps
    end
  end
end
