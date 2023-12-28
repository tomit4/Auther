import type { VerifyPayloadType } from '@fastify/jwt'
import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// import { z } from 'zod'
// import sendEmail from '../../utils/send-email'

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
        url: '/delete-profile',
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
            const { redis, knex, jwt } = fastify
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
            const redisCacheExpired =
                (await redis.ttl(`${hashedEmail}-delete-profile-ask`)) < 0
            if (redisCacheExpired) {
                throw new Error(
                    'Sorry, but you took too long to answer your email, please log in and try again.',
                )
            }
            const rawEmailFromRedis = await redis.get(`${hashedEmail}-email`)
            if (!rawEmailFromRedis) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token in cache, redirecting to home.',
                })
            }
            const userByEmail = await knex('users')
                .where('email', hashedEmail)
                .andWhere('is_deleted', false)
                .first()
            if (!userByEmail) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No user found in db, redirecting home',
                })
            }
            await knex('users')
                .where('email', hashedEmail)
                .update({ is_deleted: true })
            reply.clearCookie('appname-refresh-token', {
                path: '/onboarding',
            })
            reply.clearCookie('appname-hash', {
                path: '/verify-change-pass',
            })
            reply.clearCookie('appname-hash', {
                path: '/verify-delete-profile',
            })
            reply.clearCookie('appname-hash', { path: '/verify' })
            reply.clearCookie('appname-hash', { path: '/verify-change-pass' })

            /* TODO: If anything goes wrong, send email to user letting  (encapsulate in helper func)
             * them know of delete profile attempt and ask if it was them (requires new brevo template...)
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
            */

            await redis.del(`${hashedEmail}-delete-profile-ask`)
            await redis.del(`${hashedEmail}-email`)
            await redis.del(`${hashedEmail}-refresh-token`)
            await redis.del(`${hashedEmail}-change-password-ask`)
            return reply.code(200).send({
                ok: true,
                message:
                    'You have successfully deleted your profile, redirecting you home',
            })
        },
    })
    done()
}
