class User < ApplicationRecord
  NAME_MAX_LENGTH = 50
  PASSWORD_MIN_LENGTH = 8

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable, :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  has_many :habits, dependent: :destroy

  has_many :sent_follows,     class_name: 'Follow', foreign_key: :follower_id, dependent: :destroy, inverse_of: :follower
  has_many :received_follows, class_name: 'Follow', foreign_key: :followee_id, dependent: :destroy, inverse_of: :followee
  has_many :followees, -> { merge(Follow.status_accepted) }, through: :sent_follows,     source: :followee
  has_many :followers, -> { merge(Follow.status_accepted) }, through: :received_follows, source: :follower

  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: true
  validates :password, length: { minimum: PASSWORD_MIN_LENGTH }, allow_blank: true
end
