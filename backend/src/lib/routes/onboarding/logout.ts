import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type LogOutRes = {
    ok: boolean
    message?: string
}

// Logs Out User/Removes Refresh Token Cookie
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/logout',
        schema: {
            response: {
                200: z.object({
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
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<LogOutRes> => {
            const { userService } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            try {
                if (!refreshToken)
                    throw new Error('No refresh token sent from client')
                reply.clearCookie('appname-refresh-token', {
                    path: '/onboarding',
                })
                reply.clearCookie('appname-hash', {
                    path: '/verify-change-pass',
                })
                reply.clearCookie('appname-hash', {
                    path: '/verify-delete-profile',
                })
                const refreshTokenIsValid =
                    userService.verifyToken(refreshToken)
                if (!refreshTokenIsValid) {
                    reply.code(401)
                    throw new Error('Invalid refresh token')
                }
                if (
                    typeof refreshTokenIsValid !== 'object' ||
                    !('email' in refreshTokenIsValid)
                )
                    throw new Error('Refresh Token has incorrect payload')
                const hashedEmail = refreshTokenIsValid.email
                await userService.removeFromCache(
                    hashedEmail as string,
                    'refresh-token',
                )
                await userService.removeFromCache(
                    hashedEmail as string,
                    'email',
                )
                reply.code(200).send({
                    ok: true,
                    message: 'logged out',
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
