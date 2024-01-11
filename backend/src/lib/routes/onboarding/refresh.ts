import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type RefreshRes = {
    ok: boolean
    message?: string
    sessionToken?: string
}

// Verifies Refresh Token (longer lived jwt)
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/refresh',
        schema: {
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
            },
        },
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<RefreshRes> => {
            const { userService } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            try {
                if (!refreshToken)
                    throw new Error(
                        'No refresh token sent from client, redirecting home...',
                    )
                const refreshTokenIsValid =
                    userService.verifyToken(refreshToken)
                if (
                    typeof refreshTokenIsValid !== 'object' ||
                    !('email' in refreshTokenIsValid)
                )
                    throw new Error('Refresh Token has incorrect payload')
                const hashedEmail = refreshTokenIsValid.email
                const refreshTokenFromRedis = await userService.grabFromCache(
                    hashedEmail as string,
                    'refresh-token',
                )
                if (!refreshTokenFromRedis)
                    throw new Error('Invalid refresh token.')
                const sessionToken = userService.signToken(
                    hashedEmail as string,
                    process.env.JWT_SESSION_EXP as string,
                )
                reply.code(200).send({
                    ok: true,
                    message: 'Successfully refreshed session.',
                    sessionToken: sessionToken,
                })
            } catch (err) {
                reply.code(401).send({
                    ok: false,
                    message: 'Invalid refresh token.',
                })
            }
            return reply
        },
    })
    done()
}
