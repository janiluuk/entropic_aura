import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PlaylistCard from '@/components/PlaylistCard.vue'

describe('PlaylistCard', () => {
  let wrapper
  const mockPlaylist = {
    id: '456',
    name: 'Test Playlist',
    description: 'A test playlist',
    presets: [
      { presetId: '1', order: 0 },
      { presetId: '2', order: 1 },
      { presetId: '3', order: 2 }
    ],
    rotationInterval: 300, // 5 minutes
    shuffle: true,
    repeat: true
  }

  beforeEach(() => {
    wrapper = mount(PlaylistCard, {
      props: {
        playlist: mockPlaylist
      }
    })
  })

  it('renders playlist name', () => {
    expect(wrapper.text()).toContain('Test Playlist')
  })

  it('renders playlist description', () => {
    expect(wrapper.text()).toContain('A test playlist')
  })

  it('displays correct preset count', () => {
    expect(wrapper.text()).toContain('3 presets')
  })

  it('formats rotation interval correctly (minutes)', () => {
    expect(wrapper.text()).toContain('5m')
  })

  it('formats rotation interval correctly (hours)', async () => {
    await wrapper.setProps({
      playlist: { ...mockPlaylist, rotationInterval: 3600 } // 1 hour
    })
    expect(wrapper.text()).toContain('1h 0m')
  })

  it('shows shuffle indicator when enabled', () => {
    expect(wrapper.text()).toContain('🔀 Shuffle')
  })

  it('shows repeat indicator when enabled', () => {
    expect(wrapper.text()).toContain('🔁 Repeat')
  })

  it('emits play event when play button is clicked', async () => {
    const playButton = wrapper.find('.btn-primary')
    await playButton.trigger('click')
    
    expect(wrapper.emitted('play')).toBeTruthy()
    expect(wrapper.emitted('play')[0]).toEqual([mockPlaylist])
  })

  it('emits edit event when edit button is clicked', async () => {
    const editButton = wrapper.find('.btn-secondary')
    await editButton.trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual([mockPlaylist])
  })

  it('emits delete event when delete button is clicked', async () => {
    const deleteButton = wrapper.find('.btn-danger')
    await deleteButton.trigger('click')
    
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([mockPlaylist])
  })

  it('shows "No description" when description is empty', async () => {
    await wrapper.setProps({
      playlist: { ...mockPlaylist, description: '' }
    })
    expect(wrapper.text()).toContain('No description')
  })

  it('handles empty playlist presets', async () => {
    await wrapper.setProps({
      playlist: { ...mockPlaylist, presets: [] }
    })
    expect(wrapper.text()).toContain('0 presets')
  })

  it('does not show shuffle indicator when disabled', async () => {
    await wrapper.setProps({
      playlist: { ...mockPlaylist, shuffle: false }
    })
    expect(wrapper.text()).not.toContain('🔀 Shuffle')
  })

  it('does not show repeat indicator when disabled', async () => {
    await wrapper.setProps({
      playlist: { ...mockPlaylist, repeat: false }
    })
    expect(wrapper.text()).not.toContain('🔁 Repeat')
  })
})
