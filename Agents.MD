# MoveSync - AAPEX 팀 AGENTS.md
## 🎯 프로젝트 개요 (PRD 기반)
- **목표**: 서울로봇고 등교생의 신호등 대기 시간 낭비 해결
- **MVP Must 기능**:
  1. 신호등 잔여시간 계산 (C-ITS API)
  2. GPS 위치 수집
  3. 지도에 횡단보도/신호등 마커 표시
- **Should 기능**: 신호등 즐겨찾기, 스마트 알람
- **성공 기준**: 
  - 신호등 잔여시간 오차 3초 이내
  - 평균 이동시간 10% 감소

## 🛠️ 기술 스택 (PRD 준수)
| 구분 | 기술 | 규칙 |
|------|------|------|
| Frontend | React Native | iOS/Android 크로스 빌드, 네이버맵 SDK |
| Backend | Node.js + Express | Railway 배포, C-ITS API 프록시 |
| Map | 네이버맵 API | 마커 클릭 → 잔여시간 팝업 |
| DB | (MVP 없음) | Should 단계에서 SQLite |
| 협업 | GitHub/Notion/Slack | PRD docs/PRD.pdf 참조 |

## 📋 GitHub Flow (PRD 5장 준수)

- **브랜치**: main(배포), dev(통합), feature/[기능명]
- **커밋**: `feat: 신호등 API 연동`, `fix: GPS 권한 오류`
- **PR 규칙**:
  - 제목: `[feat/fix] 한줄 요약`
  - 본문: 변경내용 / 테스트방법 / #이슈번호
  - 리뷰: 1명 필수, AI 코드도 설명 필요

## ✅ 코드 작성 규칙

✅ DO

React Native Hooks 우선 (useState, useEffect)

TypeScript 엄격 (no any)

테스트 커버리지 80% (Jest + Detox)

네이버맵 마커 클릭 → 3초 내 잔여시간 표시

❌ DON'T

console.log (로깅은 Sentry)

직접 GPS 호출 (useGeolocation 훅)

200줄 이상 파일

API 키 하드코딩 (.env)


## 🧪 테스트 & 검증 (하네스 핵심)

npm test # 단위 (80% 커버리지)
npm run e2e # Detox E2E (신호등 클릭 → 시간 표시)
npm run lint # ESLint + Prettier


- **실패 시**: 자동 롤백, PR 재오픈
- **성공 기준**: 오차 3초 이내 (C-ITS API)

## 🔄 스킬 체인 (Codex 워크플로우)

create-plan → MVP 기능 분해

react-expert → RN 컴포넌트 작성

api-design-expert → C-ITS 엔드포인트

playwright-interactive → E2E 검증

gh-address-comments → PR 수정


## 📅 스프린트 (PRD 6장)

Sprint 1 (3주): API 연동 (유준영)
Sprint 2 (6주): UI + 지도 (한승민)
Sprint 3 (9주): 알람 + 발표 (최민욱)
데일리: Slack "어제/오늘/블로커"


