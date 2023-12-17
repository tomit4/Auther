import type { FastifyPluginCallback } from 'fastify'
import type { Knex } from 'knex'

type FastifyKnexPluginType = FastifyPluginCallback<fastifyKnex.Knex>

declare module 'fastify' {
    interface FastifyInstance {
        knex: Knex
    }
}

declare namespace fastifyKnex {
    export interface FastifyKnexNamespacedInstance {
        [namespace: string]: Knex
    }
    export type FastifyKnex = FastifyKnexNamespacedInstance & Knex
    export const fastifyKnex: FastifyKnexPluginType
    export { fastifyKnex as default }
}

declare function fastifyKnex(
    ...params: Parameters<FastifyKnexPluginType>
): ReturnType<FastifyKnexPluginType>

export { FastifyKnexPluginType }
