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
                    message: zod_1.z.string(),
                }),
                500: zod_1.z.object({
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
                    throw new Error('No refresh token sent from client');
                reply.clearCookie('appname-refresh-token', {
                    path: '/onboarding',
                });
                reply.clearCookie('appname-hash', {
                    path: '/verify-change-pass',
                });
                reply.clearCookie('appname-hash', {
                    path: '/verify-delete-profile',
                });
                const refreshTokenIsValid = userService.verifyToken(refreshToken);
                if (!refreshTokenIsValid) {
                    reply.code(401);
                    throw new Error('Invalid refresh token');
                }
                if (typeof refreshTokenIsValid !== 'object' ||
                    !('email' in refreshTokenIsValid))
                    throw new Error('Refresh Token has incorrect payload');
                const hashedEmail = refreshTokenIsValid.email;
                await userService.removeFromCache(hashedEmail, 'refresh-token');
                await userService.removeFromCache(hashedEmail, 'email');
                reply.code(200).send({
                    ok: true,
                    message: 'logged out',
                });
            }
            catch (err) {
                if (err instanceof Error)
                    reply.send({
                        ok: false,
                        message: err.message,
                    });
            }
            return reply;
        },
    });
    done();
};
