import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', table => {
        table.increments('id')
        table.string('email', 255).notNullable()
        table.string('password', 255).notNullable()
        table.datetime('created_at', { useTz: false }).defaultTo(knex.fn.now())
    })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('users')
}
