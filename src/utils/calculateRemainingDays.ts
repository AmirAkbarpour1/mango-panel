function calculateRemainingDays(expireDate: string): number {
  const now = new Date()
  const expire = new Date(expireDate)

  const diffInMilliseconds = expire.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24))

  return diffInDays > 0 ? diffInDays : 0
}

export default calculateRemainingDays
