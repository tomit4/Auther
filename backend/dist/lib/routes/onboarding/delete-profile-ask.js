"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const password_1 = require("../../schemas/password");
const send_email_1 = __importDefault(require("../../utils/send-email"));
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/delete-profile-ask',
        config: {
            rateLimit: {
                max: 5,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: zod_1.z.object({
                loginPassword: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { userService } = fastify;
            const { loginPassword } = request.body;
            const refreshToken = request.cookies['appname-refresh-token'];
            const passwordSchema = zod_1.z.string().regex(password_1.passwordSchemaRegex, {
                message: password_1.passwordSchemaErrMsg,
            });
            const zParsedPassword = passwordSchema.safeParse(loginPassword);
            try {
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword;
                    throw new Error(error.issues[0].message);
                }
                const refreshTokenIsValid = userService.verifyToken(refreshToken);
                const hashedEmail = refreshTokenIsValid.email;
                const rawEmailFromRedis = await userService.grabUserEmailInCache(hashedEmail);
                const userPasswordByEmail = await userService.grabUserByEmail(hashedEmail);
                const { password } = userPasswordByEmail;
                const passwordHashesMatch = await userService.comparePasswordToHash(loginPassword, password);
                if (!hashedEmail || !rawEmailFromRedis || !passwordHashesMatch)
                    reply.code(401);
                if (!hashedEmail)
                    throw Error('No refresh token provided by client, redirecting to home.');
                if (!rawEmailFromRedis)
                    throw Error('No refresh token in cache, redirecting to home.');
                if (!passwordHashesMatch)
                    throw Error('Incorrect password. Please try again.');
                const emailSent = await (0, send_email_1.default)(rawEmailFromRedis, `verify-delete-profile/${hashedEmail}`, process.env
                    .BREVO_DELETE_ACCOUNT_TEMPLATE_ID);
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                    throw new Error('An error occurred while sending email, please contact support.');
                }
                await userService.setInCacheWithExpiry(hashedEmail, 'delete-profile-ask', rawEmailFromRedis, 60);
                reply
                    .code(200)
                    .setCookie('appname-hash', hashedEmail, {
                    path: '/verify-delete-profile',
                    maxAge: 60 * 60,
                })
                    .send({
                    ok: true,
                    message: 'You have successfully requested to delete your profile, please check your email',
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
