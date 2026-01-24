# 🌌 Cosmic Chat

**Cosmic Chat**은 대화 흐름을 시각적인 우주 지도로 표현하는 AI 채팅 애플리케이션입니다. 복잡한 사고의 흐름을 별자리처럼 매핑하고, 여러 가지 대화 경로를 탐색할 수 있습니다.

## ✨ 주요 기능

- **대화 맵 시각화**: 대화의 흐름을 동적 그래프로 표시
- **분기 탐색**: 여러 대화 경로를 자유롭게 생성하고 탐색
- **노드 레이아웃**: 노드를 드래그하여 위치 조정 (자동 저장)
- **메모리 연결**: 서로 다른 대화 경로 간의 메모리 연결
- **추적 모드**: 특정 대화 경로를 선택하여 컨텍스트로 활용
- **실시간 저장**: 모든 대화와 레이아웃이 자동으로 저장됨

## 🚀 시작하기

### 설치

```bash
# 의존성 설치
npm install
```

### 환경 설정

`.env.local` 파일을 생성하고 Gemini API 키를 설정합니다:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 🛠 기술 스택

- **Frontend**: React + TypeScript
- **Visualization**: D3.js
- **Styling**: Tailwind CSS
- **AI API**: Google Gemini
- **Build Tool**: Vite

## 📁 프로젝트 구조

```
cosmic-chat/
├── components/          # React 컴포넌트
│   ├── ChatInterface    # 채팅 인터페이스
│   ├── UniverseMap      # 대화 맵 시각화
│   └── LandingPage      # 시작 화면
├── services/            # API 및 저장소 서비스
│   ├── geminiService    # Gemini AI 통합
│   └── storageService   # 데이터 저장소 관리
├── utils/               # 유틸리티 함수
│   └── graphUtils       # 그래프 처리 유틸
└── cosmic-chat-data/    # 세션 데이터 저장
```

## 💡 사용 방법

1. **대화 시작**: 새로운 세션을 생성하고 메시지 입력
2. **분기 생성**: 원하는 지점에서 새로운 메시지를 입력하면 분기 생성
3. **노드 위치 조정**: 맵에서 노드를 드래그하여 레이아웃 조정
4. **메모리 연결**: 노드의 "Connect Memory" 옵션으로 다른 경로와 연결
5. **경로 추적**: Track Selection Mode에서 특정 경로를 선택하여 컨텍스트로 사용

## 📝 라이선스

MIT License
