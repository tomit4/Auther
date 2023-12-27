"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Grabs user email/credentials from cache
// based off of return val from refresh jwt
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/grab-user-creds',
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                    email: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { redis, jwt } = fastify;
            /* NOTE: no need to check refresh token here,
             * request is coming from frontend protected route */
            const refreshToken = request.cookies['appname-refresh-token'];
            let hashedEmail;
            const refreshTokenIsValid = jwt.verify(refreshToken);
            if (typeof refreshTokenIsValid === 'object' &&
                'email' in refreshTokenIsValid) {
                hashedEmail = refreshTokenIsValid.email;
                const rawEmailFromRedis = await redis.get(`${hashedEmail}-email`);
                if (!rawEmailFromRedis) {
                    fastify.log.error(`No raw email found in cache: ${rawEmailFromRedis}`);
                }
                return reply.code(200).send({
                    ok: true,
                    msg: 'Successfully returned raw email from cache',
                    email: rawEmailFromRedis,
                });
            }
            return reply.code(401).send({
                ok: false,
                error: 'No refresh token in cache, redirecting to home.',
            });
        },
    });
    done();
};
