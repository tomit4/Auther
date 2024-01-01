"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const user_service_1 = __importDefault(require("./user-service"));
const userServicePlugin = (fastify, options, next) => {
    try {
        if (!fastify.userService) {
            const newUserService = new user_service_1.default();
            fastify.decorate('userService', newUserService);
        }
        next();
    }
    catch (err) {
        if (err instanceof Error)
            next(err);
    }
};
const userService = (0, fastify_plugin_1.default)(userServicePlugin, {
    name: 'fastify-user-service-plugin',
});
exports.default = async (fastify) => {
    await fastify.register(userService);
};
