import { eq } from 'drizzle-orm'

import db from '@/db'
import { users } from '@/db/schema'
import createBotHandler from '@/utils/createBotHandler'

const userMiddleware = createBotHandler(async (ctx, next) => {
  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, ctx.from.id),
  })

  if (!user) {
    await db.insert(users).values([
      {
        telegramId: ctx.from.id,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      },
    ])
  }

  return await next()
})

export default userMiddleware
