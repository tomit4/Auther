import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import VerifiedDeleteProfileView from '../views/VerifiedDeleteProfileView.vue'

describe('VerifiedDeleteProfileView', () => {
    it('renders and interacts as expected', async () => {
        const wrapper = mount(VerifiedDeleteProfileView)
        await flushPromises()
        const message = wrapper.get('[data-test="message"]')
        expect(message.text()).toContain(
            `You have successfully deleted profile for ${process.env.VITE_TEST_EMAIL}, currently rerouting you...`,
        )
        const errMessage = wrapper.find('[data-test="err-message"]')
        expect(errMessage.exists()).toBe(false)

        // 'You have successfully deleted profile for jondoe@test.com, currently rerouting you...'
        /*
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
        */
    })
})
