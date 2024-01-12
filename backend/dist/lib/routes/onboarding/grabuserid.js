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
                    message: zod_1.z.string(),
                    email: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { userService } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            try {
                if (!refreshToken)
                    throw new Error('No refresh token sent from client, redirecting home...');
                const refreshTokenIsValid = userService.verifyToken(refreshToken);
                if (typeof refreshTokenIsValid !== 'object' ||
                    !('email' in refreshTokenIsValid))
                    throw new Error('Refresh Token Payload in improper format');
                const hashedEmail = refreshTokenIsValid.email;
                const rawEmailFromRedis = await userService.grabFromCache(hashedEmail, 'email');
                if (!rawEmailFromRedis)
                    throw new Error(`No raw email found in cache for : ${hashedEmail}`);
                reply.code(200).send({
                    ok: true,
                    message: 'Successfully returned raw email from cache',
                    email: rawEmailFromRedis,
                });
            }
            catch (err) {
                if (err instanceof Error) {
                    reply.code(401).send({
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
