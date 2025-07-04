import process from 'node:process'

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME,
  },
})
