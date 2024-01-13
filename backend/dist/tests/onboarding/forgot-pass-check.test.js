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
    hash: (0, hasher_1.default)(process.env.TEST_EMAIL),
};
const mockRes = {
    ok: true,
    email: process.env.TEST_EMAIL,
    message: 'Hashed Email Verified and Validated, now you can change your password',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/forgot-password-check',
            handler: async (request, reply) => {
                const { hash } = mockReq;
                const { userService } = fastify;
                (0, sinon_1.stub)(request, 'cookies').value({
                    'appname-forgot-pass-ask-token': userService.signToken((0, hasher_1.default)(process.env.TEST_EMAIL), process.env.JWT_SESSION_EXP),
                });
                const sessionToken = request.cookies['appname-forgot-pass-ask-token'];
                try {
                    const sessionTokenIsValid = userService.verifyToken(sessionToken);
                    const { email } = sessionTokenIsValid;
                    if (hash !== email) {
                        reply.code(400);
                        throw new Error('Provided Hashes do not match, please try again');
                    }
                    (0, sinon_1.stub)(userService, 'grabFromCache').resolves(process.env.TEST_EMAIL);
                    const emailFromCache = await userService.grabFromCache(email, 'forgot-pass-ask');
                    if (!emailFromCache) {
                        reply.code(401);
                        throw new Error('You took too long to answer the forgot password email, please try again');
                    }
                    reply.code(200).send({
                        ok: true,
                        email: emailFromCache,
                        message: 'Hashed Email Verified and Validated, now you can change your password',
                    });
                }
                catch (err) {
                    if (err instanceof Error) {
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
(0, ava_1.default)('verifies and validates if user can change password', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/forgot-password-check',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
