Devise::JWT.configure do |config|
  config.secret = Rails.application.credentials.secret_key_base
  config.dispatch_requests = [
    ["POST", %r{^/auth/login$}]
  ]
  config.revocation_requests = [
    ["DELETE", %r{^/auth/logout$}]
  ]
  config.expiration_time = 1.day.to_i
end
