import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import env from '@/config/env'
import * as schema from '@/db/schema'

const sqlite = new Database(env.DB_FILE_NAME)
const db = drizzle({ client: sqlite, schema })

export default db
