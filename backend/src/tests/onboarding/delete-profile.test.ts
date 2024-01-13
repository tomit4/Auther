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

type DeleteProfileRes = {
    ok: boolean
    message?: string
}

const mockRes: DeleteProfileRes = {
    ok: true,
    message: 'You have successfully deleted your profile, redirecting you home',
}

const fastify: FastifyInstance = Fastify()

const registerRoute = async (fastify: FastifyInstance) => {
    const newRoute = async (
        fastify: FastifyInstance,
        options: FastifyPluginOptions,
        done: HookHandlerDoneFunction,
    ) => {
        fastify.route({
            method: 'DELETE',
            url: '/delete-profile',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<DeleteProfileRes> => {
                const { userService } = fastify
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
                    const refreshTokenIsValid = userService.verifyToken(
                        refreshToken,
                    ) as VerifyPayloadType & { email: string }
                    const hashedEmail = refreshTokenIsValid.email as string
                    stub(userService, 'checkIfCacheIsExpired').resolves(false)
                    const redisCacheExpired =
                        await userService.checkIfCacheIsExpired(
                            hashedEmail,
                            'delete-profile-ask',
                        )
                    stub(userService, 'grabFromCache').resolves(
                        process.env.TEST_EMAIL as string,
                    )
                    const rawEmailFromRedis = await userService.grabFromCache(
                        hashedEmail,
                        'email',
                    )
                    stub(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: hasher(process.env.TEST_EMAIL as string),
                        password: await userService.hashPassword(
                            process.env.TEST_PASSWORD as string,
                        ),
                        is_deleted: false,
                        created_at: new Date(),
                    })
                    const userByEmail =
                        await userService.grabUserByEmail(hashedEmail)
                    if (
                        !refreshToken ||
                        !hashedEmail ||
                        redisCacheExpired ||
                        !rawEmailFromRedis ||
                        !userByEmail
                    ) {
                        reply.code(401)
                    }
                    if (!refreshToken || !hashedEmail)
                        throw new Error(
                            'No refresh token provided from client, redirecting home',
                        )
                    if (redisCacheExpired)
                        throw new Error(
                            'Sorry, but you took too long to answer your email, please log in and try again.',
                        )
                    if (!rawEmailFromRedis)
                        throw new Error(
                            'No refresh token in cache, redirecting to home.',
                        )
                    if (!userByEmail)
                        throw new Error('No user found in db, redirecting home')
                    stub(userService, 'markUserAsDeleted').resolves(undefined)
                    await userService.markUserAsDeleted(hashedEmail)
                    stub(userService, 'removeFromCache').resolves(undefined)
                    await userService.removeFromCache(
                        hashedEmail,
                        'delete-profile-ask',
                    )
                    await userService.removeFromCache(hashedEmail, 'email')
                    await userService.removeFromCache(
                        hashedEmail,
                        'refresh-token',
                    )
                    await userService.removeFromCache(
                        hashedEmail,
                        'change-password-ask',
                    )
                    reply.code(200).send({
                        ok: true,
                        message:
                            'You have successfully deleted your profile, redirecting you home',
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

test('deletes user profile from db', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'DELETE',
        url: '/delete-profile',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
