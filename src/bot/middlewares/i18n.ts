import { I18n } from '@grammyjs/i18n'

import type { BotContext } from '@/types/context'

const i18nMiddleware = new I18n<BotContext>({
  defaultLocale: 'en',
  directory: 'locales',
})

export default i18nMiddleware
