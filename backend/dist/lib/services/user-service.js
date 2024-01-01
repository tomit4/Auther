"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserService {
    constructor(fastify) {
        this.knex = fastify.knex;
        this.redis = fastify.redis;
        this.bcrypt = fastify.bcrypt;
    }
    async hashPassword(password) {
        const { bcrypt } = this;
        return await bcrypt.hash(password);
    }
    async grabUserByEmail(hashedEmail) {
        const { knex } = this;
        return await knex('users').where('email', hashedEmail).first();
    }
    async isUserInCache(hashedEmail) {
        const { redis } = this;
        return ((await redis.get(`${hashedEmail}-email`)) ||
            (await redis.get(`${hashedEmail}-password`)));
    }
    async updateAlreadyDeletedUser(hashedEmail, hashedPassword) {
        const { knex } = this;
        await knex('users').where('email', hashedEmail).update({
            password: hashedPassword,
            is_deleted: false,
        });
    }
    // TODO: reset expiration to a .env variable
    async setUserCredentialsInCache(hashedEmail, email, hashedPassword) {
        const { redis } = this;
        await redis.set(`${hashedEmail}-email`, email, 'EX', 60);
        await redis.set(`${hashedEmail}-password`, hashedPassword, 'EX', 60);
    }
}
exports.default = UserService;
