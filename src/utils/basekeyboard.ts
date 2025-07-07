import { InlineKeyboard } from 'grammy'

import type { BotContext } from '@/types/bot'

class BaseKeyboard extends InlineKeyboard {
  private ctx: BotContext
  private parentCallback?: string
  private homeCallback: string
  private prefix?: string

  constructor({
    ctx,
    parentCallback,
    homeCallback = 'home',
    prefix,
  }: {
    ctx: BotContext
    parentCallback?: string
    homeCallback?: string
    prefix?: string
  }) {
    super()
    this.parentCallback = parentCallback
    this.homeCallback = homeCallback
    this.prefix = prefix
    this.ctx = ctx
  }

  build() {
    if (this.ctx) {
      if (this.ctx.session.buy.isBuying && this.prefix === 'buy') {
        this.row().text(this.ctx.t('buttons-buy-cancel'), 'buy-cancel')
      }
    }
    if (this.parentCallback) {
      this.row()
        .text(this.ctx.t('buttons-back'), this.parentCallback)
        .text(this.ctx.t('buttons-home'), this.homeCallback)
    }
    else {
      this.row().text(this.ctx.t('buttons-home'), this.homeCallback)
    }

    return this
  }
}

export default BaseKeyboard
