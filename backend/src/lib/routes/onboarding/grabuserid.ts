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

type GrabUserCredsRes = {
    ok: boolean
    msg?: string
    error?: string
    email?: string
}

// Grabs user email/credentials from cache
// based off of return val from refresh jwt
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/grab-user-creds',
        schema: {
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                    email: z.string(),
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
        ): Promise<GrabUserCredsRes> => {
            const { userService } = fastify
            /* NOTE: no need to check refresh token here,
             * request is coming from frontend protected route */
            try {
                const refreshToken = request.cookies[
                    'appname-refresh-token'
                ] as string
                if (!refreshToken) {
                    throw new Error(
                        'No refresh token sent from client, redirecting home...',
                    )
                }
                let hashedEmail: string
                const refreshTokenIsValid =
                    await userService.verifyToken(refreshToken)
                if (
                    typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid
                ) {
                    hashedEmail = refreshTokenIsValid.email as string
                    const rawEmailFromRedis =
                        await userService.grabUserEmailInCache(hashedEmail)
                    if (!rawEmailFromRedis) {
                        throw new Error(
                            `No raw email found in cache for : ${hashedEmail}`,
                        )
                    }
                    reply.code(200).send({
                        ok: true,
                        msg: 'Successfully returned raw email from cache',
                        email: rawEmailFromRedis,
                    })
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
