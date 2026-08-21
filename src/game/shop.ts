import { shopsOfGym } from '../content/shop'
import { getItem } from '../content/equipment'
import { addItem, findEntry, removeItem, sellPrice } from './equipment'
import { emit, pushLog } from './events'
import { unlockBlocker } from './unlock'
import type { GameState, ShopEntry } from './types'

/** 지금 암장에서 살 수 있는 목록 (해금 못 한 것도 이유와 함께 보여준다) */
export function shopList(s: GameState): { entry: ShopEntry; blocked: string | null; sold: number }[] {
  return shopsOfGym(s.gymId).flatMap((shop) =>
    shop.entries.map((entry) => ({
      entry,
      blocked: unlockBlocker(s, entry.unlock),
      sold: s.shopBought[entry.itemId] ?? 0,
    })),
  )
}

/** 구매. 막히면 이유를 돌려준다. */
export function buyItem(s: GameState, itemId: string): string | null {
  const row = shopList(s).find((r) => r.entry.itemId === itemId)
  const item = getItem(itemId)
  if (!row || !item) return '여기서는 안 파는 물건이에요'
  if (row.blocked) return row.blocked
  if (row.entry.stock !== null && row.sold >= row.entry.stock) return '품절이에요'
  if (!item.stackable && findEntry(s, itemId)) return '이미 가지고 있어요'
  if (s.climber.money < item.price) return `${(item.price - s.climber.money).toLocaleString()}원 모자라요`

  s.climber.money -= item.price
  s.shopBought[itemId] = row.sold + 1
  emit(s, { t: 'money.spend', amount: item.price, sink: 'shop' })
  addItem(s, itemId)
  pushLog(s, '🛍️', `${item.name} 구매 (-${item.price.toLocaleString()}원)`)
  return null
}

/** 되팔기. 값이 0인 기념품은 팔 수 없다. */
export function sellItem(s: GameState, itemId: string): string | null {
  const item = getItem(itemId)
  if (!item || !findEntry(s, itemId)) return '가지고 있지 않아요'
  const price = sellPrice(itemId)
  if (price <= 0) return '팔 수 없는 물건이에요'
  if (!removeItem(s, itemId)) return '팔 수 없어요'
  s.climber.money += price
  emit(s, { t: 'money.earn', amount: price, source: 'sell' })
  pushLog(s, '💰', `${item.name} 판매 (+${price.toLocaleString()}원)`)
  return null
}
