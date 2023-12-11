import { FastifyInstance } from 'fastify'
import fastifyEnv from '@fastify/env'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(import('@fastify/cors'))
    await fastify.register(fastifyEnv, {
        schema: {
            type: 'object',
            required: ['PORT', 'HOST'],
            properties: {
                PORT: {
                    type: 'number',
                },
                HOST: {
                    type: 'string',
                },
            },
        },
    })
}
