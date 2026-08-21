# 콘텐츠 추가 가이드

**규칙: 아래 작업은 전부 `src/content/` 안에서만 끝나야 한다.**
`src/game/`이나 `src/ui/`를 고쳐야 한다면 그건 콘텐츠가 아니라 새 시스템이다.

---

## 1. 암장 이름 바꾸기 (실서비스 대비)
`src/content/gyms.ts`의 `displayName` / `branchName`만 고친다.
`id`는 절대 바꾸지 않는다 — 세이브가 참조한다.
```ts
{ id: 'waverock-seomyeon', displayName: '부산 웨이브락 서면점', branchName: '서면점', ... }
//                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^ 여기만 교체
```

## 2. 새 웨이브락 지점 추가
`src/content/gyms.ts`의 `GYMS` 배열에 객체 하나를 추가하면
**캐릭터 생성 3단계 선택 화면에 자동으로 나타난다.**
```ts
{
  ...COMMON,                        // regionId · brandId · wallTypes · npcIds · homeBonus
  id: 'waverock-haeundae',          // 고유 · 영구 불변
  displayName: '부산 웨이브락 해운대점',
  branchName: '해운대점',
  tagline: '게임 내 분위기 문구 (실제 시설 특성을 단정하지 말 것)',
  character: '어떤 동네인지 한 줄',
  theme: { sign: '#e8916f', wall: '#d3cdbb', accent: '#c96f4e' },  // 카드/벽 색
}
```
> ⚠️ **문구 원칙**: 확인되지 않은 실제 암장 특성(벽 각도, 세팅 스타일, 시설)을 사실처럼 쓰지 마라.
> 게임 내 분위기 문구로만 쓴다.

### 지점별 문제 연결
- `gymId`가 **브랜드 id(`waverock`)** 인 문제 = 모든 지점에 뜬다 (현재 5개 전부).
- `gymId`가 **지점 id** 인 문제 = 그 지점에만 뜬다.

지금은 세 지점의 문제가 같다. 지점 전용 문제를 넣으면 **그 지점만 유리해지므로**,
보상 균형을 어떻게 맞출지 정한 뒤에 추가하고 `docs/BALANCE.md`에 기록한다.

### 지점별 NPC 연결
`Gym.npcIds`에 NPC id를 넣는다. NPC 자체는 `src/content/npcs.ts`에 정의한다.

### 지점에 유불리를 넣고 싶어지면
`Gym.homeBonus`(`SkillEffect[]`)에 넣으면 `collectModifiers()`가 자동으로 반영한다.
**지금은 세 지점 모두 빈 배열이다** — 어느 지점을 골라도 같아야 한다는 규칙 때문이다.
바꾸려면 `onboarding.test.ts`의 "지점 간 능력치·보상 보너스가 없다" 테스트도 같이 고쳐야 한다.

## 2-1. 랜덤 닉네임 추가
`src/content/nicknames.ts`의 `NICKNAMES` 배열에 문자열 하나를 넣으면 끝이다(한글 2~10자).
성별로 나누지 않는다 — 누구에게나 아무 닉네임이나 나온다.
```ts
export const NICKNAMES: string[] = [
  '쪼꼬홀드', '말랑크림프', /* … */ '새로운닉네임',
]
```
길이 규칙을 바꾸려면 `NICKNAME_RULE`을 고친다. UI 검증과 온보딩 게이트가 같은 값을 쓴다.

## 2-2. 외형 팔레트 추가
`src/content/appearance.ts`의 배열에 hex 하나를 넣는다.
```ts
export const SHIRTS = [ '#e8916f', /* … */ '#새로운색' ] as const
```
현재 규모: 피부 5 · 머리색 8 · 머리형태 6 · 상의 10 · 하의 8 · 암벽화 8 · 초크백 8.

**머리 형태**를 늘리려면 두 곳을 같이 고친다.
1. `src/game/types.ts`의 `HairKey`에 키 추가
2. `src/ui/Sprite.tsx`의 `HAIRS` 테이블에 사각형 좌표 배열 추가
3. `src/content/appearance.ts`의 `HAIR_STYLES`에 키 추가

> 성별에 따라 팔레트를 나누지 마라. 여자에게 분홍만, 남자에게 어두운 색만 나오게 하지 않는다.

## 2-3. 주특기 · 성격 추가
`src/content/traits.ts`:
```ts
// 주특기 — stat 하나를 올리고(총합은 유지) 시작 무브 숙련도를 준다
{ id: 'slab', name: '슬랩 장인', stat: 'technique', moves: ['footswap'], intro: '한 줄 자기소개' },

// 성격 — 아주 작은 패시브 하나. 다른 성격을 압도하지 않게 크기를 맞춘다.
{ id: 'calm', name: '침착한 편', desc: '설명', effect: { kind: 'jointCost', value: 0.97 } },
```
`effect`는 스킬과 같은 `SkillEffect` 종류만 쓸 수 있다(아래 5번 표 참조).
성격을 추가하면 `characterGen.test.ts`의 "모든 성격이 판정 모디파이어를 바꾼다"가 자동으로 검증한다.

## 2-4. 캐릭터 생성 규칙 수정
숫자는 전부 `src/game/balance.ts`의 `BALANCE.creation`에 있다.
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| 시작 능력치 총합 | `creation.total` |
| 능력치 최소/최대 | `creation.min` / `max` |
| 주특기 보너스 크기 | `creation.specialtyBonus` |
| 시작 숙련도 범위 | `creation.masteryMin` / `masteryMax` |
| 시작 소지금 | `creation.startingMoney` |
| 나이 범위·기본값 | `creation.ageMin` / `ageMax` / `ageDefault` |
| 배분 알고리즘 | `src/game/characterGen.ts`의 `rollStats()` |
| 키 범위 | `src/content/traits.ts`의 `BODY_TYPES[].height` |

