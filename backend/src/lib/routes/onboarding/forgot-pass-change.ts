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
    hash: string
}

type ForgotPassChangeRes = {
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
        url: '/forgot-password-change',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: z.object({
                newPassword: z.string(),
                hash: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
                400: z.object({
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
        ): Promise<ForgotPassChangeRes> => {
            const { userService } = fastify
            const { newPassword, hash } = request.body
            const sessionToken =
                request.cookies['appname-forgot-pass-ask-token']
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            const zParsedPassword = passwordSchema.safeParse(newPassword)
            try {
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(error.issues[0].message as string)
                }
                const sessionTokenIsValid = userService.verifyToken(
                    sessionToken as string,
                ) as VerifyPayloadType & { email: string }
                const { email } = sessionTokenIsValid
                if (hash !== email) {
                    reply.code(400)
                    throw new Error(
                        'Provided Hashes do not match, please try again',
                    )
                }
                const emailFromCache = await userService.grabFromCache(
                    email,
                    'forgot-pass-ask',
                )
                if (!emailFromCache) {
                    reply.code(401)
                    throw new Error(
                        'You took too long to answer the forgot password email, please try again',
                    )
                }
                const userPasswordByEmail: User | null =
                    await userService.grabUserByEmail(email)
                const { password } = userPasswordByEmail ?? {}
                const passwordHashesMatch =
                    password !== undefined &&
                    (await userService.comparePasswordToHash(
                        newPassword,
                        password,
                    ))
                // TODO: set up separate db table that keeps track of last 5 passwords
                // for user and throws this 409 reply if new password is in table
                // (i.e. newPassword cannot be the same as last 5 passwords)
                if (passwordHashesMatch) {
                    fastify.log.warn(
                        'User claimed they forgot their password, but uses their original password...',
                    )
                    reply.code(409).send({
                        ok: false,
                        message:
                            'Password provided is not original, please try again with a different password.',
                    })
                }
                const newHashedPassword =
                    await userService.hashPassword(newPassword)
                await userService.updatePassword(email, newHashedPassword)
                await userService.removeFromCache(email, 'forgot-pass-ask')
                reply
                    .code(200)
                    .clearCookie('appname-forgot-pass-ask', {
                        path: '/onboarding',
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
