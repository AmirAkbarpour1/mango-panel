import { GrammyError, HttpError } from 'grammy'

import issueKeyboard from '@/bot/keyboards/issue'
import logger from '@/lib/logger'
import type { BotContext } from '@/types/bot'

async function handleError(ctx: BotContext, error: unknown) {
  if (!ctx.from || ctx.chat?.type !== 'private') {
    return
  }
  if (error instanceof GrammyError) {
    logger.error(`Telegram API error: ${error.description}`)
  }
  else if (error instanceof HttpError) {
    logger.error(`HTTP error: ${error.message}`)
  }
  else {
    logger.error('Unhandled Error:', error)
  }

  try {
    if (ctx.message) {
      await ctx.reply(ctx.t('messages-issue', { name: ctx.from.first_name }), {
        reply_markup: issueKeyboard(ctx.t),
      })
    }
    else if (ctx.callbackQuery) {
      await ctx.editMessageText(
        ctx.t('messages-issue', { name: ctx.from.first_name }),
        {
          reply_markup: issueKeyboard(ctx.t),
        },
      )
    }
  }
  catch (innerError) {
    logger.error('Error while sending error message:', innerError)
  }
}

export default handleError
