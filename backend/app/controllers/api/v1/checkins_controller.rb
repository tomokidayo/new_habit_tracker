class Api::V1::CheckinsController < Api::V1::BaseController
  before_action :set_habit

  def index
    checkins = @habit.checkins.order(checked_on: :desc)
    render json: { checkins: checkins }
  end

  def create
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkin = @habit.checkins.build(checked_on: today)
    if checkin.save
      render json: { checkin: checkin }, status: :created
    else
      render json: { errors: checkin.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def today
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkin = @habit.checkins.find_by(checked_on: today)
    if checkin
      checkin.destroy
      head :no_content
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
