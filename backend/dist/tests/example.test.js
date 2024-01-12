"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
// NOTE: This is just an example test file, to be deleted later
(0, ava_1.default)('foo', t => {
    t.pass();
});
(0, ava_1.default)('bar', async (t) => {
    const bar = Promise.resolve('bar');
    t.is(await bar, 'bar');
});
