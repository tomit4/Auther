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
    })
})
