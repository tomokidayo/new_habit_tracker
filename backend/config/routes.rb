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
    }

  namespace :api do
    namespace :v1 do
      resource :users, only: [] do
        collection do
          get :me
          patch :me, action: :update_me
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

  get "up" => "rails/health#show", as: :rails_health_check
end
