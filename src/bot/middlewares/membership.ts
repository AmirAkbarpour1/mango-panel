import type { MiddlewareFn } from 'grammy'
import { GrammyError, InlineKeyboard } from 'grammy'

import db from '@/db'
import logger from '@/lib/logger'
import type { BotContext } from '@/types/context'

const membershipMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id
  if (!userId)
    return await next()

  const channels = await db.query.membershipChannels.findMany()
  const nonMemberChannels: typeof channels = []

  await Promise.all(
    channels.map(async (channel) => {
      try {
        const member = await ctx.api.getChatMember(channel.channelId, userId)
        if (!['member', 'creator', 'administrator'].includes(member.status)) {
          nonMemberChannels.push(channel)
        }
      }
      catch (error: unknown) {
        if (error instanceof GrammyError) {
          logger.error(`Telegram API error while checking membership in channel ${channel.title}: ${error.description}`)
        }
        else {
          logger.error(`Unknown error while checking membership in channel ${channel.title}: ${JSON.stringify(error)}`)
        }
      }
    }),
  )

  if (nonMemberChannels.length > 0) {
    const keyboard = new InlineKeyboard()

    for (const channel of nonMemberChannels) {
      try {
        const chatInfo = await ctx.api.getChat(channel.channelId)

        let channelLink: string | undefined

        if (chatInfo.username) {
          channelLink = `https://t.me/${chatInfo.username}`
        }
        else if (chatInfo.invite_link) {
          channelLink = chatInfo.invite_link
        }

        if (channelLink) {
          keyboard.row().url(channel.title, channelLink)
        }
      }
      catch (error) {
        logger.error(`Error retrieving information for channel ${channel.title}: ${JSON.stringify(error)}`)
      }
    }

    await ctx.reply(
      ctx.t('membership-join-required', { user: ctx.from?.first_name }),
      { reply_markup: keyboard },
    )

    return
  }

  return await next()
}

export default membershipMiddleware
