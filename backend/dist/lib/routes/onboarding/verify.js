"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/verify',
        schema: {
            body: zod_1.z.object({
                hashedEmail: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                }),
                400: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { hashedEmail } = request.body;
            const { redis } = fastify;
            const dataIsExpired = (await redis.ttl(hashedEmail)) < 0;
            const dataFromRedis = await redis.get(hashedEmail);
            try {
                if (dataIsExpired)
                    throw new Error('Sorry, but you took too long to answer your email, please sign up again.');
                if (!dataFromRedis)
                    throw new Error('No data found by that email address, please sign up again.');
                // TODO: Also check the db again to see if the email already exists, throw err if so
            }
            catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    });
                }
            }
            // TODO: persist email in db
            // TODO: generate and send back hashed JWT in cookie headers
            return reply.code(200).send({
                ok: true,
                msg: 'Your email has been  verified, redirecting you to the app...',
            });
        },
    });
    done();
};
