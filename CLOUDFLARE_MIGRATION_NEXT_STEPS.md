# new_habit_tracker: Cloudflare移行 引き継ぎ指示書

## プロジェクト概要

リポジトリ: https://github.com/tomokidayo/new_habit_tracker

個人習慣トラッカーアプリ。元は以下の構成:
- `frontend/` … React + Vite + TypeScript
- `backend/` … Ruby on Rails 7.2 (API mode, Devise + devise-jwt認証, PostgreSQL)

これを **Cloudflare Workers上に全面移行中**。RubyはCloudflare Workers上で実行できないため、
`backend/` のRailsコードは**そのまま残し（参照用）**、`backend-cf/` に**TypeScript(Hono)で機能を1つずつ作り直している**。

Cloudflareアカウントは個人アカウント（toblue0905@gmail.com）を使用。

---

## 現在の状態（完了済み）

### 1. フロントエンド
- `frontend/` に `wrangler.jsonc` を追加し、Cloudflare Workers（静的アセット配信）としてデプロイ済み
- GitHub連携によるWorkers Builds（Git push時に自動ビルド・デプロイ）を設定済み
- デプロイ済みURL: `https://new-habit-tracker.toblue0905.workers.dev`
- `frontend/src/api/client.ts` の `baseURL` は現状 `import.meta.env.VITE_API_URL || 'http://localhost:3001'`
  → **バックエンドが動くようになったら、CloudflareダッシュボードでこのWorkers Buildsプロジェクトに環境変数 `VITE_API_URL` を追加し、再デプロイする必要がある**

### 2. バックエンド基盤（backend-cf）
新規フォルダ `backend-cf/` を作成済み（`backend/`とは別。Rails側は変更していない）。

構成:
```
backend-cf/
├── wrangler.jsonc
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts   # エントリーポイント。/health, /db-test, /auth を登録
    └── auth.ts    # POST /auth/signup, POST /auth/login を実装
```

インストール済みパッケージ: `hono`, `pg`, `bcryptjs`, `jose`, `wrangler`(dev), `@cloudflare/workers-types`(dev), `@types/pg`(dev)

`wrangler.jsonc` の内容:
```jsonc
{
  "name": "habit-tracker-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat"],
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "7c32283bbadf4e8ea1d8aec1aedc7d88"
    }
  ]
}
```

### 3. Hyperdrive（DB接続）
- 既存のHeroku Postgres（アプリ名: `habit-tracker-api-prod`）にHyperdrive経由で接続する設定を作成済み
- Hyperdrive ID: `7c32283bbadf4e8ea1d8aec1aedc7d88`（binding名: `HYPERDRIVE`）
- `npx wrangler dev --remote` でローカルから接続確認済み。`/db-test` エンドポイントで疎通確認OK
- DATABASE_URLの値自体はこのやりとりでは共有していない（ユーザーの手元にのみある）

### 4. 動作確認済みエンドポイント
- `GET /health` → `{"status":"ok"}` 確認済み
- `GET /db-test` → `{"connected":true,"now":"..."}` 確認済み（本番Postgresへの接続成功）
- `POST /auth/signup`, `POST /auth/login` → **コードは実装済みだがまだ動作未確認**（JWT_SECRET未設定のため）

---

## 直近でやるべきこと（優先順）

### ステップ1: JWT_SECRETの設定
`c.env.JWT_SECRET` を使っているが、まだどこにも値を設定していない。

- ローカル開発用: `backend-cf/.dev.vars` ファイルを作成し、以下を記載
  ```
  JWT_SECRET=<openssl rand -hex 32 などで生成したランダムな文字列>
  ```
  `.dev.vars` は `.gitignore` に追加してコミットしないこと。

- 本番用: `npx wrangler secret put JWT_SECRET` で対話的に設定（本番デプロイ前に必須）

**注意**: 旧Rails側はJWT署名に `Rails.application.credentials.secret_key_base` を使っていたが、
これは引き継がず**新しい秘密鍵を発行する**方針。そのため移行後は旧トークンは全て無効になる
（ユーザーは再ログインすればよいだけなので実害は小さい）。

### ステップ2: signup/loginの動作確認
```bash
cd backend-cf
npx wrangler dev --remote
```
起動後、以下のようなリクエストで確認:
```bash
curl -X POST http://localhost:8787/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"user":{"name":"テスト太郎","email":"test@example.com","password":"password123","password_confirmation":"password123"}}'
```
レスポンスヘッダーの `Authorization: Bearer <token>` とボディの `user` オブジェクトを確認。

### ステップ3: 認証ミドルワークの実装
以降のAPI（habits等）はログイン必須にする必要がある。JWTを検証してユーザーを特定するミドルウェアを
`src/middleware/authenticate.ts` のような形で作り、`c.env.JWT_SECRET` を使って `jose` の `jwtVerify` で検証する。

