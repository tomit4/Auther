import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
// import type { VerifyPayloadType } from '@fastify/jwt'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { z } from 'zod'
/*
type BodyReq = {
    token: string
}
*/
/*
type VerifyRes = {
    ok: boolean
    msg?: string
    error?: string
}
*/
/* Best attempt at addressing type error below, but not working thus far
declare module '@fastify/jwt' {
    interface FastifyJWT {
        email: string
        payload: { email: string } // payload type is used for signing and verifying
        user: {
            email: string
        } // user type is return type of `request.user` object
    }
}
*/
// Verifies Refresh Token (longer lived jwt)
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/refresh',
        // TODO: extend type FastifyInstance to include authenticate...
        /*
        schema: {
            body: z.object({
                hashedEmail: z.string(),
            }),
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
        */
        handler: async (
            request: FastifyRequest,
            // request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
            // ): Promise<VerifyRes> => {
        ) => {
            const { jwt } = fastify
            const refreshToken = request.cookies['appname-refresh-token']
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(refreshToken)
                // NOTE: we may not need the hashedEmail here, but we'll still
                // need to address the type error once we set up resetting
                // password or deleting acccount as we'll need either the
                // email or the hashedEmail
                // TODO: addresss type error
                const hashedEmail = refreshTokenIsValid.email
                const sessionToken = jwt.sign(
                    { email: hashedEmail },
                    { expiresIn: process.env.JWT_SESSION_EXP },
                )
                reply.code(200).send({
                    ok: true,
                    msg: 'Successfully refreshed session.',
                    sessionToken: sessionToken,
                })
            } else {
                reply.code(500).send({
                    ok: false,
                    error: 'Invalid refresh token. Redirecting to home...',
                })
            }
        },
    })
    done()
}
