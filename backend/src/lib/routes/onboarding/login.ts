import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { validateInputs } from '../../utils/schema-validators'
import hasher from '../../utils/hasher'

type BodyReq = {
    email: string
    loginPassword: string
}

type AuthRes = {
    ok: boolean
    message?: string
    error?: string
    sessionToken?: string
}

type User = {
    id: number
    email: string
    password: string
    is_deleted: boolean
    created_at: Date
}

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: z.object({
                email: z.string(),
                loginPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                    sessionToken: z.string(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<AuthRes> => {
            const { userService } = fastify
            const { email, loginPassword } = request.body
            const hashedEmail = hasher(email)
            try {
                validateInputs(email, loginPassword)
                const userByEmail: User | null =
                    await userService.grabUserByEmail(hashedEmail)
                const { password } = userByEmail ?? {}
                const passwordHashesMatch =
                    password !== undefined &&
                    (await userService.comparePasswordToHash(
                        loginPassword,
                        password,
                    ))
                if (!userByEmail || !passwordHashesMatch) reply.code(401)
                if (userByEmail?.is_deleted) {
                    reply.code(401)
                    throw new Error(
                        'No record of that email found. Please try again.',
                    )
                }
                if (!userByEmail) {
                    throw new Error(
                        'No record of that email found. Please try again.',
                    )
                }
                if (!passwordHashesMatch) {
                    throw new Error('Incorrect password. Please try again.')
                }
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
                await userService.setUserEmailInCache(hashedEmail, email)
                reply
                    .code(200)
                    .setCookie('appname-refresh-token', refreshToken, {
                        secure: true,
                        httpOnly: true,
                        sameSite: true,
                    })
                    .send({
                        ok: true,
                        message:
                            'You have been successfully authenticated! Redirecting you to the app...',
                        sessionToken: sessionToken,
                    })
            } catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err)
                    reply.send({
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
