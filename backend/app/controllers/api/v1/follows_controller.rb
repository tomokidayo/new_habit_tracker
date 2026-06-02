class Api::V1::FollowsController < Api::V1::BaseController
  def index
    following = current_user.sent_follows.status_accepted.includes(:followee)
    followers = current_user.received_follows.status_accepted.includes(:follower)
    pending_sent = current_user.sent_follows.status_pending.includes(:followee)
    pending_received = current_user.received_follows.status_pending.includes(:follower)

    render json: {
      following:        following.map       { |f| { id: f.id, user: { id: f.followee.id, name: f.followee.name } } },
      followers:        followers.map       { |f| { id: f.id, user: { id: f.follower.id, name: f.follower.name } } },
      pending_sent:     pending_sent.map    { |f| { id: f.id, user: { id: f.followee.id, name: f.followee.name } } },
      pending_received: pending_received.map { |f| { id: f.id, user: { id: f.follower.id, name: f.follower.name } } }
    }
  end

  def create
    followee = User.find(params[:follow][:followee_id])
    follow = current_user.sent_follows.build(followee: followee)

    if follow.save
      render json: { follow: { id: follow.id, status: follow.status } }, status: :created
    else
      render json: { errors: follow.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'User not found' }, status: :not_found
  end

  def accept
    follow = current_user.received_follows.find(params[:id])
    if follow.status_pending?
      follow.update!(status: 'accepted')
      render json: { follow: { id: follow.id, status: follow.status } }
    else
      render json: { error: 'Request is not pending' }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Follow request not found' }, status: :not_found
  end

  def destroy
    follow = Follow.where(id: params[:id])
                   .where("follower_id = ? OR followee_id = ?", current_user.id, current_user.id)
                   .first
    return render json: { error: 'Follow not found' }, status: :not_found unless follow

    follow.destroy
    head :no_content
  end
end
