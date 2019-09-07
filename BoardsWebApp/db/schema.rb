# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `rails
# db:schema:load`. When creating a new database, `rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2019_09_07_202601) do

  create_table "Ultimate", id: false, force: :cascade do |t|
    t.string "player", limit: 50, null: false
    t.integer "wins"
    t.integer "losses"
    t.integer "elo"
  end

  create_table "boards", force: :cascade do |t|
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "board_name"
    t.boolean "rr_tournament"
    t.boolean "elo_enabled"
  end

  create_table "matches", force: :cascade do |t|
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "board_id"
    t.string "winner"
    t.string "loser"
    t.integer "score_pos"
    t.integer "score_neg"
    t.integer "winner_elo_change"
    t.integer "loser_elo_change"
    t.index ["board_id"], name: "index_matches_on_board_id"
  end

end
