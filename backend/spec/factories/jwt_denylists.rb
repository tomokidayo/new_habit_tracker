FactoryBot.define do
  factory :jwt_denylist do
    jti { "MyString" }
    exp { "2026-05-09 18:30:49" }
  end
end
