"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const send_email_1 = __importDefault(require("../../lib/utils/send-email"));
const hasher_1 = __importDefault(require("../../lib/utils/hasher"));
const schema_validators_1 = require("../../lib/utils/schema-validators");
const mockReq = {
    email: process.env.TEST_EMAIL,
    password: process.env.TEST_PASSWORD,
};
const mockRes = {
    ok: true,
    message: `Your Email Was Successfully Sent to ${process.env.TEST_EMAIL}!`,
};
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/signup',
            handler: async (request, reply) => {
                const { email, password } = mockReq;
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
const signupTest = async (test, fastify) => {
    test.before(async () => {
        await registerRoute(fastify);
    });
    return test('signs up user for first time and sends transac email', async (t) => {
        t.plan(3);
        const response = await fastify.inject({
            method: 'POST',
            url: '/signup',
        });
        t.is(response.statusCode, 200);
        t.is(response.headers['content-type'], 'application/json; charset=utf-8');
        t.is(response.payload, JSON.stringify(mockRes));
    });
};
exports.default = signupTest;
