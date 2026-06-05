export const config = { runtime: 'edge' };

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function buildRequest(body) {
  const { type } = body;

  if (type === 'followup') {
    const { question, answer, conversationHistory = [] } = body;
    return {
      system: `あなたはプロのコーチです。自己分析ヒアリングを行っています。
相手の答えを聞いて、深層まで掘り下げる追加質問を1つだけしてください。

ルール：
- 判断しない、評価しない
- 「なぜ」より「何を感じたか」「その時どうしたか」を引き出す
- 答えが浅い・回避的な時は「本当に正直に言うと？」と問い返す
- 感情が動いている部分を深掘りする
- 質問は短く1文で
- 日本語で答える
- 答えが既に十分に深い場合は「十分です」とだけ答える`,
      messages: [
        ...conversationHistory,
        { role: 'user', content: `質問：${question}\n回答：${answer}` },
      ],
      max_tokens: 300,
    };
  }

  if (type === 'summary') {
    const { sessionNumber, userName, allAnswers, previousSummaries = [] } = body;
    let system = '';

    if (sessionNumber === 1) {
      system = `あなたはプロのコーチです。ヒアリング結果から「${userName}の動機の核心カード」を作成してください。

出力形式（マークダウン）：

## ${userName}の動機の核心カード

### なぜ動くのか
（根底にある動機を1〜2文で端的に。原体験との接続も含めて）

### 行動を点火するもの
- （具体的に）
- （具体的に）
- （具体的に）

### 行動を止めるもの
- （具体的に）
- （具体的に）
- （具体的に）

### 幼少期との接続
（子ども時代の体験と現在の行動パターンがどう繋がっているか・1〜2文）

### 今日最大の気づき
（1文で端的に）

---
褒めず、正確に。弱点も全て含める。日本語で。`;
    }

    if (sessionNumber === 2) {
      const s1 = previousSummaries.find(s => s.sessionNumber === 1);
      system = `あなたはプロのコーチです。ヒアリング結果から「${userName}の成功条件・失敗条件カード」を作成してください。
${s1 ? `\n【前回セッション1「動機の核心カード」より参照】\n${s1.summary}\n` : ''}
出力形式（マークダウン）：

## ${userName}の成功条件・失敗条件カード

### 成功する時の条件
- （具体的に）
- （具体的に）
- （具体的に）

### 失敗する時の条件
- （具体的に）
- （具体的に）
- （具体的に）

### 繰り返している失敗パターン
（最も危険な繰り返しを1〜2文で。正直に）

### セッション1「動機の核心」との接続
（動機の核心と今回の発見がどう繋がるか・1〜2文）

### 今日最大の気づき
（1文で端的に）

---
褒めず、正確に。弱点も全て含める。日本語で。`;
    }

    if (sessionNumber === 3) {
      const s1 = previousSummaries.find(s => s.sessionNumber === 1);
      const s2 = previousSummaries.find(s => s.sessionNumber === 2);
      system = `あなたはプロのコーチです。3回のセッションを統合して「${userName}の自分軸カード」を完成させてください。
${s1 ? `\n【SESSION 1「動機の核心カード」】\n${s1.summary}\n` : ''}${s2 ? `\n【SESSION 2「成功条件・失敗条件カード」】\n${s2.summary}\n` : ''}
出力形式（マークダウン）：

## ${userName}の自分軸カード

### ${userName}が定義する「成功」
（1文で）

### 絶対に譲れない価値観（TOP3）
1.
2.
3.

### 絶対にやらないこと（TOP3）
1.
2.
3.

### 3年後の宣言
（数字と状態で具体的に）

### 3セッション統合の核心
（動機の根っこ → 行動パターン → 自分軸の繋がりを2〜3文で）

### 今日最大の気づき
（1文で端的に）

---
褒めず、正確に。3回のセッションを全て統合して。日本語で。`;
    }

    return {
      system,
      messages: [{ role: 'user', content: JSON.stringify(allAnswers) }],
      max_tokens: 1000,
    };
  }

  if (type === 'generate') {
    const { userName, allSessionData } = body;
    const content = allSessionData
      .map(s => `【SESSION ${s.sessionNumber} カード】\n${s.summary}\n\n【詳細回答】\n${JSON.stringify(s.answers)}`)
      .join('\n\n===\n\n');
    return {
      system: `あなたはプロのコーチ兼分析者です。3回のセッションカードを統合して、${userName}の「分身ドキュメント」を作成してください。

出力形式（マークダウン）：

# ${userName} 分身ドキュメント

## 核心的な動機
（なぜ動くのかを端的に・幼少期との接続を含めて）

## 強み（使える武器）
- （具体的に）
- （具体的に）
- （具体的に）
- （具体的に）
- （具体的に）

## 弱点とリスク（知っておくべきこと）
- （具体的に・オブラートに包まない）
- （具体的に）
- （具体的に）
- （具体的に）

## 成功条件
（どんな状況・環境・関係性があれば最大限動けるか）

## 失敗条件
（何が起きると失敗パターンが発動するか）

## 自分軸
**定義する成功：**
**譲れない価値観：**
**絶対にやらないこと：**
**3年後の宣言：**

## 判断基準
**動く時：**
**止まる時：**
**迷ったら問う：**

## Claudeへの指示
- （この人物と対話する際の具体的な注意点）
-
-
-
-

---
褒めず、正確に。3セッション全てを統合して。日本語で。`,
      messages: [{ role: 'user', content }],
      max_tokens: 3000,
    };
  }

  return null;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const request = buildRequest(body);
  if (!request) {
    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 });
  }

  const anthropicRes = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, stream: true, ...request }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: err.error?.message || 'API error' }), { status: anthropicRes.status });
  }

  return new Response(anthropicRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
