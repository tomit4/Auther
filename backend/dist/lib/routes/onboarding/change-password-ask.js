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
        url: '/change-password-ask',
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
                    message: zod_1.z.string().optional(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string().optional(),
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
                if (!refreshToken || !hashedEmail || !rawEmailFromRedis) {
                    reply.code(401);
                    throw new Error('No refresh token found, redirecting to home.');
                }
                const userByEmail = await userService.grabUserByEmail(hashedEmail);
                const { password } = userByEmail !== null && userByEmail !== void 0 ? userByEmail : {};
                const passwordHashesMatch = await userService.comparePasswordToHash(loginPassword, password);
                if (!passwordHashesMatch) {
                    reply.code(401);
                    throw new Error('Incorrect password. Please try again.');
                }
                const emailSent = await (0, send_email_1.default)(rawEmailFromRedis, `verify-change-pass/${hashedEmail}`, process.env
                    .BREVO_CHANGE_PASSWORD_TEMPLATE_ID);
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                    throw new Error('An error occurred while sending email, please contact support.');
                }
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
