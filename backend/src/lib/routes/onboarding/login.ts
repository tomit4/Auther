import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import {
    passwordSchemaRegex,
    passwordSchemaErrMsg,
} from '../../schemas/password'
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
            const emailSchema = z.string().email()
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            try {
                const zParsedEmail = emailSchema.safeParse(email)
                const zParsedPassword = passwordSchema.safeParse(loginPassword)
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail
                    throw new Error(error.issues[0].message as string)
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(error.issues[0].message as string)
                }
                const userByEmail =
                    await userService.grabUserByEmail(hashedEmail)
                const { password } = userByEmail
                const passwordHashesMatch =
                    await userService.comparePasswordToHash(
                        loginPassword,
                        password,
                    )
                if (!userByEmail || !passwordHashesMatch) {
                    reply.code(401)
                    throw new Error(
                        'Incorrect email or password. Please try again.',
                    )
                }
                const sessionToken = userService.signToken(
                    hashedEmail,
                    process.env.JWT_SESSION_EXP as string,
                )
                const refreshToken = userService.signToken(
                    hashedEmail,
                    process.env.JWT_REFRESH_EXP as string,
                )
                // TODO: reset expiration to a .env variable
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
