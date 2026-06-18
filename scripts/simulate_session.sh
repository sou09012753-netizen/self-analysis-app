#!/bin/bash
export PATH="/Users/sou/.nvm/versions/node/v24.16.0/bin:$PATH"
DATE=$(date +%Y-%m-%d-%H%M)
OUTPUT="$HOME/projects/self-analysis-app/logs/simulation_${DATE}.md"

echo "# SENアプリ 自動シミュレーション — ${DATE}" > "$OUTPUT"
echo "" >> "$OUTPUT"

claude --print "あなたはSENコーチングアプリのテストユーザー。以下のAPIを実際に叩いてSESSION 1〜3を通しでシミュレーションしてください。

アプリURL: https://self-analysis-app-delta.vercel.app
テストユーザー: メール test@sen.com / パスワード test1234

手順:
1. /api/auth でログイン
2. SESSION 1の各質問にリアルな回答を入力
3. 深掘りで「難しい」を1回試す
4. SESSION 1完了後にSESSION 2を開始
5. SESSION 2でSESSION 1の内容が引き継がれているか確認
6. SESSION 3まで通しで実行

各修正ポイントをOK/NG/要改善で判定して、最後に総合評価と今すぐ直すべき点をまとめてください。" >> "$OUTPUT"

echo "完了：$OUTPUT"
cat "$OUTPUT"
