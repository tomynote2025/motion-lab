export type Region = {
  id: string;
  label: string;
  en: string;
  /** 3D骨格モデル上のホットスポット座標 */
  position: [number, number, number];
  summary: string;
  signs: string[];
  articleTitle: string;
  /** ブログ記事URL — 公開先が決まったらここを差し替えるだけでOK */
  articleUrl: string;
};

export const REGIONS: Region[] = [
  {
    id: 'neck',
    label: '首・頸椎',
    en: 'NECK',
    position: [0, 2.42, 0.22],
    summary:
      '頭の重さ約5kgを支える司令塔。スマホ姿勢による頸椎の前方化は、頭痛・眼精疲労・自律神経の乱れまで波及します。',
    signs: ['朝起きると首が重い', 'デスクワーク後の頭痛', '振り向くと詰まり感がある'],
    articleTitle: 'ストレートネックは「首」だけの問題ではない',
    articleUrl: 'https://example.com/insights/neck',
  },
  {
    id: 'shoulder',
    label: '肩・肩甲帯',
    en: 'SHOULDER',
    position: [0.78, 2.05, 0.12],
    summary:
      '人体で最も可動域が広い関節。その自由度は肩甲骨と胸郭の連動が前提で、土台が崩れると腱板へのストレスが集中します。',
    signs: ['腕を上げると引っかかる', '夜間にズキズキ痛む', '背中に手が回らない'],
    articleTitle: '四十肩・五十肩の前に起きている「肩甲骨のサボり」',
    articleUrl: 'https://example.com/insights/shoulder',
  },
  {
    id: 'elbow',
    label: '肘',
    en: 'ELBOW',
    position: [0.98, 1.12, 0.12],
    summary:
      '肘の痛みの多くは肘自体ではなく、手首の使いすぎと肩の機能低下の「しわ寄せ」。ラケットスポーツや長時間のPC作業で顕在化します。',
    signs: ['物を掴むと外側が痛い', 'タオルを絞ると痛む', 'PC作業後に前腕が張る'],
    articleTitle: 'テニス肘が「安静」で治らない理由',
    articleUrl: 'https://example.com/insights/elbow',
  },
  {
    id: 'wrist',
    label: '手首・手',
    en: 'WRIST / HAND',
    position: [1.1, 0.18, 0.12],
    summary:
      '8個の手根骨が織りなす精密機構。腱鞘炎やTFCC損傷は、前腕の回旋機能と握り方のクセを見直すことが回復の鍵になります。',
    signs: ['ドアノブを回すと痛い', '小指側に体重をかけられない', '朝、指がこわばる'],
    articleTitle: '腱鞘炎を繰り返す人の「握り方」の共通点',
    articleUrl: 'https://example.com/insights/wrist',
  },
  {
    id: 'thoracic',
    label: '胸椎・胸郭',
    en: 'THORACIC',
    position: [0, 1.75, 0.42],
    summary:
      '呼吸と回旋の中心。胸椎の硬さは肩・首・腰の代償運動を生む「隠れた黒幕」。ここが動けば全身が変わります。',
    signs: ['深呼吸で胸が広がらない', 'ゴルフで回旋が浅い', '猫背を指摘される'],
    articleTitle: '不調の黒幕「胸椎の硬さ」セルフチェック',
    articleUrl: 'https://example.com/insights/thoracic',
  },
  {
    id: 'core',
    label: '体幹・腹圧',
    en: 'CORE / IAP',
    position: [0, 0.75, 0.4],
    summary:
      '横隔膜・腹横筋・骨盤底筋・多裂筋が作る「天然のコルセット」。腹腔内圧(IAP)のコントロールがすべての動作の土台です。',
    signs: ['腰を反らないと立てない', '重い物を持つのが怖い', 'くしゃみで尿もれがある'],
    articleTitle: '腹圧(IAP)とは何か — 体幹トレの前に知るべきこと',
    articleUrl: 'https://example.com/insights/core',
  },
  {
    id: 'lumbar',
    label: '腰・腰椎',
    en: 'LUMBAR',
    position: [0, 0.45, -0.38],
    summary:
      '腰痛の85%は画像で説明できない「非特異的腰痛」。腰そのものより、股関節と胸椎の動きと腹圧の使い方が問われます。',
    signs: ['長く座ると腰が抜けそう', '前屈みで痛みが走る', 'ぎっくり腰を繰り返す'],
    articleTitle: '腰痛の85%が「原因不明」と言われる本当の意味',
    articleUrl: 'https://example.com/insights/lumbar',
  },
  {
    id: 'hip',
    label: '股関節',
    en: 'HIP',
    position: [-0.45, -0.18, 0.2],
    summary:
      '体重を受け止め、パワーを生む要。股関節がしゃがむ・ひねるを担えないと、腰と膝が肩代わりして痛めます。',
    signs: ['あぐらがかけない', '歩き始めに脚の付け根が痛い', 'しゃがむと詰まる'],
    articleTitle: '「股関節から動く」を体で理解する',
    articleUrl: 'https://example.com/insights/hip',
  },
  {
    id: 'knee',
    label: '膝',
    en: 'KNEE',
    position: [-0.47, -1.55, 0.2],
    summary:
      '膝は股関節と足首に挟まれた「中間管理職」。膝痛の多くは上下の関節の機能不全のツケを払っている状態です。',
    signs: ['階段の下りで痛む', '正座ができない', '膝が内側に入ると言われる'],
    articleTitle: '膝の痛みは膝のせいじゃない — 上下から考える',
    articleUrl: 'https://example.com/insights/knee',
  },
  {
    id: 'ankle',
    label: '足首・足部',
    en: 'ANKLE / FOOT',
    position: [-0.47, -2.85, 0.2],
    summary:
      '全身で唯一、地面と接する土台。捻挫の放置や扁平足は、上に積み上がる全関節のアライメントを狂わせます。',
    signs: ['捻挫グセがある', '足裏のアーチが落ちている', 'ふくらはぎが常に張る'],
    articleTitle: '捻挫を「治った事にする」と何が起きるか',
    articleUrl: 'https://example.com/insights/ankle',
  },
];
