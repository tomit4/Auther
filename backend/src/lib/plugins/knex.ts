import type {
    FastifyPluginOptions,
    FastifyPluginCallback,
    HookHandlerDoneFunction,
} from 'fastify'
import type { FastifyInstanceWithCustomPlugins } from '../types'
import * as fp from 'fastify-plugin'
import knex from 'knex'

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
