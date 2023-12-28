"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = void 0;
async function seed(knex) {
    // Deletes ALL existing entries
    await knex('users').del();
    // Inserts seed entries
    await knex('users').insert([
        {
            email: 'testemail@email.com',
            password: 'mypAss1234!',
            is_deleted: false,
        },
        {
            email: 'testemail2@email.com',
            password: 'mypAss1234!',
            is_deleted: false,
        },
    ]);
}
exports.seed = seed;
