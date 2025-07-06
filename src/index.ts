import { Bot, GrammyError, HttpError } from 'grammy'

import registerHandlers from '@/bot/handlers/register'
import registerMiddlewares from '@/bot/middlewares/register'
import env from '@/config/env.ts'
import logger from '@/lib/logger'
import type { AppBot } from '@/types/bot'

const bot: AppBot = new Bot(env.TELEGRAM_BOT_TOKEN)

registerMiddlewares(bot)
registerHandlers(bot)

bot.start().catch((err) => {
  const ctx = err.ctx
  const e = err.error

  if (ctx?.update?.update_id)
    logger.error(`❌ Error while processing update ${ctx.update.update_id}`)

  if (e instanceof GrammyError) {
    logger.error(`🚨 Telegram API error: ${e.description}`)
  }
  else if (e instanceof HttpError) {
    logger.error('🌐 Network error: Could not contact Telegram', e)
  }
  else {
    logger.error('⚙️ Unknown error occurred:', e ?? err)
  }
})
