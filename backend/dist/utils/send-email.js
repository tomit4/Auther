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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Brevo = __importStar(require("@getbrevo/brevo"));
// Configuration for Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();
/* TS-IGNORE: Property 'authentications' is protected and only accessible
 * within class 'TransactionalEmailsApi' and its subclasses. */
// @ts-ignore
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
exports.default = sendEmail;