### ステップ4: habits（習慣）のCRUD実装
`backend/app/controllers/api/v1/habits_controller.rb` を参照しながら、以下を実装:
- `GET /api/v1/habits` （一覧、ログインユーザーのものだけ）
- `POST /api/v1/habits` （作成）
- `PATCH /api/v1/habits/:id` （更新）
- `DELETE /api/v1/habits/:id` （削除）

`habits` テーブル構造:
```
id, user_id, name, emoji, position, created_at, updated_at
```

### ステップ5: checkins（チェックイン）のCRUD実装
`backend/app/controllers/api/v1/checkins_controller.rb` を参照。
- `GET /api/v1/habits/:habit_id/checkins`
- `POST /api/v1/habits/:habit_id/checkins`
- `DELETE /api/v1/habits/:habit_id/checkins/today`

`checkins` テーブル構造:
```
id, habit_id, checked_on(date), created_at, updated_at
（habit_id + checked_on の組み合わせでユニーク制約あり）
```

### ステップ6: CORS設定
Honoの `cors` ミドルウェアを使い、フロントエンドの本番URL
（`https://new-habit-tracker.toblue0905.workers.dev`）からのアクセスを許可する。

### ステップ7: フロントエンドとの接続
1. `npx wrangler deploy` で backend-cf を本番デプロイ（事前にJWT_SECRETをwrangler secretで設定しておくこと）
2. デプロイ後に発行される本番URL（例: `https://habit-tracker-api.<サブドメイン>.workers.dev`）を確認
3. Cloudflareダッシュボード → frontendのWorkers Buildsプロジェクト → 環境変数に
   `VITE_API_URL=<上記の本番バックエンドURL>` を追加
4. frontendを再デプロイ（GitHubにpushするか、ダッシュボードから再実行）

---

## 後回しでよい機能（未着手）

以下は元のRailsアプリには存在するが、今回のスコープでは後回しにしている:

- ログアウト（`DELETE /auth/logout`）とJWT無効化リスト（`jwt_denylist` テーブルを使う）
- パスワード再設定（`POST /auth/password`, `PATCH /auth/password`）※Gmail経由のメール送信が絡むため別途対応が必要
- ユーザー関連（`GET /api/v1/users/me`, 更新, パスワード変更, 検索, `users/:id/habits`）
- フォロー機能（`follows` リソース: 一覧・作成・削除・承認）

元のRailsルーティング全体（参考）:
```ruby
devise_for :users, path: "auth", path_names: { sign_in: "login", sign_out: "logout", registration: "signup" },
  controllers: { sessions: "auth/sessions", registrations: "auth/registrations" }, skip: [:passwords]

namespace :api do
  namespace :v1 do
    resource :users, only: [] do
      collection do
        get :me
        patch :me, action: :update_me
        patch :password, action: :update_password
      end
    end
    get 'users/search', to: 'users#search'
    get 'users/:id/habits', to: 'users#followed_habits'
    resources :follows, only: [:index, :create, :destroy] do
      member { patch :accept }
    end
    resources :habits, only: [:index, :create, :update, :destroy] do
      resources :checkins, only: [:index, :create] do
        collection { delete :today }
      end
    end
  end
end

post  '/auth/password', to: 'auth/passwords#create'
patch '/auth/password', to: 'auth/passwords#update'
```

---

## 技術的な注意点・決定事項

- **Cloudflareプラン**: 個人アカウントの無料プランを使用中。Workers無料プランはリクエストあたりCPU時間10ms制限があり、
  bcryptのハッシュ化処理がこれに抵触してエラーになる可能性がある。もし発生したら、Workers Paidプラン（$5/月〜）への
  アップグレードを検討する。
- **パスワードハッシュ形式**: `bcryptjs` を使用し、Devise標準のbcrypt形式と互換性のある形で保存している
  （ただし新規ユーザーのみ対象。既存Railsユーザーのデータ移行は未検討）。
- **パスワード最小文字数**: Rails側の `config.password_length = 6..128` に合わせて6文字以上としている
  （フロントエンドのプレースホルダー表示は「8文字以上」になっているが、実際のバリデーションは6文字以上）。
- **DB接続方式**: `pg` パッケージ + Hyperdriveバインディングの `connectionString` を使用。
  `wrangler.jsonc` に `"compatibility_flags": ["nodejs_compat"]` が必須。
- **静的サイトとWorkerの違い**: frontendは `assets.directory` のみを指定した「配信専用」のwrangler.jsonc、
  backend-cfは `main` でエントリーポイントを指定した「実行される」wrangler.jsonc、という構成の違いがある。

---

## 参考: ローカル動作確認コマンド一覧

```bash
# backend-cf ディレクトリで
npm install
npx wrangler dev --remote     # Hyperdrive等リモートリソースを使うため --remote が必須

# 別ターミナルで動作確認
curl http://localhost:8787/health
curl http://localhost:8787/db-test
```
