import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { VerifyPayloadType } from '@fastify/jwt'
import { z } from 'zod'
import sendEmail from '../../utils/send-email'

type BodyReq = {
    inputPassword: string
}

/*
type AuthRes = {
    ok: boolean
    message?: string
    error?: string
    sessionToken?: string
}
*/
export default (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    done: HookHandlerDoneFunction,
) => {
    fastify.withTypeProvider<ZodTypeProvider>().route({
        method: 'DELETE',
        url: '/delete-profile-ask',
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
                loginPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                    sessionToken: z.string(),
                }),
                401: z.object({
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
            // ): Promise<AuthRes> => {
        ) => {
            const { redis, knex, bcrypt, jwt } = fastify
            const { inputPassword } = request.body
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
            const zParsedPassword = passwordSchema.safeParse(inputPassword)
            if (!zParsedPassword.success) {
                const { error } = zParsedPassword
                throw new Error(error.issues[0].message as string)
            }
            const refreshToken = request.cookies[
                'appname-refresh-token'
            ] as string
            const refreshTokenIsValid = jwt.verify(
                refreshToken,
            ) as VerifyPayloadType & { email: string }
            const hashedEmail = refreshTokenIsValid.email as string
            if (!hashedEmail) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token provided by client, redirecting to home.',
                })
            }
            // TODO: place in /delete-profile route
            /*
            const redisCacheExpired =
                (await redis.ttl(`${hashedEmail}-delete-profile-ask`)) < 0
            if (redisCacheExpired) {
                throw new Error(
                    'Sorry, but you took too long to answer your email, please log in and try again.',
                )
            }
            */
            const rawEmailFromRedis = await redis.get(`${hashedEmail}-email`)
            if (!rawEmailFromRedis) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token in cache, redirecting to home.',
                })
            }
            const userPasswordByEmail = await knex('users')
                .select('password')
                .where('email', hashedEmail)
                .first()
            const { password } = userPasswordByEmail
            const passwordHashesMatch = await bcrypt
                .compare(inputPassword, password)
                .then(match => match)
                .catch(err => err)
            if (!passwordHashesMatch) {
                return reply.code(401).send({
                    ok: false,
                    message: 'Incorrect password. Please try again.',
                })
            }
            if (rawEmailFromRedis && hashedEmail) {
                const emailSent = await sendEmail(
                    rawEmailFromRedis as string,
                    `verify-delete-profile/${hashedEmail}` as string,
                    process.env
                        .BREVO_DELETE_ACCOUNT_TEMPLATE_ID as unknown as number,
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
            }
            await redis.set(
                `${hashedEmail}-delete-profile-ask`,
                hashedEmail,
                'EX',
                60,
            )
            // TODO: place in /delete-profile route
            // await redis.del(`${hashedEmail}-delete-profile-ask`)
            return reply
                .code(200)
                .setCookie('appname-hash', hashedEmail, {
                    path: '/verify-delete-profile',
                    maxAge: 60 * 60,
                })
                .send({
                    ok: true,
                    message:
                        'You have successfully requested to delete your profile, please check your email',
                })
        },
    })
    done()
}
