import type { OnboardingDraft } from '../game/types'
import type { PersistedSave, SaveAdapter } from './storage'

const KEY = 'climber.save.v1'
/** 온보딩 임시 상태 — 본 세이브(KEY)와 다른 키를 쓴다. */
const DRAFT_KEY = 'climber.onboarding.v1'

/** 로컬 데모 모드 저장소. 로그인 없이 게스트 클라이머로 플레이할 때 쓴다. */
export const localAdapter: SaveAdapter = {
  name: 'local',
  async load() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as PersistedSave) : null
    } catch {
      // 손상된 세이브는 조용히 버리는 대신 새 게임으로 시작한다.
      console.warn('[save] 세이브를 읽지 못했습니다. 새로 시작합니다.')
      return null
    }
  },
  async save(s) {
    localStorage.setItem(KEY, JSON.stringify(s))
  },
  async clear() {
    localStorage.removeItem(KEY)
  },
  async loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      return raw ? (JSON.parse(raw) as OnboardingDraft) : null
    } catch {
      return null
    }
  },
  async saveDraft(d) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  },
  async clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
  },
  // TEMP: 로컬 모드는 기기 시간을 쓴다. 서버 모드에서 server_now()로 교체된다.
  async serverNow() {
    return Date.now()
  },
}
