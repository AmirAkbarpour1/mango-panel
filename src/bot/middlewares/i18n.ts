import { I18n } from '@grammyjs/i18n'

import type { BotContext } from '@/types/bot'

const i18nMiddleware = new I18n<BotContext>({
  defaultLocale: 'fa',
  directory: 'locales',
  useSession: true,
})

export default i18nMiddleware
