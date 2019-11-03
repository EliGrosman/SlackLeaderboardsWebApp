Rails.application.routes.draw do
  root 'home#index'
  get '/newboard', to: 'home#newboard', as: 'add_board'
  post '/', to: 'home#createboard', as: 'create_board'
  get '/matches/:id', to: 'home#show', as: 'match'
  get '/points/:id', to: 'home#showpoints', as: "points"
  get '/match/:id/edit', to: 'home#edit', as: 'edit_match'
  get '/tournament/:id', to: 'home#managetournament', as: 'manage_tournament'
  patch '/tournament/:id', to: 'home#createtournament', as: 'create_tournament'
  get '/leaderboard/:id', to: 'home#viewleaderboard', as: 'view_leaderboard'
  get '/deleteboard/:id', to: 'home#deleteboard', as: 'delete_board'
  patch '/match/:id', to: 'home#update', as: 'update_match'
  delete '/match/:id', to: 'home#destroy', as: 'delete_match'
  post '/report', to: 'commands#report'
  get '/getboards', to: 'commands#getboards'
  get '/leaderboard', to: 'commands#leaderboard'
  get '/tournamentmatches', to: 'commands#tournamentmatches'
  post '/redeem', to: 'commands#redeem'
end
