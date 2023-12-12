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
        url: '/email',
        schema: {
            body: zod_1.z.string(),
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
            const { email, password } = JSON.parse(String(request.body));
            console.log('password :=>', password);
            const emailSchema = zod_1.z.string().email();
            try {
                const zParsedEmail = emailSchema.safeParse(email);
                const { success } = zParsedEmail;
                if (!success) {
                    const { error } = zParsedEmail;
                    throw new Error(String(error.issues[0].message));
                }
                const emailSent = await (0, send_email_1.default)(String(email));
                if (!emailSent.wasSuccessfull)
                    throw new Error(String(emailSent.error));
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
