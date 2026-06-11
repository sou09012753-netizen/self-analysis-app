import { useState, useEffect, useRef } from "react";

const AGENTS = [
  {
    id: "context", name: "コンテキスト", role: "状況把握", emoji: "🗂️",
    color: "#6366f1", bg: "#1e1b4b", description: "社内・人物・事業の現在地を把握する",
    systemPrompt: (ctx) => `あなたは経営会議の「コンテキストAI」です。\n以下の情報を把握した上で、議題に対して「現在の状況・制約・リソース」の観点から簡潔に整理してください。\n\n【社内コンテキスト】\n${ctx || "（未入力）"}\n\n【ルール】\n- 事実と現実だけを述べる\n- 理想論は言わない\n- 箇条書き3〜5点で端的に\n- 最後に「最大の制約は〇〇」と一言で締める`,
  },
  {
    id: "expand", name: "発散", role: "アイデア展開", emoji: "💡",
    color: "#f59e0b", bg: "#1c1917", description: "制約なしで可能性を広げる",
    systemPrompt: (ctx) => `あなたは経営会議の「発散AI」です。\n議題に対して、制約を気にせず多方面からアイデアを出してください。\n\n【社内コンテキスト（参考）】\n${ctx || "（未入力）"}\n\n【ルール】\n- 最低5つのアイデアを出す\n- 突飛なアイデアも歓迎\n- 否定しない\n- 各アイデアは1〜2文で端的に\n- 「可能性の最大値」を示すことがゴール`,
  },
  {
    id: "deny", name: "否定", role: "弱点摘出", emoji: "⚔️",
    color: "#ef4444", bg: "#1c0a0a", description: "矛盾・リスク・弱点だけを突く",
    systemPrompt: (ctx) => `あなたは経営会議の「否定AI」です。\n発散AIのアイデアと議題に対して、弱点・矛盾・リスクだけを指摘してください。\n\n【社内コンテキスト】\n${ctx || "（未入力）"}\n\n【ルール】\n- 褒めない\n- 感情なく、事実ベースで否定する\n- 「なぜ失敗するか」の構造を明示する\n- 最も致命的な問題を最後に「致命傷：〇〇」と明示する\n- 3〜5点に絞る`,
  },
  {
    id: "integrate", name: "統合", role: "最善案の策定", emoji: "🎯",
    color: "#10b981", bg: "#022c22", description: "議論を受けて実行可能な最善案を出す",
    systemPrompt: (ctx) => `あなたは経営会議の「統合AI」です。\nコンテキスト・発散・否定の議論を踏まえて、実行可能な最善案をまとめてください。\n\n【社内コンテキスト】\n${ctx || "（未入力）"}\n\n【ルール】\n- 今すぐできる行動を優先する\n- 10億ゴールに直結するか常に問う\n- 「やること」「やめること」「判断基準」の3点セットで出す\n- 最後に「今週の一手：〇〇」で締める`,
  },
];

const ORDER = ["context", "expand", "deny", "integrate"];

