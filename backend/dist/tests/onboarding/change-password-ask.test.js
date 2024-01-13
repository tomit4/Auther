"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const sinon_1 = require("sinon");
const fastify_1 = __importDefault(require("fastify"));
const auth_utils_1 = __importDefault(require("../../test-utils/auth-utils"));
const schema_validators_1 = require("../../lib/utils/schema-validators");
const send_email_1 = __importDefault(require("../../lib/utils/send-email"));
const hasher_1 = __importDefault(require("../../lib/utils/hasher"));
/* NOTE: Set to True if you want to actually send
 * an email to test (ensure TEST_EMAIL variable is
 * set to your actual email in the .env file) */
const actuallySendEmail = false;
const mockReq = {
    loginPassword: process.env.TEST_PASSWORD,
};
const mockRes = {
    ok: true,
    message: 'Your password is authenticated, please answer your email to continue change of password',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/change-password-ask',
            handler: async (request, reply) => {
                const { userService } = fastify;
                const { loginPassword } = mockReq;
                (0, sinon_1.stub)(request, 'cookies').value({
                    'appname-refresh-token': userService.signToken(process.env.TEST_EMAIL, process.env.JWT_REFRESH_EXP),
                });
                const refreshToken = request.cookies['appname-refresh-token'];
                try {
                    (0, schema_validators_1.validatePasswordInput)(loginPassword);
                    const refreshTokenIsValid = userService.verifyToken(refreshToken);
                    const hashedEmail = refreshTokenIsValid.email;
                    (0, sinon_1.stub)(userService, 'grabFromCache').resolves(process.env.TEST_EMAIL);
                    const rawEmailFromRedis = await userService.grabFromCache(hashedEmail, 'email');
                    if (!refreshToken || !hashedEmail || !rawEmailFromRedis) {
                        reply.code(401);
                        throw new Error('No refresh token found, redirecting to home.');
                    }
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
                    if (!passwordHashesMatch) {
                        reply.code(401);
                        throw new Error('Incorrect password. Please try again.');
                    }
                    let emailSent;
                    if (actuallySendEmail) {
                        emailSent = await (0, send_email_1.default)(process.env.TEST_EMAIL, `verify-change-pass/${hashedEmail}`, process.env
                            .BREVO_CHANGE_PASSWORD_TEMPLATE_ID);
                    }
                    else
                        emailSent = { wasSuccessfull: true };
                    if (!(emailSent === null || emailSent === void 0 ? void 0 : emailSent.wasSuccessfull)) {
                        fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>');
                        throw new Error('An error occurred while sending email, please contact support.');
                    }
                    (0, sinon_1.stub)(userService, 'setInCacheWithExpiry').resolves(undefined);
                    await userService.setInCacheWithExpiry(hashedEmail, 'change-password-ask', rawEmailFromRedis, 60);
                    reply
                        .code(200)
                        .setCookie('appname-hash', hashedEmail, {
                        path: '/verify-change-pass',
                        maxAge: 60 * 60,
                    })
                        .send({
                        ok: true,
                        message: 'Your password is authenticated, please answer your email to continue change of password',
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
(0, ava_1.default)('sends a transac email to change user password', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/change-password-ask',
    });
    if (!actuallySendEmail)
        t.log('Actual email functionality not tested in change-password-ask route');
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
