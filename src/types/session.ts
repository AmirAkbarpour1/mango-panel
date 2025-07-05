export interface SessionData {
  membershipMessagesId: number[]
  __language_code?: string
  issueMessageId?: number
  buy: | { isBuying: false }
    | { isBuying: true, step: 'awaiting_name', messageId: number, serviceId: number }
    | { isBuying: true, step: 'awaiting_volume', messageId: number, serviceId: number, name: string }
    | { isBuying: true, step: 'awaiting_days', messageId: number, serviceId: number, name: string, volume: number }
    | { isBuying: true, step: 'confirm', messageId: number, serviceId: number, name: string, volume: number, days: number }
}
