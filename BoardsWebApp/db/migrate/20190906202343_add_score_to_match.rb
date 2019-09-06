class AddScoreToMatch < ActiveRecord::Migration[6.0]
  def change
    add_column :matches, :score_pos, :int
    add_column :matches, :score_neg, :int
  end
end
