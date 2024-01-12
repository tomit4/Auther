import test from 'ava'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import registerPlugins from '../../test-utils/auth-utils'
import signUpTestSuccess from '../../test-utils/auth-tests/signup-test-success'

const fastify: FastifyInstance = Fastify()

test.before(async () => {
    await registerPlugins(fastify)
    await fastify.listen()
    await fastify.ready()
})

test.after(async () => {
    await fastify.close()
})

const runTests = async () => {
    await signUpTestSuccess(test, fastify)
}

runTests()
