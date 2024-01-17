import { beforeEach, afterEach, afterAll, vi } from 'vitest'
import { RouterLink } from 'vue-router'
import { RouterLinkStub } from '@vue/test-utils'
import { server } from './src/mocks/node'

beforeEach(() => {
    vi.mock('vue-router', () => {
        return {
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
            RouterLink: RouterLinkStub,
        }
    })
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
