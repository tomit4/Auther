"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Logs Out User/Removes Refresh Token via HTTPS Cookie with maxAge=0
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
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { redis, jwt } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            if (refreshToken) {
                const refreshTokenIsValid = jwt.verify(refreshToken);
                if (typeof refreshTokenIsValid === 'object' &&
                    'email' in refreshTokenIsValid) {
                    const hashedEmail = refreshTokenIsValid.email;
                    const refreshTokenFromRedis = await redis.get(`${hashedEmail}-refresh-token`);
                    if (!refreshTokenFromRedis) {
                        return reply.code(500).send({
                            ok: false,
                            error: 'Invalid refresh token. Redirecting to home...',
                        });
                    }
                    await redis.del(`${hashedEmail}-refresh-token`);
                }
            }
            else {
                return reply.code(500).send({
                    ok: false,
                    error: 'ERROR :=> No refresh token found, log out failed',
                });
            }
            return reply
                .code(200)
                .clearCookie('appname-refresh-token', { path: '/onboarding' })
                .send({
                ok: true,
                msg: 'logged out',
            });
        },
    });
    done();
};
