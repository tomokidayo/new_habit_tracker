require "rails_helper"

RSpec.describe "POST /auth/signup", type: :request do
  let(:valid_params) do
    {
      user: {
        name: "テストユーザー",
        email: "test@example.com",
        password: "password123",
        password_confirmation: "password123"
      }
    }
  end

  context "正常系" do
    it "ユーザーを作成してJWTトークンを返す" do
      post "/auth/signup", params: valid_params, as: :json

      expect(response).to have_http_status(:created)
      expect(response.headers["Authorization"]).to be_present
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("test@example.com")
      expect(json["user"]["name"]).to eq("テストユーザー")
    end
  end

  context "異常系" do
    it "nameが空の場合は422を返す" do
      post "/auth/signup", params: { user: valid_params[:user].merge(name: "") }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["errors"]).to be_present
    end

    it "メール重複の場合は422を返す" do
      create(:user, email: "test@example.com")
      post "/auth/signup", params: valid_params, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "パスワードが8文字未満の場合は422を返す" do
      post "/auth/signup", params: { user: valid_params[:user].merge(password: "short", password_confirmation: "short") }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "password_confirmationが一致しない場合は422を返す" do
      post "/auth/signup", params: { user: valid_params[:user].merge(password_confirmation: "different") }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
