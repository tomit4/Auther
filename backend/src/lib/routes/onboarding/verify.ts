import type {
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { FastifyInstanceWithCustomPlugins } from '../../types'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type BodyReq = {
    hashedEmail: string
}

type VerifyRes = {
    ok: boolean
    msg?: string
    error?: string
}

export default (
    fastify: FastifyInstanceWithCustomPlugins,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/verify',
        schema: {
            body: z.object({
                hashedEmail: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                }),
                400: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<VerifyRes> => {
            const { hashedEmail } = request.body
            const { redis, knex } = fastify
            const dataIsExpired = (await redis.ttl(hashedEmail)) < 0
            const dataFromRedis = await redis.get(hashedEmail)
            try {
                if (dataIsExpired)
                    throw new Error(
                        'Sorry, but you took too long to answer your email, please sign up again.',
                    )
                if (!dataFromRedis)
                    throw new Error(
                        'No data found by that email address, please sign up again.',
                    )
                const userAlreadyInDb = knex
                    ? await knex('users').where('email', hashedEmail).first()
                    : undefined
                if (userAlreadyInDb)
                    throw new Error(
                        'You have already signed up, please log in.',
                    )
                await knex
                    ?.insert({
                        email: hashedEmail,
                        password: 'password',
                    })
                    .into('users')
            } catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            // TODO: generate and send back hashed JWT in cookie headers
            return reply.code(200).send({
                ok: true,
                msg: 'Your email has been  verified, redirecting you to the app...',
            })
        },
    })
    done()
}
