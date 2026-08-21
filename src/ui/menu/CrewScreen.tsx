import { Card } from '../bits'

/**
 * 크루 — 서버 연결이 필요한 기능.
 * 로컬 모드에서는 실제 다른 사용자를 만들지 않는다. 아래 멤버는 **화면 확인용 가상 데이터**다.
 * 작동하지 않는 가입·응원 버튼은 활성화하지 않는다.
 */
const PREVIEW_MEMBERS = [
  { id: 'p1', name: '(예시) 초크구름', level: 12, weeklyContribution: 340, role: 'owner' as const },
  { id: 'p2', name: '(예시) 슬랩요정', level: 9, weeklyContribution: 210, role: 'member' as const },
  { id: 'p3', name: '(예시) 펌핑감자', level: 7, weeklyContribution: 120, role: 'member' as const },
]

export function CrewScreen() {
  return (
    <>
      <div className="warn-box info">
        🔌 <b>서버 연결 후 사용 가능</b><br />
        크루는 다른 사람과 함께하는 기능이라 계정 연동이 필요해요. 아직 연결되지 않았어요.
      </div>

      <Card title="크루에서 할 수 있게 될 것">
        <div className="mini" style={{ lineHeight: 1.8 }}>
          크루 만들기 · 초대 코드로 가입 · 주간 기여도 · 크루 퀘스트 ·
          크루 랭킹 · 함께 원정 · 응원 보내기
        </div>
      </Card>

      <Card title="미리보기" right={<span className="chip lock">가상 데이터</span>}>
        <div className="warn-box" style={{ marginBottom: 8 }}>
          아래는 화면 확인용으로 만든 <b>가짜 데이터</b>예요. 실제 사용자가 아닙니다.
        </div>
        <div className="small" style={{ marginBottom: 6 }}>🧗 (예시) 부산 볼더 크루</div>
        {PREVIEW_MEMBERS.map((m) => (
          <div key={m.id} className="row small" style={{ padding: '4px 0', opacity: 0.65 }}>
            <span className="grow">{m.name} <span className="tiny muted">Lv.{m.level}</span></span>
            <span className="tiny muted">{m.role === 'owner' ? '크루장' : '멤버'} · {m.weeklyContribution}</span>
          </div>
        ))}
        <div className="spacer" />
        <button className="btn center" disabled>크루 가입 (서버 연결 필요)</button>
        <div className="spacer" />
        <button className="btn center" disabled>응원 보내기 (서버 연결 필요)</button>
      </Card>

      <Card title="연결 방법">
        <div className="tiny muted" style={{ lineHeight: 1.7 }}>
          <code>.env</code>에 Supabase 주소와 anon key를 넣으면 준비된 테이블
          (<code>crews</code>, <code>crew_members</code>)로 연결됩니다.
          자세한 절차는 <code>README.md</code>를 보세요.
        </div>
      </Card>
    </>
  )
}
