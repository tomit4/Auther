import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyPluginCallback,
    HookHandlerDoneFunction,
} from 'fastify'
import * as fp from 'fastify-plugin'
import knex from 'knex'

const knexPlugin: FastifyPluginCallback = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    next: HookHandlerDoneFunction,
) => {
    try {
        const handler = knex(options)
        if (!fastify.knex)
            fastify
                .decorate('knex', handler)
                .addHook(
                    'onClose',
                    (
                        fastifyInstance: FastifyInstance,
                        done: HookHandlerDoneFunction,
                    ) => {
                        if (fastifyInstance.knex === handler)
                            fastifyInstance.knex.destroy()
                        done()
                    },
                )
        next()
    } catch (err) {
        if (err instanceof Error) next(err)
    }
}

const plugin = fp.default(knexPlugin, {
    name: 'fastify-knex-plugin',
})

export default plugin
