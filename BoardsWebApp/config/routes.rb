Rails.application.routes.draw do
  root 'home#index'
  get '/newboard', to: 'home#newboard', as: 'add_board'
  post '/', to: 'home#createboard', as: 'create_board'
  get '/matches/:id', to: 'home#show', as: 'match'
  get '/matches/:id/edit', to: 'home#edit', as: 'edit_match'
  get '/tournament/:id', to: 'home#managetournament', as: 'manage_tournament'
  get '/leaderboard/:id', to: 'home#viewleaderboard', as: 'view_leaderboard'
  get '/deleteboard/:id', to: 'home#deleteboard', as: 'delete_board'
end
