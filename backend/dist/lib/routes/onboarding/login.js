"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const hasher_1 = __importDefault(require("../../utils/hasher"));
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/login',
        config: {
            rateLimit: {
                max: 3,
                timeWindow: 300000, // 5 minutes
            },
        },
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string(),
                loginPassword: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                    sessionToken: zod_1.z.string(),
                }),
                401: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
                500: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    message: zod_1.z.string(),
                }),
            },
        },
        handler: async (request, reply) => {
            /* TODO: implement only a certain amount of login attempts before warning is sent to email
             * and timeout is implemented before another round of attempts can be made */
            const { redis, knex, bcrypt, jwt } = fastify;
            const { email, loginPassword } = request.body;
            const hashedEmail = (0, hasher_1.default)(email);
            const emailSchema = zod_1.z.string().email();
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
            try {
                const zParsedEmail = emailSchema.safeParse(email);
                const zParsedPassword = passwordSchema.safeParse(loginPassword);
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail;
                    throw new Error(error.issues[0].message);
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword;
                    throw new Error(error.issues[0].message);
                }
                const userByEmail = await knex('users')
                    .select('password')
                    .where('email', hashedEmail)
                    .first();
                if (!userByEmail) {
                    return reply.code(401).send({
                        ok: false,
                        message: 'Incorrect email or password. Please try again.',
                    });
                }
                const { password } = userByEmail;
                const passwordHashesMatch = await bcrypt
                    .compare(loginPassword, password)
                    .then(match => match)
                    .catch(err => err);
                if (!passwordHashesMatch) {
                    return reply.code(401).send({
                        ok: false,
                        message: 'Incorrect email or password. Please try again.',
                    });
                }
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err);
                    return reply.code(500).send({
                        ok: false,
                        message: err.message,
                    });
                }
            }
            const sessionToken = jwt.sign({ email: hashedEmail }, { expiresIn: process.env.JWT_SESSION_EXP });
            const refreshToken = jwt.sign({ email: hashedEmail }, { expiresIn: process.env.JWT_REFRESH_EXP });
            // TODO: reset expiration to a .env variable
            await redis.set(`${hashedEmail}-refresh-token`, refreshToken, 'EX', 180);
            return reply
                .code(200)
                .setCookie('appname-refresh-token', refreshToken, {
                secure: true,
                httpOnly: true,
                sameSite: true,
                // maxAge: 3600, // unsure if to use, research
            })
                .send({
                ok: true,
                message: 'You have been successfully authenticated! Redirecting you to the app...',
                sessionToken: sessionToken,
            });
        },
    });
    done();
};
