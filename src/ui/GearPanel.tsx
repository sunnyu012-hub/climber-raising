import { useState } from 'react'
import { EQUIPMENT, SLOT_LABEL, SLOT_ORDER, SLOT_UNLOCK_LEVEL, getItem } from '../content/equipment'
import { MOVE_LABEL, STAT_LABEL } from '../game/balance'
import { sellPrice } from '../game/equipment'
import { shopList } from '../game/shop'
import { useGame } from '../store/gameStore'
import { Card, Empty } from './bits'
import { useToast } from './Toast'
import type { SkillEffect } from '../game/types'

/** 장비 효과를 사람이 읽을 수 있는 한 줄로. 장식용 장비를 못 만들게 하는 표시이기도 하다. */
export function effectText(e: SkillEffect): string {
  switch (e.kind) {
    case 'moveChance': return `${MOVE_LABEL[e.move]} +${Math.round(e.value * 100)}%p`
    case 'statBonus': return `${STAT_LABEL[e.stat]} +${e.value}`
    case 'fatigueCost': return `등반 피로 ${e.value < 1 ? '-' : '+'}${Math.abs(Math.round((1 - e.value) * 100))}%`
    case 'jointCost': return `관절 소모 ${e.value < 1 ? '-' : '+'}${Math.abs(Math.round((1 - e.value) * 100))}%`
    case 'recovery': return `회복량 +${Math.round((e.value - 1) * 100)}%`
    case 'reachComp': return `먼 홀드 리치 보완 ${Math.round(e.value * 100)}%`
    case 'revealChance': return '정확한 성공률 표시'
    case 'injuryWarn': return '부상 위험 경고'
    case 'wallAffinity': return `${e.wall} +${Math.round(e.value * 100)}%p`
  }
}

