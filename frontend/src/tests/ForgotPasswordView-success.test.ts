import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Focus from '../directives/focus.ts'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'

describe('ForgotPasswordView', () => {
    it('renders and interacts as expected', async () => {
        const wrapper = mount(ForgotPasswordView, {
            global: {
                directives: {
                    Focus: Focus,
                },
            },
        })
        await wrapper
            .get('[data-test="email-input"]')
            .setValue(process.env.VITE_TEST_EMAIL)
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        await flushPromises()
        const errMessage = wrapper.find('[data-test="err-message"]')
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(errMessage.exists()).toBe(false)
        expect(resSuccessful.text()).toContain(
            `Your forgot password request was successfully sent to ${process.env.VITE_TEST_EMAIL}!`,
        )
    })
})
