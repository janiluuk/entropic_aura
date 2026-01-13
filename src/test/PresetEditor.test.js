import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PresetEditor from '@/components/PresetEditor.vue'

describe('PresetEditor', () => {
  let wrapper

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders create mode when no preset is provided', () => {
    wrapper = mount(PresetEditor)
    expect(wrapper.text()).toContain('Create Preset')
  })

  it('renders edit mode when preset is provided', async () => {
    const mockPreset = {
      id: '123',
      name: 'Test Preset',
      description: 'Test description',
      prompt: 'Test prompt',
      mood: 'relaxing',
      tags: ['test'],
      parameters: { duration: 60 }
    }
    
    wrapper = mount(PresetEditor, {
      props: { preset: mockPreset }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Edit Preset')
    expect(wrapper.find('#name').element.value).toBe('Test Preset')
  })

  it('emits close event when close button is clicked', async () => {
    wrapper = mount(PresetEditor)
    const closeButton = wrapper.find('.btn-close')
    await closeButton.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when cancel button is clicked', async () => {
    wrapper = mount(PresetEditor)
    const cancelButton = wrapper.find('.btn-secondary')
    await cancelButton.trigger('click')
    
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('adds tag when enter is pressed', async () => {
    wrapper = mount(PresetEditor)
    const tagInput = wrapper.find('.tags-input input')
    
    await tagInput.setValue('nature')
    await tagInput.trigger('keypress.enter')
    
    expect(wrapper.text()).toContain('nature')
  })

  it('removes tag when tag remove button is clicked', async () => {
    const mockPreset = {
      id: '123',
      name: 'Test',
      prompt: 'Test prompt',
      tags: ['nature', 'ocean']
    }
    
    wrapper = mount(PresetEditor, {
      props: { preset: mockPreset }
    })
    
    await wrapper.vm.$nextTick()
    
    const tags = wrapper.findAll('.tag')
    expect(tags.length).toBe(2)
    
    const removeButton = wrapper.find('.tag-remove')
    expect(removeButton.exists()).toBe(true)
    await removeButton.trigger('click')
    
    await wrapper.vm.$nextTick()
    
    // One tag should be removed
    const tagsAfter = wrapper.findAll('.tag')
    expect(tagsAfter.length).toBe(1)
  })

  it('shows error when name is empty on save', async () => {
    wrapper = mount(PresetEditor)
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    expect(wrapper.text()).toContain('Please enter a preset name')
  })

  it('shows error when prompt is empty on save', async () => {
    wrapper = mount(PresetEditor)
    
    const nameInput = wrapper.find('#name')
    await nameInput.setValue('Test Name')
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    expect(wrapper.text()).toContain('Please enter an audio prompt')
  })

  it('calls API with correct data on save (create mode)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ preset: { id: '123' } })
      })
    )
    
    wrapper = mount(PresetEditor)
    
    await wrapper.find('#name').setValue('Test Preset')
    await wrapper.find('#prompt').setValue('Test prompt')
    await wrapper.find('#mood').setValue('relaxing')
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    await wrapper.vm.$nextTick()
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/presets',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  it('calls API with correct data on save (edit mode)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ preset: { id: '123' } })
      })
    )
    
    const mockPreset = {
      id: '123',
      name: 'Test',
      prompt: 'Test prompt'
    }
    
    wrapper = mount(PresetEditor, {
      props: { preset: mockPreset }
    })
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    await wrapper.vm.$nextTick()
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/presets/123',
      expect.objectContaining({
        method: 'PATCH'
      })
    )
  })

  it('emits save event with preset data on successful save', async () => {
    const savedPreset = { id: '123', name: 'Test' }
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ preset: savedPreset })
      })
    )
    
    wrapper = mount(PresetEditor)
    
    await wrapper.find('#name').setValue('Test Preset')
    await wrapper.find('#prompt').setValue('Test prompt')
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('shows error message when save fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false
      })
    )
    
    wrapper = mount(PresetEditor)
    
    await wrapper.find('#name').setValue('Test Preset')
    await wrapper.find('#prompt').setValue('Test prompt')
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.text()).toContain('Failed to save preset')
  })

  it('disables save button while saving', async () => {
    global.fetch = vi.fn(() => new Promise(() => {})) // Never resolves
    
    wrapper = mount(PresetEditor)
    
    await wrapper.find('#name').setValue('Test')
    await wrapper.find('#prompt').setValue('Test')
    
    const form = wrapper.find('form')
    await form.trigger('submit')
    
    await wrapper.vm.$nextTick()
    
    const saveButton = wrapper.find('.btn-primary')
    expect(saveButton.attributes('disabled')).toBeDefined()
    expect(saveButton.text()).toContain('Saving...')
  })

  it('does not add duplicate tags', async () => {
    wrapper = mount(PresetEditor)
    
    const tagInput = wrapper.find('.tags-input input')
    
    await tagInput.setValue('nature')
    await tagInput.trigger('keypress.enter')
    
    await tagInput.setValue('nature')
    await tagInput.trigger('keypress.enter')
    
    const tags = wrapper.findAll('.tag')
    expect(tags.length).toBe(1)
  })
})
