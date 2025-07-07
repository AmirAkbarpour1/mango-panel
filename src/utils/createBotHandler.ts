import type { MiddlewareFn } from 'grammy'

import type { BotContext } from '@/types/bot'
import handleBotError from '@/utils/handleBotError'

function isUserHandler(
  ctx: BotContext,
): ctx is BotContext & { from: NonNullable<BotContext['from']> } {
  return Boolean(ctx.from)
}

function createBotHandler(
  callback: MiddlewareFn<
    BotContext & { from: NonNullable<BotContext['from']> }
  >,
): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    if (!isUserHandler(ctx)) {
      return await next()
    }

    try {
      await callback(ctx, next)
    }
    catch (error) {
      await handleBotError(ctx, error)
    }
  }
}

export default createBotHandler
