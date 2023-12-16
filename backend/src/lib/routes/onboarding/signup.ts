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
import hasher from '../../utils/hasher'

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
            const hashedEmail = hasher(email)
            // TODO: change with encryption
            const hashedPassword = password
            const hashedData = new Map()
            hashedData.set(hashedEmail, hashedPassword)
            // TODO:  hash/salt email and encrypt password
            // set in redis hash_email_string: encrypted_password
            // NOTE: If the user answers the transac email within time limit,
            // the encrypted password is pulled from the redis cache and stored
            // in the postgresql database, it is then removed from the redis cache.
            // Otherwise, after the time limit has expired, it is removed from the
            // redis cache, and an error message is sent to the user upon redirection
            // to verify/${hashedEmail} that they took too long to answer the email and
            // to sign up again.
            await redis.hset('user-hash', hashedData)
            // TODO: on another route, that is hit by frontend /verify/${hashedEmail}, check if hashedEmail matches a cookie with the same hash, THEN send it to the backend and check again in the redis cache:
            // await redis.hexists('user-hash', hashedEmail)
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
                const emailSent = await sendEmail(
                    String(email),
                    String(hashedEmail),
                )
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
            return reply
                .setCookie('appname-hash', hashedEmail, {
                    path: '/verify',
                    maxAge: 60 * 60,
                })
                .send({
                    ok: true,
                    msg: `Email sent to ${email}`,
                    email: String(email),
                })
        },
    })
    done()
}
