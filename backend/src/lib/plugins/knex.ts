import {
    FastifyInstance,
    FastifyPluginOptions,
    HookHandlerDoneFunction,
} from 'fastify'
import { FastifyPluginCallback } from 'fastify'
import * as fp from 'fastify-plugin'
import config from '../../knexfile'
import knex from 'knex'
const knexFile = config.development
const knexInstance = knex(knexFile)

const knexPlugin: FastifyPluginCallback = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.decorate('knex', knexInstance)
    done()
}

const plugin = fp.default(knexPlugin, {
    name: 'fastify-knex-plugin',
})

export default plugin
