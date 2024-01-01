"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
// Verifies Refresh Token (longer lived jwt)
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'GET',
        url: '/refresh',
        schema: {
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string(),
                    sessionToken: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { userService } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            try {
                if (refreshToken) {
                    const refreshTokenIsValid = userService.verifyToken(refreshToken);
                    if (typeof refreshTokenIsValid === 'object' &&
                        'email' in refreshTokenIsValid) {
                        const hashedEmail = refreshTokenIsValid.email;
                        const refreshTokenFromRedis = await userService.grabRefreshTokenFromCache(hashedEmail);
                        if (!refreshTokenFromRedis) {
                            throw new Error('No refresh token in cache, redirecting to home.');
                        }
                        const sessionToken = userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                        await userService.removeRefreshTokenFromCache(hashedEmail);
                        reply.code(200).send({
                            ok: true,
                            msg: 'Successfully refreshed session.',
                            sessionToken: sessionToken,
                        });
                    }
                }
                else {
                    throw new Error('Invalid refresh token, redirecting home...');
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
