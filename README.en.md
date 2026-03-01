<div align="center">

# 🌳 Conversation-Tree

**Explore conversations like a tree**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**English** | [日本語](./README.ja.md) | [한국어](./README.md) | [中文](./README.zh.md)

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 Developer's Note

> *"A conversation is not a simple linear record, but an infinitely branching tree of possibilities."*

In our daily lives, large language models provide us with a wealth of knowledge. As someone who is naturally curious, I often ask Google AI many questions instead of just using Google Search. Almost all AI platforms use a *"chat room"* format. While this provides a great opportunity to ask an AI in-depth questions about a single topic, I felt something was missing, and that missing piece became an inconvenience.

Specifically, AI often tries to provide a lot of information at once. For example, if it explains things using numbered lists like 1, 2, and 3, I might ask follow-up questions about point 1, but then find it difficult to navigate back to point 2 later.

Previously, to compensate for the AI's lack of long-term memory, I came up with and built a "Hierarchical Semantic Memory System." Expanding on that idea, I wanted to create a chat interface for this project where **memories are separated by tracks, allowing you to converse within the specific memory context you want.**

That's how I planned this project.
I hope many people find this feature useful. Please note that this project is not hosted as a service.

---

## ✨ Features

### 🌳 Multiverse Branching
- Create new conversation branches from any message
- All branches maintain independent context
- "Edit & Fork" feature to modify past questions and explore new paths

### 🔗 Memory Connection (Context Injection)
- Share memory between different conversation paths
- Inject context from Track A into Track B
- Cross-reference complex ideas

### 🗺️ Interactive Universe Map
- Real-time conversation visualization powered by D3.js
- Freely adjust node positions by dragging
- Explore entire conversation structure with zoom/pan
- Auto-recenter to current position

### ⚡ Gemini 3 Integration
- Google Gemini 3 Flash/Pro model support
- Real-time streaming responses
- Image attachments and multimodal conversations

### 📊 Track Comparison Mode
- Select multiple conversation paths simultaneously
- AI analyzes and compares selected tracks
- Explore parallel timelines

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/Conversation-Tree.git
cd Conversation-Tree

# Install dependencies
npm install

# Run development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Preview
npm run preview
```

### API Key Setup

1. Enter your Gemini API Key on the Landing Page when launching the app
2. Key is securely stored in browser local storage
3. Auto-loads on subsequent visits

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini API |
| **Build** | Vite |
| **Markdown** | react-markdown |

---

## 📁 Project Structure

```
conversation-tree/
├── 📂 components/
│   ├── ChatInterface.tsx    # Chat UI and message rendering
│   ├── UniverseMap.tsx      # D3.js-based conversation visualization
│   └── LandingPage.tsx      # API key input and onboarding
├── 📂 services/
│   ├── geminiService.ts     # Gemini API integration
│   └── storageService.ts    # Local/browser storage management
├── 📂 utils/
│   └── graphUtils.ts        # Graph traversal and tree building
├── 📂 conversation-tree-data/     # Session data (auto-generated)
├── App.tsx                  # Main app component
├── types.ts                 # TypeScript type definitions
└── vite.config.ts           # Vite config and API plugin
```

---

## 💡 How to Use

1. **Start New Chat**: Click "New Chat" in the left sidebar
2. **Create Branch**: Click a node in the universe map → Select "Focus / View" → Type new message
3. **Connect Memory**: Click node → "Connect Memory" → Select target node
4. **Compare Tracks**: Click GitMerge icon at bottom → Select leaf nodes to compare → Enter question
5. **Adjust Layout**: Drag nodes to desired positions (auto-saved)

---

## 🤝 Contributing

Contributions are always welcome! Bug reports, feature suggestions, and PRs are appreciated.

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 🎨 Screenshots

<div align="center">
<i>Here are some simple example screenshots.</i>

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

## 📝 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**⭐ If this project helped you, please give it a Star! ⭐**

</div>

> I think it would be incredibly useful if developers at AI startups like Google, OpenAI, Claude, XAI, Grok, and others added this feature.

<div align="center">

| 👤 **Developer** | ✉️ **Email** |
|:---:|:---:|
| Zanviq | zanviq.dev@gmail.com |

</div>
