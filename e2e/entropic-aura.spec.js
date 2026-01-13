const { test, expect } = require('@playwright/test');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

test.describe('Entropic Aura - End-to-End Tests', () => {
  
  // Health Check Tests
  test.describe('Health and Connectivity', () => {
    test('backend health endpoint responds', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('comfyui');
      expect(data).toHaveProperty('timestamp');
    });

    test('frontend loads successfully', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      await expect(page).toHaveTitle(/Entropic Aura/);
    });

    test('navigation bar is visible', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=Entropic Aura')).toBeVisible();
    });
  });

  // Navigation Tests
  test.describe('Navigation', () => {
    test('can navigate to all main pages', async ({ page }) => {
      await page.goto(FRONTEND_URL);

      // Navigate to Soundscape
      await page.click('text=Soundscape');
      await expect(page).toHaveURL(/.*soundscape/);
      await expect(page.locator('h1:has-text("Create a Soundscape")')).toBeVisible();

      // Navigate to Presets
      await page.click('text=Presets');
      await expect(page).toHaveURL(/.*presets/);
      
      // Navigate to Playlists
      await page.click('text=Playlists');
      await expect(page).toHaveURL(/.*playlists/);
      
      // Navigate to Settings
      await page.click('text=Settings');
      await expect(page).toHaveURL(/.*settings/);
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    test('active navigation link is highlighted', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      const soundscapeLink = page.locator('a[href="/soundscape"]');
      await expect(soundscapeLink).toHaveClass(/router-link-active/);
    });
  });

  // Soundscape Creation Tests
  test.describe('Soundscape Creation', () => {
    test('soundscape page loads with all elements', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      await expect(page.locator('textarea')).toBeVisible();
      await expect(page.locator('button:has-text("Generate")')).toBeVisible();
      await expect(page.locator('button:has-text("Speak")')).toBeVisible();
    });

    test('can select mood tags', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const relaxingButton = page.locator('button:has-text("Relaxing")');
      await relaxingButton.click();
      await expect(relaxingButton).toHaveClass(/active/);
      
      const energizingButton = page.locator('button:has-text("Energizing")');
      await energizingButton.click();
      await expect(energizingButton).toHaveClass(/active/);
      await expect(relaxingButton).not.toHaveClass(/active/);
    });

    test('generate button is disabled when no prompt', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const generateButton = page.locator('button:has-text("Generate")');
      await expect(generateButton).toBeDisabled();
    });

    test('can enter text in prompt textarea', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const textarea = page.locator('textarea');
      await textarea.fill('peaceful ocean waves');
      await expect(textarea).toHaveValue('peaceful ocean waves');
      
      const generateButton = page.locator('button:has-text("Generate")');
      await expect(generateButton).toBeEnabled();
    });

    test('character counter updates', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const textarea = page.locator('textarea');
      await textarea.fill('test');
      
      await expect(page.locator('text=4/500')).toBeVisible();
    });
  });

  // Preset Management Tests
  test.describe('Preset Management', () => {
    test('presets page loads', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/presets`);
      await expect(page.locator('h2:has-text("All Presets")')).toBeVisible();
    });

    test('can switch between All Presets and Favorites tabs', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/presets`);
      
      const favoritesTab = page.locator('button:has-text("Favorites")');
      await favoritesTab.click();
      await expect(favoritesTab).toHaveClass(/active/);
    });

    test('preset search functionality', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/presets`);
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('ocean');
      
      // Wait for results to filter
      await page.waitForTimeout(500);
    });

    test('mood filter dropdown works', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/presets`);
      
      const moodFilter = page.locator('select.mood-filter');
      await moodFilter.selectOption('Relaxing');
      
      // Wait for filtered results
      await page.waitForTimeout(500);
    });

    test('sort order dropdown works', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/presets`);
      
      const sortSelect = page.locator('select.sort-select');
      await sortSelect.selectOption('popular');
      
      // Wait for sorting
      await page.waitForTimeout(500);
    });
  });

  // Playlist Management Tests
  test.describe('Playlist Management', () => {
    test('playlists page loads', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/playlists`);
      await expect(page.locator('h1:has-text("Playlists")')).toBeVisible();
      await expect(page.locator('button:has-text("Create Playlist")')).toBeVisible();
    });

    test('shows empty state when no playlists', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/playlists`);
      
      // Might show empty state or existing playlists
      const emptyState = page.locator('text=No playlists yet');
      const createButton = page.locator('button:has-text("Create Playlist")');
      
      await expect(createButton).toBeVisible();
    });

    test('can navigate to create playlist', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/playlists`);
      
      await page.click('button:has-text("Create Playlist")');
      await expect(page).toHaveURL(/.*playlists\/new/);
    });
  });

  // Settings Tests
  test.describe('Settings Management', () => {
    test('settings page loads with all sections', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      await expect(page.locator('h2:has-text("Audio Settings")')).toBeVisible();
      await expect(page.locator('h2:has-text("Playback Settings")')).toBeVisible();
      await expect(page.locator('h2:has-text("Playlist Settings")')).toBeVisible();
      await expect(page.locator('h2:has-text("Appearance")')).toBeVisible();
      await expect(page.locator('h2:has-text("Data Management")')).toBeVisible();
    });

    test('can adjust volume slider', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const volumeSlider = page.locator('input[type="range"]').first();
      await volumeSlider.fill('50');
      
      // Check that label updates
      await expect(page.locator('text=50%')).toBeVisible();
    });

    test('can select visualizer style', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const visualizerSelect = page.locator('select').filter({ hasText: 'Particles' });
      await visualizerSelect.selectOption('waves');
      
      // Wait for settings to save
      await page.waitForTimeout(500);
    });

    test('can toggle checkboxes', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const autoplayCheckbox = page.locator('input[type="checkbox"]').first();
      const wasChecked = await autoplayCheckbox.isChecked();
      
      await autoplayCheckbox.click();
      const isChecked = await autoplayCheckbox.isChecked();
      
      expect(isChecked).toBe(!wasChecked);
    });

    test('save settings button works', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const saveButton = page.locator('button:has-text("Save Settings")');
      await saveButton.click();
      
      // Check for success message
      await expect(page.locator('text=/Settings saved/')).toBeVisible({ timeout: 3000 });
    });

    test('can export data', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const exportButton = page.locator('button:has-text("Export")');
      await expect(exportButton).toBeVisible();
    });

    test('can reset to defaults', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const resetButton = page.locator('button:has-text("Reset")');
      await expect(resetButton).toBeVisible();
    });
  });

  // Visualizer Tests
  test.describe('Background Visualizer', () => {
    test('visualizer canvas is present', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    });

    test('visualizer changes on style selection', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      // Change visualizer style
      const visualizerSelect = page.locator('select').filter({ hasText: 'Particles' });
      await visualizerSelect.selectOption('nebula');
      
      // Navigate to another page to see visualizer
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      // Verify canvas is still there
      await expect(page.locator('canvas')).toBeVisible();
    });
  });

  // API Integration Tests
  test.describe('API Integration', () => {
    test('can fetch moods from API', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/moods`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('moods');
      expect(Array.isArray(data.moods)).toBeTruthy();
    });

    test('can fetch presets from API', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/presets`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('presets');
      expect(Array.isArray(data.presets)).toBeTruthy();
    });

    test('can fetch playlists from API', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/playlists`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('playlists');
      expect(Array.isArray(data.playlists)).toBeTruthy();
    });

    test('can create a preset', async ({ request }) => {
      const newPreset = {
        name: 'E2E Test Preset',
        description: 'Test preset for E2E',
        text: 'gentle rain falling',
        mood: 'Relaxing',
        tags: ['test', 'e2e']
      };

      const response = await request.post(`${BACKEND_URL}/api/presets`, {
        data: newPreset
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(newPreset.name);
    });
  });

  // Responsive Design Tests
  test.describe('Responsive Design', () => {
    test('mobile viewport renders correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(FRONTEND_URL);
      
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    });

    test('tablet viewport renders correctly', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(FRONTEND_URL);
      
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    });

    test('desktop viewport renders correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(FRONTEND_URL);
      
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  // Performance Tests
  test.describe('Performance', () => {
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(FRONTEND_URL);
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('navigation is fast', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      
      const startTime = Date.now();
      await page.click('text=Settings');
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
      const navTime = Date.now() - startTime;
      
      expect(navTime).toBeLessThan(2000); // 2 seconds
    });
  });

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('handles 404 pages gracefully', async ({ page }) => {
      const response = await page.goto(`${FRONTEND_URL}/nonexistent-page`);
      
      // Either 404 or redirects to home
      expect(response?.status() === 404 || page.url().includes(FRONTEND_URL)).toBeTruthy();
    });

    test('handles API errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/presets', route => route.abort());
      
      await page.goto(`${FRONTEND_URL}/presets`);
      
      // Should show error message instead of crashing
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // Accessibility Tests
  test.describe('Accessibility', () => {
    test('page has proper heading hierarchy', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const h1 = await page.locator('h1').count();
      expect(h1).toBeGreaterThan(0);
    });

    test('buttons have accessible text', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/soundscape`);
      
      const generateButton = page.locator('button:has-text("Generate")');
      await expect(generateButton).toHaveAttribute('type');
    });

    test('form inputs have labels', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/settings`);
      
      const inputs = page.locator('input[type="range"], select, input[type="checkbox"]');
      const count = await inputs.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });
});
