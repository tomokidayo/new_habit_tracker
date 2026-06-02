import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UserSearchResult, FollowsData, FollowEntry } from '../types'
import { searchUsers, getFollows, createFollow, acceptFollow, deleteFollow } from '../api/follows'

type Tab = 'search' | 'following' | 'requests'

export default function FollowPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('search')
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [followsData, setFollowsData] = useState<FollowsData>({
    following: [],
    followers: [],
    pending_sent: [],
    pending_received: [],
  })
  const [error, setError] = useState<string | null>(null)

  const loadFollows = useCallback(async () => {
    try {
      const res = await getFollows()
      setFollowsData(res.data)
    } catch {
      setError('フォロー情報の取得に失敗しました')
    }
  }, [])

  useEffect(() => {
    loadFollows()
  }, [loadFollows])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchName.trim()) {
        setSearchResults([])
        return
      }
      setSearchLoading(true)
      try {
        const res = await searchUsers(searchName)
        setSearchResults(res.data.users)
      } catch {
        setError('検索に失敗しました')
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchName])

  const handleFollow = async (userId: number) => {
    try {
      await createFollow(userId)
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, follow_status: 'pending_sent' } : u)
      )
      loadFollows()
    } catch {
      setError('フォローリクエストに失敗しました')
    }
  }

  const handleAccept = async (followId: number) => {
    try {
      await acceptFollow(followId)
      loadFollows()
    } catch {
      setError('承認に失敗しました')
    }
  }

  const handleDelete = async (followId: number) => {
    try {
      await deleteFollow(followId)
      loadFollows()
      setSearchResults(prev =>
        prev.map(u => {
          const wasPendingSent = followsData.pending_sent.find(f => f.id === followId && f.user.id === u.id)
          const wasFollowing = followsData.following.find(f => f.id === followId && f.user.id === u.id)
          if (wasPendingSent || wasFollowing) return { ...u, follow_status: 'none' }
          return u
        })
      )
    } catch {
      setError('操作に失敗しました')
    }
  }

  const requestCount = followsData.pending_received.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900">フォロー</h1>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <TabButton active={tab === 'search'} onClick={() => setTab('search')}>検索</TabButton>
          <TabButton active={tab === 'following'} onClick={() => setTab('following')}>
            フォロー中 ({followsData.following.length})
          </TabButton>
          <TabButton active={tab === 'requests'} onClick={() => setTab('requests')}>
            リクエスト {requestCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs bg-indigo-500 text-white rounded-full">
                {requestCount}
              </span>
            )}
          </TabButton>
        </div>

        {tab === 'search' && (
          <div>
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="名前で検索..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4"
            />
            {searchLoading && <p className="text-sm text-gray-400 text-center py-4">検索中...</p>}
            {!searchLoading && searchName && searchResults.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">見つかりませんでした</p>
            )}
            <ul className="space-y-2">
              {searchResults.map(u => (
                <li key={u.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <FollowButton
                    status={u.follow_status}
                    onFollow={() => handleFollow(u.id)}
                    onCancel={() => {
                      const f = followsData.pending_sent.find(f => f.user.id === u.id)
                      if (f) handleDelete(f.id)
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'following' && (
          <div className="space-y-3">
            {followsData.following.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">まだフォローしているユーザーがいません</p>
            )}
            {followsData.following.map(entry => (
              <FollowingCard
                key={entry.id}
                entry={entry}
                onView={() => navigate(`/users/${entry.user.id}`)}
                onUnfollow={() => handleDelete(entry.id)}
              />
            ))}
            {followsData.followers.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium pt-4 pb-1">フォロワー</p>
                {followsData.followers.map(entry => (
                  <div key={entry.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{entry.user.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-3">
            {followsData.pending_received.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium pb-1">受信したリクエスト</p>
                {followsData.pending_received.map(entry => (
                  <div key={entry.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{entry.user.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(entry.id)}
                        className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
                      >
                        拒否
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {followsData.pending_sent.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-medium pt-4 pb-1">送信済みリクエスト</p>
                {followsData.pending_sent.map(entry => (
                  <div key={entry.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{entry.user.name}</span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ))}
              </>
            )}
            {followsData.pending_received.length === 0 && followsData.pending_sent.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">リクエストはありません</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 pb-3 text-sm font-medium transition-colors flex items-center justify-center gap-1
        ${active ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-600'}`}
    >
      {children}
    </button>
  )
}

function FollowButton({
  status,
  onFollow,
  onCancel,
}: {
  status: UserSearchResult['follow_status']
  onFollow: () => void
  onCancel: () => void
}) {
  if (status === 'accepted') {
    return <span className="text-xs text-gray-400 px-3 py-1.5">フォロー中</span>
  }
  if (status === 'pending_sent') {
    return (
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
      >
        リクエスト済
      </button>
    )
  }
  if (status === 'pending_received') {
    return <span className="text-xs text-indigo-500 px-3 py-1.5">リクエスト受信中</span>
  }
  return (
    <button
      onClick={onFollow}
      className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
    >
      フォロー
    </button>
  )
}

function FollowingCard({
  entry,
  onView,
  onUnfollow,
}: {
  entry: FollowEntry
  onView: () => void
  onUnfollow: () => void
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
      <span className="font-medium text-gray-900">{entry.user.name}</span>
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          習慣を見る
        </button>
        <button
          onClick={onUnfollow}
          className="px-3 py-1.5 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
        >
          解除
        </button>
      </div>
    </div>
  )
}
