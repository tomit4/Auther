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
}
/*
type SignUpRes = {
    ok: boolean
    message?: string
    error?: string
}
*/
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'POST',
        url: '/forgot-password-ask',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        /*
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        */
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
            // ): Promise<SignUpRes> => {
        ) => {
            const { email } = request.body
            const { redis, knex } = fastify
            const hashedEmail = hasher(email)
            const emailSchema = z.string().email()
            try {
                const zParsedEmail = emailSchema.safeParse(email)
                // TODO: If the user deleted their profile and they sign up again,
                // we should simply change is_deleted to false again...
                const userAlreadyInDb = await knex('users')
                    .where('email', hashedEmail)
                    .andWhere('is_deleted', false)
                    .first()
                const userAlreadyInCache = await redis.get(
                    `${hashedEmail}-forgot-password-ask`,
                )
                const emailSent = await sendEmail(
                    email as string,
                    `verify-forgot-pass/${hashedEmail}` as string,
                    process.env
                        .BREVO_FORGOT_PASSWORD_TEMPLATE_ID as unknown as number,
                )
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail
                    throw new Error(error.issues[0].message as string)
                }
                if (!userAlreadyInDb)
                    throw new Error(
                        'There is no record of that email address, please sign up.',
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
                        message: err.message,
                    })
                }
            }
            await redis.set(
                `${hashedEmail}-forgot-password-ask`,
                hashedEmail,
                'EX',
                60,
            )
            return reply
                .code(200)
                .setCookie('appname-hash', hashedEmail, {
                    path: '/verify-forgot-pass',
                    maxAge: 60 * 60,
                })
                .send({
                    ok: true,
                    message: `Your forgot password request was successfully sent to ${email}!`,
                })
        },
    })
    done()
}
