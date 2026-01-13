<template>
  <div class="playlist-manager">
    <div v-if="!showEditor && !selectedPlaylist" class="list-view">
      <PlaylistList
        ref="playlistList"
        title="My Playlists"
        @play="playPlaylist"
        @edit="editPlaylist"
        @create="createPlaylist"
      />
    </div>
    
    <div v-if="showEditor" class="editor-view">
      <PlaylistEditor
        :playlist="editingPlaylist"
        @save="handleSave"
        @close="closeEditor"
      />
    </div>
    
    <div v-if="selectedPlaylist && !showEditor" class="player-view">
      <button @click="backToList" class="btn-back">
        ← Back to Playlists
      </button>
      <PlaylistPlayer
        :playlist="selectedPlaylist"
        @stop="stopPlaylist"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PlaylistList from '@/components/PlaylistList.vue'
import PlaylistEditor from '@/components/PlaylistEditor.vue'
import PlaylistPlayer from '@/components/PlaylistPlayer.vue'

const playlistList = ref(null)
const selectedPlaylist = ref(null)
const showEditor = ref(false)
const editingPlaylist = ref(null)

function playPlaylist(playlist) {
  selectedPlaylist.value = playlist
}

function editPlaylist(playlist) {
  editingPlaylist.value = playlist
  showEditor.value = true
}

function createPlaylist() {
  editingPlaylist.value = null
  showEditor.value = true
}

function closeEditor() {
  showEditor.value = false
  editingPlaylist.value = null
}

async function handleSave(playlist) {
  closeEditor()
  // Refresh the list
  if (playlistList.value) {
    await playlistList.value.refresh()
  }
}

function stopPlaylist() {
  selectedPlaylist.value = null
}

function backToList() {
  selectedPlaylist.value = null
}
</script>

<style scoped>
.playlist-manager {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem;
}

.list-view,
.editor-view,
.player-view {
  max-width: 1200px;
  margin: 0 auto;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e0e0e0;
  transform: translateX(-2px);
}

@media (max-width: 768px) {
  .playlist-manager {
    padding: 1rem;
  }
}
</style>
