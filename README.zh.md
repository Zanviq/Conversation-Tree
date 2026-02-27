<div align="center">

# 🌳 Conversation-Tree

**像探索树一样探索对话**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[English](./README.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md) | **中文** | [Español](./README.es.md)

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 开发者寄语

> *"对话不仅仅是简单的线性记录，而是无限分支的可能性的树。"*

在我们的日常生活中，大型语言模型为我们提供了大量的知识。作为一个平时就充满好奇心的人，我经常向 Google AI 提问，而不是仅仅使用 Google 搜索。几乎所有的 AI 网站都使用 *"聊天室"* 的形式。当然，这为我们提供了一个很好的机会，可以就一个主题集中向 AI 提问。然而，我在这方面感觉到了一些不足，而这种不足逐渐变成了一种不便。

特别是，AI 经常试图一次性向我提供大量信息。例如，如果它用 1. 2. 3. 这样的编号来解释，我可能会继续针对第 1 点提问，但如果之后需要回到第 2 点，就会变得很麻烦。

以前，为了弥补 AI 缺乏长期记忆的缺点，我曾构思并制作过一个“分层语义记忆系统”。在这个项目上，我扩展了这个想法，希望制作一个**将记忆按轨道分离，并允许在所需的记忆上下文中进行对话**的聊天室。

因此，我策划了如下的项目。
我希望很多人能使用这个功能，但本项目不提供单独的托管服务。

---

## ✨ 主要功能

### 🌳 多重宇宙分支 (Multiverse Branching)
- 从任何消息创建新的对话分支
- 所有分支的上下文保持独立
- "Edit & Fork" 功能：修改过去的问题并探索新路径

### 🔗 记忆连接 (Context Injection)
- 在不同的对话路径之间共享记忆
- 将 Track A 的上下文注入到 Track B
- 支持复杂想法的交叉引用

### 🗺️ 交互式宇宙地图
- 基于 D3.js 的实时对话可视化
- 自由拖动调整节点位置
- 缩放/平移以探索整个对话结构
- 自动重新居中到当前位置

### ⚡ Gemini 3 集成
- 支持 Google Gemini 3 Flash/Pro 模型
- 实时流式响应
- 图像附件和多模态对话

### 📊 轨道比较模式
- 同时选择多个对话路径
- AI 分析并比较选定的轨道
- 探索平行时间线

---

## 🚀 快速开始

### 前置要求
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/Conversation-Tree.git
cd Conversation-Tree

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

### 构建

```bash
# 生产环境构建
npm run build

# 预览
npm run preview
```

### API 密钥设置

1. 启动应用时，在 Landing Page 输入 Gemini API Key
2. 密钥将安全地存储在浏览器的本地存储中
3. 下次访问时自动加载

---

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| **Frontend** | React 19, TypeScript |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini API |
| **Build** | Vite |
| **Markdown** | react-markdown |

---

## 📁 项目结构

```
conversation-tree/
├── 📂 components/
│   ├── ChatInterface.tsx    # 聊天 UI 和消息渲染
│   ├── UniverseMap.tsx      # 基于 D3.js 的对话可视化
│   └── LandingPage.tsx      # API 密钥输入和引导
├── 📂 services/
│   ├── geminiService.ts     # Gemini API 集成
│   └── storageService.ts    # 本地/浏览器存储管理
├── 📂 utils/
│   └── graphUtils.ts        # 图遍历和树构建
├── 📂 conversation-tree-data/     # 会话数据（自动生成）
├── App.tsx                  # 主应用组件
├── types.ts                 # TypeScript 类型定义
└── vite.config.ts           # Vite 配置和 API 插件
```

---

## 💡 使用方法

1. **开始新对话**: 在左侧侧边栏点击 "New Chat"
2. **创建分支**: 在宇宙地图中点击节点 → 选择 "Focus / View" → 输入新消息
3. **连接记忆**: 点击节点 → "Connect Memory" → 选择目标节点
4. **比较轨道**: 点击底部的 GitMerge 图标 → 选择要比较的叶子节点 → 输入问题
5. **调整布局**: 拖动节点到所需位置（自动保存）

---

## 🎨 屏幕截图

<div align="center">
<i>以下是一些简单的示例截图。</i>

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

## 📝 许可证

本项目基于 MIT 许可证分发。详情请参阅 [LICENSE](LICENSE) 文件。

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给一个 Star！ ⭐**

</div>

> 我认为如果 Google、OpenAI、Claude、XAI、Grok 等众多 AI 初创公司的开发者们能添加这个功能，将会非常有用。

<div align="center">

| 👤 **开发者** | ✉️ **电子邮件** |
|:---:|:---:|
| Zanviq | Zanviq.dev@gmail.com |

</div>
