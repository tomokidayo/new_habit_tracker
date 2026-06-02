require 'rails_helper'

RSpec.describe Follow, type: :model do
  let(:user_a) { create(:user) }
  let(:user_b) { create(:user) }

  describe 'バリデーション' do
    it '有効なフォローを作成できる' do
      follow = build(:follow, follower: user_a, followee: user_b)
      expect(follow).to be_valid
    end

    it '自分自身はフォローできない' do
      follow = build(:follow, follower: user_a, followee: user_a)
      expect(follow).not_to be_valid
      expect(follow.errors[:followee_id]).to be_present
    end

    it '同じペアの重複フォローは不可' do
      create(:follow, follower: user_a, followee: user_b)
      duplicate = build(:follow, follower: user_a, followee: user_b)
      expect(duplicate).not_to be_valid
    end

    it '逆方向のフォローは別レコードとして有効' do
      create(:follow, follower: user_a, followee: user_b)
      reverse = build(:follow, follower: user_b, followee: user_a)
      expect(reverse).to be_valid
    end
  end

  describe 'ステータス' do
    it 'デフォルトはpending' do
      follow = create(:follow, follower: user_a, followee: user_b)
      expect(follow.status_pending?).to be true
    end

    it 'acceptedに更新できる' do
      follow = create(:follow, follower: user_a, followee: user_b)
      follow.update!(status: 'accepted')
      expect(follow.status_accepted?).to be true
    end
  end
end
