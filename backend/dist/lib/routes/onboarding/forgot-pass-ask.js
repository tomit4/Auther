"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const send_email_1 = __importDefault(require("../../utils/send-email"));
const hasher_1 = __importDefault(require("../../utils/hasher"));
/*
type SignUpRes = {
    ok: boolean
    message?: string
    error?: string
}
*/
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
        /*
        schema: {
            body: z.object({
                email: z.string(),
                password: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
                500: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                }),
            },
        },
        */
        handler: async (request, reply) => {
            const { email } = request.body;
            const { redis, jwt, knex } = fastify;
            const hashedEmail = (0, hasher_1.default)(email);
            const emailSchema = zod_1.z.string().email();
            try {
                const zParsedEmail = emailSchema.safeParse(email);
                // TODO: If the user deleted their profile and they sign up again,
                // we should simply change is_deleted to false again...
                const userAlreadyInDb = await knex('users')
                    .where('email', hashedEmail)
                    .andWhere('is_deleted', false)
                    .first();
                const userAlreadyInCache = await redis.get(`${hashedEmail}-forgot-pass-ask`);
                const emailSent = await (0, send_email_1.default)(email, `verify-forgot-pass/${hashedEmail}`, process.env
                    .BREVO_FORGOT_PASSWORD_TEMPLATE_ID);
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail;
                    throw new Error(error.issues[0].message);
                }
                if (!userAlreadyInDb)
                    throw new Error('There is no record of that email address, please sign up.');
                if (userAlreadyInCache)
                    throw new Error('You have already submitted your email, please check your inbox.');
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                    throw new Error('An error occurred while sending email, please contact support.');
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err.message);
                    // TODO: You recently learned that this won't hit, so don't return here,
                    // instead simply return reply at the end and conditionally determine if
                    // it is status 200 or not  (see fastify-pass-check for better example)
                    return reply.code(500).send({
                        ok: false,
                        message: err.message,
                    });
                }
            }
            const sessionToken = jwt.sign({ hashedEmail: hashedEmail }, { expiresIn: process.env.JWT_SESSION_EXP });
            await redis.set(`${hashedEmail}-forgot-pass-ask`, email, 'EX', 60);
            return reply
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
        },
    });
    done();
};
