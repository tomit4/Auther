import type { FastifyInstance } from 'fastify'
import type { Knex } from 'knex'
import type { FastifyRedis } from '@fastify/redis'

type FastifyBcryptPluginType = {
    hash: (pwd: string) => Promise<string>
    compare: (data: string, hash: string) => Promise<boolean>
}

class UserService {
    knex: Knex
    redis: FastifyRedis
    bcrypt: FastifyBcryptPluginType

    constructor(fastify: FastifyInstance) {
        this.knex = fastify.knex
        this.redis = fastify.redis
        this.bcrypt = fastify.bcrypt as FastifyBcryptPluginType
    }

    async test() {
        const { knex } = this
        console.log('this.fastify.knex(users) :=>', await knex('users'))
        console.log('this is just a test of the userService :=>')
    }
}

export default UserService
