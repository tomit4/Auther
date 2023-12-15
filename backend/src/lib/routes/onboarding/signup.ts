import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import sendEmail from '../../utils/send-email'

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
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
            },
        },
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<SignUpRes> => {
            const { email, password } = request.body
            const { redis } = fastify
            // test works
            // TODO:  hash/salt email and encrypt password
            // set in redis hash_email_string: encrypted_password
            // NOTE: If the user answers the transac email within time limit,
            // the encrypted password is pulled from the redis cache and stored
            // in the postgresql database, it is then removed from the redis cache.
            // Otherwise, after the time limit has expired, it is removed from the
            // redis cache, and an error message is sent to the user upon redirection
            // to verify/${hashedEmail} that they took too long to answer the email and
            // to sign up again.
            redis.set('test', 'test_string', err => {
                console.error('ERROR :=>', err)
            })
            // TODO: replicate zod checks on front end
            const emailSchema = z.string().email()
            const passwordSchema = z
                .string()
                .regex(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{10,}$/,
                    {
                        message:
                            'Password must be at least 10 characters in length and contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
                    },
                )
            try {
                const zParsedEmail = emailSchema.safeParse(email)
                const zParsedPassword = passwordSchema.safeParse(password)
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail
                    throw new Error(String(error.issues[0].message))
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword
                    throw new Error(String(error.issues[0].message))
                }
                // const emailSent = await sendEmail(String(email, String(hashedEmail)))
                const emailSent = await sendEmail(String(email))
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error(
                        'Error occurred while sending email, are your Brevo credentials up to date? :=>',
                        emailSent.error,
                    )
                    throw new Error(String(emailSent.error))
                }

                // TODO: hash/salt the email and store it in mariadb db via knex

                /* TODO: hash/salt the password and use it as a key in an
                 * in-memory HashMap to reference a jwt token (learn redis)
                 */
            } catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    })
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: `Email sent to ${email}`,
                email: String(email),
            })
        },
    })
    done()
}
