"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signup_1 = __importDefault(require("./onboarding/signup"));
const verify_1 = __importDefault(require("./onboarding/verify"));
const auth_1 = __importDefault(require("./onboarding/auth"));
const login_1 = __importDefault(require("./onboarding/login"));
exports.default = async (fastify) => {
    await fastify.register(signup_1.default, { prefix: '/onboarding' });
    await fastify.register(verify_1.default, { prefix: '/onboarding' });
    await fastify.register(auth_1.default, { prefix: '/onboarding' });
    await fastify.register(login_1.default, { prefix: '/onboarding' });
};
