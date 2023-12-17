import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('users').del()

    // Inserts seed entries
    await knex('users').insert([
        { email: 'testemail@email.com', password: 'mypAss1234!' },
        { email: 'testemail2@email.com', password: 'mypAss1234!' },
    ])
}
