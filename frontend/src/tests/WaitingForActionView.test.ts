import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import WaitingForActionView from '../views/WaitingForActionView.vue'

describe('WaitingForActionView', () => {
    it('renders properly', () => {
        const wrapper = mount(WaitingForActionView)
        const h1 = wrapper.get('[data-test="h1"]')
        expect(h1.text()).toContain(
            'Thanks for Signing Up! Please Check Your Email!',
        )
    })
})
