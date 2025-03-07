/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test as it, expect } from './pageTest';

it('should respect first() and last() @smoke', async ({ page }) => {
  await page.setContent(`
  <section>
    <div><p>A</p></div>
    <div><p>A</p><p>A</p></div>
    <div><p>A</p><p>A</p><p>A</p></div>
  </section>`);
  expect(await page.locator('div >> p').count()).toBe(6);
  expect(await page.locator('div').locator('p').count()).toBe(6);
  expect(await page.locator('div').first().locator('p').count()).toBe(1);
  expect(await page.locator('div').last().locator('p').count()).toBe(3);
});

it('should respect nth()', async ({ page }) => {
  await page.setContent(`
  <section>
    <div><p>A</p></div>
    <div><p>A</p><p>A</p></div>
    <div><p>A</p><p>A</p><p>A</p></div>
  </section>`);
  expect(await page.locator('div >> p').nth(0).count()).toBe(1);
  expect(await page.locator('div').nth(1).locator('p').count()).toBe(2);
  expect(await page.locator('div').nth(2).locator('p').count()).toBe(3);
});

it('should throw on capture w/ nth()', async ({ page }) => {
  await page.setContent(`<section><div><p>A</p></div></section>`);
  const e = await page.locator('*css=div >> p').nth(1).click().catch(e => e);
  expect(e.message).toContain(`Can't query n-th element`);
});

it('should throw on due to strictness', async ({ page }) => {
  await page.setContent(`<div>A</div><div>B</div>`);
  const e = await page.locator('div').isVisible().catch(e => e);
  expect(e.message).toContain(`strict mode violation`);
});

it('should throw on due to strictness 2', async ({ page }) => {
  await page.setContent(`<select><option>One</option><option>Two</option></select>`);
  const e = await page.locator('option').evaluate(e => {}).catch(e => e);
  expect(e.message).toContain(`strict mode violation`);
});

it('should filter by text', async ({ page }) => {
  await page.setContent(`<div>Foobar</div><div>Bar</div>`);
  await expect(page.locator('div', { hasText: 'Foo' })).toHaveText('Foobar');
});

it('should filter by text 2', async ({ page }) => {
  await page.setContent(`<div>foo <span>hello world</span> bar</div>`);
  await expect(page.locator('div', { hasText: 'hello world' })).toHaveText('foo hello world bar');
});

it('should filter by regex', async ({ page }) => {
  await page.setContent(`<div>Foobar</div><div>Bar</div>`);
  await expect(page.locator('div', { hasText: /Foo.*/ })).toHaveText('Foobar');
});

it('should filter by text with quotes', async ({ page }) => {
  await page.setContent(`<div>Hello "world"</div><div>Hello world</div>`);
  await expect(page.locator('div', { hasText: 'Hello "world"' })).toHaveText('Hello "world"');
});

it('should filter by regex with quotes', async ({ page }) => {
  await page.setContent(`<div>Hello "world"</div><div>Hello world</div>`);
  await expect(page.locator('div', { hasText: /Hello "world"/ })).toHaveText('Hello "world"');
});

it('should filter by regex and regexp flags', async ({ page }) => {
  await page.setContent(`<div>Hello "world"</div><div>Hello world</div>`);
  await expect(page.locator('div', { hasText: /hElLo "world"/i })).toHaveText('Hello "world"');
});

it('should filter by case-insensitive regex in a child', async ({ page }) => {
  it.info().annotations.push({ type: 'issue', description: 'https://github.com/microsoft/playwright/issues/15348' });
  await page.setContent(`<div class="test"><h5>Title Text</h5></div>`);
  await expect(page.locator('div', { hasText: /^title text$/i })).toHaveText('Title Text');
});

it('should filter by case-insensitive regex in multiple children', async ({ page }) => {
  it.info().annotations.push({ type: 'issue', description: 'https://github.com/microsoft/playwright/issues/15348' });
  await page.setContent(`<div class="test"><h5>Title</h5> <h2><i>Text</i></h2></div>`);
  await expect(page.locator('div', { hasText: /^title text$/i })).toHaveClass('test');
});

it('should filter by regex with special symbols', async ({ page }) => {
  it.info().annotations.push({ type: 'issue', description: 'https://github.com/microsoft/playwright/issues/15348' });
  await page.setContent(`<div class="test"><h5>First/"and"</h5><h2><i>Second\\</i></h2></div>`);
  await expect(page.locator('div', { hasText: /^first\/".*"second\\$/si })).toHaveClass('test');
});

