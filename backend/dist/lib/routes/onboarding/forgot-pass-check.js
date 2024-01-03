"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/forgot-password-check',
        schema: {
            body: zod_1.z.object({
                hash: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    email: zod_1.z.string(),
                    message: zod_1.z.string(),
                }),
                400: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { hash } = request.body;
            const { userService } = fastify;
            const sessionToken = request.cookies['appname-forgot-pass-ask-token'];
            try {
                const sessionTokenIsValid = userService.verifyToken(sessionToken);
                const { email } = sessionTokenIsValid;
                if (hash !== email) {
                    reply.code(400);
                    throw new Error('Provided Hashes do not match, please try again');
                }
                const emailFromCache = await userService.grabFromCache(email, 'forgot-pass-ask');
                if (!emailFromCache) {
                    reply.code(401);
                    throw new Error('You took too long to answer the forgot password email, please try again');
                }
                reply.code(200).send({
                    ok: true,
                    email: emailFromCache,
                    message: 'Hashed Email Verified and Validated, now you can change your password',
                });
            }
            catch (err) {
                if (err instanceof Error) {
                    reply.send({
                        ok: false,
                        message: err.message,
                    });
                }
            }
            return reply;
        },
    });
    done();
};
