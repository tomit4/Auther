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
const mockRes = {
    ok: true,
    message: 'You have successfully deleted your profile, redirecting you home',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'DELETE',
            url: '/delete-profile',
            handler: async (request, reply) => {
                const { userService } = fastify;
                (0, sinon_1.stub)(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(process.env.TEST_EMAIL, process.env.JWT_REFRESH_EXP),
                });
                const refreshToken = request.cookies['appname-refresh-token'];
                try {
                    const refreshTokenIsValid = userService.verifyToken(refreshToken);
                    const hashedEmail = refreshTokenIsValid.email;
                    (0, sinon_1.stub)(userService, 'checkIfCacheIsExpired').resolves(false);
                    const redisCacheExpired = await userService.checkIfCacheIsExpired(hashedEmail, 'delete-profile-ask');
                    (0, sinon_1.stub)(userService, 'grabFromCache').resolves(process.env.TEST_EMAIL);
                    const rawEmailFromRedis = await userService.grabFromCache(hashedEmail, 'email');
                    (0, sinon_1.stub)(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: (0, hasher_1.default)(process.env.TEST_EMAIL),
                        password: await userService.hashPassword(process.env.TEST_PASSWORD),
                        is_deleted: false,
                        created_at: new Date(),
                    });
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
                    (0, sinon_1.stub)(userService, 'markUserAsDeleted').resolves(undefined);
                    await userService.markUserAsDeleted(hashedEmail);
                    (0, sinon_1.stub)(userService, 'removeFromCache').resolves(undefined);
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
    fastify.register(newRoute);
};
(0, ava_1.default)('deletes user profile from db', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'DELETE',
        url: '/delete-profile',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
