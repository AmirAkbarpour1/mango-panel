import buyHandler from '@/bot/handlers/buy'
import homeHandler from '@/bot/handlers/home'
import servicesHandler from '@/bot/handlers/services'
import type { AppBot } from '@/types/bot'

function registerHandlers(bot: AppBot) {
  bot.command(['start', 'home'], homeHandler)
  bot.callbackQuery('home', homeHandler)
  bot.callbackQuery(/buy*/, buyHandler)
  bot.inlineQuery(/services*/, servicesHandler)
}

export default registerHandlers
