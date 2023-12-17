import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyPluginCallback,
    HookHandlerDoneFunction,
} from 'fastify'
import * as fp from 'fastify-plugin'
import knex from 'knex'
import type { Knex } from 'knex'

// NOTE: Copy or put this in its own file to be exported out to routes
type FastifyInstanceWithCustomPlugins = FastifyInstance & {
    knex?: Knex
}

const knexPlugin: FastifyPluginCallback = (
    fastify: FastifyInstanceWithCustomPlugins,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    if (!fastify.knex) fastify.decorate('knex', knex(options))
    done()
}

const plugin = fp.default(knexPlugin, {
    name: 'fastify-knex-plugin',
})

export default plugin
