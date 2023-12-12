"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const email_1 = __importDefault(require("./onboarding/email"));
const signup_1 = __importDefault(require("./onboarding/signup"));
exports.default = async (fastify) => {
    await fastify.register(email_1.default, { prefix: '/onboarding' });
    await fastify.register(signup_1.default, { prefix: '/onboarding' });
};
