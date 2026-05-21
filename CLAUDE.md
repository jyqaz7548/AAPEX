# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MoveSync - AAPEX** is a zero-dependency Node.js backend API (MVP v0.1.0) that proxies Seoul's C-ITS (Cooperative Intelligent Transport System) API to serve pedestrian signal remaining-time data to a React Native mobile app.

## Commands

```bash
npm run dev        # Start with --watch (hot reload)
npm start          # Production start (port 4000)
npm test           # Run unit/integration tests
npm run test:cits  # Smoke test against live C-ITS API
npm run lint       # Check for console.log violations
```

To run a single test, edit `test/run-tests.js` or isolate by description — there is no Jest, only a custom runner using `node:assert`.

## Architecture

**Zero external dependencies** — pure Node.js ESM (`"type": "module"`) using only built-in modules (`node:http`, `node:fs`, `node:assert`, `node:url`, `node:path`).

Layers:
- `src/server.js` — creates the HTTP server and binds the port
- `src/app.js` — URL routing (regex-based), request handling, error formatting, `CitsUpstreamError` class
- `src/config.js` — loads `.env.local` at startup
- `src/services/citsClient.js` — fetches raw signal phase data from the C-ITS upstream; throws `CitsUpstreamError` on failure
- `src/services/citsNormalizer.js` — transforms raw C-ITS JSON into normalized pedestrian signal objects (centiseconds → seconds, 8 directions, marks signals >36001 cs as unavailable)
- `test/run-tests.js` — custom test runner; starts real HTTP servers on dynamic ports

**API endpoints:**
- `GET /health`
- `GET /api/cits/signals/:itstId/raw` — proxied raw upstream response
- `GET /api/cits/signals/:itstId/remaining` — normalized pedestrian signal data

## Code Rules (from Agents.MD)

- No `console.log` — use Sentry for logging
- No direct GPS calls — use `useGeolocation` hook (frontend)
- No API keys hardcoded — use `.env.local` (gitignored)
- Files must stay under 200 lines
- TypeScript strict mode (`no any`) when TypeScript is introduced
- Test coverage target: 80%

## Git & PR Conventions

Branch naming: `main` (deploy), `dev` (integration), `feature/[기능명]`

Commit format: `feat: 신호등 API 연동` / `fix: GPS 권한 오류`

PR title format: `[feat/fix] 한줄 요약`  
PR body must include: 변경내용 / 테스트방법 / #이슈번호  
1 reviewer required; AI-generated code must be explained.

## Sprint Owners

- Sprint 1 — API integration (유준영)
- Sprint 2 — UI + map (한승민)
- Sprint 3 — alarm + demo (최민욱)
