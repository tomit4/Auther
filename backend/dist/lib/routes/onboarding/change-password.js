"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const password_1 = require("../../schemas/password");
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'PATCH',
        url: '/change-password',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: zod_1.z.object({
                newPassword: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                409: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { userService } = fastify;
            const { newPassword } = request.body;
            const refreshToken = request.cookies['appname-refresh-token'];
            const passwordSchema = zod_1.z.string().regex(password_1.passwordSchemaRegex, {
                message: password_1.passwordSchemaErrMsg,
            });
            const zParsedPassword = passwordSchema.safeParse(newPassword);
            try {
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword;
                    throw new Error(error.issues[0].message);
                }
                const refreshTokenIsValid = userService.verifyToken(refreshToken);
                const hashedEmail = refreshTokenIsValid.email;
                const redisCacheExpired = await userService.checkIfCacheIsExpired(hashedEmail, 'change-password-ask');
                if (!hashedEmail || redisCacheExpired) {
                    reply.code(401);
                    throw new Error('Sorry, but you took too long to answer your email, please log in and try again.');
                }
                const userPasswordByEmail = await userService.grabUserByEmail(hashedEmail);
                const { password } = userPasswordByEmail !== null && userPasswordByEmail !== void 0 ? userPasswordByEmail : {};
                const passwordHashesMatch = await userService.comparePasswordToHash(newPassword, password);
                /* TODO (v2): set up separate db table that keeps track of last 5 passwords
                 * for user and throws this 409 reply if new password is in table
                 * (i.e. newPassword cannot be the same as last 5 passwords) */
                if (passwordHashesMatch) {
                    reply.code(409);
                    throw new Error('New password cannot be the same as old password.');
                }
                const newHashedPassword = await userService.hashPassword(newPassword);
                await userService.updatePassword(hashedEmail, newHashedPassword);
                await userService.removeFromCache(hashedEmail, 'change-password-ask');
                reply
                    .code(200)
                    .clearCookie('appname-hash', {
                    path: '/verify-change-pass',
                })
                    .send({
                    ok: true,
                    message: 'You have successfully changed your password!',
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
