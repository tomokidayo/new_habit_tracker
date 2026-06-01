require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let!(:user) { create(:user, password: "password123") }
  let(:headers) { auth_headers_for(user) }

  describe "PATCH /api/v1/users/password" do
    context "正常系" do
      it "正しい現在のパスワードで変更できる" do
        patch "/api/v1/users/password",
          params: { user: { current_password: "password123", password: "newpass456", password_confirmation: "newpass456" } },
          headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["message"]).to be_present
      end
    end

    context "異常系" do
      it "現在のパスワードが誤っている場合は422を返す" do
        patch "/api/v1/users/password",
          params: { user: { current_password: "wrongpass", password: "newpass456", password_confirmation: "newpass456" } },
          headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "新しいパスワードが8文字未満の場合は422を返す" do
        patch "/api/v1/users/password",
          params: { user: { current_password: "password123", password: "short", password_confirmation: "short" } },
          headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "未認証の場合は401を返す" do
        patch "/api/v1/users/password", as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
