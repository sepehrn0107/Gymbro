import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env', override: true })
console.log('DATABASE_URL:', process.env.DATABASE_URL)

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
