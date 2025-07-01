import type { TranslateFunction } from '@grammyjs/i18n'
import { InlineKeyboard } from 'grammy'

function homeKeyboard(t: TranslateFunction) {
  const keyboard = new InlineKeyboard()

  keyboard
    .text(t('buttons-buyService'), 'buyService')
    .row()
    .text(t('buttons-wallet'), 'wallet')

  return keyboard
}

export default homeKeyboard
