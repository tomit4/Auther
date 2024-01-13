import type {
    FastifyInstance,
    FastifyPluginOptions,
    HookHandlerDoneFunction,
} from 'fastify'
import type { Knex } from 'knex'
import type { JWT, VerifyPayloadType } from '@fastify/jwt'
import type { FastifyRedis } from '@fastify/redis'
import fp from 'fastify-plugin'

declare module 'fastify' {
    interface FastifyInstance {
        userService: UserService
    }
}

type FastifyBcryptPluginType = {
    hash: (pwd: string) => Promise<string>
    compare: (data: string, hash: string) => Promise<boolean>
}

type User = {
    id: number
    email: string
    password: string
    is_deleted: boolean
    created_at: Date
}

type UserCredentials = {
    emailFromRedis?: string | null
    hashedPasswordFromRedis?: string | null
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

    async updatePassword(
        hashedEmail: string,
        newHashedPassword: string,
    ): Promise<void> {
        const { knex } = this
        await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', false)
            .update({
                password: newHashedPassword,
            })
    }

    async grabUserByEmail(hashedEmail: string): Promise<User | null> {
        const { knex } = this
        const alreadyDeletedUser = await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', true)
            .first()
        const existingUser = await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', false)
            .first()
        return alreadyDeletedUser ?? existingUser
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

    async updateAlreadyDeletedUser(
        hashedEmail: string,
        hashedPassword: string,
    ): Promise<void> {
        const { knex } = this
        await knex('users').where('email', hashedEmail).update({
            password: hashedPassword,
            is_deleted: false,
        })
    }

    async markUserAsDeleted(hashedEmail: string): Promise<void> {
        const { knex } = this
        await knex('users').where('email', hashedEmail).update({
            is_deleted: true,
        })
    }

    // NOTE: very similar to checkIfCacheIsExpired, see if you can consolidate,
    // but due to better readability where used, this is left as is
    async isUserInCacheExpired(hashedEmail: string): Promise<boolean> {
        const { redis } = this
        return (
            (await redis.ttl(`${hashedEmail}-email`)) < 0 ||
            (await redis.ttl(`${hashedEmail}-password`)) < 0
        )
    }

    async grabUserCredentialsFromCache(
        hashedEmail: string,
    ): Promise<UserCredentials> {
        const { redis } = this
        const credentials: UserCredentials = {}
        credentials.emailFromRedis = await redis.get(`${hashedEmail}-email`)
        credentials.hashedPasswordFromRedis = await redis.get(
            `${hashedEmail}-password`,
        )
        return credentials
    }

    async grabFromCache(
        hashedEmail: string,
        key: string,
    ): Promise<string | null> {
        const { redis } = this
        return await redis.get(`${hashedEmail}-${key}`)
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
        await redis.set(`${hashedEmail}-email`, emailFromRedis, 'EX', 180)
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

    async setInCacheWithExpiry(
        hashedEmail: string,
        key: string,
        value: string,
        expiration: number,
    ): Promise<void> {
        const { redis } = this
        await redis.set(`${hashedEmail}-${key}`, value, 'EX', expiration)
    }

    async checkIfCacheIsExpired(
        hashedEmail: string,
        key: string,
    ): Promise<boolean> {
        const { redis } = this
        return (await redis.ttl(`${hashedEmail}-${key}`)) < 0
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

const userServicePlugin = (
    fastify: FastifyInstance,
    options: FastifyPluginOptions,
    next: HookHandlerDoneFunction,
) => {
    try {
        if (!fastify.userService) {
            const newUserService = new UserService(fastify)
            fastify.decorate('userService', newUserService)
        }
        next()
    } catch (err) {
        if (err instanceof Error) next(err)
    }
}

const userService = fp(userServicePlugin, {
    name: 'fastify-user-service-plugin',
})

export default userService
