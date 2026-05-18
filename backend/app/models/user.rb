class User < ApplicationRecord
  NAME_MAX_LENGTH = 50
  PASSWORD_MIN_LENGTH = 8

  devise :database_authenticatable, :registerable,
         :validatable, :jwt_authenticatable,
         jwt_revocation_strategy: JwtDenylist

  has_many :habits, dependent: :destroy

  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, uniqueness: true
  validates :password, length: { minimum: PASSWORD_MIN_LENGTH }, allow_blank: true
end
