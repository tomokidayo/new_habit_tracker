FactoryBot.define do
  factory :habit do
    association :user
    name { "ランニング" }
    emoji { "🏃" }
    sequence(:position) { |n| n }
  end
end
