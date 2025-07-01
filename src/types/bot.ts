import type { I18nFlavor } from '@grammyjs/i18n'
import type { Bot, Context, Middleware, SessionFlavor } from 'grammy'

import type { SessionData } from '@/types/session'

export type BotContext = Context & I18nFlavor & SessionFlavor<SessionData>

export type AppBot = Bot<BotContext>

export type BotMiddleWare = Middleware<BotContext>
