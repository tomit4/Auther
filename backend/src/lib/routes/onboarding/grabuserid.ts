import type { VerifyPayloadType } from '@fastify/jwt'
import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type GrabUserCredsRes = {
    ok: boolean
    msg?: string
    error?: string
    email?: string
}

// Grabs user email/credentials from cache
// based off of return val from refresh jwt
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/grab-user-creds',
        schema: {
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                    email: z.string(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<GrabUserCredsRes> => {
            const { redis, jwt } = fastify
            /* NOTE: no need to check refresh token here,
             * request is coming from frontend protected route */
            const refreshToken = request.cookies[
                'appname-refresh-token'
            ] as string

            let hashedEmail: string
            const refreshTokenIsValid = jwt.verify(
                refreshToken,
            ) as VerifyPayloadType
            if (
                typeof refreshTokenIsValid === 'object' &&
                'email' in refreshTokenIsValid
            ) {
                hashedEmail = refreshTokenIsValid.email as string
                const rawEmailFromRedis = await redis.get(
                    `${hashedEmail}-email`,
                )
                if (!rawEmailFromRedis) {
                    fastify.log.error(
                        `No raw email found in cache: ${rawEmailFromRedis}`,
                    )
                }
                return reply.code(200).send({
                    ok: true,
                    msg: 'Successfully returned raw email from cache',
                    email: rawEmailFromRedis,
                })
            }
            return reply.code(401).send({
                ok: false,
                error: 'No refresh token in cache, redirecting to home.',
            })
        },
    })
    done()
}
