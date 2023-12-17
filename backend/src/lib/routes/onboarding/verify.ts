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
    hashedEmail: string
}

type VerifyRes = {
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
        url: '/verify',
        schema: {
            body: z.object({
                hashedEmail: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                }),
                400: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<VerifyRes> => {
            const { hashedEmail } = request.body
            const { redis, knex, bcrypt } = fastify
            try {
                const redisCacheExpired = (await redis.ttl(hashedEmail)) < 0
                const hashedPasswordFromRedis = await redis.get(hashedEmail)
                const userAlreadyInDb = await knex('users')
                    .where('email', hashedEmail)
                    .first()
                if (redisCacheExpired)
                    throw new Error(
                        'Sorry, but you took too long to answer your email, please sign up again.',
                    )
                if (!hashedPasswordFromRedis)
                    throw new Error(
                        'No data found by that email address, please sign up again.',
                    )
                if (userAlreadyInDb)
                    throw new Error(
                        'You have already signed up, please log in.',
                    )
                await knex
                    .insert({
                        email: hashedEmail,
                        password: hashedPasswordFromRedis,
                    })
                    .into('users')
                // TESTING LOGIN FAILING THUS FAR
                /*
                const userPassword = await knex('users')
                    .where('email', hashedEmail)
                    .select('password')
                    .first()
                console.log('userPassword :=>', userPassword)
                const passwordMatch = bcrypt.compare(
                    hashedPasswordFromRedis,
                    userPassword,
                )
                console.log('passwordMatch :=>', passwordMatch)
                */
                await redis.del(hashedEmail)
            } catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            // TODO: generate and send back hashed JWT in cookie headers
            return reply.code(200).send({
                ok: true,
                msg: 'Your email has been  verified, redirecting you to the app...',
            })
        },
    })
    done()
}
