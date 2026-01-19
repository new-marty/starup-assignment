# ユーザーフロー

## 概要

このドキュメントでは、アプリケーションのユーザーフローと画面遷移について説明します。

## 画面遷移図

```mermaid
stateDiagram-v2
    [*] --> HomePage
    HomePage --> GroupPage: Create Group
    GroupPage --> GroupPage: Add Expense
    GroupPage --> GroupPage: Delete Expense
    GroupPage --> GroupPage: Change Currency
    GroupPage --> HomePage: Create New Group
```

## ユーザージャーニー（国内旅行）

```mermaid
journey
    title User Journey - Domestic Trip
    section Create Group
      Enter group name: 5: User
      Add member names: 5: User
      Create group: 5: User
    section Add Expenses
      Select payer: 4: User
      Enter amount: 4: User
      Describe expense: 4: User
      Select split members: 4: User
    section View Results
      Check balance summary: 5: User
      See settlement instructions: 5: User
```

## ユーザージャーニー（海外旅行）

```mermaid
journey
    title User Journey - International Trip
    section Create Group
      Enter group name: 5: User
      Add member names: 5: User
      Create group: 5: User
    section Currency Setup
      Select foreign currencies: 4: User
      Fetch exchange rates: 4: User
    section Add Expenses
      Select payer: 4: User
      Enter amount: 4: User
      Select currency: 4: User
      Select split members: 4: User
    section View Results
      Check balance in JPY: 5: User
      See settlement instructions: 5: User
```

## 詳細フロー

### 1. グループ作成フロー

```mermaid
flowchart TD
    Start[HomePage] --> EnterName[Enter group name]
    EnterName --> AddMember[Add member name]
    AddMember --> More{More members?}
    More -->|Yes| AddMember
    More -->|No| Check{At least 2 members?}
    Check -->|No| AddMember
    Check -->|Yes| Create[Click Create Group]
    Create --> Navigate[Navigate to GroupPage]
```

**バリデーション:**
- グループ名: 1〜50文字
- メンバー名: 1〜20文字
- 最低メンバー数: 2人
- 重複した名前は不可

### 2. 通貨設定フロー（海外旅行用）

```mermaid
flowchart TD
    Start[GroupPage] --> SelectCurrency[Select foreign currency]
    SelectCurrency --> More{More currencies?}
    More -->|Yes| SelectCurrency
    More -->|No| Fetch[Click Fetch Rates]
    Fetch --> API[Call /api/exchange-rates]
    API --> Success{Success?}
    Success -->|Yes| Display[Display current rates]
    Success -->|No| Error[Show error toast]
    Display --> Ready[Ready to add expenses]
```

**サポート通貨:**
- JPY（日本円）- 常に選択済み
- USD, EUR, GBP, KRW, CNY, TWD, THB, SGD, AUD, CAD, CHF

### 3. 支出追加フロー

```mermaid
flowchart TD
    Start[GroupPage] --> SelectPayer[Select payer]
    SelectPayer --> EnterAmount[Enter amount]
    EnterAmount --> SelectCurrency[Select currency]
    SelectCurrency --> EnterDesc[Enter description]
    EnterDesc --> SelectSplit[Select split members]
    SelectSplit --> SelectAll{Select all?}
    SelectAll -->|Yes| AllSelected[All members selected]
    SelectAll -->|No| Individual[Select individually]
    AllSelected --> Submit[Click Add]
    Individual --> Submit
    Submit --> Validate{Valid?}
    Validate -->|No| ShowError[Show error toast]
    ShowError --> SelectPayer
    Validate -->|Yes| Save[Save expense]
    Save --> Update[Update balances and settlements]
```

**バリデーション:**
- 支払者: 必須
- 金額: 0より大きい数値
- 説明: 1〜100文字
- 割り勘対象: 最低1人

### 4. 支出削除フロー

```mermaid
flowchart TD
    Start[Expense List] --> Click[Click delete button]
    Click --> Remove[Remove expense from state]
    Remove --> Recalc[Recalculate balances]
    Recalc --> Update[Update UI]
```

### 5. 精算確認フロー

