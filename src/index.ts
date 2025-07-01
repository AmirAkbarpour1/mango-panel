import { Bot } from 'grammy'

import registerHandlers from '@/bot/handlers/register'
import registerMiddlewares from '@/bot/middlewares/register'
import env from '@/config/env.ts'
import type { AppBot } from '@/types/bot'

const bot: AppBot = new Bot(env.TELEGRAM_BOT_TOKEN)

registerMiddlewares(bot)
registerHandlers(bot)

bot.start()
