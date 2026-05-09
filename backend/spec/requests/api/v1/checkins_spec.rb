require "rails_helper"

RSpec.describe "Api::V1::Checkins", type: :request do
  let!(:user) { create(:user) }
  let!(:habit) { create(:habit, user: user) }
  let(:headers) { auth_headers_for(user) }
  let(:today) { Time.current.in_time_zone("Asia/Tokyo").to_date }

  describe "GET /api/v1/habits/:habit_id/checkins" do
    context "正常系" do
      it "過去7日のチェックイン一覧を返す" do
        create(:checkin, habit: habit, checked_on: today)
        create(:checkin, habit: habit, checked_on: today - 1)
        create(:checkin, habit: habit, checked_on: today - 8)

        get "/api/v1/habits/#{habit.id}/checkins", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["checkins"].length).to eq(2)
      end
    end

    context "異常系" do
      it "未認証の場合は401を返す" do
        get "/api/v1/habits/#{habit.id}/checkins"
        expect(response).to have_http_status(:unauthorized)
      end

      it "他ユーザーの習慣は404を返す" do
        other_habit = create(:habit, user: create(:user))
        get "/api/v1/habits/#{other_habit.id}/checkins", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/habits/:habit_id/checkins" do
    context "正常系" do
      it "今日のチェックインを作成してstreakを返す" do
        post "/api/v1/habits/#{habit.id}/checkins", headers: headers

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["checkin"]["checked_on"]).to eq(today.to_s)
        expect(json["streak"]).to eq(1)
      end

      it "連続チェック時はstreakが増加する" do
        create(:checkin, habit: habit, checked_on: today - 1)
        post "/api/v1/habits/#{habit.id}/checkins", headers: headers

        expect(JSON.parse(response.body)["streak"]).to eq(2)
      end
    end

    context "異常系" do
      it "今日すでにチェック済みの場合は422を返す" do
        create(:checkin, habit: habit, checked_on: today)
        post "/api/v1/habits/#{habit.id}/checkins", headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "未認証の場合は401を返す" do
        post "/api/v1/habits/#{habit.id}/checkins"
        expect(response).to have_http_status(:unauthorized)
      end

      it "他ユーザーの習慣は404を返す" do
        other_habit = create(:habit, user: create(:user))
        post "/api/v1/habits/#{other_habit.id}/checkins", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/v1/habits/:habit_id/checkins/today" do
    context "正常系" do
      it "今日のチェックインを削除してstreakを返す" do
        create(:checkin, habit: habit, checked_on: today)
        delete "/api/v1/habits/#{habit.id}/checkins/today", headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["streak"]).to eq(0)
        expect(habit.checkins.find_by(checked_on: today)).to be_nil
      end
    end

    context "異常系" do
      it "今日チェックしていない場合は404を返す" do
        delete "/api/v1/habits/#{habit.id}/checkins/today", headers: headers
        expect(response).to have_http_status(:not_found)
      end

      it "未認証の場合は401を返す" do
        delete "/api/v1/habits/#{habit.id}/checkins/today"
        expect(response).to have_http_status(:unauthorized)
      end

      it "他ユーザーの習慣は404を返す" do
        other_habit = create(:habit, user: create(:user))
        delete "/api/v1/habits/#{other_habit.id}/checkins/today", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
