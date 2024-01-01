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
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            /* NOTE: Technically our refresh token might be able to be authenticated within fastify.authenticate().
             * This is essentially akin to HapiJS's authentication "strategies".
             * Within fastify.authenticate(), we could check the refresh token
             * and reissue our session token instead of through a separate refresh route. */
            return fastify.authenticate(request, reply)
        },
    })
    done()
}
