import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex('users').del()

    // Inserts seed entries
    await knex('users').insert([
        {
            email: 'testemail@email.com',
            hashed_email:
                '6c5ff508eafa308e7c0451c69dbc503fd39879a62cfee6133d37b431e743czzf',
            password: 'mypAss1234!',
        },
        {
            email: 'testemail2@email.com',
            hashed_email:
                '7c5ff508eafa308e7c0451c69dbc503fd39879a62cfee6133d37b431e7431669',
            password: 'mypAss1234!',
        },
    ])
}
