class UserMailer < ApplicationMailer
  FRONTEND_RESET_URL = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/reset-password"

  def reset_password_instructions(user, token)
    @user = user
    @reset_url = "#{FRONTEND_RESET_URL}?reset_password_token=#{token}"
    mail(to: user.email, subject: 'パスワード再設定のご案内')
  end
end
