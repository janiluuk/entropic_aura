<template>
  <div class="preset-editor">
    <div class="editor-header">
      <h2>{{ isEdit ? 'Edit Preset' : 'Create Preset' }}</h2>
      <button @click="close" class="btn-close">✕</button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <form @submit.prevent="save" class="editor-form">
      <div class="form-group">
        <label for="name">Preset Name *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="Ocean Waves"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Describe your preset..."
          rows="2"
        />
      </div>
      
      <div class="form-group">
        <label for="prompt">Audio Prompt *</label>
        <textarea
          id="prompt"
          v-model="form.prompt"
          placeholder="Gentle ocean waves on a quiet beach with seagulls in the distance"
          rows="3"
          required
        />
        <small>Describe the soundscape you want to generate</small>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="mood">Mood</label>
          <select id="mood" v-model="form.mood">
            <option value="default">Default</option>
            <option value="relaxing">Relaxing</option>
            <option value="energizing">Energizing</option>
            <option value="peaceful">Peaceful</option>
            <option value="nature">Nature</option>
            <option value="dark">Dark</option>
            <option value="cinematic">Cinematic</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="duration">Duration (seconds)</label>
          <input
            id="duration"
            v-model.number="form.parameters.duration"
            type="number"
            min="10"
            max="300"
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="tags">Tags</label>
        <div class="tags-input">
          <div class="tags-list">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="tag"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(index)"
                class="tag-remove"
              >
                ✕
              </button>
            </span>
          </div>
          <input
            v-model="newTag"
            type="text"
            placeholder="Add a tag..."
            @keypress.enter.prevent="addTag"
          />
        </div>
        <small>Press Enter to add a tag</small>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="close" class="btn-secondary">
          Cancel
        </button>
        <button type="submit" :disabled="saving" class="btn-primary">
          {{ saving ? 'Saving...' : 'Save Preset' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  preset: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'close'])

const isEdit = computed(() => !!props.preset)

const form = ref({
  name: '',
  description: '',
  prompt: '',
  mood: 'default',
  tags: [],
  parameters: {
    duration: 45
  }
})

const newTag = ref('')
const saving = ref(false)
const error = ref('')

onMounted(() => {
  if (props.preset) {
    // Edit mode - populate form
    form.value = {
      name: props.preset.name,
      description: props.preset.description || '',
      prompt: props.preset.prompt || '',
      mood: props.preset.mood || 'default',
      tags: [...(props.preset.tags || [])],
      parameters: {
        duration: props.preset.parameters?.duration || 45
      }
    }
  }
})

function addTag() {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    newTag.value = ''
  }
}

function removeTag(index) {
  form.value.tags.splice(index, 1)
}

async function save() {
  if (!form.value.name.trim()) {
    error.value = 'Please enter a preset name'
    return
  }
  
  if (!form.value.prompt.trim()) {
    error.value = 'Please enter an audio prompt'
    return
  }
  
  saving.value = true
  error.value = ''
  
  try {
    const method = isEdit.value ? 'PATCH' : 'POST'
    const url = isEdit.value ? `/api/presets/${props.preset.id}` : '/api/presets'
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save preset')
    }
    
    const data = await response.json()
    emit('save', data.preset)
  } catch (err) {
    error.value = err.message || 'Failed to save preset'
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close')
}
</script>

<style scoped>
.preset-editor {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 700px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.editor-header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #42b983;
}

.form-group small {
  color: #999;
  font-size: 0.875rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.tags-input:focus-within {
  border-color: #42b983;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 24px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #42b983;
  color: white;
  border-radius: 16px;
  font-size: 0.875rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

.tags-input input {
  border: none;
  padding: 0.5rem 0;
  font-size: 1rem;
  outline: none;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #38a375;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .preset-editor {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
