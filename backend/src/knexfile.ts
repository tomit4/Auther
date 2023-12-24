import * as dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import type { Knex } from 'knex'

// Update with your config settings.
const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST as string,
            port: process.env.PG_PORT as unknown as number,
            database: process.env.PG_DB as string,
            user: process.env.PG_USER as string,
            password: process.env.PG_PASS as string,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },

    staging: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST as string,
            port: process.env.PG_PORT as unknown as number,
            database: process.env.PG_DB as string,
            user: process.env.PG_USER as string,
            password: process.env.PG_PASS as string,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },

    production: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST as string,
            port: process.env.PG_PORT as unknown as number,
            database: process.env.PG_DB as string,
            user: process.env.PG_USER as string,
            password: process.env.PG_PASS as string,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },
}

export default config
