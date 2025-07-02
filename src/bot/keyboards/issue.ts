import type { TranslateFunction } from '@grammyjs/i18n'
import { InlineKeyboard } from 'grammy'

function issueKeyboard(
  t: TranslateFunction,
  type: 'issue-report' | 'issue-cancel' = 'issue-report',
) {
  const keyboard = new InlineKeyboard()

  if (type === 'issue-report') {
    keyboard.text(t('buttons-issue'), 'issue-report')
  }
  else if (type === 'issue-cancel') {
    keyboard.text(t('buttons-issue-cancel'), 'issue-cancel')
  }

  return keyboard
}

export default issueKeyboard
