export function getTodayDateString(): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString().split('T')[0]
}

export function formatDateToISOString(date: Date): string {
    const dateCopy = new Date(date)
    dateCopy.setHours(0, 0, 0, 0)
    return dateCopy.toISOString().split('T')[0]
}

export function formatDateTimeToISOString(date: Date): string {
    return date.toISOString()
}

export function getDateDaysFromToday(days: number): string {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(0, 0, 0, 0)
    return date.toISOString().split('T')[0]
}

export function getDateRange(daysAhead: number = 30): { from: string; to: string } {
    return {
        from: getTodayDateString(),
        to: getDateDaysFromToday(daysAhead)
    }
}
  
export function isValidISODate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    return regex.test(dateString) && !isNaN(Date.parse(dateString))
}