import type { TranslateFunction } from '@grammyjs/i18n'
import { InlineKeyboard } from 'grammy'

class BaseKeyboard extends InlineKeyboard {
  private parentCallback: string
  private t: (key: string) => string

  constructor(parentCallback: string, t: TranslateFunction) {
    super()
    this.parentCallback = parentCallback
    this.t = t
  }

  build() {
    this.row()
      .text(this.t('buttons-back'), this.parentCallback)
      .text(this.t('buttons-home'), 'home')
  }
}

export default BaseKeyboard
