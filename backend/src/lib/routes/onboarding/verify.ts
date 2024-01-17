import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type BodyReq = {
    hashedEmail: string
}

type VerifyRes = {
    ok: boolean
    message?: string
    sessionToken?: string
}

export default (
    fastify: FastifyInstance,
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
                    message: z.string(),
                    sessionToken: z.string(),
                }),
                500: z.object({
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
            const { userService } = fastify
            try {
                const redisCacheExpired =
                    await userService.isUserInCacheExpired(hashedEmail)
                const { emailFromRedis, hashedPasswordFromRedis } =
                    await userService.grabUserCredentialsFromCache(hashedEmail)
                const userAlreadyInDb =
                    await userService.grabUserByEmail(hashedEmail)
                if (redisCacheExpired)
                    throw new Error(
                        'Sorry, but you took too long to answer your email, please sign up again.',
                    )
                if (!emailFromRedis || !hashedPasswordFromRedis)
                    throw new Error(
                        'No data found by that email address, please sign up again.',
                    )
                if (userAlreadyInDb && !userAlreadyInDb.is_deleted)
                    throw new Error(
                        'You have already signed up, please log in.',
                    )
                if (userAlreadyInDb?.is_deleted) {
                    await userService.updateAlreadyDeletedUser(
                        hashedEmail,
                        hashedPasswordFromRedis,
                    )
                } else {
                    await userService.insertUserIntoDb(
                        hashedEmail,
                        hashedPasswordFromRedis,
                    )
                }
                await userService.setUserEmailInCacheAndDeletePassword(
                    hashedEmail,
                    emailFromRedis,
                )
                const sessionToken = userService.signToken(
                    hashedEmail,
                    process.env.JWT_SESSION_EXP as string,
                )
                const refreshToken = userService.signToken(
                    hashedEmail,
                    process.env.JWT_REFRESH_EXP as string,
                )
                await userService.setRefreshTokenInCache(
                    hashedEmail,
                    refreshToken,
                )
                reply
                    .code(200)
                    .clearCookie('appname-hash', { path: '/verify' })
                    .setCookie('appname-refresh-token', refreshToken, {
                        secure: true,
                        httpOnly: true,
                        sameSite: true,
                    })
                    .send({
                        ok: true,
                        message:
                            'Your email has been verified, redirecting you to the app...',
                        sessionToken: sessionToken,
                    })
            } catch (err) {
                if (err instanceof Error) {
                    reply.code(500).send({
                        ok: false,
                        message: err.message,
                    })
                }
            }
            return reply
        },
    })
    done()
}
