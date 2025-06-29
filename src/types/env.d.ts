declare module 'bun' {
  interface Env {
    TELEGRAM_BOT_TOKEN: string
    DB_FILE_NAME: string
  }
}
