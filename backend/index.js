"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const joi_1 = __importDefault(require("joi"));
require("dotenv/config");
// Configuration for Brevo
const Brevo = require('@getbrevo/brevo');
const apiInstance = new Brevo.TransactionalEmailsApi();
const apiKey = apiInstance.authentications.apiKey;
apiKey.apiKey = process.env.BREVO_KEY;
const sendSmtpEmail = new Brevo.SendSmtpEmail();
// type returnedEmail = {
// wasSuccessfull: boolean
// }
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
// TODO: Get familiar with fastify typescript practices
// https://fastify.dev/docs/latest/Reference/TypeScript/
const fastify = (0, fastify_1.default)({ logger: true });
// TODO: review interfaces/type declarations to address TS error/warning messages
fastify.post('/email', async (request, reply) => {
    const input = request.body;
    const schema = joi_1.default.object({
        email: joi_1.default.string().email(),
    });
    try {
        const inputIsValid = schema.validate({ email: input }).error
            ? false
            : true;
        if (!inputIsValid)
            throw new Error(validate.error);
        const emailSent = await sendEmail(input);
        if (!emailSent.wasSuccessfull)
            console.error('ERROR :=>', emailSent.error);
    }
    catch (err) {
        return { ok: false, error: `${input} is not a valid email` };
    }
    return { ok: true, msg: `Email sent to ${input}`, email: input };
});
const start = async () => {
    await fastify.listen({ port: process.env.PORT, host: process.env.HOST }, (err, address) => {
        if (err) {
            console.error(`fastify failed to start, ERROR :=> ${err}`);
            process.exit(1);
        }
        console.log(`Server running on port: ${process.env.PORT} on host: ${process.env.HOST}`);
    });
};
start();
