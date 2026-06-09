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
      const system = `あなたは世界最高峰のコーチです。【今やること】今の質問に対する回答だけを見て、深掘りが必要かどうかを判断してください。【判断基準】回答が具体的・正直・核心を突いている → 「十分です」とだけ返す。回答が抽象的・きれいすぎる・表面的・短すぎる → 深掘り質問を1つだけ返す。【深掘り質問のルール】- 今の質問の回答だけに基づいて作る。前の質問の話を引っ張らない- 「なぜ」より「その時どうしたか」「何を感じたか」- 回避しているものを正面から聞く- 短く1文。圧をかけていい- 判断しない、評価しない、褒めない- 日本語で答える`;
      const messages = [
        { role: 'user', content: `【今の質問】${question}\n\n【回答】${answer}` },
      ];
      const text = await callClaude(system, messages, 200);
      return res.json({ text });
    }

    if (type === 'summary') {
      const { sessionNumber, userName, allAnswers, previousSummaries = [] } = req.body;
      let system = '';

      if (sessionNumber === 1) {
        system = `あなたは世界最高峰のコーチです。ヒアリング結果をもとに、${userName}さんへのフィードバックを書いてください。【文体のルール — 絶対に守ること】- 読む相手は20代。専門用語は使わず、でも軽くしすぎない- 「あなたは〜という人です」ではなく「あなたが動くのは〜だから」という語りかけの文体- レポートじゃなく、コーチが目の前で話しているような言葉で書く- 一文は短く。難しい言葉は使わない- 「承認欲求」「自己効力感」などのカタカナ心理用語は使わない。日常の言葉に置き換える- 褒めない。でも否定もしない。ただ正確に、見えているものを伝える出力形式（マークダウン）：## ${userName}さんの「動き出す理由」カード### あなたが動く時、その奥にあるもの（根底にある動機を2〜3文で。難しい言葉は使わない。「あなたは〜」という語りかけで）### 火がつく瞬間- （具体的な場面や状況で書く）- （具体的に）- （具体的に）### 止まってしまう時- （具体的な場面や状況で書く）- （具体的に）- （具体的に）### 子どもの頃との繋がり（幼少期の体験が今の自分のどこに出ているか。2文以内。語りかけの文体で）### 今日、一番大事なことに気づいた（1文。シンプルに。「〜ということに、今日気づいた」という形で）`;
      }

      if (sessionNumber === 2) {
        const s1 = previousSummaries.find(s => s.sessionNumber === 1);
        system = `あなたは世界最高峰のコーチです。ヒアリング結果をもとに、${userName}さんへのフィードバックを書いてください。${s1 ? `\n【SESSION 1で見えてきたこと】\n${s1.summary}\n` : ''}【文体のルール — 絶対に守ること】- 読む相手は20代。専門用語は使わず、でも軽くしすぎない- レポートじゃなく、コーチが目の前で話しているような言葉で書く- 一文は短く。難しい言葉は使わない- 「防衛機制」「認知の歪み」などの専門用語は使わない。日常の言葉に置き換える- 褒めない。でも否定もしない。ただ正確に、見えているものを伝える- 「またやってしまうパターン」は、責めずに、でもごまかさずに書く出力形式（マークダウン）：## ${userName}さんの「動き方のクセ」カード### うまくいく時、何が揃っている？- （具体的な条件を書く）- （具体的に）- （具体的に）### 止まる時、何が起きている？- （具体的な状況を書く）- （具体的に）- （具体的に）### 繰り返してしまうパターン（最も注意すべき行動パターンを2〜3文で。責めずに、でもはっきりと）### SESSION 1で見えたこととの繋がり（前回の「動き出す理由」と今回の発見がどう繋がるか。2文以内）### 今日、一番大事なことに気づいた（1文。シンプルに）`;
      }

      if (sessionNumber === 3) {
        const s1 = previousSummaries.find(s => s.sessionNumber === 1);
        const s2 = previousSummaries.find(s => s.sessionNumber === 2);
        system = `あなたは世界最高峰のコーチです。3回のセッションを通じて見えてきたものを、${userName}さんへ届けてください。${s1 ? `\n【SESSION 1で見えてきたこと】\n${s1.summary}\n` : ''}${s2 ? `\n【SESSION 2で見えてきたこと】\n${s2.summary}\n` : ''}【文体のルール — 絶対に守ること】- 読む相手は20代。でも軽くしすぎない。真剣に届ける文体- 「あなたはこういう人間だ」という断定ではなく「3回話してきて、こういうことが見えてきた」という語り口- 最後のカードだから、少しだけ背中を押す言葉を入れていい。ただし薄っぺらい励ましは要らない- 一文は短く。難しい言葉は使わない出力形式（マークダウン）：## ${userName}さんの「自分軸」カード### ${userName}さんにとっての「成功」って何？（1〜2文。本人が言った言葉を使いながら）### 絶対に外せない、譲れないこと1.2.3.### やらないと決めること1.2.3.### 3年後、こうなっていたい（具体的な状態と数字で）### 3回話してきて見えてきたこと（動機の根っこ → 行動のクセ → 自分軸、この流れを2〜3文でつなぐ。語りかけの文体で）### 今日、一番大事なことに気づいた（1文。この3回のセッションで最も大切な気づきを）`;
      }

      const messages = [{ role: 'user', content: JSON.stringify(allAnswers) }];
      const text = await callClaude(system, messages, 1200);
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
