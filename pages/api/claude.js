const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const headers = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.ANTHROPIC_API_KEY,
  'anthropic-version': '2023-06-01',
});

const call = async (system, messages, maxTokens) => {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'API error');
  return data.content[0]?.text || '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type } = req.body;

  try {
    if (type === 'followup') {
      const { question, answer, conversationHistory = [] } = req.body;
      const system = `あなたはプロのコーチです。自己分析ヒアリングを行っています。
相手の答えを聞いて、深層まで掘り下げる追加質問を1つだけしてください。

ルール：
- 判断しない、評価しない
- 「なぜ」より「何を感じたか」を引き出す
- 答えが浅い・回避的な時は「本当に正直に言うと？」
- 感情が動いている部分を深掘りする
- 質問は短く1文で
- 日本語で
- 答えが既に十分に深い場合は「十分です」とだけ答える`;

      const messages = [
        ...conversationHistory,
        { role: 'user', content: `質問：${question}\n回答：${answer}` },
      ];
      const text = await call(system, messages, 300);
      return res.json({ text });
    }

    if (type === 'summary') {
      const { sessionNumber, sessionTitle, userName, allAnswers, previousSummaries = [] } = req.body;

      const prevContext = previousSummaries.length > 0
        ? `\n\n【前回までのセッションサマリー】\n${previousSummaries.map(s =>
          `セッション${s.sessionNumber}「${s.title}」:\n${s.summary}`
        ).join('\n\n')}`
        : '';

      const system = `あなたはプロのコーチです。セッション${sessionNumber}「${sessionTitle}」のヒアリング結果から、今日の発見サマリーカードを作成してください。${prevContext}

出力形式（マークダウン）：

## 今日の3大発見
1. （具体的な発見）
2. （具体的な発見）
3. （具体的な発見）

## ${userName}の核心
（このセッションから見えた動機・パターンの核心を2〜3文で）

## 繰り返すパターン
**成功パターン：** （具体的に）
**失敗パターン：** （具体的に）

${previousSummaries.length > 0 ? '## 前回から見えてきた変化\n（前回セッションと比較して新たに見えたこと）\n\n' : ''}## 次のセッションで深掘りすべきこと
（具体的に1〜2点）

---
褒めず、正確に。弱点も全て含める。日本語で。`;

      const messages = [{ role: 'user', content: JSON.stringify(allAnswers) }];
      const text = await call(system, messages, 1500);
      return res.json({ text });
    }

    if (type === 'generate') {
      const { userName, allSessionData } = req.body;

      const system = `あなたはプロのコーチ兼分析者です。3回のセッションのヒアリング結果から、${userName}の分身ドキュメントを作成してください。

出力形式（マークダウン）：

# ${userName} 分身ドキュメント

## 核心的な動機（なぜ動くのか）
（根底にある動機を具体的に。幼少期の体験との接続も含めて）

## 強み（使える武器）
（箇条書きで5〜7項目、具体的に）

## 弱点（知っておくべきリスク）
（箇条書きで5〜7項目、具体的に。オブラートに包まない）

## 判断基準
**動く条件：** （何があれば動けるか）
**止まる条件：** （何が止め因子になるか）

## 繰り返すパターン（成功）
（具体的なシナリオで）

## 繰り返すパターン（失敗）
（具体的なシナリオで）

## お金が入った時の行動予測
（正直な予測を）

## 熱量が下がった時の行動予測
（正直な予測を）

## Claudeへの指示
（この人物と対話する際の具体的な注意点を5〜7項目）

---
褒めず、正確に。3回のセッションを統合して。日本語で。`;

      const messages = [{
        role: 'user',
        content: allSessionData.map(s =>
          `【セッション${s.sessionNumber}: ${s.title}】\nサマリー: ${s.summary}\n\n詳細回答:\n${JSON.stringify(s.answers)}`
        ).join('\n\n---\n\n')
      }];
      const text = await call(system, messages, 3000);
      return res.json({ text });
    }

    return res.status(400).json({ error: 'Unknown type' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal error' });
  }
}
