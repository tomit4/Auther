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
            /* TODO: implement only a certain amount of login attempts before warning is sent to email
             * and timeout is implemented before another round of attempts can be made */
            const { redis, knex, bcrypt, jwt } = fastify
            const { email, loginPassword } = request.body
            const hashedEmail = hasher(email)
            const emailSchema = z.string().email()
            const passwordSchemaRegex = new RegExp(
                [
                    /^(?=.*[a-z])/, // At least one lowercase letter
                    /(?=.*[A-Z])/, // At least one uppercase letter
                    /(?=.*\d)/, // At least one digit
                    /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, // At least one special character
                    /[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{10,}$/, // At least 10 characters long
                ]
                    .map(r => r.source)
                    .join(''),
            )
            const passwordSchemaErrMsg =
                'Password must be at least 10 characters in length and contain at \
                least one lowercase letter, one uppercase letter, one digit, and one \
                special character'
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            try {
                const zParsedEmail = emailSchema.safeParse(email)
                const zParsedPassword = passwordSchema.safeParse(loginPassword)
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail
                    throw new Error(error.issues[0].message as string)
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(error.issues[0].message as string)
                }
                const userByEmail = await knex('users')
                    .select('password')
                    .where('email', hashedEmail)
                    .first()
                if (!userByEmail) {
                    return reply.code(401).send({
                        ok: false,
                        error: 'Incorrect email or password. Please try again.',
                    })
                }
                const { password } = userByEmail
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
                    fastify.log.error('ERROR :=>', err)
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
