import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { validateInputs } from '../../utils/schema-validators'
import sendEmail from '../../utils/send-email'
import hasher from '../../utils/hasher'

type BodyReq = {
    email: string
    password: string
}

type SignUpRes = {
    ok: boolean
    message?: string
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
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
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
        handler: async (
            request: FastifyRequest<{ Body: BodyReq }>,
            reply: FastifyReply,
        ): Promise<SignUpRes> => {
            const { email, password } = request.body
            const { userService } = fastify
            const hashedEmail = hasher(email)
            const hashedPassword = await userService.hashPassword(password)
            try {
                validateInputs(email, password)
                const userAlreadyInDb =
                    await userService.grabUserByEmail(hashedEmail)
                const userAlreadyInCache =
                    await userService.isUserInCacheExpired(hashedEmail)
                if (userAlreadyInDb && userAlreadyInDb.is_deleted === false)
                    throw new Error(
                        'You have already signed up, please log in.',
                    )
                if (!userAlreadyInCache)
                    throw new Error(
                        'You have already submitted your email, please check your inbox.',
                    )
                const emailSent = await sendEmail(
                    email as string,
                    `verify/${hashedEmail}` as string,
                    process.env.BREVO_SIGNUP_TEMPLATE_ID as unknown as number,
                )
                if (!emailSent?.wasSuccessfull) {
                    fastify.log.error(
                        'Error occurred while sending email, are your Brevo credentials up to date? :=>',
                    )
                    throw new Error(
                        'An error occurred while sending email, please contact support.',
                    )
                }
                await userService.setUserEmailAndPasswordInCache(
                    hashedEmail,
                    email,
                    hashedPassword,
                )
                reply
                    .code(200)
                    .setCookie('appname-hash', hashedEmail, {
                        path: '/verify',
                    })
                    .send({
                        ok: true,
                        message: `Your Email Was Successfully Sent to ${email}!`,
                    })
            } catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message)
                    reply.code(500).send({
                        ok: false,
                        message: err.message,
                    })
                }
            }
            return reply
        },
    })
    done()
}
