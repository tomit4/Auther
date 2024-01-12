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
    message?: string
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
                    message: z.string(),
                    email: z.string(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<GrabUserCredsRes> => {
            const { userService } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            try {
                if (!refreshToken)
                    throw new Error(
                        'No refresh token sent from client, redirecting home...',
                    )
                const refreshTokenIsValid = userService.verifyToken(
                    refreshToken,
                ) as VerifyPayloadType
                if (
                    typeof refreshTokenIsValid !== 'object' ||
                    !('email' in refreshTokenIsValid)
                )
                    throw new Error('Refresh Token Payload in improper format')
                const hashedEmail = refreshTokenIsValid.email as string
                const rawEmailFromRedis = await userService.grabFromCache(
                    hashedEmail,
                    'email',
                )
                if (!rawEmailFromRedis)
                    throw new Error(
                        `No raw email found in cache for : ${hashedEmail}`,
                    )
                reply.code(200).send({
                    ok: true,
                    message: 'Successfully returned raw email from cache',
                    email: rawEmailFromRedis,
                })
            } catch (err) {
                if (err instanceof Error) {
                    reply.code(401).send({
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
