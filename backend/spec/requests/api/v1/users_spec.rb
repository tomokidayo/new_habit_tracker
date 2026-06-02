require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let!(:user) { create(:user, password: "password123") }
  let(:headers) { auth_headers_for(user) }

  describe "GET /api/v1/users/search" do
    let!(:alice) { create(:user, name: 'Alice') }
    let!(:bob)   { create(:user, name: 'Bob') }

    context '正常系' do
      it '名前で部分一致検索できる' do
        get '/api/v1/users/search', params: { name: 'ali' }, headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['users'].map { |u| u['id'] }).to include(alice.id)
        expect(json['users'].map { |u| u['id'] }).not_to include(bob.id)
      end

      it '自分自身は結果に含まれない' do
        get '/api/v1/users/search', params: { name: user.name }, headers: headers

        json = JSON.parse(response.body)
        expect(json['users'].map { |u| u['id'] }).not_to include(user.id)
      end

      it 'follow_statusが付与される' do
        create(:follow, follower: user, followee: alice, status: 'pending')
        get '/api/v1/users/search', params: { name: 'Alice' }, headers: headers

        json = JSON.parse(response.body)
        found = json['users'].find { |u| u['id'] == alice.id }
        expect(found['follow_status']).to eq('pending_sent')
      end
    end

    context '異常系' do
      it '未認証は401' do
        get '/api/v1/users/search', params: { name: 'alice' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/users/:id/habits" do
    let!(:other) { create(:user) }
    let!(:habit) { create(:habit, user: other) }

    context '正常系' do
      it 'フォロー済みユーザーの習慣を閲覧できる' do
        create(:follow, :accepted, follower: user, followee: other)
        get "/api/v1/users/#{other.id}/habits", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['user']['id']).to eq(other.id)
        expect(json['habits'].length).to eq(1)
        expect(json['habits'][0]).to include('streak', 'checked_today', 'recent_checkins')
      end
    end

    context '異常系' do
      it 'フォローしていないユーザーは403' do
        get "/api/v1/users/#{other.id}/habits", headers: headers
        expect(response).to have_http_status(:forbidden)
      end

      it 'pendingのフォローは403' do
        create(:follow, follower: user, followee: other, status: 'pending')
        get "/api/v1/users/#{other.id}/habits", headers: headers
        expect(response).to have_http_status(:forbidden)
      end

      it '存在しないユーザーは404' do
        get '/api/v1/users/99999/habits', headers: headers
        expect(response).to have_http_status(:not_found)
      end

      it '未認証は401' do
        get "/api/v1/users/#{other.id}/habits"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

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
