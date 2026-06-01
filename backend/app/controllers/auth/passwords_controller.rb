class Auth::PasswordsController < ActionController::API
  FRONTEND_RESET_URL = 'http://localhost:5173/reset-password'

  def create
    user = User.find_by(email: params.dig(:user, :email))
    if user
      raw, enc = Devise.token_generator.generate(User, :reset_password_token)
      user.update_columns(
        reset_password_token: enc,
        reset_password_sent_at: Time.now.utc
      )
      UserMailer.reset_password_instructions(user, raw).deliver_now
    end
    render json: { message: 'パスワード再設定メールを送信しました（登録済みの場合）' }
  end

  def update
    user = User.reset_password_by_token(
      reset_password_token: params.dig(:user, :reset_password_token),
      password: params.dig(:user, :password),
      password_confirmation: params.dig(:user, :password_confirmation)
    )
    if user.errors.empty?
      render json: { message: 'パスワードを再設定しました' }
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
