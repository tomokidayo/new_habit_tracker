export const toJSTDateString = (date = new Date()): string =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(date)

export const jstWeekDays = (): Date[] => {
  const todayStr = toJSTDateString()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStr)
    d.setDate(d.getDate() - (6 - i))
    return d
  })
}
