import Fastify from 'fastify'
import 'dotenv/config'
const fastify = Fastify({ logger: true })
import registerRoutes from './lib/routes'
import registerPlugins from './lib/plugins'

const start = async (): Promise<string> => {
    try {
        await registerRoutes(fastify)
        await registerPlugins(fastify)
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
