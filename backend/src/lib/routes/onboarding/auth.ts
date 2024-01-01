import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'

// Verifies Session Token (shorter lived jwt)
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.route({
        method: 'GET',
        url: '/auth',
        onRequest: fastify.authenticate,
        handler: async () => {},
    })
    done()
}
