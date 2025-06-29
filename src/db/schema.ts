import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const membershipChannels = sqliteTable('membership_channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: text('channel_id').notNull(),
  title: text('title').notNull(),
})
