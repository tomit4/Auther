import { FastifyInstance } from 'fastify'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(import('@fastify/cors'))
}
