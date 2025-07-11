import issueKeyboard from '@/bot/keyboards/issue'
import db from '@/db'
import { issues } from '@/db/schema'
import createBotHandler from '@/utils/createBotHandler'

export const issueMiddleware = createBotHandler(async (ctx, next) => {
  if (ctx.callbackQuery?.data === 'issue-report') {
    if (ctx.session.issueMessageId) {
      if (!ctx.chat?.id)
        throw new Error('Chat ID not found in issue handler')

      await ctx.api.editMessageText(
        ctx.chat.id,
        ctx.session.issueMessageId,
        ctx.t('messages-issue', { name: ctx.callbackQuery.from.first_name }),
        { reply_markup: issueKeyboard(ctx.t, 'issue-report') },
      )
    }

    await ctx.editMessageText(ctx.t('messages-issue-report'), {
      reply_markup: issueKeyboard(ctx.t, 'issue-cancel'),
    })

    ctx.session.issueMessageId = ctx.callbackQuery.message?.message_id
  }

  if (ctx.callbackQuery?.data === 'issue-cancel') {
    await ctx.editMessageText(ctx.t('messages-issue-cancel'), {
      reply_markup: issueKeyboard(ctx.t, 'issue-report'),
    })

    ctx.session.issueMessageId = undefined
  }

  if (ctx.session.issueMessageId && ctx.message?.text) {
    if (!ctx.chat?.id)
      throw new Error('Chat ID not found in issue handler')

    await ctx.api.editMessageText(
      ctx.chat.id,
      ctx.session.issueMessageId,
      ctx.t('messages-issue-sent'),
    )

    ctx.session.issueMessageId = undefined

    await db.insert(issues).values({
      issue: ctx.message.text,
      userId: ctx.message.from.id,
    })
  }

  return await next()
})
