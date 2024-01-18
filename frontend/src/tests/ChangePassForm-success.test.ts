import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

import Focus from '../directives/focus.ts'
import ChangePassForm from '../components/ChangePassForm.vue'

describe('ChangePassForm', () => {
    it('renders and interacts as expected', async () => {
        const wrapper = mount(ChangePassForm, {
            global: {
                directives: {
                    Focus: Focus,
                },
            },
        })
        await wrapper
            .get('[data-test="password-input"]')
            .setValue(process.env.VITE_TEST_PASSWORD)
        await wrapper.get('[data-test="submit-btn"]').trigger('click')
        await flushPromises()
        const errMessage = wrapper.find('[data-test="err-message"]')
        const resSuccessful = wrapper.get('[data-test="res-successful"]')
        expect(errMessage.exists()).toBe(false)
        expect(resSuccessful.text()).toContain(
            'Your password is authenticated, please answer your email to continue change of password',
        )
    })
})
