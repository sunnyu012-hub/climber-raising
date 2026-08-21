# 아키텍처

## 1. 기술 구성과 선택 근거
| 항목 | 선택 | 근거 |
|---|---|---|
| 번들러 | **Vite 5** | 이 게임은 100% 클라이언트 상태 게임이다. 서버 렌더링이 필요 없고, localStorage 기반 오프라인 진행과 SSR 하이드레이션이 충돌한다. 형제 프로젝트(`../yuring-shop`)도 동일 구성이라 도구가 이미 검증됨. GitHub Pages 정적 배포 가능. |
| UI | React 18 + TypeScript(strict) | |
| 상태 | zustand | Redux 보일러플레이트 없이 단일 스토어 + 액션 |
| 스타일 | 순수 CSS 변수 (`src/styles.css`) | 도트 UI는 유틸리티 클래스보다 픽셀 테두리/그림자 토큰이 맞다. Tailwind 미도입 |
| 테스트 | Vitest | 게임 로직은 순수 함수라 DOM 렌더 테스트가 거의 불필요 |
| 검증 | 수동 타입가드 (`store/migrate.ts`) | 세이브 1종만 파싱하므로 Zod 미도입 |

> 원 요청은 Next.js/Tailwind/Zod였다. 위 사유로 Vite/CSS/타입가드로 대체했다.
> 되돌리려면: 게임 레이어(`src/game`, `src/content`)는 프레임워크 비의존이라 그대로 이식 가능하다.

## 2. 폴더 구조
```
src/
  game/        ← 순수 게임 로직 (React 의존 0). 여기가 진짜 게임이다.
    types.ts       도메인 타입 전체
    balance.ts     밸런스 상수 단일 출처
    rng.ts         주입 가능한 시드 RNG (mulberry32)
    clock.ts       now() — 나중에 서버 시간으로 교체할 지점
    character.ts   파생 스탯, 관절 단계, 숙련도 곡선, 경고
    characterGen.ts 캐릭터 랜덤 생성 (외형·체형·주특기·성격·고정총합 능력치) — 전부 순수 함수
    climb.ts       등반 한 동작 판정 (핵심)
    progress.ts    일정 진행 / 오프라인 계산 / 시간 단축
    newGame.ts     게스트 클라이머 초기 상태
  content/     ← 데이터. 코드 수정 없이 콘텐츠를 늘리는 곳
    gyms.ts problems.ts activities.ts skills.ts npcs.ts moves.ts
    nicknames.ts appearance.ts traits.ts   ← 캐릭터 생성용 풀(닉네임/팔레트/주특기·성격·체형)
  store/       ← zustand + 저장 어댑터
    gameStore.ts localAdapter.ts supabaseAdapter.ts storage.ts migrate.ts
  ui/          ← 화면. 계산 금지, 표시만.
```

## 3. 데이터 흐름
```
content/*  (정적 데이터)
    ↓
game/*     (순수 함수: state + content + rng → 새 state + 로그)
    ↓
store/gameStore  (액션이 순수 함수를 호출하고 결과를 커밋)
    ↓  구독
ui/*       (표시 + 액션 호출만)
    ↓  persist(debounce)
store/storage → localAdapter | supabaseAdapter
```
**단방향이다.** UI가 game을 건너뛰고 state를 직접 수정하지 않는다.

## 4. 상태 관리
- 단일 `GameState` 객체 (`src/game/types.ts`).
- 액션은 `gameStore.ts`에만. 각 액션은 `game/*`의 순수 함수를 부르고 반환값을 `set`한다.
- 틱: `useGameClock` 훅이 1초마다 `tick()` → `advanceSchedule(state, now())`.
  탭 복귀(`visibilitychange`)에서도 즉시 1회 호출 → 오프라인 리포트 생성.

## 5. 게임 로직 규칙
- `climb.ts`의 `resolveStep()`는 부수효과가 없다. `(ctx, choice, rng) → StepResult`.
- 모든 난수는 인자로 받은 `Rng`에서 나온다. 테스트는 `seededRng(42)`로 재현.
- 밸런스 상수는 `balance.ts`에서만 읽는다.

## 6. 콘텐츠 데이터
`src/content/*.ts`는 순수 배열/객체다. 문제 추가는 `problems.ts`에 객체 하나 push.
자세한 절차는 `CONTENT_GUIDE.md`.

## 7. 저장 어댑터
```ts
interface SaveAdapter {
  load(): Promise<PersistedSave | null>
  save(s: PersistedSave): Promise<void>
  clear(): Promise<void>
  // 온보딩 임시 상태 — 본 세이브와 완전히 분리된 슬롯
  loadDraft(): Promise<OnboardingDraft | null>
  saveDraft(d: OnboardingDraft): Promise<void>
  clearDraft(): Promise<void>
  serverNow(): Promise<number>   // 로컬은 Date.now(), 서버는 DB 시각
}
```
- 기본: `localAdapter` (localStorage, 키 `climber.save.v1` / 온보딩 `climber.onboarding.v1`)
- 준비: `supabaseAdapter` — 타입/쿼리 형태만 작성. env가 없으면 `null`을 반환하고 로컬로 폴백.
- 세이브 버전: `SAVE_VERSION` (현재 **3**). 낮은 버전은 `migrate.ts`가 기본값과 병합해 복구한다.
  **기존 진행은 절대 버리지 않는다.**

### 온보딩 상태 분리
```
신규 사용자        세이브 없음 → draft 생성 → 3단계 진행(임시 슬롯에만 저장)
                  → 최종 확인 → 이때 처음으로 본 세이브 생성 → draft 삭제
기존 사용자        세이브 있음 + onboardingCompleted → 온보딩을 건너뛰고 바로 홈
다시 만들기        더보기에서 draft 생성 → 최종 단계에서 3택
                  (외형만 변경 / 전체 초기화 / 취소) — 취소해도 세이브 그대로
```

### v1/v2 → v3 마이그레이션
| 필드 | 처리 |
|---|---|
| `onboardingCompleted` | `true` — 기존 사용자에게 온보딩을 강제하지 않는다 |
| `gender` / `age` | `'unset'` / `null` — **임의로 확정하지 않는다.** 더보기에서 보완 |
| `gymId` | 옛 id → `waverock-seomyeon` (`migrateGymId()`) |
| `look` → `appearance` | 그대로 옮기고 빠진 색(암벽화·초크백)은 기본값으로 채운다 |
| 레벨·돈·능력치·스킬·일정·업적·기록 | **전부 그대로** |

## 8. Supabase 연결 구조
- `supabase/migrations/0001_init.sql` — 테이블 + RLS 정책 + 서버 시간 함수
- `.env.example` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- 로그인 없으면 "게스트 클라이머" 데모로 실행된다(기능 제한 없음, 저장만 로컬).

## 9. 보안 원칙
- anon key만 브라우저에 노출. **service_role 키는 절대 클라이언트에 두지 않는다.**
- 모든 테이블 RLS: `auth.uid() = user_id`.
- 오프라인 진행 시각은 서버 함수 `public.server_now()` 기준으로 전환한다(로컬 시간 조작 방지).
- 랭킹 점수와 완등 판정은 서버 함수로 재계산한다. 클라이언트 제출 수치를 신뢰하지 않는다.
- 서버 전환 지점은 코드에 `// SERVER-AUTHORITY` 주석으로 표시되어 있다.
