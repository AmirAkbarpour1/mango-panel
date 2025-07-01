import { GrammyError, InlineKeyboard } from 'grammy'

import homeKeyboard from '@/bot/keyboards/home'
import db from '@/db'
import logger from '@/lib/logger'
import type { BotMiddleWare } from '@/types/bot'

const membershipMiddleware: BotMiddleWare = async (ctx, next) => {
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
          logger.error(
            `Telegram API error while checking membership in channel ${channel.title}: ${error.description}`,
          )
        }
        else {
          logger.error(
            `Unknown error while checking membership in channel ${channel.title}: ${JSON.stringify(error)}`,
          )
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
        logger.error(
          `Error retrieving information for channel ${channel.title}: ${JSON.stringify(error)}`,
        )
      }
    }

    keyboard
      .row()
      .text(ctx.t('membership-check'), 'membership-check')
      .row()
      .text(
        ctx.t('membership-check-time', {
          time: new Date().toLocaleString(await ctx.i18n.getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        }),
      )

    if (ctx.message) {
      const sentMessage = await ctx.reply(
        ctx.t('membership-join-required', { name: ctx.from.first_name }),
        { reply_markup: keyboard },
      )

      ctx.session.membershipMessagesId?.push(sentMessage.message_id)
      return
    }

    if (
      ctx.callbackQuery
      && ctx.callbackQuery.data !== 'membership-check'
      && ctx.callbackQuery.message
    ) {
      await ctx.editMessageText(
        ctx.t('membership-join-required', { name: ctx.from.first_name }),
        {
          reply_markup: keyboard,
        },
      )
      ctx.session.membershipMessagesId?.push(
        ctx.callbackQuery.message.message_id,
      )
      return
    }

    if (ctx.callbackQuery?.data === 'membership-check') {
      await ctx.answerCallbackQuery({
        text: ctx.t('membership-checking'),
        show_alert: true,
      })

      if (ctx.chat?.id) {
        try {
          await ctx.editMessageReplyMarkup({
            reply_markup: keyboard,
          })
        }
        catch (error) {
          if (
            error instanceof GrammyError
            && error.description?.includes('message is not modified')
          ) {
            logger.warn('Message is not modified, skipping update.')
          }
          else {
            logger.error('Error while updating message reply markup:', error)
          }
        }
      }
    }

    return
  }
  else if (ctx.callbackQuery?.data === 'membership-check' && ctx.chat?.id) {
    try {
      if (ctx.session.membershipMessagesId) {
        for (const messageId of ctx.session.membershipMessagesId) {
          await ctx.api.editMessageText(
            ctx.chat.id,
            messageId,
            ctx.t('messages-home', { name: ctx.from.first_name }),
            { reply_markup: homeKeyboard(ctx.t) },
          )
        }
      }
      ctx.session.membershipMessagesId = []
    }
    catch (error) {
      if (
        error instanceof GrammyError
        && error.description?.includes('message is not modified')
      ) {
        logger.warn('Message is not modified, skipping update.')
      }
      else {
        logger.error('Error while updating message:', error)
      }
    }
  }

  return await next()
}

export default membershipMiddleware
