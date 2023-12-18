"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
                const passwordHashesMatch = await bcrypt
                    .compare(loginPassword, password)
                    .then(match => match)
                    .catch(err => err);
                /*
                .setCookie('appname-jwt', '', {
                    path: '/app',
                    maxAge: 360 // change to 15 minutes when done (alongside expire of jwt),
                })
                */
                if (!passwordHashesMatch) {
                    return reply.code(401).send({
                        ok: false,
                        error: 'Incorrect email or password. Please try again.',
                    });
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message);
                    return reply.code(500).send({
                        ok: false,
                        error: err.message,
                    });
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: 'You have been successfully authenticated! Redirecting you to the app...',
            });
        },
    });
    done();
};
