import Fastify, { FastifyInstance } from 'fastify'
import 'dotenv/config'
import registerRoutes from './lib/routes'
import registerPlugins from './lib/plugins'

/* TODO: Remove from here and export from custom type file
import knex from 'knex'
type FastifyInstanceWithCustomPlugins = FastifyInstance & {
    knex?: typeof knex
}
const fastify: FastifyInstanceWithCustomPlugins = Fastify()
*/

const fastify: FastifyInstance = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
})

const start = async (): Promise<string> => {
    try {
        await registerPlugins(fastify)
        await registerRoutes(fastify)
        return await fastify.listen({
            port: Number(process.env.PORT),
            host: String(process.env.HOST),
        })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
