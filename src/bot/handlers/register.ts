import homeHandler from '@/bot/handlers/home'
import type { AppBot } from '@/types/bot'

function registerHandlers(bot: AppBot) {
  bot.command(['start', 'home'], homeHandler).callbackQuery('home', homeHandler)
}

export default registerHandlers
