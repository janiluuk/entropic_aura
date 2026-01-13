import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PresetCard from '@/components/PresetCard.vue'

describe('PresetCard', () => {
  let wrapper
  const mockPreset = {
    id: '123',
    name: 'Test Preset',
    description: 'A test preset description',
    mood: 'Relaxing',
    tags: ['nature', 'ocean'],
    timesPlayed: 5,
    isFavorite: false
  }

  beforeEach(() => {
    wrapper = mount(PresetCard, {
      props: {
        preset: mockPreset
      }
    })
  })

  it('renders preset information correctly', () => {
    expect(wrapper.text()).toContain('Test Preset')
    expect(wrapper.text()).toContain('A test preset description')
    expect(wrapper.text()).toContain('Relaxing')
  })

  it('displays tags when present', () => {
    expect(wrapper.text()).toContain('nature')
    expect(wrapper.text()).toContain('ocean')
  })

  it('displays play count when greater than 0', () => {
    expect(wrapper.text()).toContain('5')
  })

  it('shows favorite indicator when preset is favorited', async () => {
    await wrapper.setProps({
      preset: { ...mockPreset, isFavorite: true }
    })
    
    const card = wrapper.find('.preset-card')
    expect(card.classes()).toContain('is-favorite')
  })

  it('emits play event when play button is clicked', async () => {
    const playButton = wrapper.find('.btn-primary')
    await playButton.trigger('click')
    
    expect(wrapper.emitted('play')).toBeTruthy()
    expect(wrapper.emitted('play')[0]).toEqual([mockPreset])
  })

  it('emits edit event when edit button is clicked', async () => {
    await wrapper.setProps({ showEdit: true })
    
    const editButton = wrapper.find('.btn-secondary')
    await editButton.trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual([mockPreset])
  })

  it('emits delete event when delete button is clicked', async () => {
    await wrapper.setProps({ showDelete: true })
    
    const deleteButton = wrapper.find('.btn-danger')
    await deleteButton.trigger('click')
    
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([mockPreset])
  })

  it('emits toggleFavorite event when favorite button is clicked', async () => {
    const favoriteButton = wrapper.find('.favorite-btn')
    await favoriteButton.trigger('click')
    
    expect(wrapper.emitted('toggleFavorite')).toBeTruthy()
    expect(wrapper.emitted('toggleFavorite')[0]).toEqual([mockPreset])
  })

  it('hides edit button when showEdit is false', () => {
    expect(wrapper.find('.btn-secondary').exists()).toBe(false)
  })

  it('hides delete button when showDelete is false', () => {
    expect(wrapper.find('.btn-danger').exists()).toBe(false)
  })

  it('applies correct mood class', () => {
    const badge = wrapper.find('.mood-relaxing')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Relaxing')
  })

  it('handles preset without tags', async () => {
    await wrapper.setProps({
      preset: { ...mockPreset, tags: [] }
    })
    
    expect(wrapper.find('.preset-tags').exists()).toBe(false)
  })

  it('handles preset with no play count', async () => {
    await wrapper.setProps({
      preset: { ...mockPreset, timesPlayed: 0 }
    })
    
    expect(wrapper.find('.play-count').exists()).toBe(false)
  })
})
