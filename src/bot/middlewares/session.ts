import { session } from 'grammy'

import { DrizzleAdapter } from '@/db/adapter'
import type { BotContext } from '@/types/context'
import type { SessionData } from '@/types/session'

function initial(): SessionData {
  return { membershipMessageId: undefined }
}

const sessionMiddleware = session<SessionData, BotContext>({ initial, storage: new DrizzleAdapter() })

export default sessionMiddleware
