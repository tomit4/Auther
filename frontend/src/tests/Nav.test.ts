import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import Nav from '../components/Nav.vue'

describe('Nav', () => {
    it('Nav renders properly', () => {
        const wrapper = mount(Nav)
        expect(wrapper.text()).toContain('Nav')
    })
})
