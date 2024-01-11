"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInputs = exports.validatePasswordInput = exports.validateEmailInput = void 0;
const zod_1 = require("zod");
const password_1 = require("../schemas/password");
const emailSchema = zod_1.z.string().email();
const passwordSchema = zod_1.z.string().regex(password_1.passwordSchemaRegex, {
    message: password_1.passwordSchemaErrMsg,
});
const validateEmailInput = (emailInput) => {
    const zParsedEmail = emailSchema.safeParse(emailInput);
    /* NOTE: using !zparsedEmail.success conditional causes
     * TS error when referencing error */
    if (zParsedEmail.success === false) {
        const { error } = zParsedEmail;
        throw new Error(error.issues[0].message);
    }
};
exports.validateEmailInput = validateEmailInput;
const validatePasswordInput = (passwordInput) => {
    const zParsedPassword = passwordSchema.safeParse(passwordInput);
    if (zParsedPassword.success === false) {
        const { error } = zParsedPassword;
        throw new Error(error.issues[0].message);
    }
};
exports.validatePasswordInput = validatePasswordInput;
const validateInputs = (emailInput, passwordInput) => {
    validateEmailInput(emailInput);
    validatePasswordInput(passwordInput);
};
exports.validateInputs = validateInputs;
