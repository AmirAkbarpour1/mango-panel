import i18nMiddleware from '@/bot/middlewares/i18n'
import { issueMiddleware } from '@/bot/middlewares/issue'
import membershipMiddleware from '@/bot/middlewares/membership'
import sessionMiddleware from '@/bot/middlewares/session'
import userMiddleware from '@/bot/middlewares/user'
import type { AppBot } from '@/types/bot'

async function registerMiddlewares(bot: AppBot) {
  bot.use(sessionMiddleware)
  bot.use(i18nMiddleware)
  bot.use(userMiddleware)
  bot.use(issueMiddleware)
  bot.use(membershipMiddleware)
}

export default registerMiddlewares
