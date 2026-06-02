class Api::V1::UsersController < Api::V1::BaseController
  def me
    render json: {
      user: {
        id: current_user.id,
        name: current_user.name,
        email: current_user.email
      }
    }
  end

  def update_me
    if current_user.update(user_params)
      render json: {
        user: {
          id: current_user.id,
          name: current_user.name,
          email: current_user.email
        }
      }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update_password
    if current_user.update_with_password(password_params)
      render json: { message: 'パスワードを変更しました' }
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def search
    name = params[:name].to_s.strip
    users = User.where.not(id: current_user.id)
                .where("name ILIKE ?", "%#{name}%")
                .limit(20)

    all_follows = Follow.where(follower_id: current_user.id, followee_id: users.map(&:id))
                        .or(Follow.where(follower_id: users.map(&:id), followee_id: current_user.id))

    render json: { users: users.map { |u| serialize_user_with_follow_status(u, all_follows) } }
  end

  def followed_habits
    target_user = User.find(params[:id])
    follow = current_user.sent_follows.find_by(followee_id: target_user.id, status: 'accepted')
    return render json: { error: 'Forbidden' }, status: :forbidden unless follow

    habits = target_user.habits.includes(:checkins)
    seven_days_ago = Time.zone.today - 6
    render json: {
      user: { id: target_user.id, name: target_user.name },
      habits: habits.map { |h| serialize_followed_habit(h, seven_days_ago) }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  private

  def serialize_user_with_follow_status(user, all_follows)
    sent     = all_follows.find { |f| f.follower_id == current_user.id && f.followee_id == user.id }
    received = all_follows.find { |f| f.follower_id == user.id && f.followee_id == current_user.id }

    status = if sent&.status_accepted?
      'accepted'
    elsif sent&.status_pending?
      'pending_sent'
    elsif received&.status_pending?
      'pending_received'
    else
      'none'
    end

    { id: user.id, name: user.name, follow_status: status }
  end

  def serialize_followed_habit(habit, seven_days_ago)
    recent_checkins = habit.checkins
                           .select { |c| c.checked_on >= seven_days_ago }
                           .map { |c| { id: c.id, habit_id: c.habit_id, checked_on: c.checked_on } }
    habit.as_json(only: [:id, :name, :emoji]).merge(
      streak: habit.streak,
      checked_today: habit.checked_today?,
      recent_checkins: recent_checkins
    )
  end

  def user_params
    params.require(:user).permit(:name, :email)
  end

  def password_params
    params.require(:user).permit(:current_password, :password, :password_confirmation)
  end
end
