import { getItem, SLOT_LABEL } from '../content/equipment'
import { slotsForLevel } from './newGame'
import { emit, pushLog } from './events'
import { now } from './clock'
import type { EquipSlot, GameState, InventoryEntry } from './types'

/**
 * 장비 — 인벤토리 · 장착 · 슬롯 해금.
 * 장착 효과는 `character.ts`의 `stateModifiers()`가 등반 판정에 그대로 넣는다.
 * (장식용 장비를 만들지 않기 위해, 효과 반영 지점은 한 군데뿐이다.)
 */

export const findEntry = (s: GameState, itemId: string): InventoryEntry | undefined =>
  s.inventory.items.find((e) => e.itemId === itemId)

export const hasItem = (s: GameState, itemId: string): boolean => !!findEntry(s, itemId)

/** 레벨에 맞게 슬롯을 다시 연다. 레벨업 뒤에 부르면 된다. */
export function syncSlots(s: GameState): void {
  const next = slotsForLevel(s.climber.level)
  if (next.length !== s.inventory.unlockedSlots.length) {
    const opened = next.filter((x) => !s.inventory.unlockedSlots.includes(x))
    s.inventory.unlockedSlots = next
    for (const slot of opened) pushLog(s, '🎽', `${SLOT_LABEL[slot]} 슬롯이 열렸다!`)
  }
}

export function addItem(s: GameState, itemId: string, qty = 1): void {
  const item = getItem(itemId)
  if (!item) return
  const found = findEntry(s, itemId)
  if (found && item.stackable) {
    found.qty += qty
    found.isNew = true
  } else if (!found) {
    s.inventory.items.push({ itemId, qty, isNew: true, gotAt: now() })
  } else {
    // 비소모품 중복 — 수량만 올려두고 되팔 수 있게 한다
    found.qty += qty
  }
  emit(s, { t: 'item.get', itemId })
}

export function removeItem(s: GameState, itemId: string, qty = 1): boolean {
  const e = findEntry(s, itemId)
  if (!e || e.qty < qty) return false
  e.qty -= qty
  if (e.qty <= 0) {
    s.inventory.items = s.inventory.items.filter((x) => x.itemId !== itemId)
    for (const [slot, id] of Object.entries(s.inventory.equipped)) {
      if (id === itemId) delete s.inventory.equipped[slot as EquipSlot]
    }
  }
  return true
}

/** 장착. 막히면 이유를 돌려준다. */
export function equipItem(s: GameState, itemId: string): string | null {
  const item = getItem(itemId)
  if (!item) return '없는 장비예요'
  if (!hasItem(s, itemId)) return '가지고 있지 않아요'
  if (!s.inventory.unlockedSlots.includes(item.slot))
    return `${SLOT_LABEL[item.slot]} 슬롯이 아직 안 열렸어요`
  s.inventory.equipped[item.slot] = itemId
  const e = findEntry(s, itemId)
  if (e) e.isNew = false
  emit(s, { t: 'item.equip', itemId, slot: item.slot })
  return null
}

export function unequipSlot(s: GameState, slot: EquipSlot): void {
  delete s.inventory.equipped[slot]
}

export const equippedItems = (s: GameState) =>
  (Object.values(s.inventory.equipped) as string[])
    .map((id) => getItem(id))
    .filter((x): x is NonNullable<typeof x> => !!x)

export const sellPrice = (itemId: string): number => {
  const item = getItem(itemId)
  return item ? Math.round(item.price * item.sellRatio) : 0
}
