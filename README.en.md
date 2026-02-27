<div align="center">

# 🌳 Conversation-Tree

**Explore conversations like a tree**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**English** | [日本語](./README.ja.md) | [한국어](./README.md)

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 Developer's Note

> *"A conversation is not a linear record, but a universe of infinitely branching possibilities."*

This project was born from a simple thought: "What if I had asked differently?" Traditional AI chatbots record conversations in a straight line, but our thinking is far more complex. When you want to explore multiple directions from a single question while preserving context — Conversation-Tree is the answer.

While visualizing conversations with D3.js, I wanted to create an experience like drawing constellations in the cosmos. Each node represents a moment in the dialogue, and each connection represents the flow of thought. I hope the process of creating your own map of ideas becomes a creative journey in itself.

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

---

## 📝 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**⭐ If this project helped you, please give it a Star! ⭐**

Made with 💜 and ☕

</div>
