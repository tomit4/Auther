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
    token?: string
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
                    token: z.string(),
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
                    .where('email', hashedEmail)
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
                // TODO: consider changing to hashedEmail instead
                // of emailFromRedis and what that would entail
                await knex
                    .insert({
                        email: emailFromRedis,
                        password: hashedPasswordFromRedis,
                    })
                    .into('users')
                await redis.del(`${hashedEmail}-email`)
                await redis.del(`${hashedEmail}-password`)
                // TODO: use the following in /login after grabbing password from db
                // and compare user's password typed in
                /*
                await bcrypt
                    .compare('Password1234!', hashedPasswordFromRedis)
                    .then(res => console.log('res :=>', res)) // true!!
                    .catch(err => console.error('ERROR :=>', err))
                */
            } catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message)
                    return reply.code(500).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            const token = jwt.sign(
                { email: hashedEmail },
                { expiresIn: process.env.JWT_EXPIRES_IN },
            )
            console.log('token :=>', token)
            console.log('typeof token :=>', typeof token)
            /*
            .setCookie('appname-jwt', token, {
            // NOTE: don't set path, doesn't send cookies over fetch for some reason
            secure: true, // send cookie over HTTPS only
            httpOnly: true,
            sameSite: true, // alternative CSRF protection
            // maxAge: 3600,
            })
            */
            return reply
                .code(200)
                .setCookie('appname-hash', '', {
                    path: '/verify',
                    maxAge: 0,
                })
                .send({
                    ok: true,
                    msg: 'Your email has been verified, redirecting you to the app...',
                    token: token,
                })
        },
    })
    done()
}
