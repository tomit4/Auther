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
            const { userService } = fastify;
            /* NOTE: no need to check refresh token here,
             * request is coming from frontend protected route */
            try {
                const refreshToken = request.cookies['appname-refresh-token'];
                if (!refreshToken) {
                    throw new Error('No refresh token sent from client, redirecting home...');
                }
                let hashedEmail;
                const refreshTokenIsValid = await userService.verifyToken(refreshToken);
                if (typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid) {
                    hashedEmail = refreshTokenIsValid.email;
                    const rawEmailFromRedis = await userService.grabUserEmailInCache(hashedEmail);
                    if (!rawEmailFromRedis) {
                        throw new Error(`No raw email found in cache for : ${hashedEmail}`);
                    }
                    reply.code(200).send({
                        ok: true,
                        msg: 'Successfully returned raw email from cache',
                        email: rawEmailFromRedis,
                    });
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    reply.code(401).send({
                        ok: false,
                        error: err.message,
                    });
                }
            }
            return reply;
        },
    });
    done();
};
