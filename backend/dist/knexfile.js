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
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '../.env' });
// Update with your config settings.
const config = {
    development: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DB,
            user: process.env.PG_USER,
            password: process.env.PG_PASS,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },
    staging: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DB,
            user: process.env.PG_USER,
            password: process.env.PG_PASS,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },
    production: {
        client: 'pg',
        connection: {
            host: process.env.PG_HOST,
            port: process.env.PG_PORT,
            database: process.env.PG_DB,
            user: process.env.PG_USER,
            password: process.env.PG_PASS,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: './db/migrations',
            extension: 'ts',
        },
        seeds: {
            directory: './db/seeds',
            extension: 'ts,',
        },
    },
};
exports.default = config;
