import { eq } from 'drizzle-orm'
import { isResponseError } from 'up-fetch'
import * as v from 'valibot'

import homeKeyboard from '@/bot/keyboards/home'
import serviceKeyboard from '@/bot/keyboards/services'
import db from '@/db'
import {
  categories as categoriesTable,
  services,
  users,
  userServices,
  walletTransactions,
} from '@/db/schema'
import api from '@/lib/api'
import type { User } from '@/types/marzban'
import BaseKeyboard from '@/utils/basekeyboard'
import buildBreadcrumb from '@/utils/buildBreadcrumb'
import calculateRemainingDays from '@/utils/calculateRemainingDays'
import createBotHandler from '@/utils/createBotHandler'
import createName from '@/utils/createName'

async function findUser(telegramId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  })
  if (!user)
    throw new Error('User not found in buy handler')
  return user
}

async function findService(serviceId: number) {
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
    with: { panel: true },
  })
  if (!service)
    throw new Error('Service not found in buy handler')
  return service
}

async function findCategory(categoryId: number) {
  const category = await db.query.categories.findFirst({
    where: eq(categoriesTable.id, categoryId),
    with: { children: true, services: true },
  })
  if (!category)
    throw new Error('Category not found in buy handler')
  return category
}

function calculateExpireTimestamp(days: number): number {
  const now = new Date()
  const expireDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return Math.floor(expireDate.getTime() / 1000)
}

