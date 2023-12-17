import type { FastifyInstance } from 'fastify'
import type { Knex } from 'knex'

// NOTE: there is a smarter way to do this, we need to look into creating a .d.ts file that more specifically binds knex to the fastifyInstance
// https://github.com/fastify/fastify-redis/blob/master/types/index.d.ts
type FastifyInstanceWithCustomPlugins = FastifyInstance & { knex?: Knex }

export { FastifyInstanceWithCustomPlugins }
