import { beforeEach, afterEach, afterAll, vi } from 'vitest'
import { server } from './src/mocks/node'
import { delay } from './src/utils/utils'

beforeEach(() => {
    vi.mock('vue-router', () => ({
        onBeforeRouteLeave: vi.fn(),
        useRoute: () => {
            return {
                params: {
                    hash: process.env.VITE_TEST_HASH,
                },
            }
        },
        useRouter: () => {
            return { push: vi.fn() }
        },
    }))
    vi.mock('localStorage', () => {
        return {
            setItem: vi.fn(),
        }
    })
    vi.mock(
        './src/utils/utils',
        vi.fn(() => {
            return {
                delay: vi.fn(),
                grabStoredCookie: vi.fn(() => {
                    return process.env.VITE_TEST_HASH
                }),
            }
        }),
    )
    server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    server.resetHandlers()
})

afterAll(() => {
    server.close()
})
