import { describe, it, expect } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

import Focus from '../directives/focus.ts'
import Login from '../views/LoginView.vue'

describe('Login', () => {
    it('Login renders and interacts as expected', async () => {
        const wrapper = mount(Login, {
            global: {
                directives: {
                    Focus: Focus,
                },
                stubs: {
                    RouterLink: RouterLinkStub,
                },
            },
        })
        await wrapper
            .get('[data-test="email-input"]')
            .setValue(process.env.VITE_TEST_EMAIL)
        await wrapper
            .get('[data-test="password-input"]')
            .setValue(process.env.VITE_TEST_PASSWORD)
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        await flushPromises()
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(resSuccessful.text()).toContain(
            'You have been successfully authenticated! Redirecting you to the app...',
        )
    })
})
