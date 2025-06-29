import { Bot } from 'grammy'

import env from '@/config/env.ts'

const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

bot.command('start', ctx => ctx.reply('Welcome! Up and running.'))

bot.start()