/** 성장 탭의 장비 세그먼트 — 착용 · 가방 · 상점을 한 화면에서. */
export function GearPanel() {
  const state = useGame((s) => s.state)
  const equip = useGame((s) => s.equip)
  const unequip = useGame((s) => s.unequip)
  const sell = useGame((s) => s.sell)
  const buy = useGame((s) => s.buy)
  const toast = useToast()
  const [tab, setTab] = useState<'wear' | 'bag' | 'shop'>('wear')

  const inv = state.inventory
  const rows = shopList(state)

  return (
    <>
      <div className="seg">
        <button data-on={tab === 'wear' ? '1' : '0'} onClick={() => setTab('wear')}>착용</button>
        <button data-on={tab === 'bag' ? '1' : '0'} onClick={() => setTab('bag')}>
          가방<span className="seg-count">{inv.items.length}</span>
        </button>
        <button data-on={tab === 'shop' ? '1' : '0'} onClick={() => setTab('shop')}>상점</button>
      </div>

      {tab === 'wear' && (
        <Card title="착용 중" right={<span className="tiny muted">슬롯 {inv.unlockedSlots.length}/{SLOT_ORDER.length}</span>}>
          {SLOT_ORDER.map((slot) => {
            const open = inv.unlockedSlots.includes(slot)
            const id = inv.equipped[slot]
            const item = id ? getItem(id) : undefined
            return (
              <div key={slot} className="slot-row" data-locked={open ? '0' : '1'}>
                <span
                  className="slot-swatch"
                  style={{ background: item?.color ?? 'var(--cream-2)' }}
                />
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="tiny muted" style={{ display: 'block' }}>{SLOT_LABEL[slot]}</span>
                  <span className="small">
                    {!open ? `레벨 ${SLOT_UNLOCK_LEVEL[slot]}부터` : item ? item.name : '비어 있음'}
                  </span>
                  {item && (
                    <span className="tiny muted" style={{ display: 'block', marginTop: 2 }}>
                      {item.effects.map(effectText).join(' · ')}
                    </span>
                  )}
                </span>
                {item && (
                  <button className="btn small" onClick={() => { unequip(slot); toast('벗었어요') }}>벗기</button>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {tab === 'bag' && (
        inv.items.length === 0
          ? <Empty text="가방이 비었어요. 상점에서 장비를 사보세요." />
          : (
            <Card title="가방">
              {inv.items.map((entry) => {
                const item = getItem(entry.itemId)
                if (!item) return null
                const worn = inv.equipped[item.slot] === item.id
                const canWear = inv.unlockedSlots.includes(item.slot)
                return (
                  <div key={entry.itemId} className="plist">
                    <div className="ph">
                      <span className="slot-swatch" style={{ background: item.color, width: 20, height: 20 }} />
                      <span className="grow" style={{ fontSize: 14 }}>
                        {item.name}{entry.qty > 1 && ` ×${entry.qty}`}
                      </span>
                      {entry.isNew && <span className="chip on">NEW</span>}
                      {worn && <span className="chip on">착용 중</span>}
                    </div>
                    <div className="mini" style={{ margin: '5px 0' }}>{item.desc}</div>
                    <div className="tiny muted" style={{ marginBottom: 6 }}>
                      {SLOT_LABEL[item.slot]} · {item.effects.map(effectText).join(' · ')}
                    </div>
                    <div className="row">
                      <button
                        className={`btn small${worn || !canWear ? '' : ' primary'}`}
                        disabled={worn || !canWear}
                        onClick={() => toast(equip(item.id) ?? `${item.name} 착용!`)}
                      >
                        {worn ? '착용 중' : canWear ? '착용' : `레벨 ${SLOT_UNLOCK_LEVEL[item.slot]} 필요`}
                      </button>
                      {item.price > 0 && (
                        <button
                          className="btn small"
                          onClick={() => toast(sell(item.id) ?? `${sellPrice(item.id).toLocaleString()}원에 팔았어요`)}
                        >
                          팔기 {sellPrice(item.id).toLocaleString()}원
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </Card>
          )
      )}

      {tab === 'shop' && (
        <>
          <Card tight>
            <div className="row small">
              <span className="grow">보유 금액</span>
              <span className="b">{state.climber.money.toLocaleString()}원</span>
            </div>
          </Card>
          {rows.length === 0 && <Empty text="이 암장에는 상점이 없어요." />}
          {rows.map(({ entry, blocked, sold }) => {
            const item = getItem(entry.itemId)
            if (!item) return null
            const owned = inv.items.find((i) => i.itemId === entry.itemId)?.qty ?? 0
            const soldOut = entry.stock !== null && sold >= entry.stock
            const poor = state.climber.money < item.price
            const disabled = !!blocked || soldOut || (owned > 0 && !item.stackable)
            return (
              <div key={entry.itemId} className="plist">
                <div className="ph">
                  <span className="slot-swatch" style={{ background: item.color, width: 20, height: 20 }} />
                  <span className="grow" style={{ fontSize: 14 }}>{item.name}</span>
                  <span className="chip">{item.price.toLocaleString()}원</span>
                </div>
                <div className="mini" style={{ margin: '5px 0' }}>{item.desc}</div>
                <div className="tiny muted" style={{ marginBottom: 6 }}>
                  {SLOT_LABEL[item.slot]} · {item.effects.map(effectText).join(' · ')}
                </div>
                <button
                  className={`btn small${disabled || poor ? '' : ' primary'}`}
                  disabled={disabled}
                  onClick={() => toast(buy(item.id) ?? `${item.name}을(를) 샀어요!`)}
                >
                  {blocked ? `🔒 ${blocked}`
                    : soldOut ? '품절'
                    : owned > 0 && !item.stackable ? '이미 있어요'
                    : poor ? `${(item.price - state.climber.money).toLocaleString()}원 모자라요`
                    : '구매'}
                </button>
              </div>
            )
          })}
          <div className="tiny muted center" style={{ padding: '4px 0 0' }}>
            상품은 레벨과 완등 수에 따라 늘어나요.
          </div>
        </>
      )}

      <Card title="도감 진행">
        <div className="tiny muted">
          장비 {state.collection.equipment.length} / {EQUIPMENT.length}종 발견
        </div>
      </Card>
    </>
  )
}
