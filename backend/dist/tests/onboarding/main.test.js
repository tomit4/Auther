"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const fastify_1 = __importDefault(require("fastify"));
const auth_utils_1 = __importDefault(require("../../test-utils/auth-utils"));
const signup_test_success_1 = __importDefault(require("../../test-utils/auth-tests/signup-test-success"));
const fastify = (0, fastify_1.default)();
ava_1.default.before(async () => {
    await (0, auth_utils_1.default)(fastify);
    await fastify.listen();
    await fastify.ready();
});
ava_1.default.after(async () => {
    await fastify.close();
});
const runTests = async () => {
    await (0, signup_test_success_1.default)(ava_1.default, fastify);
};
runTests();