export default function SenBoard() {
  const [theme, setTheme] = useState("");
  const [context, setContext] = useState(`■ 会社の憲法

【意思決定の原則】
・最適解はAIの多視点統合で出す（発散→否定→統合）
・判断がブレた瞬間にここに戻る
・営業・一日の整理・優先順位はAIと仕組みに完全委譲
・仙石の時間は「意思決定と実行」だけに使う

【10億ゴールへの戦略】
・本命：農業EC（社内全員で動く）
・勝ち筋：プランの質と意思決定の質を上げること
・補助エンジン：コーチング自動化SaaS・自動化ビジネス横展開

【絶対に妥協しない4軸】
・チームマネジメントの浸透（ルール・意識・優先順位）
・自動化ビジネスの拡大
・スピード感
・圧倒的な実績

【仙石のOS】
・最高パフォーマンス条件：悩みがない状態・最適解が出た状態
・弱点：行動中に判断がブレる・プロセスに酔いやすい
・対処法：土台を先に作る・AIに多視点で叩かせる

---

■ 人物カルテ

【仙石淳 — 代表】
・役割：意思決定と実行
・強み：戦略思考・AI活用・構造化
・弱点：プロセスに酔いやすい・行動中に判断がブレる
・委譲先：営業・整理・優先順位 → AIと仕組み

【スケ — 右腕】
・役割：コーチング営業（DM・スレッド）+ 農業ECのノウハウ提供
・強み：SNS集客・動画1本で250万売上実績・農家ビジネス経験
・弱点：経営面が苦手
・使い方：彼のノウハウを仙石が設計に変換する

【さとな — インターン・北海道】
・役割：農業EC編集・企画（予定）
・強み：言われたことを誰より真面目にやる・裏切らない・信頼できる
・弱点：突出した強みがまだ見えていない
・使い方：自己分析データを元に仕事を割り当てる（データ未取得）

【なのか — インターン・京都】
・役割：農家SNSインフルエンサー・看板娘
・強み：農家パイプ・動画出演・さとなとのタッグでSNS拡大
・使い方：農家の思いを届けてECサイトへの入り口になる（データ未取得）

---

■ 現在地

【事業状態】
・コーチング自動化：自己分析アプリ開発中（仙石主導）
・農業EC：スケのノウハウ × なのかのSNS × さとなの編集で立ち上げ中

【ボトルネック】
・チームへの浸透不足（ルール・優先順位の共有できていない）
・さとな・なのかの自己分析データ未取得
・朝のチェックイン未実施
・日報が記録止まりで計画につながっていない

【今週の優先課題】
・SEN BOARDを毎朝1議題叩く習慣を始める
・スケ・さとな・なのかに自己分析アプリを入力させる（仙石が指示）
・農業ECの具体的な次の一手を壁打ちで決める`
4. 顧客ステータスの自動更新`);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAgent = (id) => AGENTS.find((a) => a.id === id);

  const runMeeting = async () => {
    if (!theme.trim() || loading) return;
    setMessages([]);
    setDone(false);
    setLoading(true);
    const history = [];

    for (const agentId of ORDER) {
      const agent = getAgent(agentId);
      setActiveAgent(agentId);
      const userContent =
        history.length === 0
          ? `議題：${theme}`
          : `議題：${theme}\n\n【これまでの議論】\n${history.map((h) => `[${getAgent(h.agentId).name}]\n${h.content}`).join("\n\n")}`;

      let content = "（応答なし）";
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: agent.systemPrompt(context),
            messages: [{ role: "user", content: userContent }],
          }),
        });
        const data = await res.json();
        content = data.content?.[0]?.text || "（応答なし）";
      } catch (e) {
        content = "エラーが発生しました";
      }

      history.push({ agentId, content });
      setMessages((prev) => [...prev, { agentId, content }]);
      await new Promise((r) => setTimeout(r, 200));
    }

    setActiveAgent(null);
    setDone(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d0d14" }}>
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#6366f1", textTransform: "uppercase", marginBottom: "3px" }}>SEN BOARD</div>
          <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em" }}>経営会議AI</div>
        </div>
        <button
          onClick={() => setShowContext(!showContext)}
          style={{ background: showContext ? "#1e1b4b" : "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}
        >
          {showContext ? "▲ 閉じる" : "▼ コンテキスト入力"}
        </button>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 20px" }}>
        {/* Context */}
        {showContext && (
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "28px" }}>
            <div style={{ fontSize: "11px", color: "#6366f1", letterSpacing: "0.1em", marginBottom: "10px" }}>CONTEXT — 社内状況・社員・事業</div>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={"例）\n・仙石（代表）：プロセスに酔いやすい、直接的、10億ゴール\n・右腕Aさん：農業EC担当、実行力高い\n・事業①：コーチング自動化\n・現状課題：Notion複雑、朝チェックイン未実施"}
              style={{ width: "100%", minHeight: "130px", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", padding: "10px", fontSize: "12px", lineHeight: "1.6", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Agent Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
          {AGENTS.map((agent) => (
            <div key={agent.id} style={{
              background: activeAgent === agent.id ? agent.bg : "#0f172a",
              border: `1px solid ${activeAgent === agent.id ? agent.color : "#1e293b"}`,
              borderRadius: "12px", padding: "14px", transition: "all 0.3s ease",
              boxShadow: activeAgent === agent.id ? `0 0 18px ${agent.color}33` : "none",
            }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{agent.emoji}</div>
              <div style={{ fontSize: "12px", fontWeight: "700", color: agent.color, marginBottom: "2px" }}>{agent.name}</div>
              <div style={{ fontSize: "9px", color: "#64748b", letterSpacing: "0.05em", marginBottom: "6px" }}>{agent.role}</div>
              <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: "1.5" }}>{agent.description}</div>
              {activeAgent === agent.id && (
                <div style={{ marginTop: "8px", display: "flex", gap: "3px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: agent.color, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agenda Input */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#64748b", letterSpacing: "0.1em", marginBottom: "10px" }}>AGENDA — 議題を入力</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runMeeting()}
              placeholder="例：X→note→占いの一本化戦略をどう進めるか"
              style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0", padding: "10px 14px", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={runMeeting}
              disabled={loading || !theme.trim()}
              style={{ background: loading ? "#334155" : "#6366f1", border: "none", borderRadius: "8px", color: "#fff", padding: "10px 22px", fontSize: "13px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              {loading ? "会議中..." : "会議を開始"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {messages.map((msg, i) => {
              const agent = getAgent(msg.agentId);
              return (
                <div key={i} style={{ background: "#0f172a", border: `1px solid ${agent.color}44`, borderLeft: `3px solid ${agent.color}`, borderRadius: "12px", padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "18px" }}>{agent.emoji}</span>
                    <span style={{ color: agent.color, fontWeight: "700", fontSize: "13px" }}>{agent.name}</span>
                    <span style={{ color: "#475569", fontSize: "10px" }}>{agent.role}</span>
                  </div>
                  <div style={{ fontSize: "12px", lineHeight: "1.8", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{msg.content}</div>
                </div>
              );
            })}
            {done && (
              <div style={{ textAlign: "center", padding: "14px", color: "#10b981", fontSize: "11px", letterSpacing: "0.1em" }}>
                ✓ 会議完了 — 統合AIの「今週の一手」を実行に移してください
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#334155", fontSize: "12px" }}>
            議題を入力して会議を開始してください
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }`}</style>
    </div>
  );
}
cd ~/projects/self-analysis-app
claude
