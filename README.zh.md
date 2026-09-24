# 🌳 Conversation-Tree

**一个可以从任意消息分出新对话分支、并以树状图展示其结构的聊天界面。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) [![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | **中文** | [Español](README.es.md)

[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

---

## 💭 Developer's Note

> *"对话不仅仅是简单的线性记录，而是无限分支的可能性的树。"*

<!-- TODO: 개발 동기 -->

---

## ✨ Features

### 🌳 对话分支
- 用户消息和 AI 回答都以带有 `parentId` / `childrenIds` 的节点保存，因此一个对话就是一棵树
- 用 **Focus** 把之前的某个回答设为当前位置（head），下一条消息就会从那里开出新的分支
- **Edit** 替换问题并重新生成回答；**Edit & Fork** 保留原问题，把修改后的问题作为兄弟分支添加
- 发送给 AI 的只有从根节点到当前 head 路径上的消息

### 🔗 记忆连接
- 用 **Connect Memory** 把其他分支的节点连接到当前分支
- 发送时，被连接分支的消息（从共同祖先往下）会作为 "Connected Memory" 块加在提示词前面
- 连接在地图上以虚线显示，可用 **Delete Connection** 删除

### 📊 时间线比较
- 点击比较按钮进入轨道选择模式，在地图中选择叶子节点作为 Track B、C……
- 所选每条轨道的完整对话内容会作为上下文加入问题
- 附加的轨道以徽章形式显示在消息上，并可在只读视图中打开

### 🗺️ 对话地图
- 在聊天旁边用 D3.js 树展示问题/回答对
- 支持缩放、平移、拖动节点以及回到当前节点；拖动后的位置会被保存
- 节点名称是 Gemini 生成的简短摘要（没有密钥时使用问题的前几个词）

### ⚡ Gemini 回答
- 通过 `@google/genai` 在浏览器中直接调用，以流式方式显示回答
- 回答和标签可分别选择 Gemini 3 Flash / Pro 模型
- 图片附件（选择文件或粘贴）以 inline data 发送

### 👤 账号与存储
- 使用用户名和密码注册 / 登录（bcrypt 哈希，JWT 存放在 httpOnly Cookie 中）
- 对话、当前选中的对话和模型选择按用户保存在 PostgreSQL 中
- 不会在每个流式片段时都保存，而是按固定间隔只发送有变化的对话

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 和 Docker Compose
- （可选，用于 AI 回答）[Google Gemini API 密钥](https://aistudio.google.com/apikey)

### 运行

```bash
git clone https://github.com/Zanviq/Conversation-Tree.git
cd Conversation-Tree
cp .env.example .env
docker compose up
```

打开 http://localhost:8080（如果端口被占用，请修改 `.env` 中的 `WEB_PORT`）。

首次启动时，服务器会执行数据库迁移，并创建一个带示例对话的演示账号。

### 演示账号

| 用户名 | 密码 |
|----------|----------|
| `demo` | `demo1234` |

### Gemini API 密钥
没有密钥也可以登录并浏览所有对话、地图和轨道视图。发送消息、**Edit** 和 **Edit & Fork** 在输入密钥之前处于禁用状态。

1. 点击输入框上方的 **Add API key**（或侧边栏中的 **Gemini API Key**）
2. 粘贴密钥并点击 **Validate & Save**
3. 密钥只保存在浏览器的 localStorage 中并直接发送给 Google，不会发送到本应用的服务器

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **Markdown** | react-markdown |
| **AI** | Google Gemini API（`@google/genai`，在浏览器中调用） |
| **Backend** | Node.js 22, Express 5 |
| **Database** | PostgreSQL 16, Drizzle ORM, drizzle-kit |
| **Auth** | bcryptjs, jsonwebtoken（httpOnly Cookie） |
| **Infra** | Docker Compose, nginx |
| **Screenshots** | Playwright |

---

## 📁 Project Structure

```
Conversation-Tree/
├── 📂 components/
│   ├── ChatInterface.tsx       # 对话线程、消息操作、输入框、API 密钥提示
│   ├── UniverseMap.tsx         # D3 对话地图（拖动、缩放、连接、轨道）
│   ├── LandingPage.tsx         # 落地页与登录/注册
│   └── ApiKeyModal.tsx         # Gemini API 密钥输入（仅保存在浏览器）
├── 📂 services/
│   ├── apiClient.ts            # fetch 封装与认证 API 调用
│   ├── apiKeyStore.ts          # localStorage 中的 Gemini 密钥管理
│   ├── geminiService.ts        # 流式回答、密钥验证、节点标签
│   └── storageService.ts       # 与服务器同步对话和设置
├── 📂 utils/
│   └── graphUtils.ts           # 构建线程、记忆连接、树层级转换
├── 📂 server/
│   ├── 📂 drizzle/             # SQL 迁移
│   ├── 📂 src/
│   │   ├── 📂 db/              # 表结构、迁移执行、演示 seed
│   │   ├── 📂 routes/          # /api/auth, /api/conversations, /api/settings
│   │   ├── auth.ts             # 密码哈希与会话 Cookie
│   │   └── index.ts            # Express 入口（迁移 → seed → 启动）
│   └── Dockerfile
├── 📂 docker/
│   └── nginx.conf              # 提供 Web 构建并代理 /api
├── 📂 scripts/
│   └── 📂 capture-screenshots/ # 用于 README 截图的 Playwright 脚本
├── 📂 image/                   # 截图
├── App.tsx                     # 应用状态、分支逻辑、布局
├── types.ts                    # Session / Message 类型
├── Dockerfile                  # Web 镜像（Vite 构建 → nginx）
├── docker-compose.yml          # db, server, web
└── .env.example
```

---

## 💡 How to Use

1. **登录**：在落地页使用演示账号登录，或创建新账号
2. **开始对话**：点击 **New Chat** 并发送消息（需要 Gemini API 密钥）
3. **分支**：将鼠标移到回答上点击 **Focus**，或点击地图中的节点 → **Focus / View**，然后发送新消息
4. **Edit & Fork**：修改之前的问题，并把两个版本保留为不同的分支
5. **连接记忆**：点击节点 → **Connect Memory** → 选择目标节点
6. **比较时间线**：点击输入框旁的比较按钮，在地图中选择叶子节点，然后提问
7. **整理地图**：拖动节点，位置会随对话一起保存

---

## 🎨 Screenshots

<p align="center">
  <img src="image/main-timeline-compare.png" alt="显示时间线比较的主界面" width="100%">
</p>

<table>
  <tr>
    <td align="center"><img src="image/landing-login.png" alt="落地页与登录"><br><sub>落地页 / 登录</sub></td>
    <td align="center"><img src="image/track-view.png" alt="轨道视图"><br><sub>只读轨道视图</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/connected-memory.png" alt="记忆连接"><br><sub>记忆连接</sub></td>
    <td align="center"><img src="image/branching-map.png" alt="分支地图"><br><sub>分支地图</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/model-select.png" alt="模型选择"><br><sub>模型选择</sub></td>
    <td align="center"><img src="image/api-key-settings.png" alt="API 密钥设置"><br><sub>Gemini API 密钥设置</sub></td>
  </tr>
</table>

---

## 📝 License

MIT License。详情请参阅 [LICENSE](LICENSE)。

| 👤 Developer | ✉️ Email |
|:---:|:---:|
| Zanviq | zanviq.dev@gmail.com |
