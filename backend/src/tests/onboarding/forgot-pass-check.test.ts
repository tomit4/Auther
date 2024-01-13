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
import hasher from '../../lib/utils/hasher'

type BodyReq = {
    hash: string
}

type ForgotPassCheckRes = {
    ok: boolean
    email?: string
    message?: string
    error?: string
}

const mockReq: BodyReq = {
    hash: hasher(process.env.TEST_EMAIL as string),
}

const mockRes: ForgotPassCheckRes = {
    ok: true,
    email: process.env.TEST_EMAIL as string,
    message:
        'Hashed Email Verified and Validated, now you can change your password',
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
            url: '/forgot-password-check',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<ForgotPassCheckRes> => {
                const { hash } = mockReq
                const { userService } = fastify
                stub(request, 'cookies').value({
                    'appname-forgot-pass-ask-token': userService.signToken(
                        hasher(process.env.TEST_EMAIL as string),
                        process.env.JWT_SESSION_EXP as string,
                    ),
                })
                const sessionToken =
                    request.cookies['appname-forgot-pass-ask-token']
                try {
                    const sessionTokenIsValid = userService.verifyToken(
                        sessionToken as string,
                    ) as VerifyPayloadType & { email: string }
                    const { email } = sessionTokenIsValid
                    if (hash !== email) {
                        reply.code(400)
                        throw new Error(
                            'Provided Hashes do not match, please try again',
                        )
                    }
                    stub(userService, 'grabFromCache').resolves(
                        process.env.TEST_EMAIL as string,
                    )
                    const emailFromCache = await userService.grabFromCache(
                        email,
                        'forgot-pass-ask',
                    )
                    if (!emailFromCache) {
                        reply.code(401)
                        throw new Error(
                            'You took too long to answer the forgot password email, please try again',
                        )
                    }
                    reply.code(200).send({
                        ok: true,
                        email: emailFromCache,
                        message:
                            'Hashed Email Verified and Validated, now you can change your password',
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

test('verifies and validates if user can change password', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/forgot-password-check',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
