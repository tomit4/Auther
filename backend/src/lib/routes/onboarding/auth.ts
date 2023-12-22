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
    hashedEmail: string
}

type VerifyRes = {
    ok: boolean
    msg?: string
    error?: string
}
*/
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'GET',
        url: '/auth',
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
            // request: FastifyRequest<{ Body: BodyReq }>,
            request: FastifyRequest,
            reply: FastifyReply,
            // ): Promise<VerifyRes> => {
        ) => {
            // NOTE: that the cookies is only accessible because:
            // 1. We set the cookie from our verify.ts route, instead of sending it in the body( see more).
            // 2. Then at the AppView.vue file on the frontend, it simply sends the cookies using the credentials: 'include' flag to this route, giving us access to our jwt from the cookies
            // BUT: usually we need to authenticate the user as they traverse the application, where our routes back here on the backend check the authorization headers each time the user navigates around.
            // NOTE: these auth headers can only be set in the fetch() request if the jwt is set in localstorage or a not http-only (insecure) cookie. Thusly this technique will have to be utilized to have an actually working secure backend api that gives access to sensitive user info IF the auth headers contain a valid jwt.
            console.log('request.cookies :=>', request.cookies)
        },
    })
    done()
}
