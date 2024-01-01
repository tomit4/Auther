import type {
    FastifyRequest,
    FastifyReply,
    FastifyInstance,
    FastifyPluginOptions,
    FastifyPluginCallback,
    HookHandlerDoneFunction,
} from 'fastify'
import * as fp from 'fastify-plugin'
import type { VerifyPayloadType, FastifyJWTOptions } from '@fastify/jwt'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate(
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<VerifyPayloadType | undefined>
    }
}

const authPlugin: FastifyPluginCallback = async (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    next: HookHandlerDoneFunction,
) => {
    try {
        if (!fastify.authenticate) {
            fastify.decorate(
                'authenticate',
                async (request: FastifyRequest, reply: FastifyReply) => {
                    try {
                        await request.jwtVerify()
                        return reply.code(200).send({
                            ok: true,
                            message: 'Authenticated',
                        })
                    } catch (err) {
                        if (err instanceof Error)
                            return reply
                                .code(401)
                                .send({ ok: false, message: err.message })
                    }
                },
            )
        }
        next()
    } catch (err) {
        if (err instanceof Error) next(err)
    }
}

const fastifyAuth = fp.default<FastifyJWTOptions>(authPlugin, {
    name: 'fastify-jwt-authenticate',
})

export default fastifyAuth
