<div align="center">

# 🌌 Cosmic Chat

**대화를 별자리처럼 탐험하세요**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[English](./README.en.md) | [日本語](./README.ja.md) | **한국어**

<img src="https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Powered by Gemini"/>

</div>

---

## 💭 프로젝트 소감

> *"대화는 단순한 선형 기록이 아니라, 무한히 분기하는 가능성의 우주입니다."*

이 프로젝트는 "만약 다르게 질문했다면?"이라는 생각에서 시작되었습니다. 기존 AI 챗봇들은 대화를 일직선으로만 기록하지만, 우리의 사고는 훨씬 복잡합니다. 하나의 질문에서 여러 방향으로 탐험하고 싶을 때, 이전 맥락을 유지하면서 새로운 가능성을 열고 싶을 때 — Cosmic Chat이 그 해답입니다.

D3.js로 대화를 시각화하면서, 마치 우주의 별자리를 그리는 것 같은 경험을 만들고 싶었습니다. 각 노드는 대화의 한 순간이고, 연결선은 사고의 흐름입니다. 사용자가 자신만의 사고 지도를 만들어가는 과정 자체가 창의적인 여정이 되기를 바랍니다.

---

## ✨ 주요 기능

### 🌳 멀티버스 브랜칭
- 어떤 메시지에서든 새로운 대화 분기 생성
- 모든 분기의 컨텍스트가 독립적으로 유지
- "Edit & Fork" 기능으로 과거 질문 수정 후 새 경로 탐색

### 🔗 메모리 연결 (Context Injection)
- 서로 다른 대화 경로 간 메모리 공유
- Track A의 컨텍스트를 Track B에 주입
- 복잡한 아이디어의 교차 참조 가능

### 🗺️ 인터랙티브 우주 지도
- D3.js 기반 실시간 대화 시각화
- 드래그로 노드 위치 자유롭게 조정
- 줌/팬으로 전체 대화 구조 탐색
- 현재 위치로 자동 리센터링

### ⚡ Gemini 3 통합
- Google Gemini 3 Flash/Pro 모델 지원
- 실시간 스트리밍 응답
- 이미지 첨부 및 멀티모달 대화

### 📊 트랙 비교 모드
- 여러 대화 경로를 동시에 선택
- AI가 선택된 트랙들을 비교 분석
- 병렬 타임라인 탐색

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/cosmic-chat.git
cd cosmic-chat

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 미리보기
npm run preview
```

### API 키 설정

1. 앱 실행 시 Landing Page에서 Gemini API Key 입력
2. 키는 브라우저 로컬 스토리지에 안전하게 저장
3. 다음 접속 시 자동 로드

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19, TypeScript |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini API |
| **Build** | Vite |
| **Markdown** | react-markdown |

---

## 📁 프로젝트 구조

```
cosmic-chat/
├── 📂 components/
│   ├── ChatInterface.tsx    # 채팅 UI 및 메시지 렌더링
│   ├── UniverseMap.tsx      # D3.js 기반 대화 시각화
│   └── LandingPage.tsx      # API 키 입력 및 온보딩
├── 📂 services/
│   ├── geminiService.ts     # Gemini API 통합
│   └── storageService.ts    # 로컬/브라우저 저장소 관리
├── 📂 utils/
│   └── graphUtils.ts        # 그래프 순회 및 트리 구축
├── 📂 cosmic-chat-data/     # 세션 데이터 (자동 생성)
├── App.tsx                  # 메인 앱 컴포넌트
├── types.ts                 # TypeScript 타입 정의
└── vite.config.ts           # Vite 설정 및 API 플러그인
```

---

## 💡 사용 방법

1. **새 대화 시작**: 좌측 사이드바에서 "New Chat" 클릭
2. **분기 생성**: 우주 지도에서 노드 클릭 → "Focus / View" 선택 후 새 메시지 입력
3. **메모리 연결**: 노드 클릭 → "Connect Memory" → 연결할 노드 선택
4. **트랙 비교**: 하단 GitMerge 아이콘 클릭 → 비교할 리프 노드 선택 → 질문 입력
5. **레이아웃 조정**: 노드를 드래그하여 원하는 위치로 이동 (자동 저장)

---

## 🎨 스크린샷

<div align="center">
<i>우주 지도에서 대화의 흐름을 탐험하세요</i>
</div>

---

## 🤝 기여하기

기여는 언제나 환영합니다! 버그 리포트, 기능 제안, PR 모두 감사합니다.

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요! ⭐**

Made with 💜 and ☕

</div>
