import type { I18nFlavor } from '@grammyjs/i18n'
import type { Context, SessionFlavor } from 'grammy'

import type { SessionData } from '@/types/session'

export type BotContext = Context & I18nFlavor & SessionFlavor<SessionData>
