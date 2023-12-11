import { FastifyInstance } from 'fastify'
// import { FastifyInstance, FastifyPluginCallback } from 'fastify'
// import emailRoute from './onboarding/email'

export default async (fastify: FastifyInstance): Promise<void> => {
    // await fastify.register(emailRoute, { prefix: '/onboarding' })
    // NOTE: using require as import throws overload ts error
    await fastify.register(require('./onboarding/email'), {
        prefix: '/onboarding',
    })
}
