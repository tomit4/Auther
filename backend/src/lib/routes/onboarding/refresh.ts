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
            const { userService } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            try {
                if (refreshToken) {
                    const refreshTokenIsValid =
                        userService.verifyToken(refreshToken)
                    if (
                        typeof refreshTokenIsValid === 'object' &&
                        'email' in refreshTokenIsValid
                    ) {
                        const hashedEmail = refreshTokenIsValid.email as string
                        const refreshTokenFromRedis =
                            await userService.grabRefreshTokenFromCache(
                                hashedEmail,
                            )
                        if (!refreshTokenFromRedis) {
                            throw new Error(
                                'No refresh token in cache, redirecting to home.',
                            )
                        }
                        const sessionToken = userService.signToken(
                            hashedEmail,
                            process.env.JWT_SESSION_EXP as string,
                        )
                        await userService.removeRefreshTokenFromCache(
                            hashedEmail,
                        )
                        reply.code(200).send({
                            ok: true,
                            msg: 'Successfully refreshed session.',
                            sessionToken: sessionToken,
                        })
                    }
                } else {
                    throw new Error(
                        'Invalid refresh token, redirecting home...',
                    )
                }
            } catch (err) {
                if (err instanceof Error) {
                    reply.code(401).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            return reply
        },
    })
    done()
}
