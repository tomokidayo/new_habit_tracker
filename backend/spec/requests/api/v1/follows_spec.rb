require 'rails_helper'

RSpec.describe 'Api::V1::Follows', type: :request do
  let!(:user)  { create(:user) }
  let!(:other) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe 'GET /api/v1/follows' do
    context '正常系' do
      it 'フォロー情報を返す' do
        create(:follow, :accepted, follower: user, followee: other)
        get '/api/v1/follows', headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['following'].length).to eq(1)
        expect(json['following'][0]['user']['id']).to eq(other.id)
        expect(json['followers']).to be_empty
        expect(json['pending_sent']).to be_empty
        expect(json['pending_received']).to be_empty
      end

      it 'pending_receivedを返す' do
        create(:follow, follower: other, followee: user)
        get '/api/v1/follows', headers: headers

        json = JSON.parse(response.body)
        expect(json['pending_received'].length).to eq(1)
      end
    end

    context '異常系' do
      it '未認証は401' do
        get '/api/v1/follows'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /api/v1/follows' do
    context '正常系' do
      it 'フォローリクエストを送信できる' do
        post '/api/v1/follows', params: { follow: { followee_id: other.id } }, headers: headers, as: :json

        expect(response).to have_http_status(:created)
        expect(JSON.parse(response.body)['follow']['status']).to eq('pending')
      end
    end

    context '異常系' do
      it '自分自身へのフォローは422' do
        post '/api/v1/follows', params: { follow: { followee_id: user.id } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it '重複フォローは422' do
        create(:follow, follower: user, followee: other)
        post '/api/v1/follows', params: { follow: { followee_id: other.id } }, headers: headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it '存在しないユーザーへのフォローは404' do
        post '/api/v1/follows', params: { follow: { followee_id: 99999 } }, headers: headers, as: :json

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'PATCH /api/v1/follows/:id/accept' do
    let!(:follow_request) { create(:follow, follower: other, followee: user) }

    context '正常系' do
      it '受信したリクエストを承認できる' do
        patch "/api/v1/follows/#{follow_request.id}/accept", headers: headers

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['follow']['status']).to eq('accepted')
      end
    end

    context '異常系' do
      it '他人宛のリクエストは承認できない（404）' do
        third = create(:user)
        third_follow = create(:follow, follower: other, followee: third)
        patch "/api/v1/follows/#{third_follow.id}/accept", headers: headers

        expect(response).to have_http_status(:not_found)
      end

      it '既にacceptedのリクエストは422' do
        follow_request.update!(status: 'accepted')
        patch "/api/v1/follows/#{follow_request.id}/accept", headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'DELETE /api/v1/follows/:id' do
    context '正常系' do
      it '送信済みリクエストをキャンセルできる' do
        follow = create(:follow, follower: user, followee: other)
        delete "/api/v1/follows/#{follow.id}", headers: headers

        expect(response).to have_http_status(:no_content)
      end

      it '受信したリクエストを拒否できる' do
        follow = create(:follow, follower: other, followee: user)
        delete "/api/v1/follows/#{follow.id}", headers: headers

        expect(response).to have_http_status(:no_content)
      end

      it 'フォロー解除できる' do
        follow = create(:follow, :accepted, follower: user, followee: other)
        delete "/api/v1/follows/#{follow.id}", headers: headers

        expect(response).to have_http_status(:no_content)
        expect(Follow.find_by(id: follow.id)).to be_nil
      end
    end

    context '異常系' do
      it '関係ないフォローは404' do
        third = create(:user)
        follow = create(:follow, follower: other, followee: third)
        delete "/api/v1/follows/#{follow.id}", headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
