"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/login',
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string(),
                loginPassword: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
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
