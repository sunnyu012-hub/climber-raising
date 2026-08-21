/** 한국어 조사 처리. UI 문구에 "이(가)" 같은 표기를 남기지 않기 위한 유틸. */

const hasBatchim = (word: string): boolean => {
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false // 한글 음절이 아니면 받침 없음으로 취급
  return (code - 0xac00) % 28 !== 0
}

/** josa('손가락', '이/가') → '손가락이',  josa('어깨', '이/가') → '어깨가' */
export function josa(word: string, pair: '이/가' | '을/를' | '은/는' | '와/과' | '으로/로'): string {
  const [withBatchim, without] = pair.split('/')
  return word + (hasBatchim(word) ? withBatchim : without)
}
