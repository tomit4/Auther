"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    // TODO: write return type
    async grabUserByEmail(hashedEmail) {
        const { knex } = this;
        return await knex('users').where('email', hashedEmail).first();
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
    // TODO: Consider isUserInCache and isUserInCacheExpired as same
    async isUserInCache(hashedEmail) {
        const { redis } = this;
        return ((await redis.get(`${hashedEmail}-email`)) ||
            (await redis.get(`${hashedEmail}-password`)));
    }
    async isUserInCacheExpired(hashedEmail) {
        const { redis } = this;
        return ((await redis.ttl(`${hashedEmail}-email`)) < 0 ||
            (await redis.ttl(`${hashedEmail}-password`)) < 0);
    }
    // TODO: write return type
    async grabUserCredentialsFromCache(hashedEmail) {
        const { redis } = this;
        const credentials = {};
        credentials.emailFromRedis = await redis.get(`${hashedEmail}-email`);
        credentials.hashedPasswordFromRedis = await redis.get(`${hashedEmail}-password`);
        return credentials;
    }
    // TODO: write return type
    async updateAlreadyDeletedUser(hashedEmail, hashedPassword) {
        const { knex } = this;
        await knex('users').where('email', hashedEmail).update({
            password: hashedPassword,
            is_deleted: false,
        });
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
    async signToken(hashedEmail, expiration) {
        const { jwt } = this;
        return jwt.sign({ email: hashedEmail }, { expiresIn: expiration });
    }
}
exports.default = UserService;
