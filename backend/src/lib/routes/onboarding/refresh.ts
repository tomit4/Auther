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

type RefreshRes = {
    ok: boolean
    msg?: string
    error?: string
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
                    msg: z.string(),
                    sessionToken: z.string(),
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
        ): Promise<RefreshRes> => {
            const { jwt } = fastify
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
                    const sessionToken = jwt.sign(
                        { email: hashedEmail },
                        { expiresIn: process.env.JWT_SESSION_EXP as string },
                    )
                    return reply.code(200).send({
                        ok: true,
                        msg: 'Successfully refreshed session.',
                        sessionToken: sessionToken,
                    })
                }
            }
            return reply.code(500).send({
                ok: false,
                error: 'Invalid refresh token. Redirecting to home...',
            })
        },
    })
    done()
}
