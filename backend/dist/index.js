"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
require("dotenv/config");
const routes_1 = __importDefault(require("./lib/routes"));
const plugins_1 = __importDefault(require("./lib/plugins"));
const fastify = (0, fastify_1.default)({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
});
const start = async () => {
    try {
        await (0, plugins_1.default)(fastify);
        await (0, routes_1.default)(fastify);
        return await fastify.listen({
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
