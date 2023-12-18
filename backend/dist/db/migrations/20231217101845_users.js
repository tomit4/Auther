"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('users', table => {
        table.increments('id');
        table.string('email', 255).notNullable();
        table.string('hashed_email', 255).notNullable();
        table.string('password', 255).notNullable();
        table.datetime('created_at', { useTz: false }).defaultTo(knex.fn.now());
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTable('users');
}
exports.down = down;
