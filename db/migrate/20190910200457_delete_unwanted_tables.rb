class DeleteUnwantedTables < ActiveRecord::Migration[6.0]
  def change
    drop_table :Ultimate
    drop_table "'Test'"
  end
end
