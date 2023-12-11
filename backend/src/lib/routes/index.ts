import { FastifyInstance } from 'fastify'
import emailRoute from './onboarding/email'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(emailRoute, { prefix: '/onboarding' })
}
