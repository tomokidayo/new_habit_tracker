class Api::V1::HabitsController < Api::V1::BaseController
  before_action :set_habit, only: [:show, :update, :destroy]

  def index
    habits = current_user.habits
    render json: { habits: habits }
  end

  def create
    habit = current_user.habits.build(habit_params)
    habit.position = current_user.habits.maximum(:position).to_i + 1
    if habit.save
      render json: { habit: habit }, status: :created
    else
      render json: { errors: habit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @habit.update(habit_params)
      render json: { habit: @habit }
    else
      render json: { errors: @habit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @habit.destroy
    head :no_content
  end

  private

  def set_habit
    @habit = current_user.habits.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Habit not found" }, status: :not_found
  end

  def habit_params
    params.require(:habit).permit(:name, :emoji, :position)
  end
end
