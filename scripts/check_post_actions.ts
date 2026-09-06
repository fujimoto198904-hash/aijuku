import assert from 'node:assert/strict';
import { build } from 'esbuild';
/* oxlint-disable typescript/no-explicit-any -- Isolated JSX/hook adapter only, not production code. */

// Runs actual event handlers. No browser, production writes or persisted test data.
export async function checkPostActions() {
  const globals = globalThis as any;
  const state: any = { slots: [], cursor: 0 };
  const previousHooks = globals.postActionHooks;
  globals.postActionHooks = state;
  const built = await build({
    stdin: {
      contents: `export {ShareButton,PostReactions} from './components/social-actions';
        export {PostStock} from './components/post-stock';
        export {PostReturnNotice} from './components/post-return-notice';
        export {postActionLoginPath} from './lib/post-navigation';`,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    define: { 'process.env.NEXT_PUBLIC_SITE_BASE_PATH': '"/aistock"' },
    plugins: [
      {
        name: 'post-action-adapters',
        setup(plugin) {
          const adapters: Record<string, string> = {
            react: `const h=globalThis.postActionHooks;
          export function useState(initial){const i=h.cursor++; if(!(i in h.slots))h.slots[i]=initial;return [h.slots[i],v=>h.slots[i]=typeof v==='function'?v(h.slots[i]):v]}
          export function useRef(initial){const i=h.cursor++;return h.slots[i]??={current:initial}}
          export function useId(){return 'share-fixture'}
          export function useSyncExternalStore(){return h.hash??''}`,
            'next/navigation':
              'export function useRouter(){return {refresh(){throw Error("Unexpected refresh")}}}',
            '@/components/post-image-input':
              'export function PostImageInput(){}',
            '@/components/site-link': 'export default "a"',
            'lucide-react':
              'export const Heart="heart",Send="send",MessageCircle="comment",Bookmark="bookmark",LoaderCircle="loader"',
          };
          plugin.onResolve({ filter: /.*/ }, ({ path }) => {
            if (path in adapters)
              return { path, namespace: 'post-action-adapter' };
            if (
              !path.startsWith('.') &&
              !path.startsWith('@/') &&
              !path.startsWith('/')
            )
              return { path: import.meta.resolve(path), external: true };
          });
          plugin.onLoad(
            { filter: /.*/, namespace: 'post-action-adapter' },
            ({ path }) => ({ contents: adapters[path], loader: 'js' }),
          );
        },
      },
    ],
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(built.outputFiles[0].text).toString('base64')
  );
  const render = (component: any, props: any) => {
    state.cursor = 0;
    return component(props);
  };
  const reset = () => {
    state.slots = [];
    state.cursor = 0;
  };
  const nodes = (node: any): any[] =>
    Array.isArray(node)
      ? node.flatMap(nodes)
      : node && typeof node === 'object' && 'props' in node
        ? [node, ...nodes(node.props.children)]
        : [];
  const find = (tree: any, predicate: (node: any) => boolean) => {
    const node = nodes(tree).find(predicate);
    assert(node, 'Expected action control');
    return node;
  };
  const click = (tree: any) =>
    find(tree, (n) => n.type === 'button').props.onClick();
  const navDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  );
  const originalWindow = globals.window;
  const originalFetch = globalThis.fetch;
  const navigations: string[] = [];
  const location = {
    pathname: '/aistock/discover',
    search: '?view=posts&q=%E7%94%BB%E5%83%8F&page=2',
    hash: '#old',
    hostname: 'mon-ai.jp',
    origin: 'https://mon-ai.jp',
    assign: (url: string) => navigations.push(url),
  };
  globals.window = { location };
  const navigator = (value: any) =>
    Object.defineProperty(globalThis, 'navigator', {
      value,
      configurable: true,
    });
  try {
    state.hash = '#post-official-web';
    assert.equal(
      render(api.PostReturnNotice, { visibleRefs: ['official-web'] }),
      null,
    );
    let missing = render(api.PostReturnNotice, { visibleRefs: [] });
    assert.equal(
      find(missing, (n) => n.type === 'a').props.href,
      '/posts/official-web',
    );
    state.hash = '#post-member-one';
    missing = render(api.PostReturnNotice, { visibleRefs: [] });
    assert.equal(
      find(missing, (n) => n.type === 'a').props.href,
      '/community/member-one',
    );
    for (const hash of [
      '',
      '#comments-member-one',
      '#post-%ZZ',
      '#post-https://evil.test',
    ]) {
      state.hash = hash;
      assert.equal(render(api.PostReturnNotice, { visibleRefs: [] }), null);
    }
    let copied = '';
    navigator({
      clipboard: {
        async writeText(url: string) {
          copied = url;
        },
      },
    });
    reset();
    const shareProps = { path: '/community/post-one' };
    let tree = render(api.ShareButton, shareProps);
    await click(tree);
    tree = render(api.ShareButton, shareProps);
    assert.equal(copied, 'https://mon-ai.jp/aistock/community/post-one');
    const notice = find(tree, (n) => n.type === 'output');
    assert.equal(notice.props.className, 'as-share-notice');
    assert.equal(notice.props.children, 'リンクをコピーしました。');
    assert(!nodes(tree).some((n) => n.type === 'input'));

    for (const nav of [
      {},
      {
        clipboard: {
          async writeText() {
            throw Error('denied');
          },
        },
      },
      {
        async share() {
          throw Error('unavailable');
        },
      },
    ]) {
      reset();
      navigator(nav);
      await click(render(api.ShareButton, shareProps));
      tree = render(api.ShareButton, shareProps);
      const input = find(tree, (n) => n.type === 'input');
      assert.equal(input.props.value, copied);
      assert.equal(input.props.readOnly, true);
      let selected = 0;
      input.props.onFocus({
        currentTarget: {
          select() {
            selected++;
          },
        },
      });
      assert.equal(selected, 1);
      find(
        tree,
        (n) => n.type === 'button' && n.props.children === '閉じる',
      ).props.onClick();
      assert(
        !nodes(render(api.ShareButton, shareProps)).some(
          (n) => n.type === 'input',
        ),
      );
    }
    reset();
    navigator({
      async share() {
        throw new DOMException('Cancelled', 'AbortError');
      },
    });
    await click(render(api.ShareButton, shareProps));
    tree = render(api.ShareButton, shareProps);
    assert.equal(find(tree, (n) => n.type === 'output').props.children, '');
    assert(!nodes(tree).some((n) => n.type === 'input'));

    reset();
    let shareCalls = 0;
    let release!: () => void;
    navigator({
      share: () => {
        shareCalls++;
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      },
    });
    tree = render(api.ShareButton, shareProps);
    const pending = click(tree);
    await click(tree);
    assert.equal(shareCalls, 1);
    release();
    await pending;

    for (const [component, props] of [
      [api.PostStock, { postRef: 'post-one', returnAnchor: 'post-post-one' }],
      [
        api.PostReactions,
        {
          postRef: 'post-one',
          path: '/community/post-one',
          returnAnchor: 'post-post-one',
        },
      ],
    ]) {
      reset();
      await click(render(component, props));
      const login = new URL(navigations.at(-1)!, location.origin);
      assert.equal(login.pathname, '/aistock/login');
      assert.equal(
        login.searchParams.get('return_to'),
        '/discover' + location.search + '#post-post-one',
      );
    }
    assert.equal(
      new URL(
        api.postActionLoginPath({
          ...location,
          pathname: '/aistock/mypage',
          hash: '#saved',
        }),
        location.origin,
      ).searchParams.get('return_to'),
      '/mypage' + location.search + '#saved',
    );

    for (const [component, props] of [
      [api.PostStock, { postRef: 'post-one', canSave: true }],
      [
        api.PostReactions,
        { postRef: 'post-one', path: '/community/post-one', canInteract: true },
      ],
    ]) {
      reset();
      let writes = 0;
      let finish!: (value: Response) => void;
      globalThis.fetch = async (_url, options) => {
        writes++;
        assert.equal(JSON.parse(options!.body as string).ref, 'post-one');
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      };
      tree = render(component, props);
      const pending = click(tree);
      await click(tree);
      assert.equal(writes, 1);
      finish(
        Response.json({ error: '通信を確認してください。' }, { status: 503 }),
      );
      await pending;
      tree = render(component, props);
      assert.equal(
        find(tree, (n) => n.type === 'button').props['aria-pressed'],
        false,
      );
      assert(find(tree, (n) => n.props.role === 'alert'));
      const retry = click(tree);
      assert.equal(writes, 2);
      finish(Response.json({ ok: true, liked: true, count: 1 }));
      await retry;
      tree = render(component, props);
      assert.equal(
        find(tree, (n) => n.type === 'button').props['aria-pressed'],
        true,
      );
      assert(!nodes(tree).some((n) => n.props.role === 'alert'));
    }
    assert.equal(
      navigations.length,
      2,
      'No navigation after successful save/like',
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (navDescriptor)
      Object.defineProperty(globalThis, 'navigator', navDescriptor);
    else delete globals.navigator;
    if (originalWindow === undefined) delete globals.window;
    else globals.window = originalWindow;
    if (previousHooks === undefined) delete globals.postActionHooks;
    else globals.postActionHooks = previousHooks;
  }
}
