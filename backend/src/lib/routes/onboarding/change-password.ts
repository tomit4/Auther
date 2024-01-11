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

type BodyReq = {
    newPassword: string
}

type ChangePassRes = {
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
        method: 'PATCH',
        url: '/change-password',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: z.object({
                newPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
                409: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<ChangePassRes> => {
            const { userService } = fastify
            const { newPassword } = request.body
            const refreshToken = request.cookies[
                'appname-refresh-token'
            ] as string
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            const zParsedPassword = passwordSchema.safeParse(newPassword)
            try {
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(error.issues[0].message as string)
                }
                const refreshTokenIsValid = userService.verifyToken(
                    refreshToken,
                ) as VerifyPayloadType & { email: string }
                const hashedEmail = refreshTokenIsValid.email as string
                const redisCacheExpired =
                    await userService.checkIfCacheIsExpired(
                        hashedEmail,
                        'change-password-ask',
                    )
                if (!hashedEmail || redisCacheExpired) {
                    reply.code(401)
                    throw new Error(
                        'Sorry, but you took too long to answer your email, please log in and try again.',
                    )
                }
                const userPasswordByEmail: User | null =
                    await userService.grabUserByEmail(hashedEmail)
                const { password } = userPasswordByEmail ?? {}
                const passwordHashesMatch =
                    await userService.comparePasswordToHash(
                        newPassword,
                        password as string,
                    )
                /* TODO (v2): set up separate db table that keeps track of last 5 passwords
                 * for user and throws this 409 reply if new password is in table
                 * (i.e. newPassword cannot be the same as last 5 passwords) */
                if (passwordHashesMatch) {
                    reply.code(409)
                    throw new Error(
                        'New password cannot be the same as old password.',
                    )
                }
                const newHashedPassword =
                    await userService.hashPassword(newPassword)
                await userService.updatePassword(hashedEmail, newHashedPassword)
                await userService.removeFromCache(
                    hashedEmail,
                    'change-password-ask',
                )
                reply
                    .code(200)
                    .clearCookie('appname-hash', {
                        path: '/verify-change-pass',
                    })
                    .send({
                        ok: true,
                        message: 'You have successfully changed your password!',
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
