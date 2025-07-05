export interface SessionData {
  membershipMessagesId: number[]
  __language_code?: string
  issueMessageId?: number
  buy:
    | {
      isBuying: false
    }
    | {
      isBuying: true
      messageId: number
      serviceId: number
      name?: string
      volume?: number
      days?: number
      step: 'awaiting_volume' | 'awaiting_days' | 'awaiting_name' | 'confirm'
    }
}
