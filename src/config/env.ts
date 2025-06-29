import process from 'node:process'

import * as v from 'valibot'

const envSchema = v.object({
  TELEGRAM_BOT_TOKEN: v.pipe(v.string(), v.minLength(1)),
  DB_FILE_NAME: v.pipe(v.string(), v.minLength(1)),
})

const envParsed = v.safeParse(envSchema, Bun.env)

if (!envParsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    v.flatten(envParsed.issues),
  )
  process.exit(1)
}

const env: v.InferOutput<typeof envSchema> = envParsed.output

export default env
