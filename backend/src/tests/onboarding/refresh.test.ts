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

type RefreshRes = {
    ok: boolean
    message?: string
    sessionToken?: string
}

const mockRes: RefreshRes = {
    ok: true,
    message: 'Successfully refreshed session.',
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
            url: '/refresh',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<RefreshRes> => {
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
                    const refreshTokenIsValid =
                        userService.verifyToken(refreshToken)
                    if (
                        typeof refreshTokenIsValid !== 'object' ||
                        !('email' in refreshTokenIsValid)
                    )
                        throw new Error('Refresh Token has incorrect payload')
                    const hashedEmail = refreshTokenIsValid.email
                    stub(userService, 'grabFromCache').resolves(
                        userService.signToken(
                            process.env.TEST_EMAIL as string,
                            process.env.JWT_REFRESH_EXP as string,
                        ),
                    )
                    const refreshTokenFromRedis =
                        await userService.grabFromCache(
                            hashedEmail as string,
                            'refresh-token',
                        )
                    if (!refreshTokenFromRedis)
                        throw new Error('Invalid refresh token.')
                    userService.signToken(
                        hashedEmail as string,
                        process.env.JWT_SESSION_EXP as string,
                    )
                    reply.code(200).send({
                        ok: true,
                        message: 'Successfully refreshed session.',
                    })
                } catch (err) {
                    reply.code(401).send({
                        ok: false,
                        message: 'Invalid refresh token.',
                    })
                }
                return reply
            },
        })
        done()
    }
    fastify.register(newRoute)
}

test('refreshes session token after validating refresh token', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'GET',
        url: '/refresh',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
