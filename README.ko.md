# 🌳 Conversation-Tree

**메시지마다 대화를 갈래로 나누고, 그 구조를 트리 맵으로 보여 주는 채팅 인터페이스입니다.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) [![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)](https://expressjs.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | **한국어** | [日本語](README.ja.md) | [中文](README.zh.md) | [Español](README.es.md)

[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

---

## 💭 Developer's Note

> *"단순한 선형 기록이 아니라, 무한히 분기하는 가능성의 대화입니다."*

<!-- TODO: 개발 동기 -->

---

## ✨ Features

### 🌳 대화 분기
- 사용자 메시지와 AI 답변을 `parentId` / `childrenIds`를 가진 노드로 저장하므로 하나의 대화가 트리가 됨
- **Focus**로 이전 답변을 현재 위치(head)로 지정하면, 다음 메시지가 그 지점에서 새 갈래로 이어짐
- **Edit**은 질문을 바꾸고 답변을 다시 생성하며, **Edit & Fork**는 원래 질문을 남긴 채 수정한 질문을 형제 갈래로 추가
- AI에는 루트에서 현재 head까지 경로에 있는 메시지만 전달됨

### 🔗 기억 연결
- **Connect Memory**로 다른 갈래의 노드를 현재 갈래에 연결
- 전송 시 연결된 갈래의 메시지(공통 조상 이후)를 "Connected Memory" 블록으로 프롬프트 앞에 붙임
- 연결은 맵에 점선으로 표시되고 **Delete Connection**으로 해제

### 📊 타임라인 비교
- 비교 버튼을 누르면 트랙 선택 모드가 되고, 맵의 말단 노드를 Track B, C, … 로 선택
- 선택한 각 트랙의 전체 대화 내용이 질문에 컨텍스트로 추가됨
- 첨부된 트랙은 메시지에 배지로 표시되며, 읽기 전용 화면으로 열어 볼 수 있음

### 🗺️ 대화 맵
- 채팅 옆에 질문/답변 쌍을 D3.js 트리로 표시
- 확대/축소, 이동, 노드 드래그, 현재 노드로 재정렬 지원. 드래그한 위치는 저장됨
- 노드 이름은 Gemini가 만든 짧은 요약(키가 없으면 질문의 앞부분 단어)

### ⚡ Gemini 응답
- `@google/genai`로 브라우저에서 직접 호출하며 답변을 스트리밍으로 표시
- 답변용 모델과 라벨용 모델을 Gemini 3 Flash / Pro 중에서 각각 선택
- 이미지 첨부(파일 선택 또는 붙여넣기)는 inline data로 전송

### 👤 계정과 저장
- 아이디/비밀번호 회원가입·로그인 (bcrypt 해시, httpOnly 쿠키에 JWT)
- 대화, 현재 선택된 대화, 모델 선택을 사용자별로 PostgreSQL에 저장
- 스트리밍 청크마다 저장하지 않고, 변경된 대화만 모아서 일정 간격으로 전송

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 및 Docker Compose
- (선택, AI 답변용) [Google Gemini API 키](https://aistudio.google.com/apikey)

### 실행

```bash
git clone https://github.com/Zanviq/Conversation-Tree.git
cd Conversation-Tree
cp .env.example .env
docker compose up
```

http://localhost:8080 으로 접속합니다 (포트가 사용 중이면 `.env`의 `WEB_PORT`를 변경).

처음 실행할 때 서버가 DB 마이그레이션을 적용하고, 예시 대화가 들어 있는 데모 계정을 만듭니다.

### 데모 계정

| 아이디 | 비밀번호 |
|----------|----------|
| `demo` | `demo1234` |

### Gemini API 키
키가 없어도 로그인해서 모든 대화, 맵, 트랙 화면을 볼 수 있습니다. 메시지 전송, **Edit**, **Edit & Fork**는 키를 입력할 때까지 비활성화됩니다.

1. 입력창 위의 **Add API key**(또는 사이드바의 **Gemini API Key**)를 클릭
2. 키를 붙여넣고 **Validate & Save** 클릭
3. 키는 브라우저 localStorage에만 저장되고 Google로 직접 전송되며, 이 앱의 서버로는 전송되지 않음

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6 |
| **Visualization** | D3.js 7 |
| **Styling** | Tailwind CSS |
| **Markdown** | react-markdown |
| **AI** | Google Gemini API (`@google/genai`, 브라우저에서 호출) |
| **Backend** | Node.js 22, Express 5 |
| **Database** | PostgreSQL 16, Drizzle ORM, drizzle-kit |
| **Auth** | bcryptjs, jsonwebtoken (httpOnly 쿠키) |
| **Infra** | Docker Compose, nginx |
| **Screenshots** | Playwright |

---

## 📁 Project Structure

```
Conversation-Tree/
├── 📂 components/
│   ├── ChatInterface.tsx       # 대화 스레드, 메시지 액션, 입력창, API 키 안내
│   ├── UniverseMap.tsx         # D3 대화 맵 (드래그, 줌, 연결, 트랙)
│   ├── LandingPage.tsx         # 랜딩 페이지와 로그인/회원가입
│   └── ApiKeyModal.tsx         # Gemini API 키 입력 (브라우저에만 저장)
├── 📂 services/
│   ├── apiClient.ts            # fetch 래퍼와 인증 API 호출
│   ├── apiKeyStore.ts          # localStorage의 Gemini 키 관리
│   ├── geminiService.ts        # 스트리밍 답변, 키 검증, 노드 라벨
│   └── storageService.ts       # 대화·설정을 서버와 동기화
├── 📂 utils/
│   └── graphUtils.ts           # 스레드 구성, 기억 연결, 트리 계층 변환
├── 📂 server/
│   ├── 📂 drizzle/             # SQL 마이그레이션
│   ├── 📂 src/
│   │   ├── 📂 db/              # 스키마, 마이그레이션 실행, 데모 seed
│   │   ├── 📂 routes/          # /api/auth, /api/conversations, /api/settings
│   │   ├── auth.ts             # 비밀번호 해시와 세션 쿠키
│   │   └── index.ts            # Express 진입점 (마이그레이션 → seed → 실행)
│   └── Dockerfile
├── 📂 docker/
│   └── nginx.conf              # 웹 빌드 제공 및 /api 프록시
├── 📂 scripts/
│   └── 📂 capture-screenshots/ # README 스크린샷용 Playwright 스크립트
├── 📂 image/                   # 스크린샷
├── App.tsx                     # 앱 상태, 분기 로직, 레이아웃
├── types.ts                    # Session / Message 타입
├── Dockerfile                  # 웹 이미지 (Vite 빌드 → nginx)
├── docker-compose.yml          # db, server, web
└── .env.example
```

---

## 💡 How to Use

1. **로그인**: 랜딩 페이지에서 데모 계정으로 로그인하거나 계정을 만듦
2. **대화 시작**: **New Chat**을 누르고 메시지 전송 (Gemini API 키 필요)
3. **분기**: 답변에 마우스를 올려 **Focus**를 누르거나, 맵의 노드 클릭 → **Focus / View** 후 새 메시지 전송
4. **Edit & Fork**: 이전 질문을 수정하고 두 버전을 각각의 갈래로 유지
5. **기억 연결**: 노드 클릭 → **Connect Memory** → 대상 노드 선택
6. **타임라인 비교**: 입력창 옆 비교 버튼을 누르고 맵에서 말단 노드를 선택한 뒤 질문
7. **맵 정리**: 노드를 드래그하면 위치가 대화와 함께 저장됨

---

## 🎨 Screenshots

<p align="center">
  <img src="image/main-timeline-compare.png" alt="타임라인 비교가 표시된 메인 화면" width="100%">
</p>

<table>
  <tr>
    <td align="center"><img src="image/landing-login.png" alt="랜딩 및 로그인"><br><sub>랜딩 / 로그인</sub></td>
    <td align="center"><img src="image/track-view.png" alt="트랙 보기"><br><sub>읽기 전용 트랙 보기</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/connected-memory.png" alt="기억 연결"><br><sub>기억 연결</sub></td>
    <td align="center"><img src="image/branching-map.png" alt="분기 맵"><br><sub>분기 맵</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="image/model-select.png" alt="모델 선택"><br><sub>모델 선택</sub></td>
    <td align="center"><img src="image/api-key-settings.png" alt="API 키 설정"><br><sub>Gemini API 키 설정</sub></td>
  </tr>
</table>

---

## 📝 License

MIT License. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.

| 👤 Developer | ✉️ Email |
|:---:|:---:|
| Zanviq | zanviq.dev@gmail.com |
