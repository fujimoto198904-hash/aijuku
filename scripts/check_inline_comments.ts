import assert from 'node:assert/strict';
/* oxlint-disable typescript/no-explicit-any -- This adapter traverses esbuild-generated JSX and replaces browser globals; production components remain strictly typed. */
import { build } from 'esbuild';

// Executes the actual component handlers with small hook/navigation adapters.
// This is not a DOM renderer or browser test; API persistence is tested in D1.
export async function checkInlineComments() {
  const state: any = { slots: [], cursor: 0, refreshes: 0 };
  const globals = globalThis as any;
  globals.inlineCommentHooks = state;
  const output = await build({
    stdin: {
      contents: `export {PostDiscussion} from './components/post-discussion';
        export {FeedPostBody} from './components/feed-post-body';
        export {CommunityForm} from './components/community-form';`,
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    plugins: [
      {
        name: 'inline-handler-adapters',
        setup(plugin) {
          const adapters: Record<string, string> = {
            react: `const h=globalThis.inlineCommentHooks;
          export const Fragment=Symbol.for('react.fragment');
          export function useState(initial){const i=h.cursor++; if(!(i in h.slots))h.slots[i]=typeof initial==='function'?initial():initial; return [h.slots[i],v=>{h.slots[i]=typeof v==='function'?v(h.slots[i]):v}];}
          export function useRef(initial){const i=h.cursor++; return h.slots[i]??=( {current:initial} );}
          export function useCallback(fn){return fn}
          export function useEffect(){}
          export function useId(){return 'handler-fixture'}
          export const Suspense='suspense';
          export function lazy(){return function LazyComponent(){}}
          export function createContext(value){return {Provider:'provider',value}}
          export function useContext(context){return context.value}`,
            'next/navigation':
              'export function useRouter(){return {refresh(){globalThis.inlineCommentHooks.refreshes++}}}',
            '@/components/community-form':
              'export function CommunityFormStub(){} export {CommunityFormStub as CommunityForm}; export function CommunityDelete(){}',
            '@/components/ui/input': "export const Input='input'",
            '@/components/ui/textarea': "export const Textarea='textarea'",
            '@/components/ui/button': "export const Button='button'",
            '@/components/post-image-input':
              'export function PostImageInput(){}',
            '@/components/site-link': "export default 'a'",
            '@/lib/prepare-post-image':
              "export async function uploadPostImage(){throw new Error('unexpected upload')}",
            'lucide-react':
              'export function MessageCircle(){} export function X(){} export function Link2(){}',
          };
          plugin.onResolve({ filter: /.*/ }, ({ path }) => {
            if (path in adapters) return { path, namespace: 'handler-adapter' };
            if (
              !path.startsWith('.') &&
              !path.startsWith('@/') &&
              !path.startsWith('/')
            )
              return { path: import.meta.resolve(path), external: true };
          });
          plugin.onLoad(
            { filter: /.*/, namespace: 'handler-adapter' },
            ({ path }) => ({ contents: adapters[path], loader: 'js' }),
          );
        },
      },
    ],
  });
  const components = await import(
    'data:text/javascript;base64,' +
      Buffer.from(output.outputFiles[0].text).toString('base64')
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
    assert(node, 'Expected component control');
    return node;
  };
  const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
  const originalFetch = globalThis.fetch;
  const originalFormData = globalThis.FormData;
  const originalWindow = globals.window;
  const navigations: string[] = [];
  globals.window = {
    location: {
      pathname: '/',
      search: '?view=all',
      hash: '',
      assign: (url: string) => navigations.push(url),
    },
  };
  try {
    reset();
    let tree = render(components.FeedPostBody, {
      body: 'あ'.repeat(140) + '続き',
    });
    find(tree, (n) => n.type === 'button').props.onClick();
    tree = render(components.FeedPostBody, { body: 'あ'.repeat(140) + '続き' });
    assert.equal(
      find(tree, (n) => n.type === 'button').props['aria-expanded'],
      true,
    );
    assert.equal(
      find(tree, (n) => n.type?.name === 'CommunityBody').props.body,
      'あ'.repeat(140) + '続き',
    );
    find(tree, (n) => n.type === 'button').props.onClick();
    assert.equal(
      find(
        render(components.FeedPostBody, { body: 'あ'.repeat(140) + '続き' }),
        (n) => n.type === 'button',
      ).props['aria-expanded'],
      false,
    );
    assert.equal(navigations.length, 0);

    reset();
    const multiline = '一行目\r\n\r\n三行目\r\n四行目\r\n五行目も残す';
    tree = render(components.FeedPostBody, { body: multiline });
    find(tree, (n) => n.type === 'button').props.onClick();
    tree = render(components.FeedPostBody, { body: multiline });
    assert.equal(
      find(tree, (n) => n.type?.name === 'CommunityBody').props.body,
      multiline,
    );
    find(tree, (n) => n.type === 'button').props.onClick();
    assert.equal(
      find(
        render(components.FeedPostBody, { body: multiline }),
        (n) => n.type === 'button',
      ).props['aria-expanded'],
      false,
    );

    reset();
    const reads: string[] = [];
    let failLatest = true;
    const thread = (latest = false) => ({
      replies: [
        {
          id: latest ? 'new-reply' : 'old-reply',
          body: latest ? '送ったコメント' : '前のコメント',
          authorName: '人',
          authorRole: 'member',
          canDelete: true,
        },
      ],
      replyCount: latest ? 51 : 50,
      page: latest ? 2 : 1,
      pages: latest ? 2 : 1,
      canReply: true,
      isStaff: false,
      publicProfile: null,
      defaultNickname: '人',
      notice: '',
      needsLogin: false,
      needsConsent: false,
    });
    globalThis.fetch = async (url) => {
      const page = new URL(
        typeof url === 'string' ? url : url instanceof URL ? url.href : url.url,
        'https://school.test',
      ).searchParams.get('page')!;
      reads.push(page);
      return page === 'last' && failLatest
        ? Response.json({ error: '一時的な通信エラー' }, { status: 503 })
        : Response.json(thread(page === 'last'));
    };
    const props = { postId: 'post-one', initialCount: 50, children: null };
    tree = render(components.PostDiscussion, props);
    assert.equal(
      reads.length,
      0,
      'Do not load all comments when the feed opens',
    );
    const trigger = { focus() {} };
    tree.props.value.toggle(trigger);
    await flush();
    tree = render(components.PostDiscussion, props);
    assert.equal(find(tree, (n) => n.type === 'section').props.hidden, false);
    find(
      tree,
      (n) => typeof n.props.onReplySaved === 'function',
    ).props.onReplySaved();
    await flush();
    tree = render(components.PostDiscussion, props);
    assert.equal(reads.at(-1), 'last');
    assert(find(tree, (n) => n.props.role === 'alert'));
    failLatest = false;
    find(
      tree,
      (n) => n.type === 'button' && n.props.children === 'もう一度読み込む',
    ).props.onClick();
    await flush();
    tree = render(components.PostDiscussion, props);
    assert.equal(
      reads.at(-1),
      'last',
      'Retry the failed latest page, not the old page',
    );
    assert.equal(tree.props.value.count, 51);
    assert(
      find(
        tree,
        (n) =>
          n.type?.name === 'CommunityBody' && n.props.body === '送ったコメント',
      ),
    );
    tree.props.value.toggle(trigger);
    tree = render(components.PostDiscussion, props);
    assert.equal(find(tree, (n) => n.type === 'section').props.hidden, true);
    assert(
      find(tree, (n) => typeof n.props.onReplySaved === 'function'),
      'Closing hides without unmounting the draft',
    );
    tree.props.value.toggle(trigger);
    await flush();
    assert.equal(reads.at(-1), 'last');
    assert.equal(navigations.length, 0);

    reset();
    let savedCalls = 0;
    let writeCount = 0;
    let write: any;
    globalThis.fetch = async (_url, options) => {
      writeCount++;
      assert.equal(typeof options?.body, 'string');
      write = JSON.parse(options!.body as string);
      return Response.json({ ok: true, next: '/community/post-one' });
    };
    globals.FormData = class {
      constructor(private form: any) {}
      get(key: string) {
        return this.form.fields[key] ?? '';
      }
    };
    let resetCount = 0;
    const form = {
      fields: { body: 'その場でコメント', nickname: '人' },
      reset() {
        resetCount++;
      },
    };
    tree = render(components.CommunityForm, {
      postId: 'post-one',
      onReplySaved: () => savedCalls++,
    });
    const event = { preventDefault() {}, currentTarget: form };
    await Promise.all([tree.props.onSubmit(event), tree.props.onSubmit(event)]);
    assert.equal(writeCount, 1, 'Rapid double click only sends once');
    assert.equal(write.action, 'reply');
    assert.equal(write.postId, 'post-one');
    assert.equal(write.body, form.fields.body);
    assert.equal(write.publicConsent, true);
    assert.equal(savedCalls, 1);
    assert.equal(resetCount, 1);
    assert.equal(state.refreshes, 0);
    assert.equal(
      navigations.length,
      0,
      'Inline reply does not navigate or refresh the feed',
    );
    reset();
    tree = render(components.CommunityForm, {});
    await tree.props.onSubmit({
      preventDefault() {},
      currentTarget: {
        fields: {
          body: 'あ'.repeat(990),
          link: 'https://example.test/long-url',
        },
      },
    });
    assert.equal(
      writeCount,
      1,
      'The combined body and URL limit is checked before upload/post',
    );
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.FormData = originalFormData;
    globals.window = originalWindow;
    delete globals.inlineCommentHooks;
  }
}
