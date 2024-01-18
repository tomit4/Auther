import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import NotFoundView from '../views/NotFoundView.vue'

describe('NotFoundView', () => {
    it('renders properly', () => {
        const wrapper = mount(NotFoundView)
        const h1 = wrapper.get('[data-test="h1"]')
        expect(h1.text()).toContain('404 Not Found')
    })
})
