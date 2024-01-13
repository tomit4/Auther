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
    hash: string
}

type ForgotPassChangeRes = {
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
    hash: hasher(process.env.TEST_EMAIL as string),
}

const mockRes: ForgotPassChangeRes = {
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
            url: '/forgot-password-change',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<ForgotPassChangeRes> => {
                const { userService } = fastify
                const { newPassword, hash } = mockReq
                stub(request, 'cookies').value({
                    'appname-forgot-pass-ask-token': userService.signToken(
                        hasher(process.env.TEST_EMAIL as string),
                        process.env.JWT_SESSION_EXP as string,
                    ),
                })
                const sessionToken =
                    request.cookies['appname-forgot-pass-ask-token']
                try {
                    validatePasswordInput(newPassword)
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
                        await userService.grabUserByEmail(email)
                    const { password } = userPasswordByEmail ?? {}
                    stub(userService, 'comparePasswordToHash').resolves(false)
                    const passwordHashesMatch =
                        password !== undefined &&
                        (await userService.comparePasswordToHash(
                            newPassword,
                            password,
                        ))
                    if (passwordHashesMatch) {
                        fastify.log.warn(
                            'User claimed they forgot their password, but uses their original password...',
                        )
                        reply.code(409).send({
                            ok: false,
                            message:
                                'Password provided is not original, please try again with a different password.',
                        })
                    }
                    const newHashedPassword =
                        await userService.hashPassword(newPassword)
                    stub(userService, 'updatePassword').resolves(undefined)
                    await userService.updatePassword(email, newHashedPassword)
                    stub(userService, 'removeFromCache').resolves(undefined)
                    await userService.removeFromCache(email, 'forgot-pass-ask')
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

test('updates password change in db', async t => {
    t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'PATCH',
        url: '/forgot-password-change',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mockRes))
    await fastify.close()
})
