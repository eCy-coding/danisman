/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.describe('AI Maturity Assessment', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);
        await page.goto('/maturity-assessment');
        await page.waitForLoadState('networkidle');
    });

    test('should complete the assessment flow', async ({ page }) => {
        // Debugging
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        const bodyText = await page.innerText('body');
        console.log('--- BODY DUMP START ---');
        console.log(bodyText);
        console.log('--- BODY DUMP END ---');
        fs.writeFileSync('assessment_debug.txt', bodyText);

        // 1. Verify Page Load (AssessmentPage has Turkish h1)
        await expect(page.locator('text=Yapay Zeka Hazırlık Testi')).toBeVisible({ timeout: 8000 });
        await expect(page.locator('h1').first()).toBeVisible();

        // 2. BusinessHealthQuiz first question (English questions in component)
        await expect(page.getByText('How defined is your digital strategy?')).toBeVisible({ timeout: 5000 });

        // Quiz: select option then click Continue/Analyze Results
        const answerQuestion = async (optionText: string, isLast = false) => {
          const opt = page.locator(`button:has-text("${optionText}")`);
          await opt.scrollIntoViewIfNeeded();
          await opt.waitFor({ state: 'visible', timeout: 10000 });
          await opt.click();
          await page.waitForTimeout(300);
          const nextBtn = page.locator(isLast ? 'button:has-text("Analyze Results")' : 'button:has-text("Continue")');
          await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
          await nextBtn.click();
          await page.waitForTimeout(500);
        };
        await answerQuestion('Fully integrated and automated');
        await answerQuestion('Inbound Content Engine');
        await answerQuestion('Real-time Custom Dashboards');
        await answerQuestion('Product Innovation');
        await answerQuestion('Ready for hyper-growth', true);

        // 4. Verify Result (actual text from BusinessHealthQuiz.tsx)
        await expect(page.getByText('Assessment Result')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Digital Maturity Score')).toBeVisible();
    });
});