const buyHandler = createBotHandler(async (ctx, next) => {
  if (ctx.callbackQuery?.data === 'buy') {
    const categories = await db.query.categories.findMany({
      where: eq(categoriesTable.parentId, 0),
    })

    const keyboard = new BaseKeyboard({ ctx, prefix: 'buy' })
    categories.forEach(category =>
      keyboard.row().text(category.title, `buy-category-${category.id}`),
    )

    return ctx.editMessageText(ctx.t('messages-buy'), {
      reply_markup: keyboard.build(),
    })
  }

  if (ctx.callbackQuery?.data?.startsWith('buy-category')) {
    const categoryId = Number(ctx.callbackQuery.data.split('-')[2])
    const category = await findCategory(categoryId)

    const keyboard = new BaseKeyboard({
      ctx,
      prefix: 'buy',
      parentCallback:
        category.parentId === 0 ? 'buy' : `buy-category-${category.parentId}`,
    })

    category.children.forEach(child =>
      keyboard.row().text(child.title, `buy-category-${child.id}`),
    )
    category.services.forEach(service =>
      keyboard.row().text(service.title, `buy-service-${service.id}`),
    )

    return ctx.editMessageText(ctx.t('messages-buy'), {
      reply_markup: keyboard.build(),
    })
  }

  if (ctx.callbackQuery?.data?.startsWith('buy-service')) {
    if (ctx.session.buy.isBuying) {
      return ctx.answerCallbackQuery({
        text: ctx.t('messages-buy-in-progress'),
        show_alert: true,
      })
    }

    const serviceId = Number(ctx.callbackQuery.data.split('-')[2])
    const service = await findService(serviceId)
    const user = await findUser(ctx.from.id)

    const balance = user.walletBalance - service.basePrice
    if (balance < 0) {
      return ctx.editMessageText(ctx.t('messages-buy-not-enough-money'), {
        reply_markup: new BaseKeyboard({
          ctx,
          prefix: 'buy',
          parentCallback: `buy-category-${service.categoryId}`,
        })
          .text(ctx.t('buttons-wallet'), 'wallet')
          .build(),
      })
    }

    if (!ctx.callbackQuery.message?.message_id)
      throw new Error('Message ID not found in buy handler')

    if (service.nameMode !== 'custom') {
      ctx.session.buy = {
        isBuying: true,
        messageId: ctx.callbackQuery.message.message_id,
        serviceId: service.id,
        step: 'confirm',
        name: createName({
          nameMode: service.nameMode,
          namePrefix: service.namePrefix ?? undefined,
        }),
        volume: service.isDynamic ? 0 : service.fixedVolume!,
        days: service.isDynamic ? 0 : service.fixedDays!,
      }
    }
    else {
      ctx.session.buy = {
        isBuying: true,
        messageId: ctx.callbackQuery.message.message_id,
        serviceId: service.id,
        step: 'awaiting_name',
      }
      return ctx.editMessageText(ctx.t('messages-buy-awaiting-name'))
    }

    if (service.isDynamic) {
      ctx.session.buy = {
        ...ctx.session.buy,
        step: 'awaiting_volume',
      }
      return ctx.editMessageText(ctx.t('messages-buy-awaiting-volume'))
    }

    const breadcrumb = await buildBreadcrumb(service)

    return ctx.editMessageText(
      ctx.t('messages-buy-confirm', {
        breadcrumb,
        name: ctx.session.buy.name,
        days: service.fixedDays!,
        volume: service.fixedVolume!,
        price: service.basePrice,
        wallet: user.walletBalance,
      }),
      {
        reply_markup: new BaseKeyboard({
          ctx,
          prefix: 'buy',
          parentCallback: `buy-cancel-${service.categoryId}`,
          homeCallback: 'buy-cancel-home',
        })
          .text(ctx.t('buttons-buy-confirm'), `buy-confirm`)
          .build(),
      },
    )
  }

  if (
    ctx.callbackQuery?.data === 'buy-confirm'
    && ctx.session.buy.isBuying
    && ctx.session.buy.step === 'confirm'
  ) {
    const service = await findService(ctx.session.buy.serviceId)
    const user = await findUser(ctx.from.id)

    const name = ctx.session.buy.name
    const volume = service.isDynamic
      ? ctx.session.buy.volume
      : service.fixedVolume
    const days = service.isDynamic ? ctx.session.buy.days : service.fixedDays

    if (!days || !name || !volume)
      throw new Error('Incomplete buy session data in buy-confirm handler')

    const expireTimestamp = calculateExpireTimestamp(days)

    const userResponse = await api<User>('/user', {
      method: 'POST',
      body: {
        data_limit: volume,
        data_limit_reset_strategy: 'no_reset',
        on_hold_expire_duration: 0,
        on_hold_timeout: expireTimestamp,
        proxies: { vless: {} },
        status: 'active',
        username: name,
      },
      panelId: service.panelId,
    })

    let price = service.basePrice

    if (service.isDynamic) {
      if (!ctx.session.buy.volume || !ctx.session.buy.days) {
        throw new Error(
          'Dynamic service details are incomplete in buy-confirm handler',
        )
      }

      price
        = service.pricePerGB! * ctx.session.buy.volume
          + service.pricePerDay! * ctx.session.buy.days
    }

    const balance = user.walletBalance - price

    await db
      .update(users)
      .set({ walletBalance: balance })
      .where(eq(users.telegramId, ctx.from.id))

    await db.insert(walletTransactions).values({
      userId: user.id,
      type: 'purchase',
      amount: price,
      description: `Purchase of service: ${service.title}`,
    })

    const [userService] = await db
      .insert(userServices)
      .values({
        serviceId: service.id,
        userId: user.id,
        name,
        days,
        volume,
        basePrice: price,
        finalPrice: price,
      })
      .returning({ id: userServices.id })

    if (!userService)
      throw new Error('user Service did not created in buy Handler')

    ctx.session.buy = { isBuying: false }

    const keyboard = await serviceKeyboard(
      ctx,
      userService.id,
      userResponse.username,
      userResponse.status,
      calculateRemainingDays(userResponse.on_hold_timeout!),
      userResponse.data_limit!,
      userResponse.lifetime_used_traffic,
    )

    return ctx.editMessageText(ctx.t('messages-services-service'), {
      reply_markup: keyboard,
    })
  }

  if (ctx.callbackQuery?.data?.startsWith('buy-cancel')) {
    ctx.session.buy = { isBuying: false }

    if (ctx.callbackQuery.data === 'buy-cancel') {
      ctx.answerCallbackQuery({
        text: ctx.t('messages-buy-cancelled'),
        show_alert: true,
      })
      const categories = await db.query.categories.findMany({
        where: eq(categoriesTable.parentId, 0),
      })

      const keyboard = new BaseKeyboard({ ctx, prefix: 'buy' })
      categories.forEach(category =>
        keyboard.row().text(category.title, `buy-category-${category.id}`),
      )

      return ctx.editMessageText(ctx.t('messages-buy'), {
        reply_markup: keyboard.build(),
      })
    }

    if (ctx.callbackQuery.data === 'buy-cancel-home') {
      return ctx.editMessageText(
        ctx.t('messages-home', { name: ctx.from.first_name }),
        { reply_markup: homeKeyboard(ctx.t) },
      )
    }

    const categoryId = Number(ctx.callbackQuery.data.split('-')[2])
    const category = await findCategory(categoryId)

    const keyboard = new BaseKeyboard({
      ctx,
      prefix: 'buy',
      parentCallback:
        category.parentId === 0 ? 'buy' : `buy-category-${category.parentId}`,
    })

    category.children.forEach(child =>
      keyboard.row().text(child.title, `buy-category-${child.id}`),
    )
    category.services.forEach(service =>
      keyboard.row().text(service.title, `buy-service-${service.id}`),
    )

    return ctx.editMessageText(ctx.t('messages-buy'), {
      reply_markup: keyboard.build(),
    })
  }

  if (ctx.message?.text) {
    if (!ctx.session.buy?.isBuying)
      return await next()

    const messageId = ctx.message.message_id
    const userMessage = ctx.message.text.trim()
    const service = await findService(ctx.session.buy.serviceId)
    const user = await findUser(ctx.from.id)
    const breadcrumb = await buildBreadcrumb(service)

    if (ctx.session.buy.step === 'awaiting_name') {
      const result = v.safeParse(
        v.pipe(
          v.string(),
          v.regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9_]*[a-zA-Z0-9])?$/),
          v.minLength(3),
          v.maxLength(32),
        ),
        userMessage,
      )

      if (!result.success) {
        return ctx.reply(ctx.t('messages-buy-invalid-name'), {
          reply_parameters: { message_id: messageId },
        })
      }

      try {
        await api<User>(`/user/${userMessage}`, {
          panelId: service.panelId,
        })
      }
      catch (error) {
        if (isResponseError(error) && error.status === 404) {
          return ctx.reply(ctx.t('messages-buy-duplicate-name'), {
            reply_parameters: { message_id: messageId },
          })
        }

        throw error
      }

      ctx.session.buy = {
        ...ctx.session.buy,
        name: userMessage,
        step: 'awaiting_volume',
      }
      return ctx.reply(ctx.t('messages-buy-awaiting-volume'), {
        reply_parameters: { message_id: messageId },
      })
    }

    if (ctx.session.buy.step === 'awaiting_volume') {
      const volume = Number(userMessage)
      const result = v.safeParse(v.pipe(v.number(), v.minValue(1)), volume)

      if (!result.success) {
        return ctx.reply(ctx.t('messages-buy-invalid-volume'), {
          reply_parameters: { message_id: messageId },
        })
      }

      ctx.session.buy = { ...ctx.session.buy, volume, step: 'awaiting_days' }
      return ctx.reply(ctx.t('messages-buy-awaiting-days'), {
        reply_parameters: { message_id: messageId },
      })
    }

    if (ctx.session.buy.step === 'awaiting_days') {
      const days = Number(userMessage)
      const result = v.safeParse(v.pipe(v.number(), v.minValue(1)), days)

      if (!result.success) {
        return ctx.reply(ctx.t('messages-buy-invalid-days'), {
          reply_parameters: { message_id: messageId },
        })
      }

      ctx.session.buy = { ...ctx.session.buy, days, step: 'confirm' }

      if (
        !ctx.session.buy.name
        || !ctx.session.buy.volume
        || !service.pricePerGB
        || !service.pricePerDay
      ) {
        throw new Error('Session or service data is incomplete in buy handler')
      }

      const price
        = service.pricePerGB * ctx.session.buy.volume + service.pricePerDay * days

      return ctx.reply(
        ctx.t('messages-buy-confirm', {
          breadcrumb,
          name: ctx.session.buy.name,
          days,
          volume: ctx.session.buy.volume,
          price,
          wallet: user.walletBalance,
        }),
        {
          reply_markup: new BaseKeyboard({
            ctx,
            prefix: 'buy',
            parentCallback: `buy-cancel-${service.categoryId}`,
            homeCallback: 'buy-cancel-home',
          })
            .text(ctx.t('buttons-buy-confirm'), `buy-confirm`)
            .build(),
          reply_parameters: { message_id: messageId },
        },
      )
    }
  }
})

export default buyHandler
