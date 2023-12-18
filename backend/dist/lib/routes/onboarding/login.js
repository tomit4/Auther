"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
type SignUpRes = {
    ok: boolean
    msg?: string
    email?: string
    error?: string
}
*/
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/login',
        /*
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    msg: z.string().optional(),
                    email: z.string().optional(),
                    error: z.string().optional(),
                }),
                400: z.object({
                    ok: z.boolean(),
                    error: z.string(),
                }),
            },
        },
        */
        handler: async (request, reply) => {
            const { knex, bcrypt } = fastify;
            const { email, loginPassword } = request.body;
            try {
                const { password } = await knex('users')
                    .select('password')
                    .where('email', email)
                    .first();
                const passwordHashesmatch = await bcrypt
                    .compare(loginPassword, password)
                    .then(match => match)
                    .catch(err => console.error(err.message));
                console.log('passwordHashesmatch :=>', passwordHashesmatch);
            }
            catch (err) {
                console.error('ERROR :=>', err);
            }
        },
    });
    done();
};
