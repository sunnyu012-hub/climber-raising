/** 주입 가능한 난수. UI에서 Math.random()을 직접 부르지 마라. */
export type Rng = () => number

/** mulberry32 — 시드가 같으면 항상 같은 수열. 테스트 재현용. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 실제 플레이용. */
export const systemRng: Rng = () => Math.random()

export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]
