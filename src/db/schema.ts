import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const membershipChannels = sqliteTable('membership_channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: text('channel_id').notNull(),
  title: text('title').notNull(),
})

export const session = sqliteTable('session', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  value: text('data').notNull(),
})
