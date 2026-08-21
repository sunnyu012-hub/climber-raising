import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * dist/ 를 index.html 하나로 합친다.
 *
 * 왜: 배포를 "파일 하나 올리기"로 끝내기 위해서다.
 * GitHub 웹에서 직접 업로드하는 흐름이면 파일이 여러 개일 때 번거롭다.
 * (git push로 배포한다면 이 스크립트는 필요 없다 — dist/ 를 그대로 올리면 된다.)
 */
const DIST = 'dist'
const OUT_DIR = 'dist-single'

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const assets = readdirSync(join(DIST, 'assets'))

const js = assets.find((f) => f.endsWith('.js'))
const css = assets.find((f) => f.endsWith('.css'))
if (!js || !css) throw new Error('dist/assets 에서 js/css를 찾지 못했습니다. npm run build 먼저 실행하세요.')

const jsCode = readFileSync(join(DIST, 'assets', js), 'utf8')
const cssCode = readFileSync(join(DIST, 'assets', css), 'utf8')
const manifestB64 = readFileSync(join(DIST, 'manifest.webmanifest')).toString('base64')

// 치환값은 반드시 **함수**로 넘긴다.
// 문자열로 넘기면 번들 안의 `$&` `$'` 같은 패턴을 치환 지시자로 해석해 HTML이 깨진다.
const single = html
  .replace(
    /<script[^>]*src="[^"]*assets\/[^"]+\.js"[^>]*><\/script>/,
    () => `<script type="module">\n${jsCode}\n</script>`,
  )
  .replace(
    /<link[^>]*href="[^"]*assets\/[^"]+\.css"[^>]*>/,
    () => `<style>\n${cssCode}\n</style>`,
  )
  // 매니페스트도 인라인 — 파일 하나로 끝나야 하므로 외부 참조를 남기지 않는다
  .replace(
    /<link[^>]*rel="manifest"[^>]*>/,
    () => `<link rel="manifest" href="data:application/manifest+json;base64,${manifestB64}" />`,
  )

for (const bad of ['src="./assets', 'href="./assets', 'href="./manifest']) {
  if (single.includes(bad)) throw new Error(`인라인 실패 — 외부 참조가 남았습니다: ${bad}`)
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'index.html'), single)

const kb = (n) => `${Math.round(n / 1024)} KB`
console.log(`✓ ${OUT_DIR}/index.html  ${kb(Buffer.byteLength(single))}`)
console.log('  이 파일 하나만 올리면 배포됩니다.')
