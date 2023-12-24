import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import sendEmail from '../../utils/send-email'
import hasher from '../../utils/hasher'

type BodyReq = {
    email: string
    password: string
}

type SignUpRes = {
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
        url: '/signup',
        schema: {
            body: z.object({
                email: z.string(),
                // TODO: see below regarding regex
                password: z.string(),
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
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<SignUpRes> => {
            const { email, password } = request.body
            const { redis, knex, bcrypt } = fastify
            const hashedEmail = hasher(email)
            const hashedPassword = await bcrypt.hash(password)
            // TODO: replicate zod checks on front end
            // And then put this logic into your validation schema above
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
                const zParsedPassword = passwordSchema.safeParse(password)
                const userAlreadyInDb = await knex('users')
                    .where('email', email)
                    .first()
                const userAlreadyInCache =
                    (await redis.get(`${hashedEmail}-email`)) ||
                    (await redis.get(`${hashedEmail}-password`))
                const emailSent = await sendEmail(
                    String(email),
                    String(hashedEmail),
                )
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail
                    throw new Error(String(error.issues[0].message))
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(String(error.issues[0].message))
                }
                if (userAlreadyInDb)
                    throw new Error(
                        'You have already signed up, please log in.',
                    )
                if (userAlreadyInCache)
                    throw new Error(
                        'You have already submitted your email, please check your inbox.',
                    )
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error(
                        'Error occurred while sending email, are your Brevo credentials up to date? :=>',
                        emailSent.error,
                    )
                    throw new Error(
                        'An error occurred while sending email, please contact support.',
                    )
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
            await redis.set(`${hashedEmail}-email`, email, 'EX', 60)
            await redis.set(`${hashedEmail}-password`, hashedPassword, 'EX', 60)
            return reply
                .code(200)
                .setCookie('appname-hash', hashedEmail, {
                    path: '/verify',
                    maxAge: 60 * 60,
                })
                .send({
                    ok: true,
                    msg: `Your Email Was Successfully Sent to ${email}!`,
                })
        },
    })
    done()
}
