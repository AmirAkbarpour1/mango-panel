import { InlineKeyboard } from 'grammy'

import homeKeyboard from '@/bot/keyboards/home'
import db from '@/db'
import { createBotHandler } from '@/utils/createBotHandler'

const membershipMiddleware = createBotHandler(async (ctx, next) => {
  const channels = await db.query.membershipChannels.findMany()
  const nonMemberChannels: typeof channels = []

  for (const channel of channels) {
    const member = await ctx.api.getChatMember(channel.channelId, ctx.from.id)
    if (!['member', 'creator', 'administrator'].includes(member.status)) {
      nonMemberChannels.push(channel)
    }
  }

  if (nonMemberChannels.length === 0) {
    if (ctx.callbackQuery?.data === 'membership-check' && ctx.chat?.id) {
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

    return await next()
  }

  const keyboard = new InlineKeyboard()

  for (const channel of nonMemberChannels) {
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
  else if (
    ctx.callbackQuery?.message
    && ctx.callbackQuery.data !== 'membership-check'
  ) {
    await ctx.editMessageText(
      ctx.t('membership-join-required', { name: ctx.from.first_name }),
      { reply_markup: keyboard },
    )
    ctx.session.membershipMessagesId?.push(ctx.callbackQuery.message.message_id)
    return
  }
  else if (ctx.callbackQuery?.data === 'membership-check') {
    await ctx.answerCallbackQuery({
      text: ctx.t('membership-checking'),
      show_alert: true,
    })

    await ctx.editMessageReplyMarkup({
      reply_markup: keyboard,
    })
    return
  }

  return await next()
})

export default membershipMiddleware
