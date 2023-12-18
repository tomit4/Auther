import { ALL } from 'dns'
import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type BodyReq = {
    email: string
    loginPassword: string
}

type AuthRes = {
    ok: boolean
    msg?: string
    error?: string
}

export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/login',
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                }),
                401: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<AuthRes> => {
            const { knex, bcrypt } = fastify
            const { email, loginPassword } = request.body
            try {
                const { password } = await knex('users')
                    .select('password')
                    .where('email', email)
                    .first()
                const passwordHashesMatch = await bcrypt
                    .compare(loginPassword, password)
                    .then(match => match)
                    .catch(err => err)
                /*
                .setCookie('appname-jwt', '', {
                    path: '/app',
                    maxAge: 360 // change to 15 minutes when done (alongside expire of jwt),
                })
                */
                if (!passwordHashesMatch) {
                    return reply.code(401).send({
                        ok: false,
                        error: 'Incorrect email or password. Please try again.',
                    })
                }
            } catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message)
                    return reply.code(500).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: 'You have been successfully authenticated! Redirecting you to the app...',
            })
        },
    })
    done()
}
