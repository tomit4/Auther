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

    async hashPassword(password: string) {
        const { bcrypt } = this
        return await bcrypt.hash(password)
    }

    async grabUserByEmail(hashedEmail: string) {
        const { knex } = this
        return await knex('users').where('email', hashedEmail).first()
    }

    async isUserInCache(hashedEmail: string) {
        const { redis } = this
        return (
            (await redis.get(`${hashedEmail}-email`)) ||
            (await redis.get(`${hashedEmail}-password`))
        )
    }

    async updateAlreadyDeletedUser(
        hashedEmail: string,
        hashedPassword: string,
    ) {
        const { knex } = this
        await knex('users').where('email', hashedEmail).update({
            password: hashedPassword,
            is_deleted: false,
        })
    }

    // TODO: reset expiration to a .env variable
    async setUserCredentialsInCache(
        hashedEmail: string,
        email: string,
        hashedPassword: string,
    ) {
        const { redis } = this
        await redis.set(`${hashedEmail}-email`, email, 'EX', 60)
        await redis.set(`${hashedEmail}-password`, hashedPassword, 'EX', 60)
    }
}

export default UserService
