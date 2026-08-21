import type { GameState, OnboardingDraft } from '../game/types'

export interface PersistedSave { version: number; state: GameState }

/**
 * 저장 어댑터. UI/스토어는 localStorage나 Supabase를 직접 부르지 않는다.
 * 새 백엔드를 붙이려면 이 인터페이스만 구현하면 된다.
 */
export interface SaveAdapter {
  readonly name: string
  load(): Promise<PersistedSave | null>
  save(s: PersistedSave): Promise<void>
  clear(): Promise<void>
  /**
   * 온보딩 임시 상태. 본 세이브와 완전히 분리된 슬롯이다 —
   * 마지막 확인을 누르기 전까지 기존 세이브를 절대 건드리지 않는다.
   */
  loadDraft(): Promise<OnboardingDraft | null>
  saveDraft(d: OnboardingDraft): Promise<void>
  clearDraft(): Promise<void>
  /** SERVER-AUTHORITY: 서버 모드에서는 DB 시각을 돌려준다. */
  serverNow(): Promise<number>
}
