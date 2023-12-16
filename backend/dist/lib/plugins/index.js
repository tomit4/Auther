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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const env_1 = __importDefault(require("@fastify/env"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const knexfile_1 = __importDefault(require("../../knexfile"));
const knexFile = knexfile_1.default.development;
exports.default = async (fastify) => {
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/cors'))));
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/helmet'))));
    await fastify.register(Promise.resolve().then(() => __importStar(require('fastify-bcrypt'))));
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/cookie'))), {
        secret: 'replaceme',
        hook: 'onRequest',
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/redis'))), {
        host: String(process.env.REDIS_HOST),
        port: Number(process.env.REDIS_PORT),
        // TODO: Reinstate once working within docker
        // password: String(process.env.REDIS_PASSWORD),
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('./knex'))), knexFile);
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/rate-limit'))), {
        max: 100,
        timeWindow: '1 minute',
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/jwt'))), {
        secret: 'replaceme',
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger'))), {
        openapi: {
            info: {
                title: 'Vite via Nginx',
                version: '0.0.1',
            },
        },
        transform: fastify_type_provider_zod_1.jsonSchemaTransform,
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger-ui'))), {
        routePrefix: '/documentation',
    });
    await fastify.register(env_1.default, {
        schema: {
            type: 'object',
            required: ['PORT', 'HOST'],
            properties: {
                PORT: {
                    type: 'number',
                },
                HOST: {
                    type: 'string',
                },
            },
        },
    });
    fastify.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
    fastify.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
};
