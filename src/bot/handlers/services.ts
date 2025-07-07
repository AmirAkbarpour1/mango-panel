import { count, desc, eq } from 'drizzle-orm'
import { InlineKeyboard } from 'grammy'

import serviceKeyboard from '@/bot/keyboards/services'
import db from '@/db'
import { users, userServices as userServicesTable } from '@/db/schema'
import api from '@/lib/api'
import type {
  CallbackQueryBotContext,
  InlineQueryBotContext,
} from '@/types/bot'
import type { User } from '@/types/marzban'
import BaseKeyboard from '@/utils/basekeyboard'
import calculateRemainingDays from '@/utils/calculateRemainingDays'
import createBotHandler from '@/utils/createBotHandler'

const PAGE_SIZE = 5

const servicesHandler = createBotHandler<
  InlineQueryBotContext | CallbackQueryBotContext
>(async (ctx) => {
  if (ctx.callbackQuery?.data.startsWith('services-page')) {
    const page = Number(ctx.callbackQuery.data.split('-')[2])
    if (page <= 0 || Number.isNaN(page))
      throw new Error('Invalid page number')

    const user = await db.query.users.findFirst({
      where: eq(users.telegramId, ctx.from.id),
    })
    if (!user)
      throw new Error('User not found')

    const totalServicesCount
      = (
        await db
          .select({ count: count() })
          .from(userServicesTable)
          .where(eq(userServicesTable.userId, user.id))
      )[0]?.count ?? 0

    const userServices = await db.query.userServices.findMany({
      where: eq(userServicesTable.userId, user.id),
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      orderBy: desc(userServicesTable.createdAt),
    })

    const totalPages = Math.ceil(totalServicesCount / PAGE_SIZE)

    if (!userServices.length) {
      return ctx.editMessageText(ctx.t('messages-services'), {
        reply_markup: new BaseKeyboard({ ctx, prefix: 'services' })
          .text(ctx.t('buttons-services-empty'), 'noop')
          .row()
          .text(ctx.t('buttons-buy'), 'buy')
          .build(),
      })
    }

    const keyboard = new BaseKeyboard({ ctx, prefix: 'services' })

    userServices.forEach(({ name, id }) => {
      keyboard.row().text(name, `services-service-${id}-${page}`)
    })

    keyboard.row()

    const rows: string[][] = []
    for (let i = 1; i <= totalPages; i += PAGE_SIZE) {
      const row = Array.from({ length: PAGE_SIZE }, (_, j) => {
        const num = i + j
        return num <= totalPages ? num.toString() : '0'
      })
      rows.push(row.reverse())
    }

    rows.forEach((row) => {
      keyboard.inline_keyboard.push(
        row.map((pageNum) => {
          const num = Number(pageNum)
          return {
            text:
              num === 0 ? ' ' : num === page ? `🔸${pageNum}🔸` : `${pageNum}`,
            callback_data: num === 0 ? 'noop' : `services-page-${pageNum}`,
          }
        }),
      )
    })

    keyboard.row()

    keyboard
      .text(
        page < totalPages
          ? ctx.t('buttons-next', { emoji: '🟢' })
          : ctx.t('buttons-next', { emoji: '🔴' }),
        page < totalPages ? `services-page-${page + 1}` : 'noop',
      )
      .text(
        page > 1
          ? ctx.t('buttons-before', { emoji: '🟢' })
          : ctx.t('buttons-before', { emoji: '🔴' }),
        page > 1 ? `services-page-${page - 1}` : 'noop',
      )

    return ctx.editMessageText(ctx.t('messages-services'), {
      reply_markup: keyboard.build(),
    })
  }

  if (ctx.callbackQuery?.data.startsWith('services-service')) {
    const [_, __, id, page] = ctx.callbackQuery.data.split('-')
    const userServiceId = Number(id)
    const pageNumber = Number(page)

    if (pageNumber <= 0 || Number.isNaN(pageNumber))
      throw new Error('Invalid page number')

    const userService = await db.query.userServices.findFirst({
      where: eq(userServicesTable.id, userServiceId),
      with: { service: true, user: true },
    })

    if (!userService || userService.user.telegramId !== ctx.from.id)
      throw new Error('User service not found or not owned')

    const { username, used_traffic, data_limit, status, on_hold_timeout }
      = await api<User>(`/user/${userService.name}`, {
        panelId: userService.service.panelId,
      })

    const keyboard = await serviceKeyboard(
      ctx,
      userServiceId,
      username,
      status,
      calculateRemainingDays(on_hold_timeout!),
      data_limit!,
      used_traffic,
      `services-page-${pageNumber}`,
    )

    return ctx.editMessageText(ctx.t('messages-services-service'), {
      reply_markup: keyboard,
    })
  }

  if (ctx.inlineQuery?.query.startsWith('services-share')) {
    const userServiceId = Number(ctx.inlineQuery.query.split('-')[2])
    const userService = await db.query.userServices.findFirst({
      where: eq(userServicesTable.id, userServiceId),
      with: { service: true, user: true },
    })

    if (!userService || userService.user.telegramId !== ctx.from.id)
      return

    const { username, used_traffic, data_limit, status, on_hold_timeout }
      = await api<User>(`/user/${userService.name}`, {
        panelId: userService.service.panelId,
      })

    const expiration = new Date(
      Date.now() + userService.days * 86400000,
    ).toLocaleString(await ctx.i18n.getLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

    const remainingVolume = data_limit! - used_traffic
    const statusEmoji = ['active', 'on_hold'].includes(status) ? '🟢' : '🔴'

    const shareMessage = ctx.t('messages-services-share-text', {
      name: username,
      status: statusEmoji,
      expiration,
      days: calculateRemainingDays(on_hold_timeout!),
      totalVolume: data_limit!,
      usedVolume: used_traffic,
      remainingVolume,
    })

    const shareKeyboard = new InlineKeyboard()
      .text(username)
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

    return ctx.answerInlineQuery(
      [
        {
          type: 'article',
          id: String(userServiceId),
          title: username,
          description: ctx.t('buttons-services-share-text'),
          input_message_content: { message_text: shareMessage },
        },
        {
          type: 'article',
          id: `${userServiceId}-keyboard`,
          title: username,
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
