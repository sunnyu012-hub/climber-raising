import { describe, expect, it } from 'vitest'
import { josa } from '../text'

describe('조사 처리', () => {
  it('받침이 있으면 앞쪽, 없으면 뒤쪽 조사를 붙인다', () => {
    expect(josa('손가락', '이/가')).toBe('손가락이')
    expect(josa('어깨', '이/가')).toBe('어깨가')
    expect(josa('무릎', '이/가')).toBe('무릎이')
    expect(josa('힘', '이/가')).toBe('힘이')
    expect(josa('유연성', '을/를')).toBe('유연성을')
    expect(josa('휴식', '은/는')).toBe('휴식은')
    expect(josa('크루 교류', '을/를')).toBe('크루 교류를')
  })

  it('한글이 아닌 글자로 끝나면 받침 없음으로 처리한다', () => {
    expect(josa('V5', '이/가')).toBe('V5가')
  })
})
