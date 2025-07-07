import { session } from 'grammy'

import { DrizzleAdapter } from '@/db/adapter'
import type { BotContext } from '@/types/bot'
import type { SessionData } from '@/types/session'

function initial(): SessionData {
  return { membershipMessagesId: [], buy: { isBuying: false } }
}

const sessionMiddleware = session<SessionData, BotContext>({
  initial,
  storage: new DrizzleAdapter(),
  getSessionKey: (ctx) => {
    if (ctx.chat)
      return String(ctx.chat.id)
    if (ctx.inlineQuery)
      return `inline-${ctx.from?.id}`
    return undefined
  },
})

export default sessionMiddleware
