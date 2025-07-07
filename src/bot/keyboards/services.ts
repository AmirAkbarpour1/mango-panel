import type { BotContext } from '@/types/bot'
import type { User } from '@/types/marzban'
import BaseKeyboard from '@/utils/basekeyboard'

async function serviceKeyboard(
  ctx: BotContext,
  userServiceId: number,
  name: string,
  status: User['status'],
  days: number,
  totalVolume: number,
  usedVolume: number,
) {
  const keyboard = new BaseKeyboard({
    ctx,
    prefix: 'services',
    parentCallback: 'services',
  })

  const { t, i18n } = ctx

  const expiration = new Date(
    new Date().getTime() + days * 24 * 60 * 60 * 1000,
  ).toLocaleString(await i18n.getLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const remainingVolume = totalVolume - usedVolume

  const statusEmoji = status === 'active' || status === 'on_hold' ? '🟢' : '🔴'

  const shareMessage = ctx.t('messages-services-share-text', {
    name,
    status: statusEmoji,
    expiration,
    days,
    totalVolume,
    usedVolume,
    remainingVolume,
  })

  keyboard
    .text(t('buttons-services-sub'), `services-sub-${userServiceId}`)
    .row()
    .text(name)
    .text(t('buttons-services-name'))
    .row()
    .text(statusEmoji)
    .text(t('buttons-services-status'))
    .row()
    .text(expiration)
    .text(t('buttons-services-expiration'))
    .row()
    .text(t('buttons-services-days', { days }))
    .text(t('buttons-services-days-remaining'))
    .row()
    .text(t('buttons-services-volume', { volume: totalVolume }))
    .text(t('buttons-services-volume-total'))
    .row()
    .text(t('buttons-services-volume', { volume: usedVolume }))
    .text(t('buttons-services-volume-usaged'))
    .row()
    .text(t('buttons-services-volume', { volume: remainingVolume }))
    .text(t('buttons-services-volume-remaining'))
    .row()
    .copyText(t('buttons-services-copy'), shareMessage)
    .row()
    .switchInline(
      t('buttons-services-share'),
      `services-share-${userServiceId}`,
    )
    .build()

  return keyboard
}

export default serviceKeyboard
