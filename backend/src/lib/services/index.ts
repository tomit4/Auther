import type { FastifyInstance } from 'fastify'
import userService from './user-service'

export default async (fastify: FastifyInstance) => {
    await fastify.register(userService)
}
