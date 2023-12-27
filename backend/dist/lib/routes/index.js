"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const signup_1 = __importDefault(require("./onboarding/signup"));
const verify_1 = __importDefault(require("./onboarding/verify"));
const auth_1 = __importDefault(require("./onboarding/auth"));
const refresh_1 = __importDefault(require("./onboarding/refresh"));
const login_1 = __importDefault(require("./onboarding/login"));
const logout_1 = __importDefault(require("./onboarding/logout"));
const grabuserid_1 = __importDefault(require("./onboarding/grabuserid"));
exports.default = async (fastify) => {
    await fastify.register(signup_1.default, { prefix: '/onboarding' });
    await fastify.register(verify_1.default, { prefix: '/onboarding' });
    await fastify.register(auth_1.default, { prefix: '/onboarding' });
    await fastify.register(refresh_1.default, { prefix: '/onboarding' });
    await fastify.register(login_1.default, { prefix: '/onboarding' });
    await fastify.register(logout_1.default, { prefix: '/onboarding' });
    await fastify.register(grabuserid_1.default, { prefix: '/onboarding' });
};
