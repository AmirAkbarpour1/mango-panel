import type { MiddlewareFn } from 'grammy'

import type { BotContext } from '@/types/bot'
import handleBotError from '@/utils/handleBotError'

function createBotHandler<C extends BotContext>(
  callback: MiddlewareFn<C>,
): MiddlewareFn<C> {
  return async (ctx, next) => {
    try {
      await callback(ctx, next)
    }
    catch (error) {
      await handleBotError(ctx, error)
    }
  }
}

export default createBotHandler
