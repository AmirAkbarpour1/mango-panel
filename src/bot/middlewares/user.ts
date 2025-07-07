import { eq } from 'drizzle-orm'

import db from '@/db'
import { users } from '@/db/schema'
import createBotHandler from '@/utils/createBotHandler'

const userMiddleware = createBotHandler(async (ctx, next) => {
  const from
    = ctx.message?.from || ctx.callbackQuery?.from || ctx.inlineQuery?.from
  if (!from) {
    return await next()
  }
  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, from.id),
  })

  if (!user) {
    await db.insert(users).values([
      {
        telegramId: from.id,
        firstName: from.first_name,
        lastName: from.last_name,
        username: from.username,
      },
    ])
  }

  await ctx.i18n.setLocale('fa')

  return await next()
})

export default userMiddleware
