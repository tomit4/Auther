import * as dotenv from 'dotenv'
dotenv.config({ path: '../.env' })
import type { Knex } from 'knex'

// Update with your config settings.
const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'pg',
        connection: {
            host: String(process.env.PG_HOST),
            port: Number(process.env.PG_PORT),
            database: String(process.env.PG_DB),
            user: String(process.env.PG_USER),
            password: String(process.env.PG_PASS),
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
            host: String(process.env.PG_HOST),
            port: Number(process.env.PG_PORT),
            database: String(process.env.PG_DB),
            user: String(process.env.PG_USER),
            password: String(process.env.PG_PASS),
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
            host: String(process.env.PG_HOST),
            port: Number(process.env.PG_PORT),
            database: String(process.env.PG_DB),
            user: String(process.env.PG_USER),
            password: String(process.env.PG_PASS),
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
