"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const fastify_1 = __importDefault(require("fastify"));
const auth_utils_1 = __importDefault(require("../../test-utils/auth-utils"));
const send_email_1 = __importDefault(require("../../lib/utils/send-email"));
const hasher_1 = __importDefault(require("../../lib/utils/hasher"));
const schema_validators_1 = require("../../lib/utils/schema-validators");
const mock = {
    ok: true,
    message: `Your Email Was Successfully Sent to ${process.env.TEST_EMAIL}!`,
};
const fastify = (0, fastify_1.default)();
// TODO: We'll need to implement sinon in order to stub the DB and redis calls...
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/signup',
            handler: async (request, reply) => {
                const body = {
                    email: process.env.TEST_EMAIL,
                    password: process.env.TEST_PASSWORD,
                };
                const { email, password } = body;
                const { userService } = fastify;
                const hashedEmail = (0, hasher_1.default)(email);
                const hashedPassword = await userService.hashPassword(password);
                try {
                    (0, schema_validators_1.validateInputs)(email, password);
                    const userAlreadyInDb = await userService.grabUserByEmail(hashedEmail);
                    const userAlreadyInCache = await userService.isUserInCacheExpired(hashedEmail);
                    const emailSent = await (0, send_email_1.default)(email, `verify/${hashedEmail}`, process.env
                        .BREVO_SIGNUP_TEMPLATE_ID);
                    if (userAlreadyInDb && !userAlreadyInDb.is_deleted)
                        throw new Error('You have already signed up, please log in.');
                    if (!userAlreadyInCache)
                        throw new Error('You have already submitted your email, please check your inbox.');
                    if (!emailSent.wasSuccessfull) {
                        fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                        throw new Error('An error occurred while sending email, please contact support.');
                    }
                    await userService.setUserEmailAndPasswordInCache(hashedEmail, email, hashedPassword);
                    reply
                        .code(200)
                        .setCookie('appname-hash', hashedEmail, {
                        path: '/verify',
                        maxAge: 60 * 60,
                    })
                        .send({
                        ok: true,
                        message: `Your Email Was Successfully Sent to ${email}!`,
                    });
                }
                catch (err) {
                    if (err instanceof Error) {
                        fastify.log.error('ERROR :=>', err.message);
                        reply.code(500).send({
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
(0, ava_1.default)('signs up user for first time and sends transac email', async (t) => {
    t.plan(3);
    await (0, auth_utils_1.default)(fastify);
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/signup',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mock));
    await fastify.close();
});
