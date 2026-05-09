require 'rails_helper'

RSpec.describe Habit, type: :model do
  let(:habit) { create(:habit) }
  let(:today) { Time.current.in_time_zone("Asia/Tokyo").to_date }

  describe "#streak" do
    context "チェックインがない場合" do
      it "0を返す" do
        expect(habit.streak).to eq(0)
      end
    end

    context "今日だけチェックした場合" do
      it "1を返す" do
        create(:checkin, habit: habit, checked_on: today)
        expect(habit.streak).to eq(1)
      end
    end

    context "今日と昨日チェックした場合" do
      it "2を返す" do
        create(:checkin, habit: habit, checked_on: today)
        create(:checkin, habit: habit, checked_on: today - 1)
        expect(habit.streak).to eq(2)
      end
    end

    context "今日はなく昨日・一昨日チェックした場合" do
      it "昨日から連続カウントして2を返す" do
        create(:checkin, habit: habit, checked_on: today - 1)
        create(:checkin, habit: habit, checked_on: today - 2)
        expect(habit.streak).to eq(2)
      end
    end

    context "今日チェック済みで昨日が抜けている場合" do
      it "連続が途切れるため1を返す" do
        create(:checkin, habit: habit, checked_on: today)
        create(:checkin, habit: habit, checked_on: today - 2)
        expect(habit.streak).to eq(1)
      end
    end

    context "今日から5日間連続チェックした場合" do
      it "5を返す" do
        (0..4).each { |i| create(:checkin, habit: habit, checked_on: today - i) }
        expect(habit.streak).to eq(5)
      end
    end

    context "includes(:checkins)でeager loadされている場合" do
      it "DBクエリを追加せずstreakを計算する" do
        create(:checkin, habit: habit, checked_on: today)
        loaded_habit = Habit.includes(:checkins).find(habit.id)
        expect(loaded_habit.checkins.loaded?).to be true
        expect(loaded_habit.streak).to eq(1)
      end
    end
  end

  describe "#checked_today?" do
    context "今日チェックしていない場合" do
      it "falseを返す" do
        expect(habit.checked_today?).to be false
      end
    end

    context "今日チェックした場合" do
      it "trueを返す" do
        create(:checkin, habit: habit, checked_on: today)
        expect(habit.checked_today?).to be true
      end
    end

    context "昨日のみチェックした場合" do
      it "falseを返す" do
        create(:checkin, habit: habit, checked_on: today - 1)
        expect(habit.checked_today?).to be false
      end
    end
  end
end
