# 클라이머 키우기 🧗

부산의 초보 클라이머가 훈련·휴식·재활·알바·크루 활동을 반복하며 성장하는
**모바일 우선 2D 도트 방치형 클라이밍 육성 게임**의 첫 MVP.

- 타이밍 입력 없음 — 등반은 포켓몬 전투처럼 상황을 읽고 베타를 고르는 턴제
- 접속하지 않아도 주간 일정이 진행되고, 접속하면 일정이 앞당겨진다
- 에셋은 전부 코드로 생성한 도트 (외부 이미지 0개)

## 실행

```bash
cd climber-raising
npm install
npm run dev
```

브라우저에서 http://localhost:8950 접속.

**모바일 확인 방법** — 개발자 도구(F12) → 기기 툴바(Ctrl+Shift+M) → iPhone 15 Pro(390×844).
같은 와이파이의 실제 폰에서 보려면 `npm run dev -- --host` 로 실행한 뒤 표시되는 Network 주소로 접속.

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (포트 8950) |
| `npm run test` | 게임 로직 단위 테스트 (vitest) |
| `npm run typecheck` | 타입 검사 |
| `npm run build` | 타입 검사 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |

## 폴더

```
src/game/     순수 게임 로직 (React 의존 없음) — 판정·진행·밸런스·RNG
src/content/  콘텐츠 데이터 — 암장 / 문제 / 활동 / 스킬 / NPC / 무브
src/store/    zustand 스토어 + 저장 어댑터(local / supabase)
src/ui/       화면. 계산 없음, 표시만
supabase/     SQL 마이그레이션 (RLS 포함)
docs/         기획·아키텍처·밸런스·콘텐츠 가이드
```

## 문서

- [`CLAUDE.md`](CLAUDE.md) — **작업 규칙 (먼저 읽을 것)**
- [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) — 게임 기획
- [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md) — 이번 MVP 범위와 제외 항목
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 기술 구조와 기술 선택 근거
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — 구현 체크리스트 (현재 상태)
- [`docs/BALANCE.md`](docs/BALANCE.md) — 밸런스 수치와 의미
- [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) — **코드 수정 없이 콘텐츠 추가하는 법**
- [`docs/WORLD_PROGRESSION.md`](docs/WORLD_PROGRESSION.md) — 지역 계층 · 해금 조건 · 진행 흐름
- [`docs/SERVER_AUTHORITY.md`](docs/SERVER_AUTHORITY.md) — 서버가 맡아야 할 계산과 전환 지점
- [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) — 테스트 작성 규칙 · 모바일 검수 기준
- [`ASSET_MANIFEST.md`](ASSET_MANIFEST.md) — 에셋 목록과 출처

## 콘텐츠 추가

문제·암장·활동·스킬·NPC는 전부 `src/content/*.ts` 데이터다.
암장 이름을 바꾸려면 `src/content/gyms.ts`의 `displayName`만 고친다(`id`는 유지).
자세한 절차는 [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md).

## 저장 / Supabase

기본은 **로컬 데모 모드**(게스트 클라이머). 진행은 브라우저 localStorage에 저장된다.

Supabase를 붙이려면:

```bash
cp .env.example .env      # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 채우기
npm i @supabase/supabase-js
# supabase/migrations/0001_init.sql 적용
```

`.env`가 없으면 `createSupabaseAdapter()`가 `null`을 반환하고 자동으로 로컬 모드로 동작한다.
서버로 옮겨야 할 계산 지점은 코드에 `// SERVER-AUTHORITY` 주석으로 표시되어 있다.

## 캐릭터 만들기

처음 실행하면 **3단계 온보딩**이 먼저 뜬다 (1~2분).
```
1 기본 정보(닉네임·성별·나이) → 2 랜덤 캐릭터 확인/다시 뽑기 → 3 시작 암장 → 최종 확인
```
시작 암장은 **부산 웨이브락 서면점 / 남천점 / 부산대점** 중 하나.
세 지점은 능력치·보상이 같고 분위기와 색만 다르다.

**공정성** — 모든 캐릭터의 시작 능력치 총합이 동일하다.
성별과 나이는 능력치에 전혀 영향을 주지 않는다(표시와 문구에만 사용).

기존 사용자는 온보딩을 다시 보지 않는다. 더보기 탭에서
`캐릭터 기본 정보 설정`(성별·나이·지점 보완)과 `캐릭터 생성 화면 미리보기`를 쓸 수 있다.

## 시스템 지도

| 시스템 | 상태 |
|---|---|
| 캐릭터 생성 · 주간 일정 · 방치 진행 · 등반 · 성장 | ✅ 작동 |
| 장비/인벤토리 · 상점 · 퀘스트 · 업적/칭호 · 도감 | ✅ 작동 |
| 월드맵/지역 해금 · 암장 이동 · 원정 · 미니대회 · 기록 | ✅ 작동 |
| 알바 커리어 · NPC 관계 · 부상/회복 · 개발자 도구 | ✅ 작동 |
| 크루 · 랭킹 순위 · 시즌 | 🔌 서버 연결 필요 (화면은 있고 정직하게 표시) |
| 전국·해외 지역 | 🚧 해금 조건만 표시 |

**진행 판정은 전부 이벤트로 한다.** 퀘스트를 수동으로 수락하거나 제출하는 화면이 없다 —
실제로 한 행동(`GameEvent`)만 보고 퀘스트·업적·도감·기록이 스스로 갱신된다.
이 구조가 곧 서버 전환 지점이다 → [`docs/SERVER_AUTHORITY.md`](docs/SERVER_AUTHORITY.md)

## 대표 플레이 흐름

```
캐릭터 생성 → 홈짐 선택 → 일정 편성 → 등반 → 퀘스트 보상
→ 알바로 돈 → 장비 구매·착용(판정 반영) → 다른 지점 방문
→ 부산 원정 → 미니대회 → 기록·도감
```

## 현재 상태

✅ 테스트 134개 통과 · 빌드 330KB(gzip 103KB) · 이미지 파일 0개

✅ 3단계 캐릭터 생성 · 웨이브락 3지점 · 주간 일정 편성 · 실시간 자동 진행 ·
오프라인 리포트 · 볼더링 문제 5개 · 턴제 베타 선택 · 4단계 판정 · 무브 숙련도 ·
스킬 12종 · 주특기 8종 · 성격 8종 · 알바 3종 · NPC 3명 · 부상 5단계 ·
도트 캐릭터(포즈 15 · 머리 6 · 팔레트 조합) · 로컬 저장

🚧 준비 중 — 랭킹 · 크루 · 원정 · 장비 · 계정 연동 · 지점별 벽 성향
