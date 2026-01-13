import { test, expect } from '@playwright/test'

test.describe('Settings Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('should display settings page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Settings')
    
    // Check sections exist
    await expect(page.locator('h2').nth(0)).toContainText('Appearance')
    await expect(page.locator('h2').nth(1)).toContainText('Audio')
  })

  test('should change theme setting', async ({ page }) => {
    // Find theme select
    const themeSelect = page.locator('#theme')
    
    // Change theme
    await themeSelect.selectOption('dark')
    
    // Wait for save message
    await page.waitForSelector('.save-message', { timeout: 3000 })
    
    // Check save message
    await expect(page.locator('.save-message')).toContainText('Settings saved')
  })

  test('should adjust volume slider', async ({ page }) => {
    // Find volume slider
    const volumeSlider = page.locator('#volume')
    
    // Set volume to 50%
    await volumeSlider.fill('0.5')
    
    // Wait for save message
    await page.waitForSelector('.save-message', { timeout: 3000 })
    
    // Check that volume value is displayed
    await expect(page.locator('.setting-value').first()).toContainText('50%')
  })

  test('should toggle checkbox settings', async ({ page }) => {
    // Find autoplay checkbox
    const autoplayCheckbox = page.locator('#autoplay')
    
    // Get initial state
    const wasChecked = await autoplayCheckbox.isChecked()
    
    // Toggle checkbox
    await autoplayCheckbox.click()
    
    // Wait for save message
    await page.waitForSelector('.save-message', { timeout: 3000 })
    
    // Check that state changed
    const isChecked = await autoplayCheckbox.isChecked()
    expect(isChecked).toBe(!wasChecked)
  })

  test('should reset settings to defaults', async ({ page }) => {
    // Click reset button
    await page.click('button:has-text("Reset to Defaults")')
    
    // Confirm dialog
    page.on('dialog', dialog => dialog.accept())
    
    // Wait for save message
    await page.waitForSelector('.save-message', { timeout: 3000 })
    
    // Check message
    await expect(page.locator('.save-message')).toContainText('reset')
  })
})
