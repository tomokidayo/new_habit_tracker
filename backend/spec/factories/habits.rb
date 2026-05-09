FactoryBot.define do
  factory :habit do
    user { nil }
    name { "MyString" }
    emoji { "MyString" }
    position { 1 }
  end
end
