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
import hasher from '../../lib/utils/hasher'

type BodyReq = {
    hashedEmail: string
}

type VerifyRes = {
    ok: boolean
    message?: string
    error?: string
    sessionToken?: string
}

const mockReq: BodyReq = {
    hashedEmail: hasher(process.env.TEST_EMAIL as string),
}

const mockRes: VerifyRes = {
    ok: true,
    message: 'Your email has been verified, redirecting you to the app...',
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
            url: '/verify',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<VerifyRes> => {
                const { hashedEmail } = mockReq
                const { userService } = fastify
                try {
                    stub(userService, 'isUserInCacheExpired').resolves(false)
                    const redisCacheExpired =
                        await userService.isUserInCacheExpired(hashedEmail)
                    stub(userService, 'grabUserCredentialsFromCache').resolves({
                        emailFromRedis: process.env.TEST_EMAIL as string,
                        hashedPasswordFromRedis: process.env
                            .TEST_PASSWORD as string,
                    })
                    const { emailFromRedis, hashedPasswordFromRedis } =
                        await userService.grabUserCredentialsFromCache(
                            hashedEmail,
                        )
                    stub(userService, 'grabUserByEmail').resolves(null)
                    const userAlreadyInDb =
                        await userService.grabUserByEmail(hashedEmail)
                    if (redisCacheExpired)
                        throw new Error(
                            'Sorry, but you took too long to answer your email, please sign up again.',
                        )
                    if (!emailFromRedis || !hashedPasswordFromRedis)
                        throw new Error(
                            'No data found by that email address, please sign up again.',
                        )
                    if (userAlreadyInDb && !userAlreadyInDb.is_deleted)
                        throw new Error(
                            'You have already signed up, please log in.',
                        )
                    stub(userService, 'updateAlreadyDeletedUser').resolves(
                        undefined,
                    )
                    stub(userService, 'insertUserIntoDb').resolves(undefined)
                    if (userAlreadyInDb?.is_deleted) {
                        await userService.updateAlreadyDeletedUser(
                            hashedEmail,
                            hashedPasswordFromRedis,
                        )
                    } else {
                        await userService.insertUserIntoDb(
                            hashedEmail,
                            hashedPasswordFromRedis,
                        )
                    }
                    stub(
                        userService,
                        'setUserEmailInCacheAndDeletePassword',
                    ).resolves(undefined)
                    await userService.setUserEmailInCacheAndDeletePassword(
                        hashedEmail,
                        emailFromRedis,
                    )
                    userService.signToken(
                        hashedEmail,
                        process.env.JWT_SESSION_EXP as string,
                    )
                    const refreshToken = userService.signToken(
                        hashedEmail,
                        process.env.JWT_REFRESH_EXP as string,
                    )
                    stub(userService, 'setRefreshTokenInCache').resolves(
                        undefined,
                    )
                    await userService.setRefreshTokenInCache(
                        hashedEmail,
                        refreshToken,
                    )
                    reply
                        .code(200)
                        .setCookie('appname-refresh-token', refreshToken, {
                            secure: true,
                            httpOnly: true,
                            sameSite: true,
                        })
                        .send({
                            ok: true,
                            message:
                                'Your email has been verified, redirecting you to the app...',
                        })
                } catch (err) {
                    if (err instanceof Error) {
                        fastify.log.error('ERROR :=>', err.message)
                        reply.code(500).send({
                            ok: false,
                            error: err.message,
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

test('verifies user credentials after responding to email and signs user up', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/verify',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
