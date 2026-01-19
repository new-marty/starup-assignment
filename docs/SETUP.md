# 開発環境セットアップ

## 必要条件

- Node.js 18.17以上
- pnpm 8以上

## インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd warikan

# 依存関係をインストール
pnpm install
```

## 開発サーバー起動

```bash
pnpm dev
```

http://localhost:3000 でアクセス可能。

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動（Turbopack） |
| `pnpm build` | プロダクションビルド |
| `pnpm start` | プロダクションサーバー起動 |
| `pnpm lint` | ESLintでコードチェック |
| `pnpm lint:fix` | ESLintでコード修正 |
| `pnpm format` | Prettierでフォーマット |
| `pnpm format:check` | フォーマットチェック |
| `pnpm knip` | 未使用コード検出 |
| `pnpm test` | テスト実行 |
| `pnpm test:watch` | テストウォッチモード |
| `pnpm test:coverage` | カバレッジレポート生成 |
| `pnpm typecheck` | TypeScript型チェック |

## プロジェクト構成

```
warikan/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React コンポーネント
│   ├── atoms/         # Jotai atoms
│   ├── lib/           # ユーティリティ
│   └── types/         # TypeScript型定義
├── __tests__/         # テストファイル
├── docs/              # ドキュメント
└── public/            # 静的ファイル
```

## 技術スタック

- **Next.js 16** - Reactフレームワーク
- **TypeScript** - 型安全
- **TailwindCSS** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **Jotai** - 状態管理
- **Zod** - バリデーション
- **Vitest** - テスト

## VSCode拡張機能（推奨）

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
