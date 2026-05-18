import { WEEKLY_GRID_DAYS, TIMEZONE_JST, ISO_DATE_LOCALE } from '../constants'

export const toJSTDateString = (date = new Date()): string =>
  new Intl.DateTimeFormat(ISO_DATE_LOCALE, { timeZone: TIMEZONE_JST }).format(date)

export const jstWeekDays = (): string[] => {
  const todayStr = toJSTDateString()
  const [y, m, d] = todayStr.split('-').map(Number)
  return Array.from({ length: WEEKLY_GRID_DAYS }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - (WEEKLY_GRID_DAYS - 1 - i)))
    return toJSTDateString(date)
  })
}

export const dayOfWeek = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
