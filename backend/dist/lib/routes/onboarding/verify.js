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
                    sessionToken: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    error: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { hashedEmail } = request.body;
            const { userService } = fastify;
            try {
                const redisCacheExpired = await userService.isUserInCacheExpired(hashedEmail);
                const { emailFromRedis, hashedPasswordFromRedis } = await userService.grabUserCredentialsFromCache(hashedEmail);
                const userAlreadyInDb = await userService.grabUserByEmail(hashedEmail);
                if (redisCacheExpired)
                    throw new Error('Sorry, but you took too long to answer your email, please sign up again.');
                if (!emailFromRedis || !hashedPasswordFromRedis)
                    throw new Error('No data found by that email address, please sign up again.');
                if (userAlreadyInDb && !userAlreadyInDb.is_deleted)
                    throw new Error('You have already signed up, please log in.');
                if (userAlreadyInDb === null || userAlreadyInDb === void 0 ? void 0 : userAlreadyInDb.is_deleted) {
                    await userService.updateAlreadyDeletedUser(hashedEmail, hashedPasswordFromRedis);
                }
                else {
                    await userService.insertUserIntoDb(hashedEmail, hashedPasswordFromRedis);
                }
                await userService.setUserEmailInCacheAndDeletePassword(hashedEmail, emailFromRedis);
                const sessionToken = await userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                const refreshToken = await userService.signToken(hashedEmail, process.env.JWT_REFRESH_EXP);
                await userService.setRefreshTokenInCache(hashedEmail, refreshToken);
                reply
                    .code(200)
                    .clearCookie('appname-hash', { path: '/verify' })
                    .setCookie('appname-refresh-token', refreshToken, {
                    secure: true,
                    httpOnly: true,
                    sameSite: true,
                })
                    .send({
                    ok: true,
                    msg: 'Your email has been verified, redirecting you to the app...',
                    sessionToken: sessionToken,
                });
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message);
                    reply.code(500).send({
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
