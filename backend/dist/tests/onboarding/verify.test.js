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
const mockReq = {
    hashedEmail: (0, hasher_1.default)(process.env.TEST_EMAIL),
};
const mockRes = {
    ok: true,
    message: 'Your email has been verified, redirecting you to the app...',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/verify',
            handler: async (request, reply) => {
                const { hashedEmail } = mockReq;
                const { userService } = fastify;
                try {
                    (0, sinon_1.stub)(userService, 'isUserInCacheExpired').resolves(false);
                    const redisCacheExpired = await userService.isUserInCacheExpired(hashedEmail);
                    (0, sinon_1.stub)(userService, 'grabUserCredentialsFromCache').resolves({
                        emailFromRedis: process.env.TEST_EMAIL,
                        hashedPasswordFromRedis: process.env
                            .TEST_PASSWORD,
                    });
                    const { emailFromRedis, hashedPasswordFromRedis } = await userService.grabUserCredentialsFromCache(hashedEmail);
                    (0, sinon_1.stub)(userService, 'grabUserByEmail').resolves(null);
                    const userAlreadyInDb = await userService.grabUserByEmail(hashedEmail);
                    if (redisCacheExpired)
                        throw new Error('Sorry, but you took too long to answer your email, please sign up again.');
                    if (!emailFromRedis || !hashedPasswordFromRedis)
                        throw new Error('No data found by that email address, please sign up again.');
                    if (userAlreadyInDb && !userAlreadyInDb.is_deleted)
                        throw new Error('You have already signed up, please log in.');
                    (0, sinon_1.stub)(userService, 'updateAlreadyDeletedUser').resolves(undefined);
                    (0, sinon_1.stub)(userService, 'insertUserIntoDb').resolves(undefined);
                    if (userAlreadyInDb === null || userAlreadyInDb === void 0 ? void 0 : userAlreadyInDb.is_deleted) {
                        await userService.updateAlreadyDeletedUser(hashedEmail, hashedPasswordFromRedis);
                    }
                    else {
                        await userService.insertUserIntoDb(hashedEmail, hashedPasswordFromRedis);
                    }
                    (0, sinon_1.stub)(userService, 'setUserEmailInCacheAndDeletePassword').resolves(undefined);
                    await userService.setUserEmailInCacheAndDeletePassword(hashedEmail, emailFromRedis);
                    userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                    const refreshToken = userService.signToken(hashedEmail, process.env.JWT_REFRESH_EXP);
                    (0, sinon_1.stub)(userService, 'setRefreshTokenInCache').resolves(undefined);
                    await userService.setRefreshTokenInCache(hashedEmail, refreshToken);
                    reply
                        .code(200)
                        .setCookie('appname-refresh-token', refreshToken, {
                        secure: true,
                        httpOnly: true,
                        sameSite: true,
                    })
                        .send({
                        ok: true,
                        message: 'Your email has been verified, redirecting you to the app...',
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
    fastify.register(newRoute);
};
(0, ava_1.default)('verifies user credentials after responding to email and signs user up', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/verify',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
