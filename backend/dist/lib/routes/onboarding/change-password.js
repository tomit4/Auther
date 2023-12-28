"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
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
        method: 'PATCH',
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
            const { newPassword } = request.body;
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
            const zParsedPassword = passwordSchema.safeParse(newPassword);
            if (!zParsedPassword.success) {
                const { error } = zParsedPassword;
                throw new Error(error.issues[0].message);
            }
            const refreshToken = request.cookies['appname-refresh-token'];
            const refreshTokenIsValid = jwt.verify(refreshToken);
            const hashedEmail = refreshTokenIsValid.email;
            if (!hashedEmail) {
                return reply.code(401).send({
                    ok: false,
                    error: 'No refresh token provided by client, redirecting to home.',
                });
            }
            const redisCacheExpired = !(await redis.get(`${hashedEmail}-change-password-ask`));
            if (redisCacheExpired) {
                throw new Error('Sorry, but you took too long to answer your email, please log in and try again.');
            }
            const userPasswordByEmail = await knex('users')
                .select('password')
                .where('email', hashedEmail)
                .first();
            const { password } = userPasswordByEmail;
            const passwordHashesMatch = await bcrypt
                .compare(newPassword, password)
                .then(match => match)
                .catch(err => err);
            // TODO: set up separate db table that keeps track of last 5 passwords
            // for user and throws this 409 reply if new password is in table
            // (i.e. newPassword cannot be the same as last 5 passwords)
            if (passwordHashesMatch) {
                return reply.code(409).send({
                    ok: false,
                    message: 'New password cannot be the same as old password.',
                });
            }
            const newHashedPassword = await bcrypt.hash(newPassword);
            await knex('users').where('email', hashedEmail).update({
                password: newHashedPassword,
            });
            return reply
                .code(200)
                .clearCookie('appname-hash', { path: '/verify-change-pass' })
                .send({
                ok: true,
                message: 'You have successfully changed your password!',
            });
        },
    });
    done();
};
