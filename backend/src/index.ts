import 'dotenv/config'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import registerRoutes from './lib/routes'
import registerPlugins from './lib/plugins'

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