바꾼 뒤 `npm run test`로 공정성 테스트(총합 동일·범위 준수·성별/나이 무영향)를 반드시 확인하고
`docs/BALANCE.md`를 갱신한다.

**금지**: 성별이나 나이가 능력치에 영향을 주게 만들지 마라. 테스트가 막는다.

## 3. 새 문제 추가
`src/content/problems.ts`에 객체 하나를 추가한다. 동작은 3~5개, 베타는 2~3개.
```ts
{
  id: 'wl-006',
  gymId: 'busan-wavelock',
  name: '문제 이름',
  grade: 2,                    // 0=V0 … 숫자가 클수록 어렵다
  wall: '오버행',
  desc: '한 줄 설명',
  recommend: ['power', 'stamina'],
  reward: { exp: 90, statExp: { power: 40 } },
  steps: [
    {
      id: 's1',
      situation: '스타트 홀드가 미끄럽다.',
      line: '음… 초크부터 바르자.',     // 캐릭터 대사
      choices: [
        {
          id: 'a',
          label: '초크를 충분히 바른다',
          moves: ['chalk'],                       // 숙련도가 오를 무브
          stats: { technique: 0.6, mental: 0.4 }, // 가중치 합 1.0
          baseChance: 0.78,
          cost: { hp: 2, fatigue: 3, finger: 1 },
          luckMult: 1,
          reach: 'neutral',                       // 'far' | 'compressed' | 'neutral'
          critText: '손끝 감각이 딱 맞았다!',
          successText: '홀드가 잘 잡힌다.',
          partialText: '조금 미끄럽지만 버텼다.',
          fallText: '손이 주르륵 미끄러졌다!',
        },
      ],
    },
  ],
}
```
**필드 의미**
- `stats` — 가중 능력치. 합이 1.0이 되게 쓴다(안 맞으면 자동 정규화되지만 읽기 나빠진다).
- `baseChance` — 능력치 10 / 숙련 0 / 피로 0 기준 성공률.
- `reach` — `far`면 짧은 리치가 불리·긴 리치가 유리, `compressed`는 반대.
- `luckMult` — 무모한 베타일수록 크게(1.8~2.2). 행운 변동 폭이 곱해진다.
- `cost.finger|shoulder|knee` — 해당 관절을 깎는다. 판정 시 그 관절 상태가 성공률에도 반영된다.

### 짧은 리치 캐릭터 배려
먼 홀드(`far`) 선택지를 넣었다면 같은 동작에 `compressed` 또는 `intermediate`(중간 홀드 경유)
대체 베타를 반드시 하나 넣는다. 그래야 짧은 리치가 막히지 않는다.

## 4. 새 활동(훈련/알바) 추가
`src/content/activities.ts`:
```ts
{
  id: 'job-photo',
  name: '클라이밍 영상 촬영',
  kind: 'job',                   // 'train' | 'rest' | 'rehab' | 'job' | 'social'
  icon: '🎬',
  desc: '한 줄 설명',
  hp: -12, fatigue: +8,
  joints: { shoulder: -2 },
  statExp: { routefinding: 18, social: 12 },
  money: 45000,
  injuryRisk: 0.01,
  requires: { stats: { routefinding: 12 } },   // 선택
  allowedWhenInjured: true,                     // 부상 중에도 가능한가
  events: [ { chance: 0.2, text: '세터가 촬영본을 보고 베타를 알려줬다!', npcId: 'setter', friendship: 3 } ],
}
```
활동을 추가하면 일정 편성 화면에 자동으로 나타난다.

## 5. 새 스킬 추가
`src/content/skills.ts`. 효과는 **반드시 아래 종류 중 하나**여야 한다(가짜 스킬 금지):
| kind | 의미 |
|---|---|
| `moveChance` | 특정 무브 성공률 +값 |
| `statBonus` | 특정 능력치 +값 |
| `fatigueCost` | 등반 피로 소모 배수 (0.9 = -10%) |
| `jointCost` | 관절 소모 배수 |
| `recovery` | 하루 회복량 배수 |
| `reachComp` | 먼 홀드 리치 패널티 완화 |
| `revealChance` | 정확한 성공률 표시 |
| `injuryWarn` | 부상 위험 사전 감지 강화 |
| `wallAffinity` | 특정 벽 성향에서 +값 |
새 `kind`가 필요하면 그건 시스템 변경이다 → `src/game/climb.ts`도 같이 고치고 테스트를 추가한다.

## 6. 새 NPC 추가
`src/content/npcs.ts`:
```ts
{
  id: 'crewmate', name: '크루 동생', emoji: '🧗',
  role: '같이 다니는 크루원',
  lines: { greet: '...', high: '...', low: '...' },
  perks: [ { at: 30, kind: 'statBonus', stat: 'mental', value: 1, desc: '친밀도 30: 멘탈 +1' } ],
}
```
`perks[].at`은 친밀도 임계값이다. 도달하면 자동 적용된다.

## 7. 밸런스만 바꾸고 싶다면
`src/game/balance.ts` 한 파일. 콘텐츠 파일에 숫자를 흩뿌리지 마라.
바꾼 뒤 `npm run test`로 회귀를 확인하고 `docs/BALANCE.md`를 갱신한다.
