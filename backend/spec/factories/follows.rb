FactoryBot.define do
  factory :follow do
    association :follower, factory: :user
    association :followee, factory: :user
    status { 'pending' }

    trait :accepted do
      status { 'accepted' }
    end
  end
end
