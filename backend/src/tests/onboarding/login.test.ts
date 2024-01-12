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
import { validateInputs } from '../../lib/utils/schema-validators'

type BodyReq = {
    email: string
    loginPassword: string
}

type AuthRes = {
    ok: boolean
    message?: string
    error?: string
    sessionToken?: string
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
    loginPassword: process.env.TEST_PASSWORD as string,
}

const mockRes: AuthRes = {
    ok: true,
    message:
        'You have been successfully authenticated! Redirecting you to the app...',
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
            url: '/login',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<AuthRes> => {
                const { userService } = fastify
                const { email, loginPassword } = mockReq
                const hashedEmail = hasher(email)
                try {
                    validateInputs(email, loginPassword)
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
                    if (!userByEmail || !passwordHashesMatch) reply.code(401)
                    if (!userByEmail) {
                        throw new Error(
                            'No record of that email found. Please try again.',
                        )
                    }
                    if (!passwordHashesMatch) {
                        throw new Error('Incorrect password. Please try again.')
                    }
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
                    stub(userService, 'setUserEmailInCache').resolves(undefined)
                    await userService.setUserEmailInCache(hashedEmail, email)
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
                                'You have been successfully authenticated! Redirecting you to the app...',
                        })
                } catch (err) {
                    if (err instanceof Error) {
                        fastify.log.error('ERROR :=>', err)
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

test('logs user in with valid credentials', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/login',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
