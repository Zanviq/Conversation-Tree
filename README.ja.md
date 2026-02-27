<div align="center">

# 🌳 Conversation-Tree

**会話をツリーのように探検しよう**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[English](./README.en.md) | **日本語** | [한국어](./README.md)

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 開発者の想い

> *「会話は単なる線形の記録ではなく、無限に分岐する可能性の宇宙です。」*

このプロジェクトは「もし違う質問をしていたら？」という考えから始まりました。従来のAIチャットボットは会話を一直線に記録しますが、私たちの思考はもっと複雑です。一つの質問から複数の方向を探求したい時、以前のコンテキストを維持しながら新しい可能性を開きたい時 — Conversation-Treeがその答えです。

D3.jsで会話を可視化しながら、まるで宇宙の星座を描くような体験を作りたいと思いました。各ノードは対話の一瞬であり、接続線は思考の流れです。ユーザーが自分だけの思考マップを作っていく過程そのものが、創造的な旅になることを願っています。

---

## ✨ 主な機能

### 🌳 マルチバースブランチング
- どのメッセージからでも新しい会話分岐を作成
- すべての分岐のコンテキストが独立して維持
- 「Edit & Fork」機能で過去の質問を修正し、新しいパスを探索

### 🔗 メモリ接続（コンテキストインジェクション）
- 異なる会話パス間でメモリを共有
- トラックAのコンテキストをトラックBに注入
- 複雑なアイデアの相互参照が可能

### 🗺️ インタラクティブ宇宙マップ
- D3.jsベースのリアルタイム会話可視化
- ドラッグでノード位置を自由に調整
- ズーム/パンで会話構造全体を探索
- 現在位置への自動リセンタリング

### ⚡ Gemini 3統合
- Google Gemini 3 Flash/Proモデルサポート
- リアルタイムストリーミングレスポンス
- 画像添付とマルチモーダル会話

### 📊 トラック比較モード
- 複数の会話パスを同時に選択
- AIが選択されたトラックを比較分析
- 並列タイムラインの探索

---

## 🚀 はじめに

### 前提条件
- Node.js 18+
- [Google Gemini APIキー](https://aistudio.google.com/app/apikey)

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/Conversation-Tree.git
cd Conversation-Tree

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

### APIキーの設定

1. アプリ起動時のランディングページでGemini APIキーを入力
2. キーはブラウザのローカルストレージに安全に保存
3. 次回アクセス時に自動ロード

---

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|----------|------|
| **Frontend** | React 19, TypeScript |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini API |
| **Build** | Vite |
| **Markdown** | react-markdown |

---

## 📁 プロジェクト構造

```
conversation-tree/
├── 📂 components/
│   ├── ChatInterface.tsx    # チャットUIとメッセージレンダリング
│   ├── UniverseMap.tsx      # D3.jsベースの会話可視化
│   └── LandingPage.tsx      # APIキー入力とオンボーディング
├── 📂 services/
│   ├── geminiService.ts     # Gemini API統合
│   └── storageService.ts    # ローカル/ブラウザストレージ管理
├── 📂 utils/
│   └── graphUtils.ts        # グラフ走査とツリー構築
├── 📂 conversation-tree-data/     # セッションデータ（自動生成）
├── App.tsx                  # メインアプリコンポーネント
├── types.ts                 # TypeScript型定義
└── vite.config.ts           # Vite設定とAPIプラグイン
```

---

## 💡 使い方

1. **新しい会話を開始**: 左サイドバーで「New Chat」をクリック
2. **分岐を作成**: 宇宙マップでノードをクリック → 「Focus / View」を選択 → 新しいメッセージを入力
3. **メモリを接続**: ノードをクリック → 「Connect Memory」 → 接続先ノードを選択
4. **トラックを比較**: 下部のGitMergeアイコンをクリック → 比較するリーフノードを選択 → 質問を入力
5. **レイアウト調整**: ノードをドラッグして希望の位置に移動（自動保存）

---

## 🤝 コントリビューション

コントリビューションは大歓迎です！バグ報告、機能提案、PRをお待ちしています。

1. このリポジトリをFork
2. Featureブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにPush (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

---

## 📝 ライセンス

このプロジェクトはMITライセンスの下で配布されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

---

<div align="center">

**⭐ このプロジェクトが役に立ったら、Starをお願いします！ ⭐**

Made with 💜 and ☕

</div>
