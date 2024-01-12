"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'DELETE',
        url: '/delete-profile',
        schema: {
            response: {
                200: zod_1.z.object({
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
            const { userService } = fastify;
            const refreshToken = request.cookies['appname-refresh-token'];
            try {
                const refreshTokenIsValid = userService.verifyToken(refreshToken);
                const hashedEmail = refreshTokenIsValid.email;
                const redisCacheExpired = await userService.checkIfCacheIsExpired(hashedEmail, 'delete-profile-ask');
                const rawEmailFromRedis = await userService.grabFromCache(hashedEmail, 'email');
                const userByEmail = await userService.grabUserByEmail(hashedEmail);
                if (!refreshToken ||
                    !hashedEmail ||
                    redisCacheExpired ||
                    !rawEmailFromRedis ||
                    !userByEmail) {
                    reply.code(401);
                }
                if (!refreshToken || !hashedEmail)
                    throw new Error('No refresh token provided from client, redirecting home');
                if (redisCacheExpired)
                    throw new Error('Sorry, but you took too long to answer your email, please log in and try again.');
                if (!rawEmailFromRedis)
                    throw new Error('No refresh token in cache, redirecting to home.');
                if (!userByEmail)
                    throw new Error('No user found in db, redirecting home');
                await userService.markUserAsDeleted(hashedEmail);
                reply.clearCookie('appname-refresh-token', {
                    path: '/onboarding',
                });
                reply.clearCookie('appname-hash', {
                    path: '/verify-change-pass',
                });
                reply.clearCookie('appname-hash', {
                    path: '/verify-delete-profile',
                });
                reply.clearCookie('appname-hash', { path: '/verify' });
                reply.clearCookie('appname-hash', {
                    path: '/verify-change-pass',
                });
                await userService.removeFromCache(hashedEmail, 'delete-profile-ask');
                await userService.removeFromCache(hashedEmail, 'email');
                await userService.removeFromCache(hashedEmail, 'refresh-token');
                await userService.removeFromCache(hashedEmail, 'change-password-ask');
                reply.code(200).send({
                    ok: true,
                    message: 'You have successfully deleted your profile, redirecting you home',
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
