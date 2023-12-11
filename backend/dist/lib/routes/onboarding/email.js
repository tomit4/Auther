"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("joi"));
const send_email_1 = __importDefault(require("../../utils/send-email"));
exports.default = (fastify, options, done) => {
    fastify.route({
        method: 'POST',
        url: '/email',
        // add validation schema, see:
        // https://fastify.dev/docs/latest/Reference/TypeScript/#json-schema
        handler: async (request, reply) => {
            var _a, _b;
            const input = request.body;
            const schema = joi_1.default.object({
                email: joi_1.default.string().email(),
            });
            try {
                // TODO: Consider wrapping this with sendEmail in a fastify service/class
                const inputIsValid = schema.validate({ email: input }).error
                    ? false
                    : true;
                if (!inputIsValid) {
                    const validationErr = (_b = (_a = schema.validate({ email: input })
                        .error) === null || _a === void 0 ? void 0 : _a.details[0]) === null || _b === void 0 ? void 0 : _b.message;
                    throw new Error(validationErr);
                }
                const emailSent = await (0, send_email_1.default)(String(input));
                if (!emailSent.wasSuccessfull)
                    console.error('ERROR :=>', emailSent.error);
            }
            catch (err) {
                return reply.send({
                    ok: false,
                    error: `${input} is not a valid email`,
                });
            }
            return reply.send({
                ok: true,
                msg: `Email sent to ${input}`,
                email: String(input),
            });
        },
    });
    done();
};
