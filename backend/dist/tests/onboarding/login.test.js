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
    email: process.env.TEST_EMAIL,
    loginPassword: process.env.TEST_PASSWORD,
};
const mockRes = {
    ok: true,
    message: 'You have been successfully authenticated! Redirecting you to the app...',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/login',
            handler: async (request, reply) => {
                const { userService } = fastify;
                const { email, loginPassword } = mockReq;
                const hashedEmail = (0, hasher_1.default)(email);
                try {
                    (0, schema_validators_1.validateInputs)(email, loginPassword);
                    (0, sinon_1.stub)(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: (0, hasher_1.default)(process.env.TEST_EMAIL),
                        password: await userService.hashPassword(process.env.TEST_PASSWORD),
                        is_deleted: false,
                        created_at: new Date(),
                    });
                    const userByEmail = await userService.grabUserByEmail(hashedEmail);
                    const { password } = userByEmail !== null && userByEmail !== void 0 ? userByEmail : {};
                    (0, sinon_1.stub)(userService, 'comparePasswordToHash').resolves(true);
                    const passwordHashesMatch = password !== undefined &&
                        (await userService.comparePasswordToHash(loginPassword, password));
                    if (!userByEmail || !passwordHashesMatch)
                        reply.code(401);
                    if (!userByEmail) {
                        throw new Error('No record of that email found. Please try again.');
                    }
                    if (!passwordHashesMatch) {
                        throw new Error('Incorrect password. Please try again.');
                    }
                    userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                    const refreshToken = userService.signToken(hashedEmail, process.env.JWT_REFRESH_EXP);
                    (0, sinon_1.stub)(userService, 'setRefreshTokenInCache').resolves(undefined);
                    await userService.setRefreshTokenInCache(hashedEmail, refreshToken);
                    (0, sinon_1.stub)(userService, 'setUserEmailInCache').resolves(undefined);
                    await userService.setUserEmailInCache(hashedEmail, email);
                    reply
                        .code(200)
                        .setCookie('appname-refresh-token', refreshToken, {
                        secure: true,
                        httpOnly: true,
                        sameSite: true,
                    })
                        .send({
                        ok: true,
                        message: 'You have been successfully authenticated! Redirecting you to the app...',
                    });
                }
                catch (err) {
                    if (err instanceof Error) {
                        fastify.log.error('ERROR :=>', err);
                        reply.send({
                            ok: false,
                            message: err.message,
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
(0, ava_1.default)('logs user in with valid credentials', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/login',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
