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

type GrabUserCredsRes = {
    ok: boolean
    message?: string
    email?: string
}

const mockRes: GrabUserCredsRes = {
    ok: true,
    message: 'Successfully returned raw email from cache',
}

const fastify: FastifyInstance = Fastify()

const registerRoute = async (fastify: FastifyInstance) => {
    const newRoute = async (
        fastify: FastifyInstance,
        options: FastifyPluginOptions,
        done: HookHandlerDoneFunction,
    ) => {
        fastify.route({
            method: 'GET',
            url: '/get-user-creds',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<GrabUserCredsRes> => {
                const { userService } = fastify
                stub(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(
                        process.env.TEST_EMAIL as string,
                        process.env.JWT_REFRESH_EXP as string,
                    ),
                })
                const refreshToken = request.cookies['appname-refresh-token']
                try {
                    if (!refreshToken)
                        throw new Error(
                            'No refresh token sent from client, redirecting home...',
                        )
                    const refreshTokenIsValid = userService.verifyToken(
                        refreshToken,
                    ) as VerifyPayloadType
                    if (
                        typeof refreshTokenIsValid !== 'object' ||
                        !('email' in refreshTokenIsValid)
                    )
                        throw new Error(
                            'Refresh Token Payload in improper format',
                        )
                    const hashedEmail = refreshTokenIsValid.email as string
                    stub(userService, 'grabFromCache').resolves(
                        process.env.TEST_EMAIL,
                    )
                    const rawEmailFromRedis = await userService.grabFromCache(
                        hashedEmail,
                        'email',
                    )
                    if (!rawEmailFromRedis)
                        throw new Error(
                            `No raw email found in cache for : ${hashedEmail}`,
                        )
                    reply.code(200).send({
                        ok: true,
                        message: 'Successfully returned raw email from cache',
                    })
                } catch (err) {
                    if (err instanceof Error) {
                        reply.code(401).send({
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

test('retrieves user credentials (unhashed email) from cache', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'GET',
        url: '/get-user-creds',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
