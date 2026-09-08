import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss, { type AnyNode } from 'postcss';

export function checkMobileNavigation() {
  // Check the real CSS declarations at each breakpoint, including later
  // overrides. This is a source-level contract, not browser layout testing.
  const sheets = ['globals', 'aistock', 'social'].map((name) =>
    postcss.parse(
      readFileSync(new URL(`../app/${name}.css`, import.meta.url), 'utf8'),
    ),
  );
  function styles(selector: string, width: number) {
    const values: Record<string, string> = {};
    for (const sheet of sheets) {
      sheet.walkRules((rule) => {
        if (rule.selector !== selector) return;
        for (
          let parent: AnyNode | undefined = rule.parent;
          parent;
          parent = parent.parent
        ) {
          if (parent.type !== 'atrule') continue;
          if (parent.name !== 'media') return;
          // Resolve width-only rules for the default (non-hover) state.
          if (!/^\((min|max)-width: \d+px\)$/.test(parent.params)) return;
          const [, bound, px] = parent.params.match(
            /\((min|max)-width: (\d+)px\)/,
          )!;
          if (bound === 'min' ? width < Number(px) : width > Number(px)) return;
        }
        rule.walkDecls((decl) => {
          values[decl.prop] = decl.value;
        });
      });
    }
    return values;
  }
  const rem = (value: string, fontSize: number) => {
    assert.match(value, /^[\d.]+rem$/);
    return parseFloat(value) * fontSize;
  };
  for (const width of [320, 360, 390, 430, 568, 739, 740, 1024, 1049]) {
    const root = styles(':root', width);
    const item = styles('.as-nav-item', width);
    const nav = styles('.as-navigation', width);
    const grid = styles('.as-nav-items', width);
    assert.equal(item.width, '100%');
    assert.equal(item['min-width'], '0');
    assert.equal(item['min-height'], 'var(--as-nav-touch-height)');
    assert.equal(nav.height, 'var(--as-bottom-nav-height)');
    assert.equal(grid['grid-template-columns'], 'repeat(5, minmax(0, 1fr))');
    assert.equal(grid.gap, '0');
    assert.equal(root['--as-nav-touch-height'], '4rem');
    assert.equal(root['--as-nav-padding'], '0.375rem');
    assert.equal(
      root['--as-bottom-nav-height'].replace(/\s+/g, ' '),
      'calc( var(--as-nav-touch-height) + var(--as-nav-padding) * 2 + 1px + env(safe-area-inset-bottom, 0px) )',
    );
    assert.equal(
      nav.padding.replace(/\s+/g, ' '),
      'var(--as-nav-padding) max(0.5rem, env(safe-area-inset-right, 0px)) calc(var(--as-nav-padding) + env(safe-area-inset-bottom, 0px)) max(0.5rem, env(safe-area-inset-left, 0px))',
    );
    assert.equal(
      styles('.aistock-app', width)['padding-bottom'],
      'calc(var(--as-bottom-nav-height) + 1rem)',
    );
    assert.equal(
      styles('.as-lesson-bottom-controls', width).bottom,
      'var(--as-bottom-nav-height)',
    );
    for (const fontSize of [16, 32]) {
      const hitHeight = rem(root['--as-nav-touch-height'], fontSize);
      assert(hitHeight >= 64);
      // Formula checks for normal/large text and portrait/landscape insets.
      // Do not describe these values as measurements from a physical phone.
      const sideInset = width >= 568 ? 44 : 0;
      assert((width - 2 * Math.max(0.5 * fontSize, sideInset)) / 5 >= 48);
      for (const bottomInset of [0, 34]) {
        const navHeight =
          hitHeight +
          2 * rem(root['--as-nav-padding'], fontSize) +
          1 +
          bottomInset;
        assert(navHeight > hitHeight + bottomInset);
        assert(
          navHeight + fontSize > navHeight,
          'body reserves space below the final control',
        );
      }
      if (width <= 739) {
        const icon = styles('.as-nav-icon > svg', width);
        assert.equal(rem(icon.width, fontSize), 1.75 * fontSize);
        assert.equal(icon.height, icon.width);
      }
    }
  }
  for (const width of [1050, 1280]) {
    assert.equal(styles(':root', width)['--as-bottom-nav-height'], '0px');
    assert.equal(styles('.as-navigation', width).height, 'auto');
    assert.equal(styles('.as-nav-items', width).display, 'flex');
    assert.equal(styles('.as-nav-item', width)['min-height'], '48px');
    assert.equal(styles('.aistock-app', width)['padding-bottom'], '0');
  }
  for (const sheet of sheets) {
    sheet.walkRules((rule) => {
      if (
        rule.selector.includes('.as-nav-item') &&
        rule.selector.includes(':active') &&
        !rule.selector.endsWith('.as-nav-icon')
      ) {
        rule.walkDecls('transform', () =>
          assert.fail('Do not shrink the link hit area while pressing'),
        );
      }
    });
  }
  const layout = readFileSync(
    new URL('../app/layout.tsx', import.meta.url),
    'utf8',
  );
  assert.match(layout, /export const viewport: Viewport/);
  assert.match(layout, /viewportFit: 'cover'/);
  assert(
    !/maximumScale|userScalable/.test(layout),
    'Keep browser zoom available',
  );
  const reader = readFileSync(
    new URL('../components/textbook/lesson-reader.tsx', import.meta.url),
    'utf8',
  );
  const readerBar = reader.match(
    /className="as-lesson-bottom-controls[^"]*"/,
  )?.[0];
  assert(
    readerBar && !/bottom-0|safe-area-inset-bottom/.test(readerBar),
    'Reader actions must sit above the shared menu without double safe-area padding',
  );
  console.log(
    'Mobile navigation CSS checks passed: 320–1049px, large text/inset formulas, desktop sidebar, stable hit areas and reader offset. No browser layout measured.',
  );
}
