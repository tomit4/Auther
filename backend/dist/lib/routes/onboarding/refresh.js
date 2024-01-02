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
                    message: zod_1.z.string(),
                    sessionToken: zod_1.z.string(),
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
                    throw new Error('Refresh Token has incorrect payload');
                const hashedEmail = refreshTokenIsValid.email;
                const refreshTokenFromRedis = await userService.grabRefreshTokenFromCache(hashedEmail);
                if (!refreshTokenFromRedis)
                    throw new Error('Invalid refresh token.');
                const sessionToken = userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                reply.code(200).send({
                    ok: true,
                    message: 'Successfully refreshed session.',
                    sessionToken: sessionToken,
                });
            }
            catch (err) {
                reply.code(401).send({
                    ok: false,
                    message: 'Invalid refresh token.',
                });
            }
            return reply;
        },
    });
    done();
};
