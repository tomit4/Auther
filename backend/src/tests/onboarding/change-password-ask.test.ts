import test from 'ava'
import { stub } from 'sinon'
import Fastify from 'fastify'
import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import type { VerifyPayloadType } from '@fastify/jwt'
import registerPlugins from '../../test-utils/auth-utils'
import { validatePasswordInput } from '../../lib/utils/schema-validators'
import sendEmail from '../../lib/utils/send-email'
import hasher from '../../lib/utils/hasher'

/* NOTE: Set to True if you want to actually send
 * an email to test (ensure TEST_EMAIL variable is
 * set to your actual email in the .env file) */
const actuallySendEmail = false

type BodyReq = {
    loginPassword: string
}

type ChangePassAskRes = {
    ok: boolean
    message?: string
}

type User = {
    id: number
    email: string
    password: string
    is_deleted: boolean
    created_at: Date
}

const mockReq: BodyReq = {
    loginPassword: process.env.TEST_PASSWORD as string,
}

const mockRes: ChangePassAskRes = {
    ok: true,
    message:
        'Your password is authenticated, please answer your email to continue change of password',
}

const fastify: FastifyInstance = Fastify()

const registerRoute = async (fastify: FastifyInstance) => {
    const newRoute = async (
        fastify: FastifyInstance,
        options: FastifyPluginOptions,
        done: HookHandlerDoneFunction,
    ) => {
        fastify.route({
            method: 'POST',
            url: '/change-password-ask',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<ChangePassAskRes> => {
                const { userService } = fastify
                const { loginPassword } = mockReq
                stub(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(
                        process.env.TEST_EMAIL as string,
                        process.env.JWT_REFRESH_EXP as string,
                    ),
                })
                const refreshToken = request.cookies[
                    'appname-refresh-token'
                ] as string
                try {
                    validatePasswordInput(loginPassword)
                    const refreshTokenIsValid = userService.verifyToken(
                        refreshToken,
                    ) as VerifyPayloadType & { email?: string }
                    const hashedEmail = refreshTokenIsValid.email as string
                    stub(userService, 'grabFromCache').resolves(
                        process.env.TEST_EMAIL,
                    )
                    const rawEmailFromRedis = await userService.grabFromCache(
                        hashedEmail,
                        'email',
                    )
                    if (!refreshToken || !hashedEmail || !rawEmailFromRedis) {
                        reply.code(401)
                        throw new Error(
                            'No refresh token found, redirecting to home.',
                        )
                    }
                    stub(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: hasher(process.env.TEST_EMAIL as string),
                        password: await userService.hashPassword(
                            process.env.TEST_PASSWORD as string,
                        ),
                        is_deleted: false,
                        created_at: new Date(),
                    })
                    const userByEmail: User | null =
                        await userService.grabUserByEmail(hashedEmail)
                    const { password } = userByEmail ?? {}
                    stub(userService, 'comparePasswordToHash').resolves(true)
                    const passwordHashesMatch =
                        password !== undefined &&
                        (await userService.comparePasswordToHash(
                            loginPassword,
                            password,
                        ))
                    if (!passwordHashesMatch) {
                        reply.code(401)
                        throw new Error('Incorrect password. Please try again.')
                    }
                    let emailSent: undefined | { wasSuccessfull: boolean }
                    if (actuallySendEmail) {
                        emailSent = await sendEmail(
                            process.env.TEST_EMAIL as string,
                            `verify-change-pass/${hashedEmail}` as string,
                            process.env
                                .BREVO_CHANGE_PASSWORD_TEMPLATE_ID as unknown as number,
                        )
                    } else emailSent = { wasSuccessfull: true }
                    if (!emailSent?.wasSuccessfull) {
                        fastify.log.error(
                            'Error occurred while sending email, are your Brevo credentials up to date? :=>',
                        )
                        throw new Error(
                            'An error occurred while sending email, please contact support.',
                        )
                    }
                    stub(userService, 'setInCacheWithExpiry').resolves(
                        undefined,
                    )
                    await userService.setInCacheWithExpiry(
                        hashedEmail,
                        'change-password-ask',
                        rawEmailFromRedis,
                        60,
                    )
                    reply
                        .code(200)
                        .setCookie('appname-hash', hashedEmail, {
                            path: '/verify-change-pass',
                            maxAge: 60 * 60,
                        })
                        .send({
                            ok: true,
                            message:
                                'Your password is authenticated, please answer your email to continue change of password',
                        })
                } catch (err) {
                    if (err instanceof Error)
                        reply.send({
                            ok: false,
                            message: err.message,
                        })
                }
                return reply
            },
        })
        done()
    }
    fastify.register(newRoute)
}

test('sends a transac email to change user password', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/change-password-ask',
    })

    if (!actuallySendEmail)
        t.log(
            'Actual email functionality not tested in change-password-ask route',
        )

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
