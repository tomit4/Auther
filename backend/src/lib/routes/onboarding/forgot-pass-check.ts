import { VerifyPayloadType } from '@fastify/jwt'
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
    hash: string
}

type ForgotPassCheckRes = {
    ok: boolean
    message?: string
    error?: string
}

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/forgot-password-check',
        schema: {
            body: z.object({
                hash: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    email: z.string(),
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
        ): Promise<ForgotPassCheckRes> => {
            const { hash } = request.body
            const { userService } = fastify
            const sessionToken =
                request.cookies['appname-forgot-pass-ask-token']
            try {
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
                reply.code(200).send({
                    ok: true,
                    email: emailFromCache,
                    message:
                        'Hashed Email Verified and Validated, now you can change your password',
                })
            } catch (err) {
                if (err instanceof Error) {
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
