import type { FastifyInstance } from 'fastify'
import type { Knex } from 'knex'
import type { JWT, VerifyPayloadType } from '@fastify/jwt'
import type { FastifyRedis } from '@fastify/redis'

type FastifyBcryptPluginType = {
    hash: (pwd: string) => Promise<string>
    compare: (data: string, hash: string) => Promise<boolean>
}

type User = {
    id: number
    email: string
    password: string
    is_deleted: boolean
    created_at: string
}

class UserService {
    knex: Knex
    redis: FastifyRedis
    jwt: JWT
    bcrypt: FastifyBcryptPluginType

    constructor(fastify: FastifyInstance) {
        this.knex = fastify.knex
        this.redis = fastify.redis
        this.jwt = fastify.jwt
        this.bcrypt = fastify.bcrypt as FastifyBcryptPluginType
    }

    // TODO: Organize based off of which plugin used
    async hashPassword(password: string): Promise<string> {
        const { bcrypt } = this
        return await bcrypt.hash(password)
    }

    async comparePasswordToHash(
        loginPassword: string,
        password: string,
    ): Promise<boolean> {
        const { bcrypt } = this
        return await bcrypt
            .compare(loginPassword, password)
            .then(match => match)
            .catch(err => err)
    }

    // TODO: write return type
    async grabUserByEmail(hashedEmail: string): Promise<User> {
        const { knex } = this
        return await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', false)
            .first()
    }

    async insertUserIntoDb(
        hashedEmail: string,
        hashedPasswordFromRedis: string,
    ): Promise<void> {
        const { knex } = this
        await knex
            .insert({
                email: hashedEmail,
                password: hashedPasswordFromRedis,
                is_deleted: false,
            })
            .into('users')
    }

    // TODO: write return type
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

    async grabUserEmailInCache(hashedEmail: string): Promise<string | null> {
        const { redis } = this
        return await redis.get(`${hashedEmail}-email`)
    }

    // TODO: Consider isUserInCache and isUserInCacheExpired as same
    async isUserInCache(hashedEmail: string): Promise<string | null> {
        const { redis } = this
        return (
            (await redis.get(`${hashedEmail}-email`)) ||
            (await redis.get(`${hashedEmail}-password`))
        )
    }

    async isUserInCacheExpired(hashedEmail: string): Promise<boolean> {
        const { redis } = this
        return (
            (await redis.ttl(`${hashedEmail}-email`)) < 0 ||
            (await redis.ttl(`${hashedEmail}-password`)) < 0
        )
    }

    // TODO: write return type
    async grabUserCredentialsFromCache(hashedEmail: string) {
        const { redis } = this
        const credentials: {
            emailFromRedis?: string | null
            hashedPasswordFromRedis?: string | null
        } = {}
        credentials.emailFromRedis = await redis.get(`${hashedEmail}-email`)
        credentials.hashedPasswordFromRedis = await redis.get(
            `${hashedEmail}-password`,
        )
        return credentials
    }

    async grabRefreshTokenFromCache(
        hashedEmail: string,
    ): Promise<string | null> {
        const { redis } = this
        return await redis.get(`${hashedEmail}-refresh-token`)
    }

    async setUserEmailInCache(
        hashedEmail: string,
        email: string,
    ): Promise<void> {
        const { redis } = this
        await redis.set(`${hashedEmail}-email`, email, 'EX', 180)
    }

    // TODO: reset expiration to a .env variable
    async setUserEmailAndPasswordInCache(
        hashedEmail: string,
        email: string,
        hashedPassword: string,
    ): Promise<void> {
        const { redis } = this
        await redis.set(`${hashedEmail}-email`, email, 'EX', 60)
        await redis.set(`${hashedEmail}-password`, hashedPassword, 'EX', 60)
    }

    async setUserEmailInCacheAndDeletePassword(
        hashedEmail: string,
        emailFromRedis: string,
    ): Promise<void> {
        const { redis } = this
        await redis.set(`${hashedEmail}-email`, emailFromRedis, 'EX', 60)
        await redis.del(`${hashedEmail}-password`)
    }

    // TODO: reset expiration to a .env variable
    async setRefreshTokenInCache(
        hashedEmail: string,
        refreshToken: string,
    ): Promise<void> {
        const { redis } = this
        await redis.set(
            `${hashedEmail}-refresh-token`,
            refreshToken as string,
            'EX',
            180,
        )
    }

    async removeFromCache(hashedEmail: string, key: string): Promise<void> {
        const { redis } = this
        await redis.del(`${hashedEmail}-${key}`)
    }

    signToken(hashedEmail: string, expiration: string): string {
        const { jwt } = this
        return jwt.sign({ email: hashedEmail }, { expiresIn: expiration })
    }

    verifyToken(token: string): VerifyPayloadType | undefined {
        const { jwt } = this
        try {
            return jwt.verify(token)
        } catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message)
            }
        }
    }
}

export default UserService
