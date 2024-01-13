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
import registerPlugins from '../../test-utils/auth-utils'
import { validateEmailInput } from '../../lib/utils/schema-validators'
import sendEmail from '../../lib/utils/send-email'
import hasher from '../../lib/utils/hasher'

/* NOTE: Set to True if you want to actually send
 * an email to test (ensure TEST_EMAIL variable is
 * set to your actual email in the .env file) */
const actuallySendEmail = false

type BodyReq = {
    email: string
}

type ForgotPassAskRes = {
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
    email: process.env.TEST_EMAIL as string,
}

const mockRes: ForgotPassAskRes = {
    ok: true,
    message: `Your forgot password request was successfully sent to ${process.env.TEST_EMAIL}!`,
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
            url: '/forgot-password-ask',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<ForgotPassAskRes> => {
                const { email } = mockReq
                const { userService } = fastify
                const hashedEmail = hasher(email)
                try {
                    validateEmailInput(email)
                    stub(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: hasher(process.env.TEST_EMAIL as string),
                        password: await userService.hashPassword(
                            process.env.TEST_PASSWORD as string,
                        ),
                        is_deleted: false,
                        created_at: new Date(),
                    })
                    const userAlreadyInDb =
                        await userService.grabUserByEmail(hashedEmail)
                    stub(userService, 'grabFromCache').resolves(null)
                    const userAlreadyInCache = await userService.grabFromCache(
                        hashedEmail,
                        'forgot-pass-ask',
                    )
                    if (!userAlreadyInDb || userAlreadyInDb.is_deleted)
                        throw new Error(
                            'There is no record of that email address, please sign up.',
                        )
                    if (userAlreadyInCache)
                        throw new Error(
                            'You have already submitted your email, please check your inbox.',
                        )
                    let emailSent: undefined | { wasSuccessfull: boolean }
                    if (actuallySendEmail) {
                        emailSent = await sendEmail(
                            email as string,
                            `verify-forgot-pass/${hashedEmail}` as string,
                            process.env
                                .BREVO_FORGOT_PASSWORD_TEMPLATE_ID as unknown as number,
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
                    userService.signToken(
                        hashedEmail,
                        process.env.JWT_SESSION_EXP as string,
                    )
                    stub(userService, 'setInCacheWithExpiry').resolves(
                        undefined,
                    )
                    await userService.setInCacheWithExpiry(
                        hashedEmail,
                        'forgot-pass-ask',
                        email,
                        60,
                    )
                    reply.code(200).send({
                        ok: true,
                        message: `Your forgot password request was successfully sent to ${email}!`,
                    })
                } catch (err) {
                    if (err instanceof Error) {
                        reply.send({
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
    fastify.register(newRoute)
}

test('sends a transac email to reset forgotten password', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/forgot-password-ask',
    })

    if (!actuallySendEmail)
        t.log(
            'Actual email functionality not tested in forgot-password-ask route',
        )

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
