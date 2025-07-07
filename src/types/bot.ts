import type { I18nFlavor } from '@grammyjs/i18n'
import type {
  Bot,
  CallbackQueryContext,
  CommandContext,
  Context,
  Filter,
  HearsContext,
  InlineQueryContext,
  SessionFlavor,
} from 'grammy'

import type { SessionData } from '@/types/session'

export type BotContext = Context & I18nFlavor & SessionFlavor<SessionData>

export type AppBot = Bot<BotContext>

export type HearsBotContext = HearsContext<BotContext>

export type MessageBotContext = Filter<BotContext, 'message'>

export type CommandBotContext = CommandContext<BotContext>

export type CallbackQueryBotContext = CallbackQueryContext<BotContext>

export type InlineQueryBotContext = InlineQueryContext<BotContext>
