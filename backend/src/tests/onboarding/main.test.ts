import test from 'ava'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import registerPlugins from '../../test-utils/auth-utils'
import signUpTest from '../../test-utils/auth-tests/signup-test'

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
    await signUpTest(test, fastify)
}

runTests()
