## 2026-10-08 Codex → Claude｜出張パーソナル申込・利用案内の公開文言確認
- 状態: 未着手
- やったこと: 専用申込フォーム、対応可能時間、初めての方へ、FAQ、対応エリア、お客様の声（掲載準備中）を実装し、料金・流れ・プロフィールへの案内導線を整理した
- 次にやること: 各ページの公開文言、女性お一人のご自宅対応に関する案内、キャンセル規定・支払い方法を最終確認する
- 注意点: 申込は静的サイトのためメールアプリ起動方式。問診票・同意書は日程確定後に送付する。実在しないお客様の声は掲載していない
- 関連ファイル: src/pages/PersonalTrainingApplyPage.tsx, src/pages/PersonalTrainingInfoPages.tsx, src/pages/PersonalTrainingPage.tsx, src/App.tsx, src/index.css

## 2026-10-06 Codex → Claude｜ご自宅への出張対応を追加
- 状態: 未着手
- やったこと: 中目黒・恵比寿・六本木・代官山の出張プランを「ご自宅またはレンタルジム」対応に更新した
- 次にやること: ご自宅訪問の条件（必要スペース、対応可能な住居、女性のみ等）があれば公開文言に追加する
- 注意点: ご自宅・レンタルジムとも同一料金と表示。レンタルジム利用時は利用料込み
- 関連ファイル: src/pages/PersonalTrainingPage.tsx, src/sections/PersonalTrainingPromo.tsx

## 2026-10-06 Codex → Claude｜料金プランとおすすめ対象の文言確認
- 状態: 未着手
- やったこと: 出張プランにレンタルジム料・出張費込みを明記し、北品川を別料金プランとして分離。「こんな方におすすめ」4項目を追加した
- 次にやること: 北品川プランの正式料金決定後に差し替え。おすすめ対象とサービス説明の公開文言を最終確認する
- 注意点: 痛みの予防・治療を断定せず「目指したい」という利用者の希望として表現。運動制限がある場合の主治医への事前相談も併記
- 関連ファイル: src/pages/PersonalTrainingPage.tsx, src/index.css

## 2026-10-06 Codex → Claude｜出張パーソナルの公開文言最終確認
- 状態: 未着手
- やったこと: 対応エリア、料金、サービス内容、申し込みから問診票入力までの流れを専用ページに実装した
- 次にやること: サービス説明の公開文言を最終確認し、レンタルジム利用料が表示価格に含まれるかをユーザーに確認する
- 注意点: 慢性痛は治療効果を断定せず「慢性的な不調への運動サポート」と表現。医療行為ではない旨を併記した
- 関連ファイル: src/pages/PersonalTrainingPage.tsx, src/sections/PersonalTrainingPromo.tsx, src/index.css

## 2026-10-06 Codex → Claude｜出張パーソナル案内の公開文言確認
- 状態: 未着手
- やったこと: トップページに大きな出張パーソナル導線を追加し、専用案内ページとCONTACTへのリンクを実装した
- 次にやること: 正式なサービス名、対象者、対応地域、料金、時間、申し込み方法を確定し、公開文言を最終確認する
- 注意点: 未確定の料金・地域などは「準備中」と表示。医療行為や治療効果を示す文言にしない
- 関連ファイル: src/pages/PersonalTrainingPage.tsx, src/sections/PersonalTrainingPromo.tsx, src/App.tsx, src/pages/HomePage.tsx, src/index.css

## 2026-10-01 Codex → Claude｜Lab改修と自己紹介ページの文言確認
- 状態: 未着手
- やったこと: Labの外観、腹腔内圧、筋膜ネットワーク、固有感覚テストを改修し、自己紹介ページの雛形を追加した
- 次にやること: 自己紹介ページのメッセージ、経歴、保有資格、受講歴、専門分野、活動方針の公開文言を確認・作成する
- 注意点: 健康情報の事実主張と出典はClaude側で最終確認する。写真は現在プレースホルダー
- 関連ファイル: src/pages/ProfilePage.tsx, src/sections/IapLab.tsx, src/sections/FasciaLab.tsx, src/sections/FasciaNetworkLab.tsx, src/sections/ProprioceptionLab.tsx
