import i18nMiddleware from '@/bot/middlewares/i18n'
import membershipMiddleware from '@/bot/middlewares/membership'
import privateChatMiddleware from '@/bot/middlewares/privateChat'
import sessionMiddleware from '@/bot/middlewares/session'
import type { AppBot } from '@/types/bot'

async function registerMiddlewares(bot: AppBot) {
  bot.use(privateChatMiddleware)
  bot.use(sessionMiddleware)
  bot.use(i18nMiddleware)
  bot.use(membershipMiddleware)
}

export default registerMiddlewares
