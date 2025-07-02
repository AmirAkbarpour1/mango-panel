import { relations } from 'drizzle-orm'
import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

/** Tabels */
export const membershipChannels = sqliteTable('membership_channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: text('channel_id').notNull(),
  title: text('title').notNull(),
})

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  value: text('data').notNull(),
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: integer('telegram_id').unique().notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  username: text('username'),
  walletBalance: real('wallet_balance').notNull().default(0),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const walletTransactions = sqliteTable('wallet_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  type: text('type', { enum: ['charge', 'purchase', 'refund'] }).notNull(),
  amount: real('amount').notNull(),
  description: text('description'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const panels = sqliteTable('panels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  title: text('title').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const panelInbounds = sqliteTable(
  'panel_inbounds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    panelId: integer('panel_id').notNull(),
    inboundTag: text('inbound_tag').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  },
  table => [unique().on(table.panelId, table.inboundTag)],
)

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  parentId: integer('parent_id').notNull().default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  basePrice: real('base_price').notNull(),
  pricePerDay: real('price_per_day'),
  pricePerGB: real('price_per_gb'),
  isDynamic: integer('is_dynamic').notNull().default(0),
  categoryId: integer('category_id').notNull(),
  panelId: integer('panel_id').notNull(),
  allowCustomName: integer('allow_custom_name').notNull().default(0),
  namePrefix: text('name_prefix'),
  useRandomName: integer('use_random_name').notNull().default(1),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const serviceInbounds = sqliteTable('service_inbounds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').notNull(),
  inboundId: integer('inbound_id').notNull(),
})

export const discountCodes = sqliteTable('discount_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').unique().notNull(),
  discountPercent: real('discount_percent').notNull(),
  maxUsage: integer('max_usage').notNull(),
  usedCount: integer('used_count').notNull().default(0),
  expireAt: text('expire_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const userServices = sqliteTable('user_services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  serviceId: integer('service_id').notNull(),
  status: text('status', {
    enum: ['pending', 'confirmed', 'active', 'expired', 'canceled'],
  })
    .notNull()
    .default('pending'),
  customPrice: real('custom_price'),
  customVolume: real('custom_volume'),
  customDuration: integer('custom_duration'),
  customName: text('custom_name'),
  discountCode: text('discount_code'),
  finalPrice: real('final_price'),
  adminNote: text('admin_note'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  issue: text('issue').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

/** Relations */
export const usersRelations = relations(users, ({ many }) => ({
  walletTransactions: many(walletTransactions),
  userServices: many(userServices),
  issues: many(issues),
}))

export const walletTransactionsRelations = relations(
  walletTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [walletTransactions.userId],
      references: [users.id],
    }),
  }),
)

export const panelsRelations = relations(panels, ({ many }) => ({
  inbounds: many(panelInbounds),
  services: many(services),
}))

export const panelInboundsRelations = relations(
  panelInbounds,
  ({ one, many }) => ({
    panel: one(panels, {
      fields: [panelInbounds.panelId],
      references: [panels.id],
    }),
    serviceInbounds: many(serviceInbounds), // 👈 همین جدول میانی
  }),
)

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  services: many(services),
}))

export const servicesRelations = relations(services, ({ many, one }) => ({
  panel: one(panels, { fields: [services.panelId], references: [panels.id] }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  userServices: many(userServices),
  serviceInbounds: many(serviceInbounds),
}))

export const serviceInboundsRelations = relations(
  serviceInbounds,
  ({ one }) => ({
    service: one(services, {
      fields: [serviceInbounds.serviceId],
      references: [services.id],
    }),
    inbound: one(panelInbounds, {
      fields: [serviceInbounds.inboundId],
      references: [panelInbounds.id],
    }),
  }),
)

export const userServicesRelations = relations(userServices, ({ one }) => ({
  user: one(users, { fields: [userServices.userId], references: [users.id] }),
  service: one(services, {
    fields: [userServices.serviceId],
    references: [services.id],
  }),
}))

export const issuesRelations = relations(issues, ({ one }) => ({
  user: one(users, { fields: [issues.userId], references: [users.id] }),
}))
