"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const send_email_1 = __importDefault(require("../../utils/send-email"));
exports.default = (fastify, options, done) => {
    fastify.route({
        method: 'POST',
        url: '/email',
        // add validation schema, see:
        // https://fastify.dev/docs/latest/Reference/TypeScript/#json-schema
        handler: async (request, reply) => {
            const input = request.body;
            const schema = zod_1.z.object({
                email: zod_1.z.string().email(),
            });
            try {
                // TODO: Consider wrapping this with sendEmail in a fastify
                // service/class
                const inputIsValid = schema.safeParse({ email: input });
                if (!inputIsValid.success)
                    throw new Error(`ERROR :=> ${inputIsValid.error}`);
                const emailSent = await (0, send_email_1.default)(String(input));
                if (!emailSent.wasSuccessfull)
                    throw new Error(`ERROR :=> ${emailSent.error}`);
            }
            catch (err) {
                return reply.code(400).send({
                    ok: false,
                    error: `${input} is not a valid email`,
                });
            }
            return reply.code(200).send({
                ok: true,
                msg: `Email sent to ${input}`,
                email: String(input),
            });
        },
    });
    done();
};
