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

type LogOutRes = {
    ok: boolean
    msg?: string
    error?: string
}

// Logs Out User/Removes Refresh Token via HTTPS Cookie with maxAge=0
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
                    msg: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<LogOutRes> => {
            const { redis, jwt } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(
                    refreshToken,
                ) as VerifyPayloadType
                if (
                    typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid
                ) {
                    const hashedEmail = refreshTokenIsValid.email
                    const refreshTokenFromRedis = await redis.get(
                        `${hashedEmail}-refresh-token`,
                    )
                    if (!refreshTokenFromRedis) {
                        return reply.code(500).send({
                            ok: false,
                            error: 'Invalid refresh token. Redirecting to home...',
                        })
                    }
                    await redis.del(`${hashedEmail}-refresh-token`)
                }
            } else {
                return reply.code(500).send({
                    ok: false,
                    error: 'ERROR :=> No refresh token found, log out failed',
                })
            }
            return reply
                .code(200)
                .clearCookie('appname-refresh-token', { path: '/onboarding' })
                .send({
                    ok: true,
                    msg: 'logged out',
                })
        },
    })
    done()
}
