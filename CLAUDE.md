# 個人習慣トラッカーアプリ

## プロジェクト概要
StreaksやHabitifyのようなミニマル・カード中心の習慣トラッカーアプリ。
モバイルファーストのSPA構成。

---

## 環境

### バックエンド
- Ruby 3.3.3 / Rails 7.2.3.1 / PostgreSQL 14
- Rails API mode
- 認証: devise + devise-jwt（JWTトークンベース）

### フロントエンド
- React 18 / TypeScript / Vite / Tailwind CSS
- ルーティング: React Router
- 状態管理: Context API
- HTTPクライアント: Axios
- コンポーネント: Tailwindで自作（ライブラリなし）
- フォームバリデーション: HTML5ネイティブ
- エラー表示: フォーム内インライン
- 通知: フォーム内インライン表示のみ
- レイアウト: モバイルファースト

---

## ディレクトリ構成

habit-tracker/ 
├── CLAUDE.md 
├── backend/ # Rails API 
└── frontend/ # React + Vite

---

## 機能要件

### 認証
- アカウント登録・ログイン・ログアウト（JWT）
- マイページ表示・編集

### 習慣管理
- 習慣のCRUD（名前・絵文字）

### チェックオフ
- 今日の習慣をチェックオフ（JST基準）
- ストリーク：前日チェックがあれば継続、なければ当日から再カウント
- 週間グリッド：今日を右端として過去7日を表示

### 将来追加予定
- ユーザー間フォロー・習慣の閲覧

---

## 非機能要件
- テスト: モデルspec（ストリーク計算）とrequest specのみ
- エラー表示: フォーム内インライン
- デプロイ: ローカル開発のみ（将来的にデプロイ予定）

---

## API設計

### ベースURL
- バックエンド: http://localhost:3001
- フロントエンド: http://localhost:5173
- APIプレフィックス: /api/v1/

### 認証エンドポイント
| Method | Path | 説明 |
|--------|------|------|
| POST | /auth/signup | 新規登録 |
| POST | /auth/login | ログイン |
| DELETE | /auth/logout | ログアウト |

### APIエンドポイント
| Method | Path | 説明 |
|--------|------|------|
| GET | /api/v1/users/me | ログインユーザー情報取得 |
| PATCH | /api/v1/users/me | ユーザー情報更新 |
| GET | /api/v1/habits | 習慣一覧取得 |
| POST | /api/v1/habits | 習慣作成 |
| PATCH | /api/v1/habits/:id | 習慣更新 |
| DELETE | /api/v1/habits/:id | 習慣削除 |
| GET | /api/v1/habits/:id/checkins | チェックイン履歴取得 |
| POST | /api/v1/habits/:id/checkins | 今日チェックイン |
| DELETE | /api/v1/habits/:id/checkins/today | 今日のチェックイン取り消し |

---

## DB設計

### usersテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigint | PK |
| name | string | 表示名 |
| email | string | メール（unique） |
| encrypted_password | string | パスワード（devise） |
| created_at | datetime | |
| updated_at | datetime | |

### habitsテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigint | PK |
| user_id | bigint | FK |
| name | string | 習慣名 |
| emoji | string | 絵文字 |
| position | integer | 並び順 |
| created_at | datetime | |
| updated_at | datetime | |

### checkinsテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigint | PK |
| habit_id | bigint | FK |
| checked_on | date | チェックした日（JST） |
| created_at | datetime | |
| updated_at | datetime | |

### jwt_denylistテーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigint | PK |
| jti | string | JWTのID（unique） |
| exp | datetime | 有効期限 |

---

## ブランチ戦略

main 
├── feature/setup # 初期設定・DB・CORS・JWT基盤 
├── feature/auth # 認証（登録・ログイン・ログアウト） 
├── feature/habits # 習慣CRUD API 
├── feature/checkins # チェックオフ・ストリーク API 
└── feature/frontend # Reactフロント全般

### ルール
- 各featureブランチはmainから作成
- 動作確認後にmainへマージ
- コミットメッセージ: `feat:`, `fix:`, `chore:` のプレフィックスをつける

---

## CORS設定
- 許可オリジン: http://localhost:5173
- 許可ヘッダー: Authorization（JWTトークン用）
- expose: Authorization

---

## 進め方
- 機能ごとにブランチを切って作成
- 各ブランチ完成後にcurlで動作確認してからmainへマージ
- バックエンド完成後にフロントエンドを実装

---

## 注意事項
- タイムゾーンは全てJST（Asia/Tokyo）で処理
- ストリーク計算はサーバーサイドで行う
- JWTトークンはAuthorization headerで受け渡し
- Rails API modeのためセッション不使用


## テスト方針

### 使用ツール
- RSpec（request spec / model spec）
- FactoryBot（テストデータ作成）

### 進め方
- 各featureブランチの実装と同時にテストを書く
- PRマージ前にテストが通ることを確認

### 対象
| 種類 | 対象 |
|------|------|
| model spec | ストリーク計算ロジック |
| request spec | 全APIエンドポイント（正常系・異常系） |

### 方針
- 正常系・異常系（未認証・他人のリソース）を必ずカバー
- カバレッジは問わず、重要ロジックを優先

## セキュリティ対策

### 認証・認可
- 全APIエンドポイントにJWT認証必須
- 他ユーザーのリソースへのアクセス禁止（必ずcurrent_userでスコープ）
- JWTはDenylistで無効化対応

### 入力バリデーション
- モデルレベルでバリデーション必須
  - name: 存在・最大文字数（50文字）
  - emoji: 存在・1文字
  - email: 存在・形式・一意性
  - password: 最低8文字

### その他
- CORS: localhost:5173のみ許可
- パスワードはbcryptでハッシュ化（deviseデフォルト）
- SQLインジェクション: ActiveRecordで自動対策
- XSS: Reactのデフォルトエスケープで対策

## GitHub

- リポジトリ: https://github.com/tomokidayo/new_habit_tracker.git
- ブランチ戦略:
  - mainブランチが本線
  - 各featureブランチはmainから作成
  - push後にGitHubでPR作成 → 確認 → マージはご自身で行う

## 初回セットアップ手順（Claude Codeが実行）
git init
git remote add origin https://github.com/tomokidayo/new_habit_tracker.git
git add .
git commit -m "chore: initial commit"
git push -u origin main