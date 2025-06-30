import { eq } from 'drizzle-orm'
import type { StorageAdapter } from 'grammy'

import db from '@/db/index'
import { session as sessionsTable } from '@/db/schema'

export class DrizzleAdapter<T> implements StorageAdapter<T> {
  async read(key: string) {
    const session = await db.query.session.findFirst({
      where: eq(sessionsTable.key, key),
    })

    return session?.value ? (JSON.parse(session.value) as T) : undefined
  }

  async write(key: string, data: T) {
    const value = JSON.stringify(data)

    await db.insert(sessionsTable).values({ key, value }).onConflictDoUpdate({
      target: sessionsTable.key,
      set: { value },
    })
  }

  async delete(key: string) {
    await db.delete(sessionsTable).where(eq(sessionsTable.key, key))
  }
}
