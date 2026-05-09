export const toJSTDateString = (date = new Date()): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date)

export const jstWeekDays = (): string[] => {
  const todayStr = toJSTDateString()
  const [y, m, d] = todayStr.split('-').map(Number)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - (6 - i)))
    return toJSTDateString(date)
  })
}

export const dayOfWeek = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
