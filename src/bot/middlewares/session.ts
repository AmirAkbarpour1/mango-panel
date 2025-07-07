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
    if (ctx.chat?.id)
      return String(ctx.chat.id)

    if (ctx.inlineQuery)
      return `inline-${ctx.from?.id}`

    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.message?.chat?.id)
        return String(ctx.callbackQuery.message.chat.id)

      if (ctx.from?.id)
        return `callback-${ctx.from.id}`
    }

    if (ctx.from?.id)
      return `user-${ctx.from.id}`

    return 'global-session'
  },
})

export default sessionMiddleware
