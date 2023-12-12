import { FastifyInstance } from 'fastify'
import emailRoute from './onboarding/email'
import signupRoute from './onboarding/signup'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(emailRoute, { prefix: '/onboarding' })
    await fastify.register(signupRoute, { prefix: '/onboarding' })
}
