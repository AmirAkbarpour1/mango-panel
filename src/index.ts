import { Bot } from 'grammy'

import i18nMiddleware from '@/bot/middlewares/i18n'
import membershipMiddleware from '@/bot/middlewares/membership'
import privateChatMiddleware from '@/bot/middlewares/privateChat'
import sessionMiddleware from '@/bot/middlewares/session'
import env from '@/config/env.ts'
import type { BotContext } from '@/types/context'

const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN)

bot.use(
  privateChatMiddleware,
  sessionMiddleware,
  i18nMiddleware,
  membershipMiddleware,
)

bot.start()
