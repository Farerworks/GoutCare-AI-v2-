# GoutCare AI  goutcare-ai

<p align="center">
  <strong>더 건강하고 통풍 없는 하루를 위한 AI 파트ナー</strong><br />
  <em>Your AI partner for a healthier, gout-free day.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Google-Gemini_API-orange?logo=google" alt="Gemini API">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-blue?logo=tailwindcss" alt="Tailwind CSS">
</p>

---

## 📖 개요 (Introduction)

GoutCare AI는 통풍 환자들이 일상에서 겪는 어려움을 해결하기 위해 설계된 AI 기반의 종합 건강 관리 애플리케이션입니다. 인터넷에 만연한 부정확한 정보 속에서 식단 관리에 혼란을 겪거나, 개인별 통풍 유발 요인을 체계적으로 파악하기 어려운 문제에 집중했습니다.

본 프로젝트는 사용자가 최소한의 노력으로 자신의 건강 데이터를 기록하고, AI를 통해 **데이터를 의미 있는 통찰력으로 전환**하는 경험을 제공하는 것을 목표로 합니다. 최종적으로는 임상적으로 검증된 **디지털 치료제(Digital Therapeutic, DTx)**로 발전하여 전 세계 통풍 환자들에게 신뢰할 수 있는 솔루션을 제공하는 것을 비전으로 삼고 있습니다.

## ✨ 핵심 기능 (Key Features)

GoutCare AI는 통풍 관리를 위한 강력하고 직관적인 기능들을 제공합니다.

| 기능 | 설명 |
| :--- | :--- |
| 📸 **AI 식단 분석 (AI Food Analysis)** | 음식 사진이나 텍스트만으로 즉시 퓨린 위험도를 분석하고, 더 나은 식단 대안을 AI가 제안합니다. 라이브러리, 비교, 계획, 검색 등 다양한 보조 기능을 제공합니다. |
| 📊 **개인화된 위험 예측 (Personalized Risk Forecast)** | 매일 기록된 건강 데이터(식단, 증상, 수면 등)를 바탕으로 AI가 오늘의 통풍 발작 위험도를 예측하고 실행 가능한 조언을 제공합니다. |
| 📝 **간편한 건강 기록 (Comprehensive Logging)** | 증상, 식단, 약물, 수분 섭취, 음주, 활동, 스트레스 등 통풍 관리에 필요한 모든 데이터를 직관적인 UI를 통해 쉽고 빠르게 기록할 수 있습니다. |
| 💬 **AI 어시스턴트 (Interactive AI Assistant)** | 통풍 관리에 대해 궁금한 점이 생길 때마다 전문가와 대화하듯 즉시 답변을 얻을 수 있는 대화형 챗봇입니다. (Gemini API 기반) |
| 📈 **AI 건강 리포트 (Insightful AI Reports)** | 누적된 데이터를 AI가 심층 분석하여 개인의 건강 트렌드를 시각화하고, 숨겨진 패턴, 긍정적 습관, 개선 영역을 담은 맞춤형 보고서를 생성합니다. |
| 🔄 **안전한 데이터 관리 (Data Management)** | 모든 데이터는 사용자의 브라우저(`localStorage`)에만 저장되어 개인정보를 강력하게 보호합니다. 데이터 백업(내보내기) 및 복원(가져오기) 기능을 지원합니다. |

---

## 🛠️ 기술 스택 및 아키텍처 (Tech Stack & Architecture)

### 기술 스택
- **프론트엔드:** React, TypeScript, Tailwind CSS
- **AI 서비스:** Google Gemini API (`gemini-2.5-flash` 모델)
- **상태 관리:** React Hooks (`useState`, `useContext`)
- **런타임:** Modern Web Browsers (ES Modules, Import Maps)

### 아키텍처
현재 GoutCare AI는 백엔드 서버 없이 모든 로직과 데이터가 브라우저에서 처리되는 **순수 클라이언트 사이드 애플리케이션(Client-Side Application)**으로 구축되었습니다.

- **데이터 저장소:** 모든 사용자 데이터는 브라우저의 `localStorage`에 저장됩니다.
  - **장점:** 서버 비용이 없고, 오프라인 접근이 가능하며, 사용자 데이터가 외부로 전송되지 않아 프라이버시가 극대화됩니다.
  - **미래 방향:** 향후 디지털 치료제로 발전하고 학술 연구를 진행하기 위해, 사용자 동의 기반의 데이터를 안전하게 수집할 수 있는 **서버리스 클라우드 아키텍처(Firebase, AWS Amplify 등)**로의 전환을 계획하고 있습니다.

- **AI 연동:** 모든 AI 기능은 `services/geminiService.ts` 모듈을 통해 Google Gemini API와 통신합니다. `responseSchema`를 활용한 JSON 모드를 통해 안정적으로 구조화된 데이터를 받아 처리합니다.

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하는 방법입니다.

### 1. 전제 조건 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18.x 이상 권장)
- [pnpm](https://pnpm.io/) (또는 npm, yarn)

### 2. 설치 및 실행 (Installation & Running)

1.  **리포지토리 복제 (Clone the repository):**
    ```bash
    git clone https://github.com/your-username/goutcare-ai.git
    cd goutcare-ai
    ```

2.  **의존성 설치 (Install dependencies):**
    ```bash
    pnpm install
    ```

3.  **환경 변수 설정 (Set up environment variables):**
    프로젝트 루트 디렉토리에 `.env` 파일을 생성하고, Google AI Studio에서 발급받은 Gemini API 키를 추가합니다.
    ```
    # .env
    API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  **개발 서버 실행 (Run the development server):**
    이 프로젝트는 Vite를 사용하여 개발 서버를 실행합니다.
    ```bash
    pnpm dev
    ```
    이제 브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 주소)로 접속하여 애플리케이션을 확인할 수 있습니다.

---

## 🗺️ 비전 및 로드맵 (Vision & Roadmap)

GoutCare AI는 단순한 관리 앱을 넘어, 임상적으로 검증된 디지털 치료제(DTx)로 발전하는 것을 장기 목표로 합니다.

- **Phase 1: 기반 구축 및 사용자 성장**
  - 최고의 사용자 경험을 통해 양질의 데이터를 최대한 많이 확보하고, 게이미피케이션 요소를 도입하여 사용자 참여를 극대화합니다.

- **Phase 2: 학술적 검증 및 가치 입증**
  - 축적된 익명화 데이터를 통해 '통풍 발작과 생활 습관의 상관관계'에 대한 학술적 성과를 창출하고, 솔루션의 임상적 가치를 입증합니다.

- **Phase 3: 글로벌 상용화 및 DTx 승인**
  - 임상 시험을 통해 확보된 데이터를 바탕으로 디지털 치료제 품목 허가를 신청하고, 이를 기반으로 한 글로벌 B2C/B2B 수익 모델을 구축합니다.

---

## 🤝 기여 방법 (Contributing)

이 프로젝트에 기여하고 싶으신 분들을 언제나 환영합니다. 버그 리포트, 기능 제안 등은 GitHub Issues를 통해 제출해주시고, 코드 기여는 Pull Request를 통해 참여하실 수 있습니다.

---

## 📄 라이선스 (License)

이 프로젝트는 [MIT License](./LICENSE)에 따라 라이선스가 부여됩니다.
