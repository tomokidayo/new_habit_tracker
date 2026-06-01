Rails.application.routes.draw do
  devise_for :users,
    path: "auth",
    path_names: {
      sign_in: "login",
      sign_out: "logout",
      registration: "signup"
    },
    controllers: {
      sessions: "auth/sessions",
      registrations: "auth/registrations"
    },
    skip: [:passwords]

  namespace :api do
    namespace :v1 do
      resource :users, only: [] do
        collection do
          get :me
          patch :me, action: :update_me
          patch :password, action: :update_password
        end
      end

      resources :habits, only: [:index, :create, :update, :destroy] do
        resources :checkins, only: [:index, :create] do
          collection do
            delete :today
          end
        end
      end
    end
  end

  post  '/auth/password', to: 'auth/passwords#create'
  patch '/auth/password', to: 'auth/passwords#update'

  get "up" => "rails/health#show", as: :rails_health_check
end
