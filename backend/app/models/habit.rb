class Habit < ApplicationRecord
  NAME_MAX_LENGTH = 50
  EMOJI_MAX_LENGTH = 2
  STREAK_LOOKBACK_DAYS = 365

  belongs_to :user
  has_many :checkins, dependent: :destroy

  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validates :emoji, presence: true, length: { maximum: EMOJI_MAX_LENGTH }

  default_scope { order(:position) }

  def streak
    today = Time.current.in_time_zone("Asia/Tokyo").to_date
    checked_dates = if checkins.loaded?
      checkins.map(&:checked_on).to_set
    else
      checkins.where(checked_on: (today - STREAK_LOOKBACK_DAYS)..today).pluck(:checked_on).to_set
    end

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
    if checkins.loaded?
      checkins.any? { |c| c.checked_on == today }
    else
      checkins.exists?(checked_on: today)
    end
  end
end
