const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const callClaude = async (system, messages, maxTokens) => {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API error');
  return data.content?.[0]?.text || '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type } = req.body;

  try {
    if (type === 'followup') {
      const { question, answer } = req.body;
      const system = `あなたは世界最高峰のコーチです。今の質問への回答だけを見て深掘りしてください。今の質問と回答だけを見る。過去の回答は一切参照しない。回答が表面的・短い・回避的な時は同じテーマを別の角度から聞く。わからない・ない・普通が出た時は「本当に？正直に言うと？」と返す。回答の中で一番感情が動いていそうな言葉を一つ拾ってそこだけを深掘りする。新しいテーマを出さない。質問は1文。短く。圧をかけていい。回答が具体的で150文字以上あり感情や本音が出ている場合のみ「十分です」を返す。前の深掘りと同じ角度・同じ言い回しで聞かない。毎回必ず違うアプローチで掘る。`;
      const messages = [
        { role: 'user', content: `質問：${question}\n回答：${answer}` },
      ];
      const text = await callClaude(system, messages, 200);
      return res.json({ text });
    }

    if (type === 'reflect') {
      const { answer } = req.body;
      const system = `1文だけ。今の回答から一番核心を突いた言葉をそのまま引用して「〜ということですね」と返す。評価しない。解釈しない。本人の言葉をそのまま使う。`;
      const text = await callClaude(system, [{ role: 'user', content: answer }], 100);
      return res.json({ text });
    }

    if (type === 'onelineinsight') {
      const { allAnswers } = req.body;
      const system = `1文だけ。今日のセッション全体を通じて、クライアントが言った言葉の中で最も核心を突いている一言をそのまま引用して返す。分析しない。評価しない。その言葉だけを返す。`;
      const text = await callClaude(system, [{ role: 'user', content: JSON.stringify(allAnswers) }], 100);
      return res.json({ text });
    }

    if (type === 'summary') {
      const { sessionNumber, userName, allAnswers, previousSummaries = [] } = req.body;
      let system = '';

      const toneRules = `【文体のルール — 絶対に守ること】読む相手は20代。専門用語なし。一文短く。褒めない。でも否定しない。見えているものをそのまま届ける。カタカナ心理用語は使わない。コーチが目の前で話しているような言葉で書く。`;

      if (sessionNumber === 1) {
        system = `あなたは世界最高峰のコーチです。SESSION 1のヒアリング結果をもとに、${userName}さんへ3ブロック構成のフィードバックを書いてください。${toneRules}

出力形式（マークダウン）：

## ブロック①　言語化カード

### 今日、一番核心を突いた言葉
「（本人が実際に使った言葉をそのまま1〜2文引用する。要約しない）」

### あなたが気づいていない矛盾
（セッション中に言った2つのことを対比させる。「〇〇したいと言いながら、〇〇している」という形で1つだけ特定して書く。曖昧にしない。）

### あなたの動き方のパターン
**うまくいく時：**（具体的な状況・条件で書く）
**止まる時：**（具体的な状況・条件で書く）

### 子どもの頃との接続
（幼少期の体験が今のパターンにどう出ているか。2文以内。「あなたが〜するのは」という語りかけで）

### 今日最大の気づき
（1文だけ。本人が使った言葉を入れて。「〜ということに、今日気づいた」の形で）

---

## ブロック②　あなたへの問いかけ

（次のセッションまで持ち歩く問いを1つだけ。答えを出す必要はない。考え続けることが目的。本人が一番回避していたテーマから作る。答えが怖くなるくらい核心を突くこと。問いだけを書く。説明は不要）

---

## ブロック③　今週のアクション提案

（SESSION 1の最初の質問で出てきたモヤモヤを元に作る。「〜しなさい」ではなく「試してみてください」の形で。全部、本人の回答から出てきた言葉を使って書く）

**今週やめること：**（1つ。本人の言葉から）

**試してみてください：**
1. （具体的な行動）
2. （具体的な行動）
3. （具体的な行動）

**今週使う強み：**（1つ。本人の回答から見えたもの）`;
      }

      if (sessionNumber === 2) {
        const s1 = previousSummaries.find(s => s.sessionNumber === 1);
        system = `あなたは世界最高峰のコーチです。SESSION 2のヒアリング結果をもとに、${userName}さんへ3ブロック構成のフィードバックを書いてください。${s1 ? `\n【SESSION 1で見えてきたこと（参考）】\n${s1.summary}\n` : ''}${toneRules}

出力形式（マークダウン）：

## ブロック①　言語化カード

### 今日、一番核心を突いた言葉
「（本人が実際に使った言葉をそのまま1〜2文引用する。要約しない）」

### あなたが気づいていない矛盾
（セッション中に言った2つのことを対比させる。「〇〇したいと言いながら、〇〇している」という形で1つだけ特定して書く。曖昧にしない。）

### 繰り返してしまうパターン
**うまくいく時：**（具体的な状況・条件で書く）
**止まる時：**（具体的な状況・条件で書く）

### SESSION 1とのつながり
（前回見えた「動き出す理由」と今回の発見がどう繋がるか。2文以内）

### 今日最大の気づき
（1文だけ。本人が使った言葉を入れて）

---

## ブロック②　あなたへの問いかけ

（次のセッションまで持ち歩く問いを1つだけ。本人が今日一番回避していたテーマから作る。答えが怖くなるくらい核心を突くこと。問いだけを書く）

---

## ブロック③　今週のアクション提案

（今日見えた「止まるパターン」を元に作る。本人の言葉を使って書く）

**今週やめること：**（1つ。本人の回答から）

**試してみてください：**
1. （具体的な行動）
2. （具体的な行動）
3. （具体的な行動）

**今週使う強み：**（1つ。本人の回答から見えたもの）`;
      }

      if (sessionNumber === 3) {
        const s1 = previousSummaries.find(s => s.sessionNumber === 1);
        const s2 = previousSummaries.find(s => s.sessionNumber === 2);
        system = `あなたは世界最高峰のコーチです。3回のセッションを締めくくるフィードバックを、${userName}さんへ3ブロック構成で書いてください。${s1 ? `\n【SESSION 1で見えてきたこと】\n${s1.summary}\n` : ''}${s2 ? `\n【SESSION 2で見えてきたこと】\n${s2.summary}\n` : ''}${toneRules}最後だから、少しだけ前を向ける言葉を入れていい。ただし薄い励ましは要らない。本当のことだけ書く。

出力形式（マークダウン）：

## ブロック①　言語化カード

### 3回を通じて、一番核心を突いた言葉
「（本人が実際に使った言葉をそのまま1〜2文引用する）」

### あなたが気づいていない矛盾
（3回のセッションを通じて言った2つのことを対比させる。「〇〇したいと言いながら、〇〇している」という形で1つだけ特定して書く。曖昧にしない。）

### 3回で見えてきたパターン
（動機の根っこ → 行動のクセ → 自分軸、この流れを2〜3文でつなぐ。語りかけの文体で）

### 3年後への接続
（今日の気づきが3年後にどう繋がるか。2文以内。具体的に）

### 3回を通じての最大の気づき
（1文だけ。本人が使った言葉を入れて）

---

## ブロック②　あなたへの問いかけ

（3回のセッションで本人が最も回避し続けたテーマから問いを1つ作る。答えが怖くなるくらい核心を突くこと。これからも持ち歩く問いとして。問いだけを書く）

---

## ブロック③　これからのアクション提案

（今日決めた「次の一手」と3回の気づきを元に作る。本人の言葉を使って書く）

**やめること：**（1つ。3回を通じて見えた「やめると楽になること」）

**試してみてください：**
1. （具体的な行動）
2. （具体的な行動）
3. （具体的な行動）

**使い続ける強み：**（1つ。3回を通じて一貫して見えた強み）`;
      }

      const messages = [{ role: 'user', content: JSON.stringify(allAnswers) }];
      const text = await callClaude(system, messages, 1800);
      return res.json({ text });
    }

    if (type === 'generate') {
      const { userName, allSessionData } = req.body;
      const system = `あなたは世界最高峰のコーチです。3回のセッションを通じて見えてきたことを、${userName}さんへの「分身ドキュメント」としてまとめてください。【文体のルール — 絶対に守ること】- 読む相手は20代。専門用語は使わない。でも深さは落とさない- 「あなたは〜という人です」という他人行儀なレポート文体ではなく、コーチが直接語りかける文体- 一文は短く。改行を多めに使う- 心理用語・カタカナ専門用語は使わない- 褒めない。でも否定もしない。見えているものをそのまま届ける- 最後だけ、少しだけ前を向ける言葉で締める出力形式（マークダウン）：# ${userName}さんの分身ドキュメント## 動き出す理由（なぜ動くのか。幼少期との繋がりを含めて。語りかける文体で3〜4文）## 持っている武器- （具体的に。「〜できる」という形で）- （具体的に）- （具体的に）- （具体的に）- （具体的に）## 知っておくべきリスク- （具体的に。オブラートに包まない。でも責めない）- （具体的に）- （具体的に）- （具体的に）## うまくいく条件（どんな状況・環境・関係性の時に最大限動けるか。3〜4文）## 止まってしまう条件（何が起きると失敗パターンが動き出すか。3〜4文）## 自分軸**${userName}さんが定義する成功：****絶対に外せないこと：****やらないと決めること：****3年後の姿：**## 迷った時に使う問い**動く時：**（この条件が揃っているか？）**止まっている時：**（今、何を守ろうとしているか？）**判断に迷った時：**（10年後の自分はどっちを選ぶか？）## ${userName}さんへ（3回のセッションを終えて、コーチとして一番伝えたいことを3〜5文で。語りかける文体。薄い励ましは要らない。本当のことだけ）`;
      const content = allSessionData
        .map(s => `【SESSION ${s.sessionNumber} カード】\n${s.summary}\n\n【詳細回答】\n${JSON.stringify(s.answers)}`)
        .join('\n\n===\n\n');
      const text = await callClaude(system, [{ role: 'user', content }], 3000);
      return res.json({ text });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (e) {
    console.error('API error:', e.message);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
