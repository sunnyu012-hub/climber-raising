/**
 * 시간 추상화.
 * SERVER-AUTHORITY: 로컬 시간 조작으로 오프라인 보상을 부풀리지 못하게,
 * 나중에 Supabase `server_now()` 결과로 이 구현을 교체한다.
 * 그때 바꿀 파일은 이 파일 하나여야 한다.
 */
let offsetMs = 0

/** 서버 시각과의 차이를 등록한다(서버 모드 전환 시 호출). */
export function syncServerTime(serverNowMs: number): void {
  offsetMs = serverNowMs - Date.now()
}

export function now(): number {
  return Date.now() + offsetMs
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0초'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${sec}초`
  return `${sec}초`
}
