import { FastifyInstance } from 'fastify'
import signupRoute from './onboarding/signup'
import verifyRoute from './onboarding/verify'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(signupRoute, { prefix: '/onboarding' })
    await fastify.register(verifyRoute, { prefix: '/onboarding' })
}
