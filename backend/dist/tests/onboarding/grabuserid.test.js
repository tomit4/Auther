"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const sinon_1 = require("sinon");
const fastify_1 = __importDefault(require("fastify"));
const auth_utils_1 = __importDefault(require("../../test-utils/auth-utils"));
const mockRes = {
    ok: true,
    message: 'Successfully returned raw email from cache',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'GET',
            url: '/get-user-creds',
            handler: async (request, reply) => {
                const { userService } = fastify;
                (0, sinon_1.stub)(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(process.env.TEST_EMAIL, process.env.JWT_REFRESH_EXP),
                });
                const refreshToken = request.cookies['appname-refresh-token'];
                try {
                    if (!refreshToken)
                        throw new Error('No refresh token sent from client, redirecting home...');
                    const refreshTokenIsValid = userService.verifyToken(refreshToken);
                    if (typeof refreshTokenIsValid !== 'object' ||
                        !('email' in refreshTokenIsValid))
                        throw new Error('Refresh Token Payload in improper format');
                    const hashedEmail = refreshTokenIsValid.email;
                    (0, sinon_1.stub)(userService, 'grabFromCache').resolves(process.env.TEST_EMAIL);
                    const rawEmailFromRedis = await userService.grabFromCache(hashedEmail, 'email');
                    if (!rawEmailFromRedis)
                        throw new Error(`No raw email found in cache for : ${hashedEmail}`);
                    reply.code(200).send({
                        ok: true,
                        message: 'Successfully returned raw email from cache',
                    });
                }
                catch (err) {
                    if (err instanceof Error) {
                        reply.code(401).send({
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
(0, ava_1.default)('retrieves user credentials (unhashed email) from cache', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'GET',
        url: '/get-user-creds',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
