"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const fastify_1 = __importDefault(require("fastify"));
// TODO: Set up registration of plugins and mock output
// import registerPlugins from '../../test_utils/auth-utils'
// import mock from '../mocks/auth/mock_get-user.json'
const mock = {
    ok: true,
    message: 'Hello World!',
};
const fastify = (0, fastify_1.default)();
const registerRoute = async (fastify) => {
    const newRoute = async (fastify, options, done) => {
        fastify.route({
            method: 'POST',
            url: '/signup',
            handler: async (request, reply) => {
                return reply.send({ ok: true, message: 'Hello World!' });
            },
        });
        done();
    };
    fastify.register(newRoute);
};
(0, ava_1.default)('requests the / route', async (t) => {
    // t.plan(3)
    // await registerPlugins(fastify)
    await registerRoute(fastify);
    await fastify.listen();
    await fastify.ready();
    const response = await fastify.inject({
        method: 'POST',
        url: '/signup',
    });
    t.is(response.statusCode, 200);
    t.is(response.headers['content-type'], 'application/json; charset=utf-8');
    t.is(response.payload, JSON.stringify(mock));
    await fastify.close();
});
