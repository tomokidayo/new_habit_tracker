require "rails_helper"

RSpec.describe "Auth::Passwords", type: :request do
  let!(:user) { create(:user, email: "test@example.com", password: "password123") }

  describe "POST /auth/password" do
    context "正常系" do
      it "登録済みメールの場合はリセットトークンを発行して200を返す" do
        post "/auth/password", params: { user: { email: "test@example.com" } }, as: :json

        expect(response).to have_http_status(:ok)
        expect(user.reload.reset_password_token).to be_present
      end
    end

    context "異常系" do
      it "未登録メールでも200を返す（メール存在確認を防ぐ）" do
        post "/auth/password", params: { user: { email: "nobody@example.com" } }, as: :json

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe "PATCH /auth/password" do
    let(:raw_token) do
      raw, enc = Devise.token_generator.generate(User, :reset_password_token)
      user.update_columns(reset_password_token: enc, reset_password_sent_at: Time.now.utc)
      raw
    end

    context "正常系" do
      it "有効なトークンでパスワードを再設定できる" do
        patch "/auth/password",
          params: { user: { reset_password_token: raw_token, password: "newpass456", password_confirmation: "newpass456" } },
          as: :json

        expect(response).to have_http_status(:ok)
        expect(user.reload.valid_password?("newpass456")).to be true
      end
    end

    context "異常系" do
      it "無効なトークンでは422を返す" do
        patch "/auth/password",
          params: { user: { reset_password_token: "invalid", password: "newpass456", password_confirmation: "newpass456" } },
          as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "新しいパスワードが8文字未満では422を返す" do
        patch "/auth/password",
          params: { user: { reset_password_token: raw_token, password: "short", password_confirmation: "short" } },
          as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
