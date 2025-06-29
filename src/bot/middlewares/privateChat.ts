import type { MiddlewareFn } from 'grammy'

import type { BotContext } from '@/types/context'

const privateChatMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (ctx.chat?.type !== 'private') {
    return
  }
  return await next()
}

export default privateChatMiddleware
