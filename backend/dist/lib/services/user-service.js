"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserService {
    constructor(fastify) {
        this.knex = fastify.knex;
        this.redis = fastify.redis;
        this.bcrypt = fastify.bcrypt;
    }
    async test() {
        const { knex } = this;
        console.log('this.fastify.knex(users) :=>', await knex('users'));
        console.log('this is just a test of the userService :=>');
    }
}
exports.default = UserService;
