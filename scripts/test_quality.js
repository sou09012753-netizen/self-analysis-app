// scripts/test_quality.js
// AIプロンプト品質テスト — summary / onelineinsight / reflect を実行して出力確認
'use strict';

const fs   = require('fs');
const path = require('path');

// ── env ファイル読み込み（複数ソースを順番に試す）──────────────
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
      }
    }
  } catch {}
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));
loadEnvFile(path.join(__dirname, '..', '.env.production'));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY が見つかりません');
  console.error('   以下のいずれかで渡してください:');
  console.error('   ANTHROPIC_API_KEY=sk-... node scripts/test_quality.js');
  console.error('   または .env.local に ANTHROPIC_API_KEY=sk-... を追記');
  process.exit(1);
}

// ── ダミー回答データ（意図的な矛盾あり）────────────────────────
// 矛盾①: 「時間が足りない」 ↔ 「自分でやらないと気が済まない」（時間不足は自分で作っている）
// 矛盾②: 「誰かに認められた時が一番嬉しい」 ↔ 「誰にも見せなくてもやり続けると思う」
// 矛盾③: 「一人の時間が欲しい」 ↔ 「一人になると全部どうでもよくなる」

const DUMMY_ANSWERS = [
  {
    phase: 'モヤモヤの輪郭を取る',
    qa: [
      {
        question: '今、頭の中にあるモヤモヤや引っかかりを、思いつくまま全部書いてください。',
        answer: '時間が全然足りない。やりたいことが多すぎて全部中途半端になっている。人に任せれば楽になるのはわかってるのに、結局自分でやらないと気が済まない。一人の時間がほしいと思いながら、一人になるとすごく不安になる。どっちが本音なのかもわからなくなってきた。',
      },
      {
        question: 'そのモヤモヤは「自分自身への疑い」から来ていますか。それとも「周りや環境への不満・比較」から来ていますか。',
        answer: '両方ある気がするけど、どちらかというと自分への疑い。自分がもっとちゃんとやれば全部うまくいくはずなのに、なんでできないんだろうって。周りの人はちゃんとやってるように見える。',
      },
      {
        question: 'そのモヤモヤが完全に消えたとして、あなたは「何ができるようになる」と思いますか。',
        answer: '人に任せることができるようになると思う。今は全部自分が握っていないと怖い。でも本当は、誰かを信頼してバトンを渡せる人間になりたい。',
      },
      {
        question: '一番「考えたくない」「直視したくない」と感じるものはどれですか。',
        answer: '一番直視したくないのは、自分が認められたくてやっているかもしれないってこと。純粋にやりたいからやってる、って信じていたいけど、そうじゃないかもしれない。',
      },
    ],
  },
  {
    phase: '過去から現在を読む',
    qa: [
      {
        question: '親に「ありがとう」と直接言ったことはありますか。',
        answer: 'ない。言えたことがない。親に何かを言うと「そんなこと当たり前だろ」って返ってくるのが怖くて。感謝しているのに言葉にすると弱く見られそうで。',
      },
      {
        question: '子どもの頃、「本気でやめたいのに続けたこと」はありますか。',
        answer: '習字。小3から中学まで。全然好きじゃなかったけど、やめると言ったら親に失望されると思って続けた。一度だけやめたいって言ったら「せっかくここまでやったのに」って言われて、それ以来言えなくなった。',
      },
      {
        question: '「続けられると思っていたのにやめたこと」は何ですか。やめた瞬間、自分に何と言い訳しましたか。',
        answer: '大学のバンド。本気でプロになりたかった。でも就活の時期に「現実的に考えて」って自分に言い聞かせてやめた。本当は怖かっただけだと思う。失敗するのが。',
      },
    ],
  },
  {
    phase: '承認と動機の核心',
    qa: [
      {
        question: '誰かに褒められた時と、自分で「できた」と感じた時、どちらの満足感が長く続きますか。',
        answer: '正直に言うと、誰かに認められた時の方が長続きする。自分でできたと思っても、誰かに言わない限りどこか物足りない。これって問題なのかなとは思ってる。',
      },
      {
        question: '一生誰にも見せられない、評価されない条件でも、今やっていることを続けますか。',
        answer: 'うーん、続けると思う。誰も見てなくても、やっぱりやりたいからやる、っていう感覚はある。でも本当にそうかって聞かれると、自信を持って言えない。誰にも見せられないならやる意味あるのかな、って少し思う自分もいる。',
      },
    ],
  },
];

// reflect 用のダミー回答（単発）
const DUMMY_REFLECT_ANSWER =
  '一番直視したくないのは、自分が認められたくてやっているかもしれないってこと。純粋にやりたいからやってる、って信じていたいけど、そうじゃないかもしれない。でも認められたいって言ったら負けな気がして。';

