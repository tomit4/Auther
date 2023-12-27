import { FastifyInstance } from 'fastify'
import signupRoute from './onboarding/signup'
import verifyRoute from './onboarding/verify'
import authRoute from './onboarding/auth'
import refreshRoute from './onboarding/refresh'
import loginRoute from './onboarding/login'
import logoutRoute from './onboarding/logout'
import grabUserId from './onboarding/grabuserid'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(signupRoute, { prefix: '/onboarding' })
    await fastify.register(verifyRoute, { prefix: '/onboarding' })
    await fastify.register(authRoute, { prefix: '/onboarding' })
    await fastify.register(refreshRoute, { prefix: '/onboarding' })
    await fastify.register(loginRoute, { prefix: '/onboarding' })
    await fastify.register(logoutRoute, { prefix: '/onboarding' })
    await fastify.register(grabUserId, { prefix: '/onboarding' })
}
