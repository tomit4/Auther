import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import AppDash from '../components/AppDash.vue'

describe('AppDash', () => {
    it('AppDash renders and interacts as expected', async () => {
        const wrapper = mount(AppDash, {
            props: {
                emailFromCache: process.env.VITE_TEST_EMAIL,
            },
        })
        const greeting = wrapper.get('[data-test="greeting"]')
        await wrapper.get('[data-test="logout-btn"]').trigger('click')
        await wrapper.get('[data-test="change-password-btn"]').trigger('click')
        await wrapper.get('[data-test="delete-profile-btn"]').trigger('click')
        expect(greeting.text()).toContain(process.env.VITE_TEST_EMAIL)
        expect(wrapper.emitted()).toHaveProperty('handleLogout')
        expect(wrapper.emitted()).toHaveProperty('toggleChangePasswordForm')
        expect(wrapper.emitted()).toHaveProperty('toggleDeleteProfileForm')
    })
})
