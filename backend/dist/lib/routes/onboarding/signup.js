"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const send_email_1 = __importDefault(require("../../utils/send-email"));
exports.default = (fastify, options, done) => {
    fastify.withTypeProvider().route({
        method: 'POST',
        // TODO: This is actually the /signup route to replace the old signup.ts
        url: '/signup',
        schema: {
            body: zod_1.z.object({
                email: zod_1.z.string(),
                password: zod_1.z.string(),
            }),
            response: {
                200: zod_1.z.object({
                    ok: zod_1.z.boolean(),
                    msg: zod_1.z.string().optional(),
                    email: zod_1.z.string().optional(),
                    error: zod_1.z.string().optional(),
                }),
            },
        },
        handler: async (request, reply) => {
            const { email, password } = request.body;
            // TODO: replicate zod checks on front end
            const emailSchema = zod_1.z.string().email();
            const passwordSchema = zod_1.z
                .string()
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{10,}$/, {
                message: 'Password must be at least 10 characters in length and contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
            });
            try {
                const zParsedEmail = emailSchema.safeParse(email);
                const zParsedPassword = passwordSchema.safeParse(password);
                if (!zParsedEmail.success) {
                    const { error } = zParsedEmail;
                    throw new Error(String(error.issues[0].message));
                }
                if (!zParsedPassword.success) {
                    const { error } = zParsedPassword;
                    throw new Error(String(error.issues[0].message));
                }
                const emailSent = await (0, send_email_1.default)(String(email));
                if (!emailSent.wasSuccessfull) {
                    fastify.log.error('Error occurred while sending email, are your Brevo credentials up to date? :=>', emailSent.error);
                    throw new Error(String(emailSent.error));
                }
                // TODO: hash/salt the email and store it in mariadb db via knex
                /* TODO: hash/salt the password and use it as a key in an
                 * in-memory HashMap to reference a jwt token (learn redis)
                 */
            }
            catch (err) {
                if (err instanceof Error) {
                    return reply.code(400).send({
                        ok: false,
                        error: err.message,
                    });
                }
            }
            return reply.code(200).send({
                ok: true,
                msg: `Email sent to ${email}`,
                email: String(email),
            });
        },
    });
    done();
};
