class Api::V1::CheckinsController < Api::V1::BaseController
  WEEKLY_GRID_DAYS = 7

  before_action :set_habit

  def index
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkins = @habit.checkins.where(checked_on: (today - (WEEKLY_GRID_DAYS - 1))..today).order(checked_on: :asc)
    render json: { checkins: checkins }
  end

  def create
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkin = @habit.checkins.build(checked_on: today)
    if checkin.save
      render json: { checkin: checkin, streak: @habit.streak }, status: :created
    else
      render json: { errors: checkin.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def today
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkin = @habit.checkins.find_by(checked_on: today)
    if checkin
      checkin.destroy
      render json: { streak: @habit.streak }
    else
      render json: { error: "No checkin found for today" }, status: :not_found
    end
  end

  private

  def set_habit
    @habit = current_user.habits.find(params[:habit_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Habit not found" }, status: :not_found
  end
end
