/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { expect, test } from './inspectorTest';

test.describe('cli codegen javascript extended', () => {
  test.only('should generate getByTestId with key if value exists resources map when JavaScript', async ({
    page,
    openRecorder,
  }) => {
    const recorder = await openRecorder();

    await recorder.setContentAndWait(`<div data-testid="testIdInResourcesForTest" onclick="console.log('click')">Submit</div>`);

    const locator = await recorder.hoverOverElement('div');
    expect(locator).toBe(`getByTestId('test.domain.key')`);

    const [message, sources] = await Promise.all([
      page.waitForEvent('console', msg => msg.type() !== 'error'),
      recorder.waitForOutput('JavaScript', 'click'),
      recorder.trustedClick(),
    ]);

    expect.soft(sources.get('JavaScript').text).toContain(`
  await page.getByTestId('test.domain.key').click();`);

    expect.soft(sources.get('Python').text).toContain(`
    page.get_by_test_id("testIdInResourcesForTest").click()`);

    expect.soft(sources.get('Python Async').text).toContain(`
    await page.get_by_test_id("testIdInResourcesForTest").click()`);

    expect.soft(sources.get('Java').text).toContain(`
      page.getByTestId("testIdInResourcesForTest").click()`);

    expect.soft(sources.get('C#').text).toContain(`
        await page.GetByTestId("testIdInResourcesForTest").ClickAsync();`);

    expect(message.text()).toBe('click');
  });
});
