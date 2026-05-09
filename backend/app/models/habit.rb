class Habit < ApplicationRecord
  belongs_to :user
  has_many :checkins, dependent: :destroy

  validates :name, presence: true, length: { maximum: 50 }
  validates :emoji, presence: true, length: { maximum: 2 }

  default_scope { order(:position) }
end
