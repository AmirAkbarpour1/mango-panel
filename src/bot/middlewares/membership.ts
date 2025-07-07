import { InlineKeyboard } from 'grammy'

import homeKeyboard from '@/bot/keyboards/home'
import db from '@/db'
import createBotHandler from '@/utils/createBotHandler'

const membershipMiddleware = createBotHandler(async (ctx, next) => {
  const channels = await db.query.membershipChannels.findMany()
  const nonMemberChannels = []

  const from
    = ctx.message?.from || ctx.callbackQuery?.from || ctx.inlineQuery?.from
  if (!from) {
    return await next()
  }

  for (const channel of channels) {
    const member = await ctx.api.getChatMember(channel.channelId, from.id)
    if (!['member', 'creator', 'administrator'].includes(member.status)) {
      nonMemberChannels.push(channel)
    }
  }

  if (nonMemberChannels.length === 0) {
    if (ctx.callbackQuery?.data === 'membership-check') {
      if (!ctx.chat?.id)
        throw new Error('Chat ID not found in membership handler')

      if (ctx.session.membershipMessagesId) {
        for (const messageId of ctx.session.membershipMessagesId) {
          await ctx.api.editMessageText(
            ctx.chat.id,
            messageId,
            ctx.t('messages-home', { name: from.first_name }),
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

    const channelLink = chatInfo.username
      ? `https://t.me/${chatInfo.username}`
      : chatInfo.invite_link

    if (channelLink) {
      keyboard.row().url(channel.title, channelLink)
    }
  }

  if (!ctx.inlineQuery) {
    keyboard
      .row()
      .text(ctx.t('buttons-membership-check'), 'membership-check')
      .row()
      .text(
        ctx.t('buttons-membership-check-time', {
          time: new Date().toLocaleString(await ctx.i18n.getLocale(), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        }),
      )
  }

  if (ctx.message) {
    const sentMessage = await ctx.reply(
      ctx.t('messages-membership', { name: from.first_name }),
      {
        reply_markup: keyboard,
        reply_parameters: { message_id: ctx.message.message_id },
      },
    )

    return ctx.session.membershipMessagesId?.push(sentMessage.message_id)
  }

  if (ctx.callbackQuery?.data === 'membership-check') {
    return await ctx.answerCallbackQuery({
      text: ctx.t('messages-membership-checking'),
      show_alert: true,
    })
  }

  if (ctx.callbackQuery?.message) {
    await ctx.editMessageText(
      ctx.t('messages-membership', { name: from.first_name }),
      { reply_markup: keyboard },
    )

    return ctx.session.membershipMessagesId?.push(
      ctx.callbackQuery.message.message_id,
    )
  }

  if (ctx.inlineQuery) {
    await ctx.answerInlineQuery(
      [
        {
          type: 'article',
          id: 'messages-membership-inline',
          title: ctx.t('buttons-membership-check'),
          input_message_content: {
            message_text: ctx.t('messages-membership-inline', {
              name: from.first_name,
            }),
          },
          reply_markup: keyboard,
        },
      ],
      { cache_time: 0 },
    )

    return ctx.session.membershipMessagesId?.push()
  }

  throw new Error('Callback message not found in membership handler')
})

export default membershipMiddleware
