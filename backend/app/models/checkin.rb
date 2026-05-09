class Checkin < ApplicationRecord
  belongs_to :habit

  validates :checked_on, presence: true, uniqueness: { scope: :habit_id }
end
