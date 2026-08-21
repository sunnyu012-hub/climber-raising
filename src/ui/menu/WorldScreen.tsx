import { REGIONS, TIER_LABEL, getGym } from '../../content/gyms'
import { gymOptions, isExpeditionGym } from '../../game/world'
import { unlockBlocker } from '../../game/unlock'
import { useGame } from '../../store/gameStore'
import { Card } from '../bits'
import { useToast } from '../Toast'

/** 지도 — 지역 계층과 암장 이동. 잠긴 곳도 조건이 보인다. */
export function WorldScreen() {
  const state = useGame((s) => s.state)
  const travel = useGame((s) => s.travel)
  const toast = useToast()

  return (
    <>
      <Card title="지도" right={<span className="tiny muted">현재 {getGym(state.gymId).branchName}</span>}>
        <div className="tiny muted" style={{ lineHeight: 1.6 }}>
          다른 지점으로 옮기면 그곳 문제를 붙을 수 있어요. 교통비가 듭니다.<br />
          웨이브락 밖으로 나가는 건 원정으로 쳐요.
        </div>
      </Card>

      {REGIONS.map((region) => {
        const unlocked = state.world.unlockedRegions.includes(region.id)
        const blocked = unlockBlocker(state, region.unlock)
        const gyms = gymOptions(state, region.id)
        const fam = Math.floor(state.world.regionFamiliarity[region.id] ?? 0)
        const clears = gyms.reduce((a, g) => a + (state.stats.gymClears[g.gym.id] ?? 0), 0)

        return (
          <Card
            key={region.id}
            title={`${region.displayName} · ${TIER_LABEL[region.tier]}`}
            right={<span className="tiny muted">{unlocked ? `친숙도 ${fam}` : '🔒'}</span>}
          >
            {region.blurb && <div className="mini" style={{ marginBottom: 6 }}>{region.blurb}</div>}

            {!unlocked && (
              <div className="warn-box info">
                🔒 {blocked ?? '조건 확인 중'}
                {region.travelCost > 0 && ` · 원정비 ${region.travelCost.toLocaleString()}원`}
                {region.travelDays > 0 && ` · ${region.travelDays}일`}
              </div>
            )}

            {unlocked && gyms.length === 0 && (
              <div className="mini muted">아직 이 지역에 갈 수 있는 암장이 없어요.</div>
            )}

            {unlocked && gyms.map(({ gym, blocked: gb, cost, here, visited }) => (
              <button
                key={gym.id}
                className="day-row"
                data-today={here ? '1' : '0'}
                disabled={!!gb}
                style={gb ? { opacity: 0.5 } : undefined}
                onClick={() => {
                  const err = travel(gym.id)
                  toast(err ?? `${gym.branchName}${isExpeditionGym(gym) ? ' 원정 완료!' : '으로 옮겼어요'}`)
                }}
              >
                <span className="dname" style={{ background: gym.theme.sign, color: '#fff', borderColor: gym.theme.accent }}>
                  {visited ? '✓' : '?'}
                </span>
                <span className="dbody">
                  <span className="dname-t">
                    {gym.branchName}
                    {isExpeditionGym(gym) && <span className="chip" style={{ marginLeft: 4 }}>원정</span>}
                  </span>
                  <span className="dmeta">{gb ?? (here ? '지금 여기예요' : `교통비 ${cost.toLocaleString()}원`)}</span>
                  <span className="dmeta">{gym.tagline}</span>
                </span>
              </button>
            ))}

            {unlocked && (
              <div className="tiny muted" style={{ marginTop: 4 }}>
                방문 {gyms.filter((g) => g.visited).length}/{gyms.length} · 완등 {clears}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
