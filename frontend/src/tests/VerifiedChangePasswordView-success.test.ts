import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import Focus from '../directives/focus.ts'
import VerifiedChangePasswordView from '../views/VerifiedChangePasswordView.vue'

describe('VerifiedChangePasswordView', () => {
    it('renders and interacts as expected', async () => {
        const wrapper = mount(VerifiedChangePasswordView, {
            global: {
                directives: {
                    Focus: Focus,
                },
            },
        })
        await flushPromises()
        const prompt = wrapper.get('[data-test="prompt"]')
        expect(prompt.text()).toContain(
            `Please enter your New Password for ${process.env.VITE_TEST_EMAIL}`,
        )
        await wrapper
            .get('[data-test="password-input"]')
            .setValue(process.env.VITE_TEST_PASSWORD)
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        await flushPromises()
        const errMessage = wrapper.find('[data-test="err-message"]')
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(errMessage.exists()).toBe(false)
        expect(resSuccessful.text()).toContain(
            'You have successfully changed your password!',
        )
        await flushPromises()
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        expect(prompt.text()).toContain(
            `Please enter your New Password for ${process.env.VITE_TEST_EMAIL}`,
        )
    })
})
