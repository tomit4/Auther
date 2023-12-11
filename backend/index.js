"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const joi_1 = __importDefault(require("joi"));
require("dotenv/config");
const Brevo = __importStar(require("@getbrevo/brevo"));
const fastify = (0, fastify_1.default)({ logger: true });
// TODO: Get familiar with fastify typescript practices
// https://fastify.dev/docs/latest/Reference/TypeScript/
// Configuration for Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();
const apiKey = apiInstance.authentications.apiKey;
apiKey.apiKey = String(process.env.BREVO_KEY);
const sendSmtpEmail = new Brevo.SendSmtpEmail();
const sendEmail = async (email) => {
    sendSmtpEmail.sender = {
        name: 'My Test Company',
        email: 'mytestemail@email.com',
    };
    sendSmtpEmail.subject = 'My Test Company';
    sendSmtpEmail.to = [
        {
            email: email,
        },
    ];
    sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID);
    sendSmtpEmail.params = {
        link: `${process.env.BREVO_LINK}/verify`,
    };
    return await apiInstance.sendTransacEmail(sendSmtpEmail).then(data => {
        console.log('data :=>', data);
        return { wasSuccessfull: true, data: data };
    }, error => {
        return { wasSuccessfull: false, error: error };
    });
};
fastify.post('/email', async (request, reply) => {
    var _a, _b;
    const input = request.body;
    const schema = joi_1.default.object({
        email: joi_1.default.string().email(),
    });
    try {
        const inputIsValid = schema.validate({ email: input }).error
            ? false
            : true;
        if (!inputIsValid) {
            const validationErr = (_b = (_a = schema.validate({ email: input }).error) === null || _a === void 0 ? void 0 : _a.details[0]) === null || _b === void 0 ? void 0 : _b.message;
            throw new Error(validationErr);
        }
        const emailSent = await sendEmail(String(input));
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
});
const start = async () => {
    try {
        await fastify.listen({
            port: Number(process.env.PORT),
            host: String(process.env.HOST),
        });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
