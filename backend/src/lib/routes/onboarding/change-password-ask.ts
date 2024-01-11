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
import {
    passwordSchemaRegex,
    passwordSchemaErrMsg,
} from '../../schemas/password'
import sendEmail from '../../utils/send-email'

type BodyReq = {
    loginPassword: string
}

type ChangePassAskRes = {
    ok: boolean
    message?: string
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
        url: '/change-password-ask',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: z.object({
                loginPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string().optional(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    message: z.string().optional(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<ChangePassAskRes> => {
            const { userService } = fastify
            const { loginPassword } = request.body
            const refreshToken = request.cookies[
                'appname-refresh-token'
            ] as string
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            const zParsedPassword = passwordSchema.safeParse(loginPassword)
            try {
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(error.issues[0].message as string)
                }
                const refreshTokenIsValid = userService.verifyToken(
                    refreshToken,
                ) as VerifyPayloadType & { email?: string }
                const hashedEmail = refreshTokenIsValid.email as string
                const rawEmailFromRedis =
                    await userService.grabUserEmailInCache(hashedEmail)
                if (!refreshToken || !hashedEmail || !rawEmailFromRedis) {
                    reply.code(401)
                    throw new Error(
                        'No refresh token found, redirecting to home.',
                    )
                }
                const userByEmail: User | null =
                    await userService.grabUserByEmail(hashedEmail)
                const { password } = userByEmail ?? {}
                const passwordHashesMatch =
                    password !== undefined &&
                    (await userService.comparePasswordToHash(
                        loginPassword,
                        password,
                    ))
                if (!passwordHashesMatch) {
                    reply.code(401)
                    throw new Error('Incorrect password. Please try again.')
                }
                const emailSent = await sendEmail(
                    rawEmailFromRedis as string,
                    `verify-change-pass/${hashedEmail}` as string,
                    process.env
                        .BREVO_CHANGE_PASSWORD_TEMPLATE_ID as unknown as number,
                )
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error(
                        'Error occurred while sending email, are your Brevo credentials up to date? :=>',
                        emailSent.error,
                    )
                    throw new Error(
                        'An error occurred while sending email, please contact support.',
                    )
                }
                await userService.setInCacheWithExpiry(
                    hashedEmail,
                    'change-password-ask',
                    rawEmailFromRedis,
                    60,
                )
                reply
                    .code(200)
                    .setCookie('appname-hash', hashedEmail, {
                        path: '/verify-change-pass',
                        maxAge: 60 * 60,
                    })
                    .send({
                        ok: true,
                        message:
                            'Your password is authenticated, please answer your email to continue change of password',
                    })
            } catch (err) {
                if (err instanceof Error)
                    reply.send({
                        ok: false,
                        message: err.message,
                    })
            }
            return reply
        },
    })
    done()
}
