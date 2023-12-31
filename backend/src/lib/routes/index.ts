import { FastifyInstance } from 'fastify'
import signupRoute from './onboarding/signup'
import verifyRoute from './onboarding/verify'
import authRoute from './onboarding/auth'
import refreshRoute from './onboarding/refresh'
import loginRoute from './onboarding/login'
import logoutRoute from './onboarding/logout'
import grabUserId from './onboarding/grabuserid'
import changePasswordAskRoute from './onboarding/change-password-ask'
import changePassword from './onboarding/change-password'
import deleteProfileAskRoute from './onboarding/delete-profile-ask'
import deleteProfileRoute from './onboarding/delete-profile'
import forgotPasswordAskRoute from './onboarding/forgot-pass-ask'
import forgotPasswordCheckRoute from './onboarding/forgot-pass-check'

export default async (fastify: FastifyInstance): Promise<void> => {
    await fastify.register(signupRoute, { prefix: '/onboarding' })
    await fastify.register(verifyRoute, { prefix: '/onboarding' })
    await fastify.register(authRoute, { prefix: '/onboarding' })
    await fastify.register(refreshRoute, { prefix: '/onboarding' })
    await fastify.register(loginRoute, { prefix: '/onboarding' })
    await fastify.register(logoutRoute, { prefix: '/onboarding' })
    await fastify.register(grabUserId, { prefix: '/onboarding' })
    await fastify.register(changePasswordAskRoute, { prefix: '/onboarding' })
    await fastify.register(changePassword, { prefix: '/onboarding' })
    await fastify.register(deleteProfileAskRoute, { prefix: '/onboarding' })
    await fastify.register(deleteProfileRoute, { prefix: '/onboarding' })
    await fastify.register(forgotPasswordAskRoute, { prefix: '/onboarding' })
    await fastify.register(forgotPasswordCheckRoute, { prefix: '/onboarding' })
}
