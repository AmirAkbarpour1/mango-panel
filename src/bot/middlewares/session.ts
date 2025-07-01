import { session } from 'grammy'

import { DrizzleAdapter } from '@/db/adapter'
import type { BotContext } from '@/types/bot'
import type { SessionData } from '@/types/session'

function initial(): SessionData {
  return { membershipMessagesId: [] }
}

const sessionMiddleware = session<SessionData, BotContext>({
  initial,
  storage: new DrizzleAdapter(),
})

export default sessionMiddleware
