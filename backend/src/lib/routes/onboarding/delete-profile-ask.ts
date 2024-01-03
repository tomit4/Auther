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

type DeleteProfileAskRes = {
    ok: boolean
    message?: string
}

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/delete-profile-ask',
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
                    message: z.string(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<DeleteProfileAskRes> => {
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
                ) as VerifyPayloadType & { email: string }
                const hashedEmail = refreshTokenIsValid.email as string
                const rawEmailFromRedis =
                    await userService.grabUserEmailInCache(hashedEmail)
                const userPasswordByEmail =
                    await userService.grabUserByEmail(hashedEmail)
                const { password } = userPasswordByEmail
                const passwordHashesMatch =
                    await userService.comparePasswordToHash(
                        loginPassword,
                        password,
                    )
                if (!hashedEmail || !rawEmailFromRedis || !passwordHashesMatch)
                    reply.code(401)
                if (!hashedEmail)
                    throw Error(
                        'No refresh token provided by client, redirecting to home.',
                    )
                if (!rawEmailFromRedis)
                    throw Error(
                        'No refresh token in cache, redirecting to home.',
                    )
                if (!passwordHashesMatch)
                    throw Error('Incorrect password. Please try again.')
                const emailSent = await sendEmail(
                    rawEmailFromRedis as string,
                    `verify-delete-profile/${hashedEmail}` as string,
                    process.env
                        .BREVO_DELETE_ACCOUNT_TEMPLATE_ID as unknown as number,
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
                    'delete-profile-ask',
                    rawEmailFromRedis,
                    60,
                )
                reply
                    .code(200)
                    .setCookie('appname-hash', hashedEmail, {
                        path: '/verify-delete-profile',
                        maxAge: 60 * 60,
                    })
                    .send({
                        ok: true,
                        message:
                            'You have successfully requested to delete your profile, please check your email',
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
