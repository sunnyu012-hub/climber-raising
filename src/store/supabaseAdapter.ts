import type { PersistedSave, SaveAdapter } from './storage'

/**
 * Supabase 저장 어댑터 — 구조와 타입만 준비된 상태다.
 *
 * 현재 상태: **미연결**. 환경변수가 없으면 `createSupabaseAdapter()`가 null을 돌려주고
 * 앱은 localAdapter(게스트 클라이머 데모)로 폴백한다.
 *
 * 연결 방법
 *  1. `npm i @supabase/supabase-js`
 *  2. `.env` 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 작성 (.env.example 참고)
 *  3. `supabase/migrations/0001_init.sql` 적용
 *  4. 아래 TODO 부분의 주석을 실제 쿼리로 교체
 *
 * 보안
 *  - anon key만 브라우저에 노출한다. service_role 키는 절대 여기 두지 않는다.
 *  - 모든 테이블은 RLS로 `auth.uid() = user_id` 를 강제한다.
 */

export interface SupabaseEnv {
  url: string
  anonKey: string
}

export function readSupabaseEnv(): SupabaseEnv | null {
  const url = import.meta.env?.VITE_SUPABASE_URL
  const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}

/** save_slots 테이블 한 행의 형태. SQL 마이그레이션과 1:1로 맞춘다. */
export interface SaveRow {
  user_id: string
  slot: number
  version: number
  state: unknown
  updated_at: string
}

/**
 * SERVER-AUTHORITY 전환 지점
 * ---------------------------------------------------------------
 * 아래 세 가지는 로컬 모드에서는 클라이언트가 계산하지만,
 * 서버 모드에서는 반드시 서버가 계산·검증해야 한다.
 *
 *  1) serverNow()        → `select public.server_now()` (기기 시간 조작 방지)
 *  2) 오프라인 진행 결과   → edge function `advance_schedule`이 재계산
 *  3) 완등 판정과 랭킹 점수 → edge function `submit_attempt`가 재계산
 *
 * 클라이언트가 계산한 보상 수치를 그대로 저장하는 코드를 새로 만들지 마라.
 */
export function createSupabaseAdapter(): SaveAdapter | null {
  const env = readSupabaseEnv()
  if (!env) return null

  // TODO(연결): createClient(env.url, env.anonKey) 로 클라이언트를 만든다.
  //   const supabase = createClient(env.url, env.anonKey)

  return {
    name: 'supabase',
    async load(): Promise<PersistedSave | null> {
      // TODO: const { data } = await supabase.from('save_slots')
      //   .select('version, state').eq('slot', 1).maybeSingle()
      //   return data ? { version: data.version, state: data.state as GameState } : null
      throw new Error('Supabase 어댑터가 아직 연결되지 않았습니다. .env를 설정하세요.')
    },
    async save(_s: PersistedSave): Promise<void> {
      // TODO: await supabase.from('save_slots').upsert({ slot: 1, version: _s.version, state: _s.state })
      throw new Error('Supabase 어댑터가 아직 연결되지 않았습니다.')
    },
    async clear(): Promise<void> {
      // TODO: await supabase.from('save_slots').delete().eq('slot', 1)
      throw new Error('Supabase 어댑터가 아직 연결되지 않았습니다.')
    },
    // 온보딩 임시 상태는 서버에 올리지 않는다 — 기기에만 남는다.
    async loadDraft() { return null },
    async saveDraft() { /* no-op */ },
    async clearDraft() { /* no-op */ },
    async serverNow(): Promise<number> {
      // TODO: const { data } = await supabase.rpc('server_now')
      //   return new Date(data).getTime()
      throw new Error('Supabase 어댑터가 아직 연결되지 않았습니다.')
    },
  }
}
