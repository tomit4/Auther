import { describe, it, expect } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'

import Focus from '../directives/focus.ts'
import SignUp from '../views/SignUpView.vue'

describe('SignUp', () => {
    it('SignUp renders and interacts as expected', async () => {
        const wrapper = mount(SignUp, {
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
        const errMessage = wrapper.find('[data-test="err-message"]')
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(errMessage.exists()).toBe(false)
        expect(resSuccessful.text()).toContain(
            `Your Email Was Successfully Sent to ${process.env.VITE_TEST_EMAIL}`,
        )
    })
})
