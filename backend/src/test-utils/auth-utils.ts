import 'dotenv/config'
import type { FastifyInstance } from 'fastify'
import knexConfig from '../knexfile'
const knexFile = knexConfig.development
import knexPlugin from '../lib/plugins/knex'
import userService from '../lib/services/user-service'

const registerPlugins = async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(import('@fastify/cookie'), {
        secret: process.env.COOKIE_SECRET as string,
        hook: 'onRequest',
    })
    await fastify.register(import('fastify-bcrypt'))
    await fastify.register(import('@fastify/redis'), {
        host: process.env.REDIS_HOST as string,
        port: process.env.REDIS_PORT as unknown as number,
    })
    await fastify.register(knexPlugin, knexFile)
    await fastify.register(import('@fastify/jwt'), {
        secret: process.env.JWT_SECRET as string,
    })
    await fastify.register(userService)
}

export default registerPlugins
