import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyPluginCallback,
    HookHandlerDoneFunction,
} from 'fastify'
import * as fp from 'fastify-plugin'
import knex, { type Knex } from 'knex'

const knexPlugin: FastifyPluginCallback = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    next: HookHandlerDoneFunction,
) => {
    try {
        const knexInstance: Knex = knex(options)
        if (!fastify.knex)
            fastify
                .decorate('knex', knexInstance)
                .addHook(
                    'onClose',
                    (
                        fastifyInstance: FastifyInstance,
                        done: HookHandlerDoneFunction,
                    ) => {
                        if (fastifyInstance.knex === knexInstance)
                            fastifyInstance.knex.destroy()
                        done()
                    },
                )
        next()
    } catch (err) {
        if (err instanceof Error) next(err)
    }
}

const fastifyKnex = fp.default(knexPlugin, {
    name: 'fastify-knex',
})

export default fastifyKnex
