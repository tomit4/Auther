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
import {
    passwordSchemaRegex,
    passwordSchemaErrMsg,
} from '../../schemas/password'

type BodyReq = {
    newPassword: string
    hash: string
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
        method: 'PATCH',
        url: '/forgot-password-change',
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
            const { newPassword, hash } = request.body
            const passwordSchema = z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            })
            const zParsedPassword = passwordSchema.safeParse(newPassword)
            if (!zParsedPassword.success) {
                const { error } = zParsedPassword
                throw new Error(error.issues[0].message as string)
            }

            const sessionToken =
                request.cookies['appname-forgot-pass-ask-token']
            const sessionTokenIsValid = jwt.verify(
                sessionToken as string,
            ) as VerifyPayloadType & { hashedEmail: string }
            const { hashedEmail } = sessionTokenIsValid
            if (hash !== hashedEmail) {
                reply.code(400)
                throw new Error(
                    'Provided Hashes do not match, please try again',
                )
            }
            const email = await redis.get(`${hashedEmail}-forgot-pass-ask`)
            if (!email) {
                reply.code(401)
                throw new Error(
                    'You took too long to answer the forgot password email, please try again',
                )
            }
            const userPasswordByEmail = await knex('users')
                .select('password')
                .where('email', hashedEmail)
                .andWhere('is_deleted', false)
                .first()
            const { password } = userPasswordByEmail
            const passwordHashesMatch = await bcrypt
                .compare(newPassword, password)
                .then(match => match)
                .catch(err => err)
            // TODO: set up separate db table that keeps track of last 5 passwords
            // for user and throws this 409 reply if new password is in table
            // (i.e. newPassword cannot be the same as last 5 passwords)
            if (passwordHashesMatch) {
                fastify.log.warn(
                    'User claimed they forgot their password, but uses their original password...',
                )
                return reply.code(409).send({
                    ok: false,
                    message:
                        'Password provided is not original, please try again with a different password.',
                })
            }
            const newHashedPassword = await bcrypt.hash(newPassword)
            await knex('users')
                .where('email', hashedEmail)
                .andWhere('is_deleted', false)
                .update({
                    password: newHashedPassword,
                })
            await redis.del(`${hashedEmail}-forgot-pass-ask`)
            return reply
                .code(200)
                .clearCookie('appname-forgot-pass-ask', { path: '/onboarding' })
                .send({
                    ok: true,
                    message: 'You have successfully changed your password!',
                })
        },
    })
    done()
}
