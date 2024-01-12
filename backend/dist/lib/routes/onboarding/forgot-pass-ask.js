"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const schema_validators_1 = require("../../utils/schema-validators");
const send_email_1 = __importDefault(require("../../utils/send-email"));
const hasher_1 = __importDefault(require("../../utils/hasher"));
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/forgot-password-ask',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { email } = request.body;
            const { userService } = fastify;
            const hashedEmail = (0, hasher_1.default)(email);
            try {
                (0, schema_validators_1.validateEmailInput)(email);
                const userAlreadyInDb = await userService.grabUserByEmail(hashedEmail);
                const userAlreadyInCache = await userService.grabFromCache(hashedEmail, 'forgot-pass-ask');
                if (!userAlreadyInDb || userAlreadyInDb.is_deleted)
                    throw new Error('There is no record of that email address, please sign up.');
                if (userAlreadyInCache)
                    throw new Error('You have already submitted your email, please check your inbox.');
                const emailSent = await (0, send_email_1.default)(email, `verify-forgot-pass/${hashedEmail}`, process.env
                    .BREVO_FORGOT_PASSWORD_TEMPLATE_ID);
                if (!(emailSent === null || emailSent === void 0 ? void 0 : emailSent.wasSuccessfull)) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>');
                    throw new Error('An error occurred while sending email, please contact support.');
                }
                const sessionToken = userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                await userService.setInCacheWithExpiry(hashedEmail, 'forgot-pass-ask', email, 60);
                reply
                    .code(200)
                    .setCookie('appname-forgot-pass-ask-token', sessionToken, {
                    secure: true,
                    httpOnly: true,
                    sameSite: true,
                })
                    .send({
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
