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
    email: process.env.TEST_EMAIL,
};
const mockRes = {
    ok: true,
    message: `Your forgot password request was successfully sent to ${process.env.TEST_EMAIL}!`,
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/forgot-password-ask',
            handler: async (request, reply) => {
                const { email } = mockReq;
                const { userService } = fastify;
                const hashedEmail = (0, hasher_1.default)(email);
                try {
                    (0, schema_validators_1.validateEmailInput)(email);
                    (0, sinon_1.stub)(userService, 'grabUserByEmail').resolves({
                        id: 3,
                        email: (0, hasher_1.default)(process.env.TEST_EMAIL),
                        password: await userService.hashPassword(process.env.TEST_PASSWORD),
                        is_deleted: false,
                        created_at: new Date(),
                    });
                    const userAlreadyInDb = await userService.grabUserByEmail(hashedEmail);
                    (0, sinon_1.stub)(userService, 'grabFromCache').resolves(null);
                    const userAlreadyInCache = await userService.grabFromCache(hashedEmail, 'forgot-pass-ask');
                    if (!userAlreadyInDb || userAlreadyInDb.is_deleted)
                        throw new Error('There is no record of that email address, please sign up.');
                    if (userAlreadyInCache)
                        throw new Error('You have already submitted your email, please check your inbox.');
                    let emailSent;
                    if (actuallySendEmail) {
                        emailSent = await (0, send_email_1.default)(email, `verify-forgot-pass/${hashedEmail}`, process.env
                            .BREVO_FORGOT_PASSWORD_TEMPLATE_ID);
                    }
                    else
                        emailSent = { wasSuccessfull: true };
                    if (!(emailSent === null || emailSent === void 0 ? void 0 : emailSent.wasSuccessfull)) {
                        fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>');
                        throw new Error('An error occurred while sending email, please contact support.');
                    }
                    userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                    (0, sinon_1.stub)(userService, 'setInCacheWithExpiry').resolves(undefined);
                    await userService.setInCacheWithExpiry(hashedEmail, 'forgot-pass-ask', email, 60);
                    reply.code(200).send({
                        ok: true,
                        message: `Your forgot password request was successfully sent to ${email}!`,
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
(0, ava_1.default)('sends a transac email to reset forgotten password', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/forgot-password-ask',
    });
    if (!actuallySendEmail)
        t.log('Actual email functionality not tested in forgot-password-ask route');
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mockRes));
    await fastify.close();
});
