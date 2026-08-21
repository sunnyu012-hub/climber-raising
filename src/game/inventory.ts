import { EQUIPMENT, SLOT_ORDER, SLOT_UNLOCK_LEVEL, getItem } from '../content/equipment'
import { SHOPS, getShop } from '../content/shop'
import { emit, pushLog } from './events'
import { checkUnlock } from './world'
import type {
  EquipSlot, GameState, InventoryState, SkillEffect,
} from './types'

/**
 * 장비 · 인벤토리 · 상점.
 * 장착 효과는 스킬과 같은 `SkillEffect`라 `collectModifiers()`가 그대로 소비한다 —
 * 장식용 장비가 생길 수 없는 구조다.
 */

export function emptyInventory(): InventoryState {
  return { items: [], equipped: {}, unlockedSlots: ['shoes', 'chalkbag'] }
}

/** 레벨로 열리는 슬롯을 갱신한다 */
export function refreshSlots(s: GameState): EquipSlot[] {
  const opened = SLOT_ORDER.filter((slot) => s.climber.level >= SLOT_UNLOCK_LEVEL[slot])
  const added = opened.filter((x) => !s.inventory.unlockedSlots.includes(x))
  s.inventory.unlockedSlots = opened
  return added
}

/** 장착 중인 장비의 효과 전부 — collectModifiers가 스킬 효과와 함께 합친다 */
export function equippedEffects(s: GameState): SkillEffect[] {
  return Object.values(s.inventory.equipped)
    .map((id) => (id ? getItem(id) : undefined))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .flatMap((i) => i.effects)
}

// ---------------- 인벤토리 조작 ----------------
export function addItem(s: GameState, itemId: string, qty = 1): boolean {
  const def = getItem(itemId)
  if (!def) return false
  const existing = s.inventory.items.find((e) => e.itemId === itemId)
  if (existing && def.stackable) {
    existing.qty += qty
    existing.isNew = true
  } else if (existing) {
    return false // 고유 장비는 하나만
  } else {
    s.inventory.items.push({ itemId, qty, isNew: true, gotAt: s.clock.lastTickAt })
  }
  emit(s, { t: 'item.get', itemId })
  return true
}

export function equipItem(s: GameState, itemId: string): { ok: boolean; message: string } {
  const def = getItem(itemId)
  if (!def) return { ok: false, message: '없는 장비예요.' }
  if (!s.inventory.items.some((e) => e.itemId === itemId)) {
    return { ok: false, message: '가지고 있지 않아요.' }
  }
  if (!s.inventory.unlockedSlots.includes(def.slot)) {
    return { ok: false, message: `레벨 ${SLOT_UNLOCK_LEVEL[def.slot]}부터 쓸 수 있어요.` }
  }
  s.inventory.equipped[def.slot] = itemId
  const entry = s.inventory.items.find((e) => e.itemId === itemId)
  if (entry) entry.isNew = false
  emit(s, { t: 'item.equip', itemId, slot: def.slot })
  return { ok: true, message: `${def.name}을(를) 착용했어요.` }
}

export function unequipSlot(s: GameState, slot: EquipSlot): void {
  delete s.inventory.equipped[slot]
}

export function sellItem(s: GameState, itemId: string): { ok: boolean; message: string } {
  const def = getItem(itemId)
  const idx = s.inventory.items.findIndex((e) => e.itemId === itemId)
  if (!def || idx < 0) return { ok: false, message: '가지고 있지 않아요.' }
  if (def.price === 0) return { ok: false, message: '팔 수 없는 물건이에요.' }

  const entry = s.inventory.items[idx]
  const price = Math.floor(def.price * def.sellRatio)

  if (entry.qty > 1) entry.qty -= 1
  else s.inventory.items.splice(idx, 1)

  // 마지막 하나를 팔았으면 장착 해제
  if (!s.inventory.items.some((e) => e.itemId === itemId) && s.inventory.equipped[def.slot] === itemId) {
    delete s.inventory.equipped[def.slot]
  }

  s.climber.money += price
  emit(s, { t: 'money.earn', amount: price, source: 'sell' })
  pushLog(s, '💰', `${def.name}을(를) 팔았다. (+${price.toLocaleString()}원)`)
  return { ok: true, message: `${price.toLocaleString()}원에 팔았어요.` }
}

// ---------------- 상점 ----------------
export interface ShopRow {
  itemId: string
  locked: boolean
  lockReason: string
  owned: number
  soldOut: boolean
}

export function shopRows(s: GameState, shopId: string): ShopRow[] {
  const shop = getShop(shopId)
  if (!shop) return []
  return shop.entries.map((e) => {
    const lock = checkUnlock(s, e.unlock)
    const owned = s.inventory.items.find((i) => i.itemId === e.itemId)?.qty ?? 0
    const bought = s.shopBought[e.itemId] ?? 0
    const def = getItem(e.itemId)
    return {
      itemId: e.itemId,
      locked: !lock.ok,
      lockReason: lock.comingSoon ? '준비 중' : (lock.reasons[0] ?? ''),
      owned,
      soldOut: e.stock !== null ? bought >= e.stock : (!def?.stackable && owned > 0),
    }
  })
}

export function buyItem(s: GameState, shopId: string, itemId: string): { ok: boolean; message: string } {
  const shop = getShop(shopId)
  const entry = shop?.entries.find((e) => e.itemId === itemId)
  const def = getItem(itemId)
  if (!shop || !entry || !def) return { ok: false, message: '지금은 팔지 않아요.' }

  const lock = checkUnlock(s, entry.unlock)
  if (!lock.ok) return { ok: false, message: lock.reasons[0] ?? '아직 살 수 없어요.' }

  const owned = s.inventory.items.find((i) => i.itemId === itemId)?.qty ?? 0
  if (!def.stackable && owned > 0) return { ok: false, message: '이미 가지고 있어요.' }

  const bought = s.shopBought[itemId] ?? 0
  if (entry.stock !== null && bought >= entry.stock) return { ok: false, message: '품절이에요.' }

  if (s.climber.money < def.price) {
    return { ok: false, message: `${(def.price - s.climber.money).toLocaleString()}원이 모자라요.` }
  }

  s.climber.money -= def.price
  s.shopBought[itemId] = bought + 1
  emit(s, { t: 'money.spend', amount: def.price, sink: 'shop' })
  addItem(s, itemId, 1)
  pushLog(s, '🛍️', `${def.name}을(를) 샀다. (-${def.price.toLocaleString()}원)`)
  return { ok: true, message: `${def.name}을(를) 샀어요!` }
}

export const ALL_ITEMS = EQUIPMENT
export const ALL_SHOPS = SHOPS
