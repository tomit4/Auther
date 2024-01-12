import test from 'ava'
import Fastify from 'fastify'
import type {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
    HookHandlerDoneFunction,
} from 'fastify'
import registerPlugins from '../test-utils/auth-utils'
import sendEmail from '../lib/utils/send-email'
import hasher from '../lib/utils/hasher'
import { validateInputs } from '../lib/utils/schema-validators'

type BodyReq = {
    email: string
    password: string
}

type SignUpRes = {
    ok: boolean
    message?: string
    error?: string
}

// TODO: Set up registration of plugins and mock output
// import mock from '../mocks/auth/mock_get-user.json'
const mock = {
    ok: true,
    message: 'Hello World!',
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
            url: '/signup',
            handler: async (
                request: FastifyRequest,
                reply: FastifyReply,
            ): Promise<SignUpRes> => {
                // NOTE:  userService is now registered and
                // all necessary plugins to do basic testing of routes is in place
                const body: BodyReq = {
                    email: process.env.TEST_EMAIL as string,
                    password: process.env.TEST_PASSWORD as string,
                }
                const { email, password } = body
                const { userService } = fastify
                return reply.send({ ok: true, message: 'Hello World!' })
            },
        })
        done()
    }
    fastify.register(newRoute)
}

test('requests the / route', async t => {
    // t.plan(3)
    await registerPlugins(fastify)
    await registerRoute(fastify)
    await fastify.listen()
    await fastify.ready()

    const response = await fastify.inject({
        method: 'POST',
        url: '/signup',
    })

    t.is(response.statusCode, 200)
    t.is(response.headers['content-type'], 'application/json; charset=utf-8')
    t.is(response.payload, JSON.stringify(mock))
    await fastify.close()
})
