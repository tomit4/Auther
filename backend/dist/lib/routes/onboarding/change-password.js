"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const send_email_1 = __importDefault(require("../../utils/send-email"));
/*
type AuthRes = {
    ok: boolean
    message?: string
    error?: string
    sessionToken?: string
}
*/
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/change-password',
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
                loginPassword: z.string(),
            }),
            response: {
                200: z.object({
                    ok: z.boolean(),
                    message: z.string(),
                    sessionToken: z.string(),
                }),
                401: z.object({
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
            const { redis, knex, bcrypt, jwt } = fastify;
            const { inputPassword } = request.body;
            const refreshToken = request.cookies['appname-refresh-token'];
            const refreshTokenIsValid = jwt.verify(refreshToken);
            const hashedEmail = refreshTokenIsValid.email;
            if (!hashedEmail) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token provided by client, redirecting to home.',
                });
            }
            const rawEmailFromRedis = await redis.get(`${hashedEmail}-email`);
            if (!rawEmailFromRedis) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token in cache, redirecting to home.',
                });
            }
            const userByEmail = await knex('users')
                .select('password')
                .where('email', hashedEmail)
                .first();
            const passwordSchemaRegex = new RegExp([
                /^(?=.*[a-z])/, // At least one lowercase letter
                /(?=.*[A-Z])/, // At least one uppercase letter
                /(?=.*\d)/, // At least one digit
                /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, // At least one special character
                /[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{10,}$/, // At least 10 characters long
            ]
                .map(r => r.source)
                .join(''));
            const passwordSchemaErrMsg = 'Password must be at least 10 characters in length and contain at \
                least one lowercase letter, one uppercase letter, one digit, and one \
                special character';
            const passwordSchema = zod_1.z.string().regex(passwordSchemaRegex, {
                message: passwordSchemaErrMsg,
            });
            const zParsedPassword = passwordSchema.safeParse(inputPassword);
            if (!zParsedPassword.success) {
                const { error } = zParsedPassword;
                throw new Error(error.issues[0].message);
            }
            const { password } = userByEmail;
            const passwordHashesMatch = await bcrypt
                .compare(inputPassword, password)
                .then(match => match)
                .catch(err => err);
            if (!passwordHashesMatch) {
                return reply.code(401).send({
                    ok: false,
                    message: 'Incorrect password. Please try again.',
                });
            }
            if (rawEmailFromRedis && hashedEmail) {
                const emailSent = await (0, send_email_1.default)(rawEmailFromRedis, `change-password/${hashedEmail}`);
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                    throw new Error('An error occurred while sending email, please contact support.');
                }
            }
            // TODO: set hashedEmail-changing-password value in redis with TTL of 5 minutes
            return reply.code(200).send({
                ok: true,
                message: 'Your password is authenticated, please answer your email to continue change of password',
            });
        },
    });
    done();
};
