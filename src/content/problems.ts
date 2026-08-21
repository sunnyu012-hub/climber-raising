import { WAVEROCK_BRAND, getGym } from './gyms'
import type { ClimbingProblem } from '../game/types'

/**
 * 볼더링 문제 데이터. 코드를 고치지 말고 여기에 객체를 추가한다.
 * 규칙: 먼 홀드(reach: far) 선택지를 넣으면 같은 동작에
 *      compressed 또는 intermediate 대체 베타를 반드시 하나 넣는다.
 */
export const PROBLEMS: ClimbingProblem[] = [
  // =============================== 1
  {
    id: 'wl-001',
    gymId: WAVEROCK_BRAND,
    name: '발을 믿어주세요',
    grade: 0,
    wall: '슬랩',
    desc: '손홀드는 거의 없다. 발만 믿으면 되는데 그게 제일 어렵다.',
    flavor: '세터가 붙여놓은 안내판: "손에 힘 빼세요 (진심)"',
    recommend: ['technique', 'flexibility'],
    reward: { exp: 55, statExp: { technique: 40, mental: 15 } },
    firstClearBonus: { exp: 40, money: 0 },
    achievement: { id: 'ach-slab', name: '슬랩 입문', desc: '발을 믿어주세요를 완등했다' },
    steps: [
      {
        id: 's1',
        situation: '스타트 발홀드가 손톱만 하다. 벽은 미끄러워 보인다.',
        line: '이거… 밟아도 되는 거 맞죠?',
        choices: [
          {
            id: 'a', label: '체중을 발끝에 완전히 싣는다',
            moves: ['footswap'], stats: { technique: 0.7, mental: 0.3 },
            baseChance: 0.72, cost: { hp: 3, fatigue: 3, knee: 1 }, luckMult: 1, reach: 'neutral',
            critText: '발끝이 벽에 착 붙었다. 소리도 안 났다!',
            successText: '조심스럽게 올라섰다. 생각보다 잘 선다.',
            partialText: '발이 살짝 밀렸지만 손으로 버텼다.',
            fallText: '발이 쭉 미끄러지며 매트로 착지했다.',
          },
          {
            id: 'b', label: '손으로 벽을 눌러 버틴다',
            moves: ['lockoff'], stats: { power: 0.6, technique: 0.4 },
            baseChance: 0.6, cost: { hp: 6, fatigue: 7, shoulder: 2 }, luckMult: 1.2, reach: 'neutral',
            critText: '팔로 밀어붙여 억지로 올라섰다. 세터가 한숨 쉰다.',
            successText: '힘으로 해결했다. 슬랩인데 팔이 아프다.',
            partialText: '팔이 부들부들 떨린다. 겨우 멈췄다.',
            fallText: '손이 벽에서 주르륵. 엉덩이부터 떨어졌다.',
          },
        ],
      },
      {
        id: 's2',
        situation: '중간에 발을 바꿔야 다음 홀드가 닿는다.',
        line: '왼발 오른발… 아 헷갈려.',
        choices: [
          {
            id: 'a', label: '조용히 발을 바꾼다',
            moves: ['footswap'], stats: { technique: 0.8, flexibility: 0.2 },
            baseChance: 0.7, cost: { hp: 3, fatigue: 4, knee: 2 }, luckMult: 1, reach: 'neutral',
            critText: '발 바꾸는 소리조차 안 났다. 옆에서 보던 사람이 감탄한다.',
            successText: '깔끔하게 발을 바꿨다.',
            partialText: '발이 겹쳐서 잠깐 흔들렸다.',
            fallText: '두 발이 엉키면서 균형을 잃었다!',
          },
          {
            id: 'b', label: '플래깅으로 균형만 잡고 넘어간다',
            moves: ['flagging'], stats: { technique: 0.5, flexibility: 0.5 },
            baseChance: 0.66, cost: { hp: 4, fatigue: 5, knee: 2 }, luckMult: 1, reach: 'compressed',
            critText: '다리가 저절로 뒤로 뻗었다. 몸이 알아서 안다!',
            successText: '반대 다리로 균형을 잡고 그냥 지나갔다.',
            partialText: '다리를 뻗다가 몸이 벽에서 떴다.',
            fallText: '균형이 무너지며 옆으로 떨어졌다.',
          },
        ],
      },
      {
        id: 's3',
        situation: '탑 홀드까지 한 손 거리. 발이 정말 아무것도 없다.',
        line: '여기서 손 놓으면… 안 되겠지?',
        choices: [
          {
            id: 'a', label: '발에 체중을 두고 천천히 일어선다',
            moves: ['highstep'], stats: { technique: 0.5, flexibility: 0.3, mental: 0.2 },
            baseChance: 0.68, cost: { hp: 5, fatigue: 5, knee: 3 }, luckMult: 1, reach: 'compressed',
            critText: '아주 천천히, 아주 확실하게 일어섰다. 완벽하다!',
            successText: '침착하게 일어서서 탑을 잡았다.',
            partialText: '무릎이 덜덜 떨렸지만 안 떨어졌다.',
            fallText: '일어서는 순간 발이 밀렸다!',
          },
          {
            id: 'b', label: '짧게 튀어 올라 탑을 낚아챈다',
            moves: ['dyno'], stats: { power: 0.6, mental: 0.4 },
            baseChance: 0.5, cost: { hp: 8, fatigue: 9, shoulder: 4 }, luckMult: 1.8, reach: 'far',
            critText: '슬랩에서 다이노라니. 근데 잡혔다!',
            successText: '튀어 올라 탑을 잡았다. 심장이 뛴다.',
            partialText: '손끝만 스쳤다. 겨우 아래 홀드로 돌아왔다.',
            fallText: '허공을 갈랐다. 매트가 반겨준다.',
          },
        ],
      },
    ],
  },

  // =============================== 2
  {
    id: 'wl-002',
    gymId: WAVEROCK_BRAND,
    name: '리치가 원수다',
    grade: 1,
    wall: '수직',
    desc: '홀드 간격이 넓다. 키 큰 사람은 두 수, 작은 사람은 네 수로 푼다.',
    flavor: '"이거 세터 키가 몇이에요?" — 이 문제 앞에서 가장 많이 나온 말',
    recommend: ['power', 'flexibility', 'routefinding'],
    reward: { exp: 80, statExp: { power: 25, flexibility: 25, routefinding: 20 } },
    firstClearBonus: { exp: 60, money: 0 },
    achievement: { id: 'ach-reach', name: '리치 극복', desc: '리치가 원수다를 완등했다' },
    steps: [
      {
        id: 's1',
        situation: '두 번째 홀드가 멀다. 팔을 다 펴도 손끝이 살짝 모자란다.',
        line: '조금만… 조금만 더…',
        choices: [
          {
            id: 'a', label: '그냥 길게 뻗어 잡는다',
            moves: ['lockoff'], stats: { power: 0.6, technique: 0.4 },
            baseChance: 0.66, cost: { hp: 6, fatigue: 6, shoulder: 3, finger: 2 }, luckMult: 1, reach: 'far',
            critText: '어깨까지 밀어 넣어서 잡았다. 리치가 늘어난 기분!',
            successText: '간신히 손가락 두 마디가 걸렸다.',
            partialText: '손끝이 닿았다가 미끄러졌다. 다시 돌아왔다.',
            fallText: '닿지 않았다. 몸이 벽에서 떨어져 나간다.',
          },
          {
            id: 'b', label: '발을 높이 올려 몸을 붙인다',
            moves: ['highstep'], stats: { flexibility: 0.6, technique: 0.4 },
            baseChance: 0.64, cost: { hp: 6, fatigue: 6, knee: 4 }, luckMult: 1, reach: 'compressed',
            critText: '발이 허리 높이까지 올라갔다. 홀드가 갑자기 가까워 보인다!',
            successText: '몸을 밀어 올려 여유롭게 잡았다.',
            partialText: '고관절이 안 열려서 어정쩡하게 멈췄다.',
            fallText: '무릎이 벽을 밀어내면서 몸이 뒤로 넘어갔다!',
          },
          {
            id: 'c', label: '왼쪽 작은 홀드를 경유한다',
            moves: ['intermediate'], stats: { routefinding: 0.6, technique: 0.4 },
            baseChance: 0.6, cost: { hp: 5, fatigue: 5, finger: 3 }, luckMult: 1, reach: 'neutral',
            critText: '아무도 안 쓰던 중간 홀드를 찾아냈다. 이게 정답이었다!',
            successText: '중간 홀드를 거쳐 안전하게 넘어갔다.',
            partialText: '중간 홀드가 생각보다 나쁘다. 잠깐 버텼다.',
            fallText: '중간 홀드가 손에서 돌아갔다.',
          },
        ],
      },
      {
        id: 's2',
        situation: '몸이 벽에서 뜬다. 발을 어디에 두느냐가 전부다.',
        line: '발… 발이 문제야.',
        choices: [
          {
            id: 'a', label: '반대 다리를 뒤로 뻗어 붙인다',
            moves: ['flagging'], stats: { technique: 0.6, flexibility: 0.4 },
            baseChance: 0.7, cost: { hp: 4, fatigue: 5, knee: 2 }, luckMult: 1, reach: 'compressed',
            critText: '몸이 벽에 착 붙었다. 힘이 하나도 안 든다!',
            successText: '플래깅으로 몸을 눌렀다. 편해졌다.',
            partialText: '다리 위치가 애매해서 살짝 흔들린다.',
            fallText: '몸이 문짝처럼 열리며 떨어졌다.',
          },
          {
            id: 'b', label: '팔로 버티면서 그냥 간다',
            moves: ['lockoff'], stats: { power: 0.8, stamina: 0.2 },
            baseChance: 0.6, cost: { hp: 9, fatigue: 11, shoulder: 5 }, luckMult: 1, reach: 'neutral',
            critText: '팔이 아직 살아있다. 그대로 밀어붙였다!',
            successText: '힘으로 버티고 넘어갔다. 팔은 좀 무겁다.',
            partialText: '팔이 펌핑됐다. 털면서 버텼다.',
            fallText: '팔이 먼저 포기했다.',
          },
        ],
      },
      {
        id: 's3',
        situation: '마지막 홀드가 너무 멀다!',
        line: '아 진짜 세터님…',
        choices: [
          {
            id: 'a', label: '하이스텝으로 올라간다',
            moves: ['highstep'], stats: { flexibility: 0.7, technique: 0.3 },
            baseChance: 0.62, cost: { hp: 7, fatigue: 7, knee: 5 }, luckMult: 1, reach: 'compressed',
            critText: '다리를 쭉 올렸다! 유연성이 효과를 발휘했다!',
            successText: '발을 올리고 일어서니 손이 닿았다.',
            partialText: '엉덩이가 안 올라간다. 한 번 더 시도해야 한다.',
            fallText: '무게중심이 못 넘어가고 뒤로 밀렸다!',
          },
          {
            id: 'b', label: '중간 홀드를 경유한다',
            moves: ['intermediate'], stats: { routefinding: 0.5, technique: 0.5 },
            baseChance: 0.58, cost: { hp: 6, fatigue: 6, finger: 4 }, luckMult: 1, reach: 'neutral',
            critText: '나쁜 홀드를 아주 잠깐만 썼다. 완벽한 판단!',
            successText: '중간을 한 번 거쳐서 마지막을 잡았다.',
            partialText: '중간 홀드에 오래 머물렀다. 손가락이 아프다.',
            fallText: '중간 홀드에서 손이 벗겨졌다.',
          },
          {
            id: 'c', label: '과감하게 다이노한다',
            moves: ['dyno'], stats: { power: 0.6, mental: 0.4 },
            baseChance: 0.48, cost: { hp: 10, fatigue: 12, shoulder: 6 }, luckMult: 2.0, reach: 'far',
            critText: '몸이 날았다. 그리고 붙었다. 암장이 조용해졌다!',
            successText: '던져서 잡았다! 손바닥이 얼얼하다.',
            partialText: '손이 걸렸는데 몸이 흔들려서 내려왔다.',
            fallText: '멋있게 날았고 멋있게 떨어졌다.',
          },
        ],
      },
      {
        id: 's4',
        situation: '탑 홀드를 두 손으로 잡고 3초 버티면 완등이다.',
        line: '됐다… 됐지? 됐어!',
        choices: [
          {
            id: 'a', label: '두 손으로 확실히 잡는다',
            moves: ['lockoff'], stats: { power: 0.5, mental: 0.5 },
            baseChance: 0.8, cost: { hp: 4, fatigue: 4, finger: 2 }, luckMult: 1, reach: 'neutral',
            critText: '두 손 다 완벽하게 걸렸다. 완등!',
            successText: '탑을 잡고 버텼다. 완등이다!',
            partialText: '한 손만 걸린 채로 흔들린다.',
            fallText: '마지막에 손이 미끄러졌다. 제일 아까운 실패다.',
          },
        ],
      },
    ],
  },

  // =============================== 3
  {
    id: 'wl-003',
    gymId: WAVEROCK_BRAND,
    name: '팔이 먼저 퇴근했습니다',
    grade: 2,
    wall: '오버행',
    desc: '길고 지루한 오버행. 어려운 무브는 없는데 끝까지 가는 사람이 없다.',
    flavor: '이 문제를 완등한 사람들은 하나같이 "쉬는 자리를 찾았다"고 말한다.',
    recommend: ['stamina', 'power'],
    reward: { exp: 110, statExp: { stamina: 45, power: 25, mental: 15 } },
    firstClearBonus: { exp: 80, money: 0 },
    achievement: { id: 'ach-pump', name: '펌핑 극복', desc: '팔이 먼저 퇴근했습니다를 완등했다' },
    steps: [
      {
        id: 's1',
        situation: '스타트부터 발이 뜬다. 초반에 힘을 얼마나 아끼느냐가 전부다.',
        line: '천천히… 천천히 가자.',
        choices: [
          {
            id: 'a', label: '발을 먼저 올려 몸을 붙인다',
            moves: ['footswap'], stats: { technique: 0.6, stamina: 0.4 },
            baseChance: 0.72, cost: { hp: 5, fatigue: 5, knee: 2 }, luckMult: 1, reach: 'neutral',
            critText: '발이 먼저 올라가니 팔이 편하다. 이게 오버행이지!',
            successText: '몸을 벽에 붙이고 출발했다.',
            partialText: '발이 늦게 올라와서 팔로 좀 버텼다.',
            fallText: '몸이 열리면서 그대로 매달렸다가 떨어졌다.',
          },
          {
            id: 'b', label: '빠르게 두 수 당겨서 지나간다',
            moves: ['lockoff'], stats: { power: 0.7, stamina: 0.3 },
            baseChance: 0.68, cost: { hp: 10, fatigue: 12, shoulder: 5 }, luckMult: 1, reach: 'neutral',
            critText: '순식간에 두 수를 먹었다. 아직 팔은 쌩쌩하다!',
            successText: '힘으로 빠르게 통과했다.',
            partialText: '생각보다 힘이 많이 들었다.',
            fallText: '초반부터 팔이 터졌다.',
          },
        ],
      },
      {
        id: 's2',
        situation: '팔이 슬슬 무거워진다. 큰 홀드가 하나 보인다.',
        line: '여기서 쉴 수 있을 것 같은데…',
        choices: [
          {
            id: 'a', label: '한 손씩 털면서 회복한다',
            moves: ['rest'], stats: { stamina: 0.6, routefinding: 0.4 },
            baseChance: 0.76, cost: { hp: -6, fatigue: -8, shoulder: 1 }, luckMult: 1, reach: 'neutral',
            critText: '완벽한 레스트 자세를 찾았다. 팔이 살아난다!',
            successText: '한 손씩 털었다. 좀 살 것 같다.',
            partialText: '자세가 애매해서 별로 안 쉬어졌다.',
            fallText: '털다가 남은 손이 미끄러졌다!',
          },
          {
            id: 'b', label: '쉬지 않고 밀어붙인다',
            moves: ['lockoff'], stats: { power: 0.5, mental: 0.5 },
            baseChance: 0.62, cost: { hp: 9, fatigue: 11, shoulder: 4 }, luckMult: 1.2, reach: 'neutral',
            critText: '기세가 붙었다. 그냥 뚫고 간다!',
            successText: '쉬지 않고 통과했다. 대신 팔이 무겁다.',
            partialText: '중간에 멈췄다. 어정쩡하게 매달려 있다.',
            fallText: '팔이 완전히 터져버렸다.',
          },
        ],
      },
      {
        id: 's3',
        situation: '가장 나쁜 홀드 구간. 손가락 두 마디만 걸린다.',
        line: '이거 잡는 거 맞아…?',
        choices: [
          {
            id: 'a', label: '초크를 바르고 정확히 잡는다',
            moves: ['chalk'], stats: { technique: 0.5, mental: 0.5 },
            baseChance: 0.66, cost: { hp: 6, fatigue: 6, finger: 5 }, luckMult: 1, reach: 'neutral',
            critText: '손끝 감각이 살아났다. 딱 맞는 지점을 잡았다!',
            successText: '초크를 바르고 확실하게 걸었다.',
            partialText: '손가락이 아프다. 겨우 붙어 있다.',
            fallText: '손가락이 펴지면서 홀드에서 벗겨졌다.',
          },
          {
            id: 'b', label: '힐 훅으로 무게를 나눈다',
            moves: ['heelhook'], stats: { flexibility: 0.6, power: 0.4 },
            baseChance: 0.6, cost: { hp: 7, fatigue: 6, knee: 5 }, luckMult: 1, reach: 'compressed',
            critText: '힐이 완벽하게 걸렸다. 손이 갑자기 편해졌다!',
            successText: '힐로 무게를 나눠서 버텼다.',
            partialText: '힐이 살짝 미끄러졌다. 손으로 만회했다.',
            fallText: '힐이 빠지면서 몸이 뒤집혔다!',
          },
        ],
      },
      {
        id: 's4',
        situation: '마지막 구간. 팔에 감각이 거의 없다.',
        line: '팔… 어디 갔어…?',
        choices: [
          {
            id: 'a', label: '남은 힘을 한 번에 쓴다',
            moves: ['lockoff'], stats: { power: 0.5, mental: 0.5 },
            baseChance: 0.6, cost: { hp: 12, fatigue: 14, shoulder: 6 }, luckMult: 1.2, reach: 'neutral',
            critText: '없던 힘이 나왔다. 사람은 이래서 무섭다!',
            successText: '마지막 힘을 짜냈다.',
            partialText: '팔이 안 접힌다. 매달린 채로 버틴다.',
            fallText: '팔이 그대로 펴지면서 떨어졌다.',
          },
          {
            id: 'b', label: '발로 밀어서 팔을 아낀다',
            moves: ['highstep'], stats: { technique: 0.5, flexibility: 0.5 },
            baseChance: 0.64, cost: { hp: 7, fatigue: 7, knee: 5 }, luckMult: 1, reach: 'compressed',
            critText: '발로 다 밀었다. 팔은 거의 안 썼다. 교과서다!',
            successText: '발을 써서 팔 부담을 줄였다.',
            partialText: '발이 조금 낮았다. 팔이 또 일했다.',
            fallText: '발이 밀리면서 팔에 전부 실렸고, 팔은 이미 퇴근했다.',
          },
        ],
      },
      {
        id: 's5',
        situation: '탑까지 한 수. 여기서 떨어지면 진짜 아깝다.',
        line: '제발… 제발…!',
        choices: [
          {
            id: 'a', label: '침착하게 탑을 잡는다',
            moves: ['lockoff'], stats: { mental: 0.6, stamina: 0.4 },
            baseChance: 0.7, cost: { hp: 6, fatigue: 6, finger: 3 }, luckMult: 1, reach: 'neutral',
            critText: '떨리는 손으로도 정확히 잡았다. 완등!',
            successText: '탑을 잡았다. 완등이다!',
            partialText: '손이 걸렸다가 밀렸다. 아직 안 끝났다.',
            fallText: '마지막 한 수에서 놓쳤다. 다음엔 된다.',
          },
        ],
      },
    ],
  },

  // =============================== 4
  {
    id: 'wl-004',
    gymId: WAVEROCK_BRAND,
    name: '세터님 잠깐만요',
    grade: 2,
    wall: '수직',
    desc: '스타트 자세부터 이상하다. 답을 찾으면 쉽고, 못 찾으면 영원히 못 푼다.',
    flavor: '세터는 이 문제 앞을 지나갈 때마다 웃는다. 물어보면 대답은 안 해준다.',
    recommend: ['routefinding', 'luck'],
    reward: { exp: 105, statExp: { routefinding: 45, technique: 20, luck: 10 } },
    firstClearBonus: { exp: 75, money: 0 },
    achievement: { id: 'ach-weird', name: '해독 완료', desc: '세터님 잠깐만요를 완등했다' },
    steps: [
      {
        id: 's1',
        situation: '스타트 홀드 두 개가 서로 반대 방향을 보고 있다.',
        line: '이걸… 어떻게 동시에 잡지?',
        choices: [
          {
            id: 'a', label: '몸을 비틀어 두 홀드를 마주 당긴다',
            moves: ['lockoff'], stats: { routefinding: 0.5, power: 0.5 },
            baseChance: 0.62, cost: { hp: 6, fatigue: 7, shoulder: 4 }, luckMult: 1, reach: 'compressed',
            critText: '몸을 비트니 두 홀드가 서로를 잡아준다. 이게 의도였구나!',
            successText: '압축해서 두 홀드를 동시에 눌렀다.',
            partialText: '자세가 안 나온다. 한 손만 겨우 걸렸다.',
            fallText: '몸이 돌아가면서 그대로 매트행.',
          },
          {
            id: 'b', label: '일단 한 손만 잡고 발부터 올린다',
            moves: ['footswap'], stats: { routefinding: 0.6, technique: 0.4 },
            baseChance: 0.58, cost: { hp: 5, fatigue: 5, knee: 3 }, luckMult: 1.3, reach: 'neutral',
            critText: '발을 먼저 올리니 나머지가 저절로 풀렸다!',
            successText: '순서를 바꿨더니 됐다.',
            partialText: '발이 애매한 데 올라갔다. 다시 정리해야 한다.',
            fallText: '한 손으로는 못 버텼다.',
          },
          {
            id: 'c', label: '이상해 보이지만 등을 벽에 대본다',
            moves: ['rest'], stats: { routefinding: 0.4, luck: 0.4, mental: 0.2 },
            baseChance: 0.5, cost: { hp: 5, fatigue: 4, shoulder: 2 }, luckMult: 2.0, reach: 'neutral',
            critText: '설마 했는데 이게 정답이었다. 세터가 박수를 친다!',
            successText: '어정쩡한데 되긴 됐다.',
            partialText: '아무 일도 안 일어났다. 그냥 벽에 기대 있는 사람이 됐다.',
            fallText: '등이 미끄러지면서 앉은 채로 내려왔다.',
          },
        ],
      },
      {
        id: 's2',
        situation: '다음 홀드가 세 개 보이는데 두 개는 함정 같다.',
        line: '어느 거지… 어느 거야…',
        choices: [
          {
            id: 'a', label: '홀드 방향을 읽고 고른다',
            moves: ['intermediate'], stats: { routefinding: 0.8, technique: 0.2 },
            baseChance: 0.68, cost: { hp: 5, fatigue: 5, finger: 3 }, luckMult: 1, reach: 'neutral',
            critText: '홀드가 향한 방향을 보고 한 번에 골랐다. 정확하다!',
            successText: '읽은 대로 골랐고 맞았다.',
            partialText: '반쯤 맞았다. 자세가 꼬였다.',
            fallText: '함정 홀드였다. 손이 그대로 돌아갔다.',
          },
          {
            id: 'b', label: '제일 커 보이는 걸 잡는다',
            moves: ['lockoff'], stats: { luck: 0.6, power: 0.4 },
            baseChance: 0.5, cost: { hp: 6, fatigue: 7, finger: 4 }, luckMult: 1.8, reach: 'neutral',
            critText: '큰 게 정답이었다. 가끔은 단순한 게 맞다!',
            successText: '운 좋게 맞았다.',
            partialText: '큰데 나쁘다. 세상은 원래 그렇다.',
            fallText: '제일 큰 홀드가 제일 나쁜 홀드였다.',
          },
        ],
      },
      {
        id: 's3',
        situation: '몸이 거꾸로 돌아가는 구간. 여기가 이 문제의 핵심이다.',
        line: '지금 내 오른손이… 왼쪽에 있네?',
        choices: [
          {
            id: 'a', label: '플래깅으로 회전을 막는다',
            moves: ['flagging'], stats: { technique: 0.6, flexibility: 0.4 },
            baseChance: 0.64, cost: { hp: 6, fatigue: 6, knee: 3 }, luckMult: 1, reach: 'compressed',
            critText: '다리 하나로 회전을 딱 잡았다. 아름답다!',
            successText: '플래깅으로 몸을 고정했다.',
            partialText: '조금 돌았지만 버텼다.',
            fallText: '몸이 팽이처럼 돌면서 떨어졌다.',
          },
          {
            id: 'b', label: '차라리 완전히 돌아버린다',
            moves: ['heelhook'], stats: { flexibility: 0.5, mental: 0.3, luck: 0.2 },
            baseChance: 0.55, cost: { hp: 8, fatigue: 8, knee: 5 }, luckMult: 1.6, reach: 'compressed',
            critText: '돌아버렸더니 오히려 자세가 편해졌다. 이게 베타였다!',
            successText: '반대로 돌아서 넘어갔다.',
            partialText: '반쯤 돌다가 멈췄다. 어색하다.',
            fallText: '돌다가 손이 다 풀렸다.',
          },
        ],
      },
      {
        id: 's4',
        situation: '마지막은 의외로 평범하다. 그냥 잡고 올라가면 된다.',
        line: '어? 이건 그냥 잡으면 되네?',
        choices: [
          {
            id: 'a', label: '평범하게 올라간다',
            moves: ['highstep'], stats: { technique: 0.5, mental: 0.5 },
            baseChance: 0.78, cost: { hp: 4, fatigue: 4, knee: 2 }, luckMult: 1, reach: 'neutral',
            critText: '허무할 만큼 쉽게 끝났다. 완등!',
            successText: '마지막을 정리하고 완등했다.',
            partialText: '방심해서 한 번 미끄러졌다.',
            fallText: '다 와서 방심했다. 제일 억울한 추락이다.',
          },
        ],
      },
    ],
  },

  // =============================== 5
  {
    id: 'wl-005',
    gymId: WAVEROCK_BRAND,
    isProject: true,
    holds: ['슬로퍼', '핀치', '볼륨'],
    name: '힐은 배신하지 않아',
    grade: 3,
    wall: '오버행',
    desc: '처음부터 끝까지 힐 훅. 뒤꿈치를 못 믿으면 한 수도 못 간다.',
    flavor: '"힐은 배신하지 않아요" — 은서 님. 그날 은서 님은 힐이 빠져서 떨어졌다.',
    recommend: ['flexibility', 'power'],
    reward: { exp: 140, statExp: { flexibility: 50, power: 25, technique: 20 } },
    firstClearBonus: { exp: 100, money: 0 },
    achievement: { id: 'ach-heel', name: '힐 마스터', desc: '힐은 배신하지 않아를 완등했다' },
    steps: [
      {
        id: 's1',
        situation: '스타트부터 발을 머리 높이에 걸어야 한다.',
        line: '여기에… 발을요…?',
        choices: [
          {
            id: 'a', label: '힐을 걸고 당긴다',
            moves: ['heelhook'], stats: { flexibility: 0.6, power: 0.4 },
            baseChance: 0.6, cost: { hp: 7, fatigue: 7, knee: 6 }, luckMult: 1, reach: 'compressed',
            critText: '힐이 홀드에 딱 걸렸다. 몸이 스르륵 올라간다!',
            successText: '힐을 걸고 당겨서 올라섰다.',
            partialText: '힐이 얕게 걸렸다. 무릎이 아프다.',
            fallText: '힐이 빠지면서 거꾸로 매달렸다가 떨어졌다.',
          },
          {
            id: 'b', label: '토 훅으로 대신한다',
            moves: ['flagging'], stats: { technique: 0.5, flexibility: 0.5 },
            baseChance: 0.55, cost: { hp: 7, fatigue: 8, knee: 4 }, luckMult: 1.2, reach: 'neutral',
            critText: '발등을 걸었더니 오히려 안정적이다!',
            successText: '토 훅으로 버텼다.',
            partialText: '발등이 아프다. 오래는 못 버틴다.',
            fallText: '발이 스르륵 빠졌다.',
          },
        ],
      },
      {
        id: 's2',
        situation: '힐을 건 채로 손을 옮겨야 한다. 다리에 쥐가 날 것 같다.',
        line: '다리… 다리 좀…',
        choices: [
          {
            id: 'a', label: '힐에 체중을 싣고 손을 뗀다',
            moves: ['heelhook'], stats: { flexibility: 0.5, mental: 0.5 },
            baseChance: 0.62, cost: { hp: 6, fatigue: 6, knee: 6 }, luckMult: 1, reach: 'compressed',
            critText: '힐 하나로 온몸을 지탱했다. 무섭도록 안정적이다!',
            successText: '힐을 믿고 손을 옮겼다.',
            partialText: '무릎이 떨린다. 서둘러 손을 다시 잡았다.',
            fallText: '힐이 배신했다. 은서 님 말은 틀렸다.',
          },
          {
            id: 'b', label: '손 힘으로 버티며 빠르게 옮긴다',
            moves: ['lockoff'], stats: { power: 0.7, stamina: 0.3 },
            baseChance: 0.58, cost: { hp: 11, fatigue: 13, shoulder: 6 }, luckMult: 1, reach: 'neutral',
            critText: '순식간에 손을 옮겼다. 힐은 장식이었다!',
            successText: '팔로 버티고 손을 옮겼다.',
            partialText: '팔이 터졌다. 겨우 붙어 있다.',
            fallText: '팔이 먼저 나갔다.',
          },
        ],
      },
      {
        id: 's3',
        situation: '루프 구간. 완전히 천장에 매달린 상태다.',
        line: '지금 나 천장에 붙어 있어…!',
        choices: [
          {
            id: 'a', label: '양쪽 힐로 몸을 고정한다',
            moves: ['heelhook', 'flagging'], stats: { flexibility: 0.6, power: 0.2, technique: 0.2 },
            baseChance: 0.56, cost: { hp: 9, fatigue: 9, knee: 7 }, luckMult: 1, reach: 'compressed',
            critText: '두 발로 천장을 물었다. 원숭이 같다는 소리를 들었다!',
            successText: '양발을 걸고 안정적으로 통과했다.',
            partialText: '한쪽 힐이 자꾸 빠진다.',
            fallText: '두 발이 동시에 빠졌다. 등부터 떨어졌다.',
          },
          {
            id: 'b', label: '한 번에 던져서 다음 홀드를 잡는다',
            moves: ['dyno'], stats: { power: 0.6, mental: 0.4 },
            baseChance: 0.44, cost: { hp: 13, fatigue: 15, shoulder: 8 }, luckMult: 2.2, reach: 'far',
            critText: '천장에서 다이노를 했다. 다들 소리를 질렀다!',
            successText: '던져서 잡았다. 아직도 안 믿긴다.',
            partialText: '손끝이 스쳤다. 매달린 채로 겨우 버텼다.',
            fallText: '천장에서 그대로 낙하. 매트가 푹신해서 다행이다.',
          },
        ],
      },
      {
        id: 's4',
        situation: '벽 끝으로 나오는 립 구간. 여기만 넘기면 끝이다.',
        line: '거의 다 왔어. 거의!',
        choices: [
          {
            id: 'a', label: '힐을 립에 걸고 몸을 세운다',
            moves: ['heelhook'], stats: { flexibility: 0.5, power: 0.3, mental: 0.2 },
            baseChance: 0.62, cost: { hp: 8, fatigue: 8, knee: 6 }, luckMult: 1, reach: 'compressed',
            critText: '힐로 립을 낚아채 몸을 세웠다. 완등!',
            successText: '힐을 걸고 올라섰다. 완등이다!',
            partialText: '힐이 립에서 미끄러졌다. 다시 매달렸다.',
            fallText: '립을 못 넘고 뒤로 넘어갔다.',
          },
          {
            id: 'b', label: '팔로 매달려 그냥 올라간다',
            moves: ['lockoff'], stats: { power: 0.7, mental: 0.3 },
            baseChance: 0.54, cost: { hp: 12, fatigue: 13, shoulder: 7 }, luckMult: 1.2, reach: 'neutral',
            critText: '팔만으로 립을 넘었다. 팔뚝이 자랑스럽다!',
            successText: '힘으로 올라섰다. 완등!',
            partialText: '팔이 안 접힌다. 한 번 더 시도해야 한다.',
            fallText: '립 앞에서 팔이 다 풀렸다.',
          },
        ],
      },
    ],
  },
]

export const getProblem = (id: string): ClimbingProblem | undefined =>
  PROBLEMS.find((p) => p.id === id)

/**
 * 그 지점에서 붙을 수 있는 문제.
 * 지금은 세 지점 모두 브랜드 공통 세팅 5개로 같다 — 지점 선택에 유불리가 없어야 하기 때문이다.
 * 나중에 지점 전용 문제를 넣으려면 gymId에 지점 id를 쓰면 자동으로 그 지점에만 뜬다.
 */
export const problemsOfGym = (gymId: string): ClimbingProblem[] => {
  const gym = getGym(gymId)
  return PROBLEMS.filter((p) => p.gymId === gym.brandId || p.gymId === gym.id)
}
