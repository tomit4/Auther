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

type LogOutRes = {
    ok: boolean
    message?: string
}

const mockRes: LogOutRes = {
    ok: true,
    message: 'logged out',
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
            url: '/logout',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<LogOutRes> => {
                const { userService } = fastify
                stub(request, 'cookies').resolves({
                    'appname-refresh-token': userService.signToken(
                        process.env.TEST_EMAIL as string,
                        process.env.JWT_REFRESH_EXP as string,
                    ),
                })
                const refreshToken = request.cookies['appname-refresh-token']
                try {
                    if (!refreshToken)
                        throw new Error('No refresh token sent from client')
                    const refreshTokenIsValid =
                        userService.verifyToken(refreshToken)
                    if (!refreshTokenIsValid) {
                        reply.code(401)
                        throw new Error('Invalid refresh token')
                    }
                    if (
                        typeof refreshTokenIsValid !== 'object' ||
                        !('email' in refreshTokenIsValid)
                    )
                        throw new Error('Refresh Token has incorrect payload')
                    const hashedEmail = refreshTokenIsValid.email
                    stub(userService, 'removeFromCache').resolves(undefined)
                    await userService.removeFromCache(
                        hashedEmail as string,
                        'refresh-token',
                    )
                    await userService.removeFromCache(
                        hashedEmail as string,
                        'email',
                    )
                    reply.code(200).send({
                        ok: true,
                        message: 'logged out',
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

test('logs user out from app', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'GET',
        url: '/logout',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
