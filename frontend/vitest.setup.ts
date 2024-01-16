import { beforeEach, afterEach, afterAll, vi } from 'vitest'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { server } from './src/mocks/node'

beforeEach(() => {
    vi.mock('vue-router', () => ({
        onBeforeRouteLeave: () => vi.fn(onBeforeRouteLeave),
        useRoute: () => vi.fn(useRoute),
        useRouter: () => vi.fn(useRouter),
    }))
    server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
    vi.restoreAllMocks()
    server.resetHandlers()
})

afterAll(() => {
    server.close()
})
