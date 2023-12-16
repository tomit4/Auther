"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    return knex.schema.createTable('test', table => {
        table.increments('id');
        table.string('email', 255).notNullable();
        table.string('password', 255).notNullable();
    });
}
exports.up = up;
async function down(knex) {
    return knex.schema.dropTable('test');
}
exports.down = down;