```mermaid
flowchart TD
    Start[GroupPage] --> ViewBalance[View Balance Summary]
    ViewBalance --> Understand[Understand who owes/receives]
    Understand --> ViewSettlement[View Settlement List]
    ViewSettlement --> Follow[Follow payment instructions]
    Follow --> Done[All settled]
```

## 画面構成

### ホームページ（/）

```
┌─────────────────────────────┐
│         割り勘計算           │  ← Header
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │     グループ名         │  │  ← Card: Group Name
│  │  ┌─────────────────┐  │  │
│  │  │ 北海道旅行        │  │  │  ← Input
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │     メンバー名         │  │  ← Card: Members
│  │  ┌──────────┐ [追加]  │  │
│  │  │          │         │  │  ← Input + Button
│  │  └──────────┘         │  │
│  │  ┌─────────────────┐  │  │
│  │  │ 田中    [×]      │  │  │  ← Member List
│  │  │ 鈴木    [×]      │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   グループを作成        │  │  ← Create Button
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### グループページ（/group）

```
┌─────────────────────────────┐
│         割り勘計算           │  ← Header (link to home)
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │      北海道旅行        │  │  ← Group Info Card
│  │   3人: 田中、鈴木、佐藤 │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 🌐 通貨設定            │  │  ← Currency Selector
│  │ [JPY] [USD] [EUR] ... │  │
│  │ [為替レートを取得]     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ ➕ 支出を追加          │  │  ← Add Expense Form
│  │ 支払者: [選択]        │  │
│  │ 金額: [    ] [JPY▼]   │  │
│  │ 何に: [            ]  │  │
│  │ 割り勘: [全員選択]    │  │
│  │ [田中] [鈴木] [佐藤]  │  │
│  │      [追加する]       │  │
│  └───────────────────────┘  │
│  ─────────────────────────  │
│  ┌───────────────────────┐  │
│  │ 🧾 支出一覧 (2件)      │  │  ← Expense List
│  │ ┌───────────────────┐ │  │
│  │ │レンタカー ¥30,000 │ │  │
│  │ │田中が支払い→全員  │ │  │
│  │ └───────────────────┘ │  │
│  └───────────────────────┘  │
│  ─────────────────────────  │
│  ┌───────────────────────┐  │
│  │ 💰 収支バランス        │  │  ← Balance Summary
│  │ 田中: +¥20,000 (緑)   │  │
│  │ 鈴木: -¥10,000 (赤)   │  │
│  │ 佐藤: -¥10,000 (赤)   │  │
│  └───────────────────────┘  │
│  ─────────────────────────  │
│  ┌───────────────────────┐  │
│  │ ✅ 精算方法            │  │  ← Settlement List
│  │ ┌───────────────────┐ │  │
│  │ │鈴木 → 田中 ¥10,000│ │  │
│  │ │佐藤 → 田中 ¥10,000│ │  │
│  │ └───────────────────┘ │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## インタラクション

### トースト通知

| アクション | メッセージ | タイプ |
|-----------|-----------|--------|
| グループ作成 | 「グループを作成しました」 | Success |
| 支出追加 | 「支出を追加しました」 | Success |
| 為替レート取得 | 「為替レートを取得しました」 | Success |
| バリデーションエラー | 各種エラーメッセージ | Error |
| API エラー | 「為替レートの取得に失敗しました」 | Error |

### キーボード操作

| 画面 | キー | アクション |
|------|------|-----------|
| メンバー入力 | Enter | メンバーを追加 |
| 全般 | Tab | 次の入力フィールドへ移動 |

## エラーハンドリング

### バリデーションエラー

```mermaid
flowchart TD
    Input[User Input] --> Validate{Valid?}
    Validate -->|No| ShowError[Show error message below input]
    ShowError --> Wait[Wait for correction]
    Wait --> Input
    Validate -->|Yes| Process[Process input]
```

### API エラー

```mermaid
flowchart TD
    Request[API Request] --> Response{Success?}
    Response -->|No| Toast[Show error toast]
    Toast --> Retry[User can retry]
    Response -->|Yes| Update[Update UI]
```
