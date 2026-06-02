class Follow < ApplicationRecord
  belongs_to :follower, class_name: 'User'
  belongs_to :followee, class_name: 'User'

  enum :status, { pending: 'pending', accepted: 'accepted' }, prefix: :status

  validates :followee_id, uniqueness: { scope: :follower_id, message: 'already followed or requested' }
  validate :cannot_follow_self

  private

  def cannot_follow_self
    errors.add(:followee_id, 'cannot follow yourself') if follower_id == followee_id
  end
end
