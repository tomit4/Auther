import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { createRouterMock, injectRouterMock } from 'vue-router-mock'
import { server } from './src/mocks/node'

const router = createRouterMock({
    spy: {
        create: fn => vi.fn(fn),
        reset: spy => spy.mockReset(),
    },
})

beforeAll(() => {
    injectRouterMock(router)
    server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
    vi.restoreAllMocks()
    server.resetHandlers()
})

afterAll(() => {
    server.close()
})
