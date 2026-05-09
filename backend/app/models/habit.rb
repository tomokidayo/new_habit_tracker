class Habit < ApplicationRecord
  belongs_to :user
  has_many :checkins, dependent: :destroy

  validates :name, presence: true, length: { maximum: 50 }
  validates :emoji, presence: true, length: { maximum: 2 }

  default_scope { order(:position) }

  def streak
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checked_dates = checkins.pluck(:checked_on).to_set

    current = checked_dates.include?(today) ? today : today - 1
    count = 0
    while checked_dates.include?(current)
      count += 1
      current -= 1
    end
    count
  end

  def checked_today?
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checkins.exists?(checked_on: today)
  end
end
