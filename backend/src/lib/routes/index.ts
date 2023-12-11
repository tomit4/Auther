import { FastifyInstance } from 'fastify'

export default async (fastify: FastifyInstance): Promise<void> => {
    // NOTE: using require as import throws overload ts error
    // await fastify.register(import('./onboarding/email'))
    await fastify.register(require('./onboarding/email'), {
        prefix: '/onboarding',
    })
}
