"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
exports.default = (string) => {
    return crypto_1.default
        .createHmac('sha256', String(process.env.HASH_SALT))
        .update(string)
        .digest('hex');
};
