import { test, expect } from '@playwright/test'

test.describe('Playlist Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playlists')
  })

  test('should display playlists page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h2')).toContainText('Playlists')
    
    // Check create button exists
    await expect(page.locator('.btn-create')).toBeVisible()
  })

  test('should open playlist editor when create button is clicked', async ({ page }) => {
    // Click create button
    await page.click('.btn-create')
    
    // Wait for editor to appear
    await page.waitForSelector('.playlist-editor', { timeout: 5000 })
    
    // Check editor title
    await expect(page.locator('.playlist-editor h2')).toContainText('Create Playlist')
  })

  test('should close playlist editor when cancel is clicked', async ({ page }) => {
    // Click create button
    await page.click('.btn-create')
    
    // Wait for editor
    await page.waitForSelector('.playlist-editor', { timeout: 5000 })
    
    // Click cancel
    await page.click('.btn-secondary')
    
    // Editor should be hidden
    await expect(page.locator('.playlist-editor')).not.toBeVisible()
  })
})
