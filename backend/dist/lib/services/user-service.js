"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
class UserService {
    constructor(fastify) {
        this.knex = fastify.knex;
        this.redis = fastify.redis;
        this.jwt = fastify.jwt;
        this.bcrypt = fastify.bcrypt;
    }
    // TODO: Organize based off of which plugin used
    async hashPassword(password) {
        const { bcrypt } = this;
        return await bcrypt.hash(password);
    }
    async comparePasswordToHash(loginPassword, password) {
        const { bcrypt } = this;
        return await bcrypt
            .compare(loginPassword, password)
            .then(match => match)
            .catch(err => err);
    }
    async updatePassword(hashedEmail, newHashedPassword) {
        const { knex } = this;
        await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', false)
            .update({
            password: newHashedPassword,
        });
    }
    async grabUserByEmail(hashedEmail) {
        const { knex } = this;
        const alreadyDeletedUser = await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', true)
            .first();
        const existingUser = await knex('users')
            .where('email', hashedEmail)
            .andWhere('is_deleted', false)
            .first();
        return alreadyDeletedUser !== null && alreadyDeletedUser !== void 0 ? alreadyDeletedUser : existingUser;
    }
    async insertUserIntoDb(hashedEmail, hashedPasswordFromRedis) {
        const { knex } = this;
        await knex
            .insert({
            email: hashedEmail,
            password: hashedPasswordFromRedis,
            is_deleted: false,
        })
            .into('users');
    }
    async updateAlreadyDeletedUser(hashedEmail, hashedPassword) {
        const { knex } = this;
        await knex('users').where('email', hashedEmail).update({
            password: hashedPassword,
            is_deleted: false,
        });
    }
    async markUserAsDeleted(hashedEmail) {
        const { knex } = this;
        await knex('users').where('email', hashedEmail).update({
            is_deleted: true,
        });
    }
    async grabUserEmailInCache(hashedEmail) {
        const { redis } = this;
        return await redis.get(`${hashedEmail}-email`);
    }
    // NOTE: very similar to checkIfCacheIsExpired, see if you can consolidate,
    // but due to better readability where used, this is left as is
    async isUserInCacheExpired(hashedEmail) {
        const { redis } = this;
        return ((await redis.ttl(`${hashedEmail}-email`)) < 0 ||
            (await redis.ttl(`${hashedEmail}-password`)) < 0);
    }
    async grabUserCredentialsFromCache(hashedEmail) {
        const { redis } = this;
        const credentials = {};
        credentials.emailFromRedis = await redis.get(`${hashedEmail}-email`);
        credentials.hashedPasswordFromRedis = await redis.get(`${hashedEmail}-password`);
        return credentials;
    }
    async grabFromCache(hashedEmail, key) {
        const { redis } = this;
        return await redis.get(`${hashedEmail}-${key}`);
    }
    async setUserEmailInCache(hashedEmail, email) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-email`, email, 'EX', 180);
    }
    // TODO: reset expiration to a .env variable
    async setUserEmailAndPasswordInCache(hashedEmail, email, hashedPassword) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-email`, email, 'EX', 60);
        await redis.set(`${hashedEmail}-password`, hashedPassword, 'EX', 60);
    }
    async setUserEmailInCacheAndDeletePassword(hashedEmail, emailFromRedis) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-email`, emailFromRedis, 'EX', 60);
        await redis.del(`${hashedEmail}-password`);
    }
    // TODO: reset expiration to a .env variable
    async setRefreshTokenInCache(hashedEmail, refreshToken) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-refresh-token`, refreshToken, 'EX', 180);
    }
    async removeFromCache(hashedEmail, key) {
        const { redis } = this;
        await redis.del(`${hashedEmail}-${key}`);
    }
    async setInCacheWithExpiry(hashedEmail, key, value, expiration) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-${key}`, value, 'EX', expiration);
    }
    async checkIfCacheIsExpired(hashedEmail, key) {
        const { redis } = this;
        return (await redis.ttl(`${hashedEmail}-${key}`)) < 0;
    }
    signToken(hashedEmail, expiration) {
        const { jwt } = this;
        return jwt.sign({ email: hashedEmail }, { expiresIn: expiration });
    }
    verifyToken(token) {
        const { jwt } = this;
        try {
            return jwt.verify(token);
        }
        catch (err) {
            if (err instanceof Error) {
                throw new Error(err.message);
            }
        }
    }
}
const userServicePlugin = (fastify, options, next) => {
    try {
        if (!fastify.userService) {
            const newUserService = new UserService(fastify);
            fastify.decorate('userService', newUserService);
        }
        next();
    }
    catch (err) {
        if (err instanceof Error)
            next(err);
    }
};
const userService = (0, fastify_plugin_1.default)(userServicePlugin, {
    name: 'fastify-user-service-plugin',
});
exports.default = userService;
