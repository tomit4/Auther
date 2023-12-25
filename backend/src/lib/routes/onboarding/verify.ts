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
    sessionToken?: string
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
                    sessionToken: z.string(),
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
        ): Promise<VerifyRes> => {
            const { hashedEmail } = request.body
            const { redis, knex, jwt } = fastify
            try {
                const redisCacheExpired =
                    (await redis.ttl(`${hashedEmail}-email`)) < 0 ||
                    (await redis.ttl(`${hashedEmail}-password`)) < 0
                const emailFromRedis = await redis.get(`${hashedEmail}-email`)
                const hashedPasswordFromRedis = await redis.get(
                    `${hashedEmail}-password`,
                )
                const userAlreadyInDb = await knex('users')
                    .where('email', emailFromRedis)
                    .first()
                if (redisCacheExpired)
                    throw new Error(
                        'Sorry, but you took too long to answer your email, please sign up again.',
                    )
                if (!emailFromRedis || !hashedPasswordFromRedis)
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
                await redis.del(`${hashedEmail}-email`)
                await redis.del(`${hashedEmail}-password`)
            } catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message)
                    return reply.code(500).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            const sessionToken = jwt.sign(
                { email: hashedEmail },
                { expiresIn: process.env.JWT_SESSION_EXP as string },
            )
            const refreshToken = jwt.sign(
                { email: hashedEmail },
                { expiresIn: process.env.JWT_REFRESH_EXP as string },
            )
            // TODO: reset expiration to a .env variable
            await redis.set(
                `${hashedEmail}-refresh-token`,
                refreshToken,
                'EX',
                180,
            )
            return reply
                .code(200)
                .setCookie('appname-hash', '', {
                    path: '/verify',
                    maxAge: 0,
                })
                .setCookie('appname-refresh-token', refreshToken, {
                    secure: true,
                    httpOnly: true,
                    sameSite: true,
                    // maxAge: 3600, // unsure if to use, research
                })
                .send({
                    ok: true,
                    msg: 'Your email has been verified, redirecting you to the app...',
                    sessionToken: sessionToken,
                })
        },
    })
    done()
}
