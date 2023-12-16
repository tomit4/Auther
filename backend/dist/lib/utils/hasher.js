"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
exports.default = (string) => {
    const salt = crypto_1.default.randomBytes(16);
    return crypto_1.default.createHash('sha256', salt).update(string).digest('hex');
};
