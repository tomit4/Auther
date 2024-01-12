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
// ISSUE: https://github.com/getbrevo/brevo-node/issues/1
// TS-ERROR: Property 'authentications' is protected and only accessible
// within class 'TransactionalEmailsApi' and its subclasses.
// @ts-ignore
const apiKey = apiInstance.authentications.apiKey;
apiKey.apiKey = process.env.BREVO_KEY;
const sendSmtpEmail = new Brevo.SendSmtpEmail();
exports.default = async (email, endpoint, templateId) => {
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
    sendSmtpEmail.templateId = Number(templateId);
    sendSmtpEmail.params = {
        // NOTE: verify must also change based off of sign up, change password, or delete
        link: `${process.env.BREVO_LINK}/${endpoint}`,
    };
    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { wasSuccessfull: true, data: data };
    }
    catch (err) {
        throw new Error(`ERROR :=>, ${err}`);
    }
};