it('should support has:locator', async ({ page, trace }) => {
  it.skip(trace === 'on');

  await page.setContent(`<div><span>hello</span></div><div><span>world</span></div>`);
  await expect(page.locator(`div`, {
    has: page.locator(`text=world`)
  })).toHaveCount(1);
  expect(removeHighlight(await page.locator(`div`, {
    has: page.locator(`text=world`)
  }).evaluate(e => e.outerHTML))).toBe(`<div><span>world</span></div>`);
  await expect(page.locator(`div`, {
    has: page.locator(`text="hello"`)
  })).toHaveCount(1);
  expect(removeHighlight(await page.locator(`div`, {
    has: page.locator(`text="hello"`)
  }).evaluate(e => e.outerHTML))).toBe(`<div><span>hello</span></div>`);
  await expect(page.locator(`div`, {
    has: page.locator(`xpath=./span`)
  })).toHaveCount(2);
  await expect(page.locator(`div`, {
    has: page.locator(`span`)
  })).toHaveCount(2);
  await expect(page.locator(`div`, {
    has: page.locator(`span`, { hasText: 'wor' })
  })).toHaveCount(1);
  expect(removeHighlight(await page.locator(`div`, {
    has: page.locator(`span`, { hasText: 'wor' })
  }).evaluate(e => e.outerHTML))).toBe(`<div><span>world</span></div>`);
  await expect(page.locator(`div`, {
    has: page.locator(`span`),
    hasText: 'wor',
  })).toHaveCount(1);
});

it('should support locator.filter', async ({ page, trace }) => {
  it.skip(trace === 'on');

  await page.setContent(`<section><div><span>hello</span></div><div><span>world</span></div></section>`);
  await expect(page.locator(`div`).filter({ hasText: 'hello' })).toHaveCount(1);
  await expect(page.locator(`div`, { hasText: 'hello' }).filter({ hasText: 'hello' })).toHaveCount(1);
  await expect(page.locator(`div`, { hasText: 'hello' }).filter({ hasText: 'world' })).toHaveCount(0);
  await expect(page.locator(`section`, { hasText: 'hello' }).filter({ hasText: 'world' })).toHaveCount(1);
  await expect(page.locator(`div`).filter({ hasText: 'hello' }).locator('span')).toHaveCount(1);
  await expect(page.locator(`div`).filter({ has: page.locator('span', { hasText: 'world' }) })).toHaveCount(1);
  await expect(page.locator(`div`).filter({ has: page.locator('span') })).toHaveCount(2);
  await expect(page.locator(`div`).filter({
    has: page.locator('span'),
    hasText: 'world',
  })).toHaveCount(1);
});

it('should support locator.or', async ({ page }) => {
  await page.setContent(`<div>hello</div><span>world</span>`);
  await expect(page.locator('div').or(page.locator('span'))).toHaveCount(2);
  await expect(page.locator('div').or(page.locator('span'))).toHaveText(['hello', 'world']);
  await expect(page.locator('span').or(page.locator('article')).or(page.locator('div'))).toHaveText(['hello', 'world']);
  await expect(page.locator('article').or(page.locator('someting'))).toHaveCount(0);
  await expect(page.locator('article').or(page.locator('div'))).toHaveText('hello');
  await expect(page.locator('article').or(page.locator('span'))).toHaveText('world');
  await expect(page.locator('div').or(page.locator('article'))).toHaveText('hello');
  await expect(page.locator('span').or(page.locator('article'))).toHaveText('world');
});

it('should enforce same frame for has/leftOf/rightOf/above/below/near', async ({ page, server }) => {
  await page.goto(server.PREFIX + '/frames/two-frames.html');
  const child = page.frames()[1];
  for (const option of ['has']) {
    let error;
    try {
      page.locator('div', { [option]: child.locator('span') });
    } catch (e) {
      error = e;
    }
    expect(error.message).toContain(`Inner "${option}" locator must belong to the same frame.`);
  }
});

it('alias methods coverage', async ({ page }) => {
  await page.setContent(`<div><button>Submit</button></div>`);
  await expect(page.locator('button')).toHaveCount(1);
  await expect(page.locator('div').locator('button')).toHaveCount(1);
  await expect(page.locator('div').getByRole('button')).toHaveCount(1);
  await expect(page.mainFrame().locator('button')).toHaveCount(1);
});

function removeHighlight(markup: string) {
  return markup.replace(/\s__playwright_target__="[^"]+"/, '');
}