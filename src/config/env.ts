import * as v from 'valibot';
import 'dotenv/load';
import process from 'node:process';

const envSchema = v.object({
  TELEGRAM_BOT_TOKEN: v.pipe(v.string(), v.minLength(1)),
});

const envParsed = v.safeParse(envSchema, process.env);

if (!envParsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    v.flatten(envParsed.issues),
  );
  process.exit(1);
}

const env: v.InferOutput<typeof envSchema> = envParsed.output;

export default env;
