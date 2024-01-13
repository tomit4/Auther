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
import { validatePasswordInput } from '../../lib/utils/schema-validators'

type BodyReq = {
    newPassword: string
}

type ChangePassRes = {
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
    newPassword: process.env.TEST_PASSWORD as string,
}

const mockRes: ChangePassRes = {
    ok: true,
    message: 'You have successfully changed your password!',
}

const fastify: FastifyInstance = Fastify()

const registerRoute = async (fastify: FastifyInstance) => {
    const newRoute = async (
        fastify: FastifyInstance,
        options: FastifyPluginOptions,
        done: HookHandlerDoneFunction,
    ) => {
        fastify.route({
            method: 'PATCH',
            url: '/change-password',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<ChangePassRes> => {
                const { userService } = fastify
                const { newPassword } = mockReq
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
                    validatePasswordInput(newPassword)
                    const refreshTokenIsValid = userService.verifyToken(
                        refreshToken,
                    ) as VerifyPayloadType & { email: string }
                    const hashedEmail = refreshTokenIsValid.email as string
                    stub(userService, 'checkIfCacheIsExpired').resolves(false)
                    const redisCacheExpired =
                        await userService.checkIfCacheIsExpired(
                            hashedEmail,
                            'change-password-ask',
                        )
                    if (!hashedEmail || redisCacheExpired) {
                        reply.code(401)
                        throw new Error(
                            'Sorry, but you took too long to answer your email, please log in and try again.',
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
                    const userPasswordByEmail: User | null =
                        await userService.grabUserByEmail(hashedEmail)
                    const { password } = userPasswordByEmail ?? {}
                    stub(userService, 'comparePasswordToHash').resolves(false)
                    const passwordHashesMatch =
                        password !== undefined &&
                        (await userService.comparePasswordToHash(
                            newPassword,
                            password,
                        ))
                    if (passwordHashesMatch) {
                        reply.code(409)
                        throw new Error(
                            'New password cannot be the same as old password.',
                        )
                    }
                    const newHashedPassword =
                        await userService.hashPassword(newPassword)
                    stub(userService, 'updatePassword').resolves(undefined)
                    await userService.updatePassword(
                        hashedEmail,
                        newHashedPassword,
                    )
                    stub(userService, 'removeFromCache').resolves(undefined)
                    await userService.removeFromCache(
                        hashedEmail,
                        'change-password-ask',
                    )
                    reply.code(200).send({
                        ok: true,
                        message: 'You have successfully changed your password!',
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

test('updates password after confirming change password request', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'PATCH',
        url: '/change-password',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
