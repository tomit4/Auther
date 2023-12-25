import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { VerifyPayloadType } from '@fastify/jwt'
import { z } from 'zod'

type RefreshRes = {
    ok: boolean
    msg?: string
    error?: string
    sessionToken?: string
}

// Verifies Refresh Token (longer lived jwt)
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/refresh',
        schema: {
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                    sessionToken: z.string(),
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
        ): Promise<RefreshRes> => {
            const { redis, jwt } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            let hashedEmail
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(
                    refreshToken,
                ) as VerifyPayloadType
                if (
                    typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid
                ) {
                    hashedEmail = refreshTokenIsValid.email as string
                    const refreshTokenFromRedis = await redis.get(
                        `${hashedEmail}-refresh-token`,
                    )
                    if (!refreshTokenFromRedis) {
                        return reply.code(401).send({
                            ok: false,
                            error: 'No refresh token in cache, redirecting to home.',
                        })
                    }
                    const sessionToken = jwt.sign(
                        { email: hashedEmail },
                        { expiresIn: process.env.JWT_SESSION_EXP as string },
                    )
                    return reply.code(200).send({
                        ok: true,
                        msg: 'Successfully refreshed session.',
                        sessionToken: sessionToken,
                    })
                }
            }
            await redis.del(`${hashedEmail}-refresh-token`)
            return reply.code(401).send({
                ok: false,
                error: 'Invalid refresh token. Redirecting to home...',
            })
        },
    })
    done()
}
