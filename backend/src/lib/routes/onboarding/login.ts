import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { z } from 'zod'
/*
type BodyReq = {
    email: string
    password: string
}

type SignUpRes = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}
*/
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        /*
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
                400: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        */
        handler: async (
            // request: FastifyRequest<{ Body: BodyReq }>,
            request: FastifyRequest,
            reply: FastifyReply,
            // ): Promise<SignUpRes> => {
        ) => {
            console.log('hit login route :=>')
        },
    })
    done()
}
