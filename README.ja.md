<div align="center">

# 🌳 Conversation-Tree

**会話をツリーのように探検しよう**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[English](./README.md) | **日本語** | [한국어](./README.ko.md) | [中文](./README.zh.md) | [Español](./README.es.md)

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 開発者の想い

> *「単なる線形の記録ではなく、無限に分岐する可能性の会話です。」*

私たちの日常において、大規模言語モデルは多くの知識を提供してくれます。特に普段から好奇心旺盛な私は、Google検索の代わりにGoogle AIに多くの質問をします。ほぼすべてのAIサイトでは「*チャットルーム*」形式が採用されています。もちろん、これは私たちが一つのテーマについて集中的にAIに質問できる良い機会を提供してくれます。しかし、私はこの部分に少し物足りなさを感じ、その物足りなさが不便さとして迫ってきました。

特にAIは、一度に多くの情報を私に提供しようとします。例えば、1. 2. 3. のように番号を付けて説明されると、私は1番について質問を続けた後、再び2番に戻らなければならない場合に困ってしまいます。

以前、私はAIの不足している長期記憶を補うために「階層的意味記憶システム」というアイデアを思いつき、制作してみた経験がありました。そのアイデアを拡張し、このプロジェクトでは**記憶をトラック別に分離し、希望する記憶の中で会話ができるように**チャットルームを制作したいと考えました。

そうして、私は以下のようなプロジェクトを企画しました。
多くの人にこの機能を使ってもらいたいと願っていますが、このプロジェクトは別途ホスティングして提供することはありません。

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
git clone https://github.com/Zanviq/Conversation-Tree.git
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

## 🎨 スクリーンショット

<div align="center">
<i>簡単な例のスクリーンショットです。</i>

![Screenshot](image/LandingPage.png)

<table>
  <tr>
    <td><img src="image/Chat_1.png" width="400"/></td>
    <td><img src="image/Chat_2.png" width="400"/></td>
  </tr>
  <tr>
    <td><img src="image/Chat_3.png" width="400"/></td>
    <td><img src="image/Chat_4.png" width="400"/></td>
  </tr>
</table>
</div>

---

## 📝 ライセンス

このプロジェクトはMITライセンスの下で配布されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

---

<div align="center">

**⭐ このプロジェクトが役に立ったら、Starをお願いします！ ⭐**

</div>

> Google、OpenAI、Claude、XAI、Grok...など、多くのAIスタートアップの開発者の方々がこの機能を追加してくだされば、非常に便利に使えると思います。

<div align="center">

| 👤 **開発者** | ✉️ **メール** |
|:---:|:---:|
| Zanviq | zanviq.dev@gmail.com |

</div>
