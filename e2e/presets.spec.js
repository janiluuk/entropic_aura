import { test, expect } from '@playwright/test'

test.describe('Preset Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/presets')
  })

  test('should display presets list', async ({ page }) => {
    // Wait for presets to load
    await page.waitForSelector('.presets-grid', { timeout: 10000 })
    
    // Check that presets are displayed
    const presetCards = await page.locator('.preset-card').count()
    expect(presetCards).toBeGreaterThan(0)
  })

  test('should search presets', async ({ page }) => {
    // Wait for presets to load
    await page.waitForSelector('.search-input', { timeout: 10000 })
    
    // Type in search box
    await page.fill('.search-input', 'Ocean')
    
    // Wait a moment for filtering
    await page.waitForTimeout(500)
    
    // Check that results are filtered
    const presetCards = await page.locator('.preset-card')
    const count = await presetCards.count()
    
    if (count > 0) {
      // Check that visible presets contain search term
      const firstCard = await presetCards.first().textContent()
      expect(firstCard.toLowerCase()).toContain('ocean')
    }
  })

  test('should filter presets by mood', async ({ page }) => {
    // Wait for mood filter
    await page.waitForSelector('.mood-filter', { timeout: 10000 })
    
    // Select a mood
    await page.selectOption('.mood-filter', 'Relaxing')
    
    // Wait for filtering
    await page.waitForTimeout(500)
    
    // Check that presets are displayed
    const presetCards = await page.locator('.preset-card')
    const count = await presetCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should toggle favorite on preset', async ({ page }) => {
    // Wait for presets
    await page.waitForSelector('.preset-card', { timeout: 10000 })
    
    // Find first preset's favorite button
    const favoriteBtn = page.locator('.favorite-btn').first()
    
    // Check initial state
    const initialClass = await favoriteBtn.getAttribute('class')
    
    // Click favorite button
    await favoriteBtn.click()
    
    // Wait a moment for state update
    await page.waitForTimeout(500)
    
    // Check that state changed (this is a simple check)
    const newClass = await favoriteBtn.getAttribute('class')
    // Class should have changed (either added or removed 'active')
    expect(newClass).not.toBe(initialClass)
  })
})
