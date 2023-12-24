import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import hasher from '../../utils/hasher'

type BodyReq = {
    email: string
    loginPassword: string
}

type AuthRes = {
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
        url: '/login',
        schema: {
            body: z.object({
                email: z.string(),
                // TODO: validate with regex from signup
                loginPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string(),
                    sessionToken: z.string(),
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
            const { knex, bcrypt, jwt } = fastify
            const { email, loginPassword } = request.body
            const hashedEmail = hasher(email)
            try {
                const { password } = await knex('users')
                    .select('password')
                    .where('email', email)
                    .first()
                const passwordHashesMatch = await bcrypt
                    .compare(loginPassword, password)
                    .then(match => match)
                    .catch(err => err)
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
            const sessionToken = jwt.sign(
                { email: hashedEmail },
                { expiresIn: process.env.JWT_SESSION_EXP },
            )
            const refreshToken = jwt.sign(
                { email: hashedEmail },
                { expiresIn: process.env.JWT_REFRESH_EXP },
            )
            return reply
                .code(200)
                .setCookie('appname-refresh-token', refreshToken, {
                    secure: true,
                    httpOnly: true,
                    sameSite: true,
                    // maxAge: 3600, // unsure if to use, research
                })
                .send({
                    ok: true,
                    msg: 'You have been successfully authenticated! Redirecting you to the app...',
                    sessionToken: sessionToken,
                })
        },
    })
    done()
}
