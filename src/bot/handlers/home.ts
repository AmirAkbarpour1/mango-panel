import homeKeyboard from '@/bot/keyboards/home'
import type { BotMiddleWare } from '@/types/bot'

const homeHandler: BotMiddleWare = async (ctx) => {
  const userId = ctx.from?.id
  if (!userId)
    return
  if (ctx.callbackQuery) {
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
}

export default homeHandler
