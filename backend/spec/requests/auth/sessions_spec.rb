require "rails_helper"

RSpec.describe "Auth::Sessions", type: :request do
  let!(:user) { create(:user, email: "test@example.com", password: "password123") }

  describe "POST /auth/login" do
    context "正常系" do
      it "JWTトークンを返してログインできる" do
        post "/auth/login", params: { user: { email: "test@example.com", password: "password123" } }, as: :json

        expect(response).to have_http_status(:ok)
        expect(response.headers["Authorization"]).to be_present
        json = JSON.parse(response.body)
        expect(json["user"]["email"]).to eq("test@example.com")
      end
    end

    context "異常系" do
      it "パスワードが間違っている場合は401を返す" do
        post "/auth/login", params: { user: { email: "test@example.com", password: "wrongpass" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it "存在しないメールの場合は401を返す" do
        post "/auth/login", params: { user: { email: "nobody@example.com", password: "password123" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /auth/logout" do
    context "正常系" do
      it "ログアウトできる" do
        post "/auth/login", params: { user: { email: "test@example.com", password: "password123" } }, as: :json
        token = response.headers["Authorization"]

        delete "/auth/logout", headers: { "Authorization" => token }

        expect(response).to have_http_status(:ok)
      end
    end

    context "異常系" do
      it "トークンなしでは401を返す" do
        delete "/auth/logout"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
