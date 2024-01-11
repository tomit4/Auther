"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const schema_validators_1 = require("../../utils/schema-validators");
const hasher_1 = __importDefault(require("../../utils/hasher"));
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        url: '/login',
        config: {
            rateLimit: {
                max: 5,
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
            const { userService } = fastify;
            const { email, loginPassword } = request.body;
            const hashedEmail = (0, hasher_1.default)(email);
            try {
                (0, schema_validators_1.validateInputs)(email, loginPassword);
                const userByEmail = await userService.grabUserByEmail(hashedEmail);
                const { password } = userByEmail !== null && userByEmail !== void 0 ? userByEmail : {};
                const passwordHashesMatch = password !== undefined &&
                    (await userService.comparePasswordToHash(loginPassword, password));
                if (!userByEmail || !passwordHashesMatch)
                    reply.code(401);
                if (!userByEmail) {
                    throw new Error('No record of that email found. Please try again.');
                }
                if (!passwordHashesMatch) {
                    throw new Error('Incorrect password. Please try again.');
                }
                const sessionToken = userService.signToken(hashedEmail, process.env.JWT_SESSION_EXP);
                const refreshToken = userService.signToken(hashedEmail, process.env.JWT_REFRESH_EXP);
                // TODO: reset expiration to a .env variable
                await userService.setRefreshTokenInCache(hashedEmail, refreshToken);
                await userService.setUserEmailInCache(hashedEmail, email);
                reply
                    .code(200)
                    .setCookie('appname-refresh-token', refreshToken, {
                    secure: true,
                    httpOnly: true,
                    sameSite: true,
                })
                    .send({
                    ok: true,
                    message: 'You have been successfully authenticated! Redirecting you to the app...',
                    sessionToken: sessionToken,
                });
            }
            catch (err) {
                if (err instanceof Error) {
                    fastify.log.error('ERROR :=>', err);
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