// ── req/res モック ───────────────────────────────────────────────
function createMock(body) {
  let result;
  const req = { method: 'POST', body };
  const res = {
    json:   (data) => { result = data; },
    status: (code) => ({
      json: (data) => { result = { _status: code, ...data }; },
      end:  ()     => { result = { _status: code }; },
    }),
  };
  return { req, res, getResult: () => result };
}

// ── 出力ヘルパー ─────────────────────────────────────────────────
const hr  = (char = '─', len = 70) => char.repeat(len);
const sec = (title) => console.log(`\n${hr('═')}\n  ${title}\n${hr('═')}\n`);
const sub = (title) => console.log(`\n${hr()}\n  ${title}\n${hr()}\n`);

// ── メイン ───────────────────────────────────────────────────────
async function main() {
  console.log(`\n${hr('▓')}`);
  console.log('  SEN AI品質テスト — summary / onelineinsight / reflect');
  console.log(`${hr('▓')}\n`);
  console.log('  モデル : claude-sonnet-4-6');
  console.log('  矛盾①  : 「時間が足りない」 ↔ 「自分でやらないと気が済まない」');
  console.log('  矛盾②  : 「認められた時が一番嬉しい」 ↔ 「誰にも見せなくてもやり続ける」');
  console.log('  矛盾③  : 「一人の時間がほしい」 ↔ 「一人になると不安」');

  // ESM ハンドラーを動的ロード
  const { default: handler } = await import('../pages/api/claude.js');

  // ────────────────────────────────────────────────────────────────
  // 1. onelineinsight
  // ────────────────────────────────────────────────────────────────
  sec('① onelineinsight（セッション全体の核心フレーズ）');
  process.stdout.write('  生成中...');
  const m1 = createMock({ type: 'onelineinsight', allAnswers: DUMMY_ANSWERS });
  await handler(m1.req, m1.res);
  process.stdout.write('\r               \r');
  const r1 = m1.getResult();
  if (r1?.error) {
    console.log('  ❌  エラー:', r1.error);
  } else {
    console.log('  結果 :', r1.text);
    console.log();
    console.log('  ✅  確認ポイント');
    console.log('     - 本人が実際に書いた言葉をそのまま引用しているか');
    console.log('     - AIの言葉での言い換えがないか');
    console.log('     - 繰り返し・矛盾の核が拾えているか');
  }

  // ────────────────────────────────────────────────────────────────
  // 2. reflect（単発回答後の一言返し）
  // ────────────────────────────────────────────────────────────────
  sec('② reflect（回答直後の一言フィードバック）');
  console.log('  入力 :', DUMMY_REFLECT_ANSWER.slice(0, 60) + '...');
  console.log();
  process.stdout.write('  生成中...');
  const m2 = createMock({ type: 'reflect', answer: DUMMY_REFLECT_ANSWER });
  await handler(m2.req, m2.res);
  process.stdout.write('\r               \r');
  const r2 = m2.getResult();
  if (r2?.error) {
    console.log('  ❌  エラー:', r2.error);
  } else {
    console.log('  結果 :', r2.text);
    console.log();
    console.log('  ✅  確認ポイント');
    console.log('     - 「言いかけてぼかした部分」を引用しているか');
    console.log('     - AIの言葉で言い換えていないか');
    console.log('     - 1文で収まっているか');
  }

  // ────────────────────────────────────────────────────────────────
  // 3. summary（SESSION 1 全体まとめ）
  // ────────────────────────────────────────────────────────────────
  sec('③ summary SESSION 1（全体フィードバック）');
  console.log('  ※ トークン数が多いため30〜60秒かかります...\n');
  const m3 = createMock({
    type: 'summary',
    sessionNumber: 1,
    userName: 'テストユーザー',
    allAnswers: DUMMY_ANSWERS,
    previousSummaries: [],
  });

  const start = Date.now();
  await handler(m3.req, m3.res);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const r3 = m3.getResult();

  if (r3?.error) {
    console.log('  ❌  エラー:', r3.error);
  } else {
    console.log(r3.text);
    sub(`生成時間: ${elapsed}秒`);
    console.log('  ✅  確認ポイント');
    console.log('     - 「矛盾を並べた引用」が ブロック①に含まれているか');
    console.log('     - 「繰り返している言葉」の指摘があるか');
    console.log('     - アクション提案に「いつ・何を・どう記録するか」が入っているか');
    console.log('     - 決めつけ（「あなたの本当の悩みは〇〇です」）がないか');
    console.log('     - 当たり障りない要約（「〇〇を大事にしていますね」）がないか');
  }

  console.log(`\n${hr('▓')}`);
  console.log('  テスト完了');
  console.log(`${hr('▓')}\n`);
}

main().catch((err) => {
  console.error('\n❌  予期しないエラー:', err.message);
  process.exit(1);
});
