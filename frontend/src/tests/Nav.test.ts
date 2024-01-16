import { describe, it, expect } from 'vitest'

// NOTE: Consider reimplementing without @vue/test-utils in favor of @testing-library/vue
import { mount } from '@vue/test-utils'
import Nav from '../components/Nav.vue'

describe('Nav', () => {
    it('Nav renders properly', () => {
        const wrapper = mount(Nav)
        expect(wrapper.text()).toContain('Nav')
    })
})
