import homeKeyboard from '@/bot/keyboards/home'
import type { CallbackQueryBotContext, CommandBotContext } from '@/types/bot'
import createBotHandler from '@/utils/createBotHandler'

const homeHandler = createBotHandler<
  CommandBotContext | CallbackQueryBotContext
>(async (ctx) => {
  if (ctx.message) {
    await ctx.reply(ctx.t('messages-home', { name: ctx.from.first_name }), {
      reply_markup: homeKeyboard(ctx.t),
      reply_parameters: { message_id: ctx.message.message_id },
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
