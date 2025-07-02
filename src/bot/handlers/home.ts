import homeKeyboard from '@/bot/keyboards/home'
import { createBotHandler } from '@/utils/createBotHandler'

const homeHandler = createBotHandler(async (ctx) => {
  if (ctx.message) {
    await ctx.reply(ctx.t('messages-home', { name: ctx.from.first_name }), {
      reply_markup: homeKeyboard(ctx.t),
    })
  }
  if (ctx.callbackQuery) {
    await ctx.editMessageText(
      ctx.t('messages-home', { name: ctx.from.first_name }),
      {
        reply_markup: homeKeyboard(ctx.t),
      },
    )
  }
})

export default homeHandler
