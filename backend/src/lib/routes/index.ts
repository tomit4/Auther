import { FastifyInstance } from 'fastify'
import signupRoute from './onboarding/signup'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(signupRoute, { prefix: '/onboarding' })
}
