// Vitest setup file
import { config } from '@vue/test-utils'

// Mock window.fetch for components that make API calls
global.fetch = vi.fn()

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
