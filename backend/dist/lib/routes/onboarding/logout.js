"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Logs Out User/Removes Refresh Token Cookie
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/logout',
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    statusCode: zod_1.z.number(),
                    code: zod_1.z.string(),
                    error: zod_1.z.string(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { redis, jwt } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            if (refreshToken) {
                reply.clearCookie('appname-refresh-token', {
                    path: '/onboarding',
                });
                const refreshTokenIsValid = jwt.verify(refreshToken);
                if (typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid) {
                    const hashedEmail = refreshTokenIsValid.email;
                    await redis.del(`${hashedEmail}-refresh-token`);
                    await redis.del(`${hashedEmail}-email`);
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: 'logged out',
            });
        },
    });
    done();
};
