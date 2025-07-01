import type { BotMiddleWare } from '@/types/bot'

const privateChatMiddleware: BotMiddleWare = async (ctx, next) => {
  if (ctx.chat?.type !== 'private') {
    return
  }
  return await next()
}

export default privateChatMiddleware
