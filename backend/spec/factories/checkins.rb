FactoryBot.define do
  factory :checkin do
    association :habit
    checked_on { Time.current.in_time_zone("Asia/Tokyo").to_date }
  end
end
