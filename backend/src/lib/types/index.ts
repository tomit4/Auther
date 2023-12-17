import type { FastifyInstance } from 'fastify'
import type { Knex } from 'knex'

type FastifyInstanceWithCustomPlugins = FastifyInstance & { knex?: Knex }

export { FastifyInstanceWithCustomPlugins }
