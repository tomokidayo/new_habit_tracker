require "rails_helper"

RSpec.describe "Api::V1::Habits", type: :request do
  let!(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe "GET /api/v1/habits" do
    context "正常系" do
      it "自分の習慣一覧を返す" do
        create_list(:habit, 3, user: user)
        get "/api/v1/habits", headers: headers

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["habits"].length).to eq(3)
      end

      it "他ユーザーの習慣は含まれない" do
        other_user = create(:user)
        create(:habit, user: other_user)
        create(:habit, user: user)

        get "/api/v1/habits", headers: headers

        expect(JSON.parse(response.body)["habits"].length).to eq(1)
      end
    end

    context "異常系" do
      it "未認証の場合は401を返す" do
        get "/api/v1/habits"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/habits" do
    let(:valid_params) { { habit: { name: "読書", emoji: "📚" } } }

    context "正常系" do
      it "習慣を作成できる" do
        post "/api/v1/habits", params: valid_params, headers: headers, as: :json

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["habit"]["name"]).to eq("読書")
        expect(json["habit"]["emoji"]).to eq("📚")
      end

      it "positionが自動で設定される" do
        create(:habit, user: user, position: 1)
        post "/api/v1/habits", params: valid_params, headers: headers, as: :json

        expect(JSON.parse(response.body)["habit"]["position"]).to eq(2)
      end
    end

    context "異常系" do
      it "nameが空の場合は422を返す" do
        post "/api/v1/habits", params: { habit: { name: "", emoji: "📚" } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to be_present
      end

      it "emojiが空の場合は422を返す" do
        post "/api/v1/habits", params: { habit: { name: "読書", emoji: "" } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "未認証の場合は401を返す" do
        post "/api/v1/habits", params: valid_params, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/habits/:id" do
    let!(:habit) { create(:habit, user: user, name: "ランニング", emoji: "🏃") }

    context "正常系" do
      it "習慣を更新できる" do
        patch "/api/v1/habits/#{habit.id}", params: { habit: { name: "水泳" } }, headers: headers, as: :json

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["habit"]["name"]).to eq("水泳")
      end
    end

    context "異常系" do
      it "他ユーザーの習慣は更新できない" do
        other_habit = create(:habit, user: create(:user))
        patch "/api/v1/habits/#{other_habit.id}", params: { habit: { name: "水泳" } }, headers: headers, as: :json

        expect(response).to have_http_status(:not_found)
      end

      it "nameが空の場合は422を返す" do
        patch "/api/v1/habits/#{habit.id}", params: { habit: { name: "" } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "emojiが空の場合は422を返す" do
        patch "/api/v1/habits/#{habit.id}", params: { habit: { emoji: "" } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe "DELETE /api/v1/habits/:id" do
    let!(:habit) { create(:habit, user: user) }

    context "正常系" do
      it "習慣を削除できる" do
        delete "/api/v1/habits/#{habit.id}", headers: headers

        expect(response).to have_http_status(:no_content)
        expect(Habit.find_by(id: habit.id)).to be_nil
      end
    end

    context "異常系" do
      it "他ユーザーの習慣は削除できない" do
        other_habit = create(:habit, user: create(:user))
        delete "/api/v1/habits/#{other_habit.id}", headers: headers

        expect(response).to have_http_status(:not_found)
      end

      it "未認証の場合は401を返す" do
        delete "/api/v1/habits/#{habit.id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
