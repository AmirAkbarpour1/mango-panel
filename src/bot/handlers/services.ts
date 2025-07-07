import { eq } from 'drizzle-orm'
import { InlineKeyboard } from 'grammy'

import db from '@/db'
import { userServices } from '@/db/schema'
import api from '@/lib/api'
import type { User } from '@/types/marzban'
import calculateRemainingDays from '@/utils/calculateRemainingDays'
import createBotHandler from '@/utils/createBotHandler'

const servicesHandler = createBotHandler(async (ctx) => {
  if (ctx.inlineQuery && ctx.inlineQuery.query.startsWith('services-share-')) {
    const userServiceId = Number(ctx.inlineQuery.query.split('-')[2])
    const userService = await db.query.userServices.findFirst({
      where: eq(userServices.id, userServiceId),
      with: { service: true },
    })
    if (!userService)
      return

    const {
      username: name,
      used_traffic,
      data_limit,
      status,
      on_hold_timeout,
    } = await api<User>(`/user/${userService.name}`, {
      panelId: userService.service.panelId,
    })

    const expiration = new Date(
      new Date().getTime() + userService.days * 24 * 60 * 60 * 1000,
    ).toLocaleString(await ctx.i18n.getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const remainingVolume = data_limit! - used_traffic

    const statusEmoji
      = status === 'active' || status === 'on_hold' ? '🟢' : '🔴'

    const shareMessage = ctx.t('messages-services-share-text', {
      name,
      status: statusEmoji,
      expiration,
      days: calculateRemainingDays(on_hold_timeout!),
      totalVolume: data_limit!,
      usedVolume: used_traffic,
      remainingVolume,
    })

    const shareKeyboard = new InlineKeyboard()
      .text(name)
      .text(ctx.t('buttons-services-name'))
      .row()
      .text(statusEmoji)
      .text(ctx.t('buttons-services-status'))
      .row()
      .text(expiration)
      .text(ctx.t('buttons-services-expiration'))
      .row()
      .text(
        ctx.t('buttons-services-days', {
          days: calculateRemainingDays(on_hold_timeout!),
        }),
      )
      .text(ctx.t('buttons-services-days-remaining'))
      .row()
      .text(ctx.t('buttons-services-volume', { volume: data_limit! }))
      .text(ctx.t('buttons-services-volume-total'))
      .row()
      .text(ctx.t('buttons-services-volume', { volume: used_traffic }))
      .text(ctx.t('buttons-services-volume-usaged'))
      .row()
      .text(ctx.t('buttons-services-volume', { volume: remainingVolume }))
      .text(ctx.t('buttons-services-volume-remaining'))
      .row()

    await ctx.answerInlineQuery(
      [
        {
          type: 'article',
          id: String(userServiceId),
          title: name,
          description: ctx.t('buttons-services-share-text'),
          input_message_content: {
            message_text: shareMessage,
          },
        },
        {
          type: 'article',
          id: `${String(userServiceId)}-keyboard`,
          title: name,
          description: ctx.t('buttons-services-share-keyboard'),
          input_message_content: {
            message_text: ctx.t('messages-services-share-keyboard'),
          },
          reply_markup: shareKeyboard,
        },
      ],
      { cache_time: 0 },
    )
  }
})

export default servicesHandler
