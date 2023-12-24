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
    msg?: string
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
            },
        },
        handler: async (
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<LogOutRes> => {
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
