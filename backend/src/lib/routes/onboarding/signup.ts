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
        // TODO: This is actually the /signup route to replace the old signup.ts
        url: '/signup',
        schema: {
            body: z.string(),
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
            request: FastifyRequest,
            reply: FastifyReply,
        ): Promise<SignUpRes> => {
            const { email, password } = JSON.parse(String(request.body))
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
                const emailSent = await sendEmail(String(email))
                if (!emailSent.wasSuccessfull)
                    throw new Error(String(emailSent.error))

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
