"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const sinon_1 = require("sinon");
const fastify_1 = __importDefault(require("fastify"));
const auth_utils_1 = __importDefault(require("../../test-utils/auth-utils"));
const hasher_1 = __importDefault(require("../../lib/utils/hasher"));
const schema_validators_1 = require("../../lib/utils/schema-validators");
const mockReq = {
    newPassword: process.env.TEST_PASSWORD,
};
const mockRes = {
    ok: true,
    message: 'You have successfully changed your password!',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'PATCH',
            url: '/change-password',
            handler: async (request, reply) => {
                const { userService } = fastify;
                const { newPassword } = mockReq;
                (0, sinon_1.stub)(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(process.env.TEST_EMAIL, process.env.JWT_REFRESH_EXP),
                });
                const refreshToken = request.cookies['appname-refresh-token'];
                try {
                    (0, schema_validators_1.validatePasswordInput)(newPassword);
                    const refreshTokenIsValid = userService.verifyToken(refreshToken);
                    const hashedEmail = refreshTokenIsValid.email;
                    (0, sinon_1.stub)(userService, 'checkIfCacheIsExpired').resolves(false);
                    const redisCacheExpired = await userService.checkIfCacheIsExpired(hashedEmail, 'change-password-ask');
                    if (!hashedEmail || redisCacheExpired) {
                        reply.code(401);
                        throw new Error('Sorry, but you took too long to answer your email, please log in and try again.');
                    }
                    (0, sinon_1.stub)(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: (0, hasher_1.default)(process.env.TEST_EMAIL),
                        password: await userService.hashPassword(process.env.TEST_PASSWORD),
                        is_deleted: false,
                        created_at: new Date(),
                    });
                    const userPasswordByEmail = await userService.grabUserByEmail(hashedEmail);
                    const { password } = userPasswordByEmail !== null && userPasswordByEmail !== void 0 ? userPasswordByEmail : {};
                    (0, sinon_1.stub)(userService, 'comparePasswordToHash').resolves(false);
                    const passwordHashesMatch = password !== undefined &&
                        (await userService.comparePasswordToHash(newPassword, password));
                    if (passwordHashesMatch) {
                        reply.code(409);
                        throw new Error('New password cannot be the same as old password.');
                    }
                    const newHashedPassword = await userService.hashPassword(newPassword);
                    (0, sinon_1.stub)(userService, 'updatePassword').resolves(undefined);
                    await userService.updatePassword(hashedEmail, newHashedPassword);
                    (0, sinon_1.stub)(userService, 'removeFromCache').resolves(undefined);
                    await userService.removeFromCache(hashedEmail, 'change-password-ask');
                    reply.code(200).send({
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
    fastify.register(newRoute);
};
(0, ava_1.default)('updates password after confirming change password request', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'PATCH',
        url: '/change-password',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
