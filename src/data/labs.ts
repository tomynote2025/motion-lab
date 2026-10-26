/**
 * 体験ラボの一覧（ラボページの目次・トップの紹介・各ラボの見出しで共通に使う）
 * 並び順がそのまま番号になる。ラボを足すときはここに1件足し、LabPage に部品を置く。
 */
export type LabGroupId = 'test' | 'model' | 'life';

export const LAB_GROUPS: { id: LabGroupId; title: string; desc: string }[] = [
  { id: 'test', title: '試して測る', desc: '自分の体で試して、結果を数字で確かめる' },
  { id: 'model', title: '仕組みを見る', desc: '3Dや図を動かして、体の中の仕組みを見る' },
  { id: 'life', title: '暮らしに活かす', desc: '呼吸・痛み・食事を、ふだんの生活につなげる' },
];

export type Lab = {
  id: string;
  group: LabGroupId;
  en: string;
  title: string;
  desc: string;
  /** 使う機器 */
  device: string;
  /** かかる時間の目安 */
  time: string;
  /** 共有したときに出る問いかけ（OGP。scripts/ogp-pages.mjs が読む） */
  hook: string;
};

export const LABS: Lab[] = [
  { id: 'proprioception', group: 'test', en: 'POSITION SENSE', title: '関節位置覚テスト', desc: '目を閉じて、同じ角度に戻せるかを試す', device: 'スマホがあると数字で測れる', time: '約3分', hook: '目を閉じて、同じ角度に戻せますか？' },
  { id: 'laterality', group: 'test', en: 'LEFT / RIGHT', title: '左右判断テスト', desc: '手足の画像が右か左かを、速く正確に答える', device: 'パソコン・スマホ', time: '約2分', hook: 'この手は、右手？ 左手？' },
  { id: 'balance', group: 'test', en: 'BALANCE', title: 'スマホでふらつき測定', desc: '目を開けたとき・閉じたときの揺れを比べる', device: 'スマホ専用', time: '約1分', hook: '目を閉じると、揺れは何倍になる？' },
  { id: 'neuro', group: 'test', en: 'EYES & REACTION', title: '眼と反応のラボ', desc: '光点を追う・見つける速さと、視線を保つしくみ', device: 'パソコン・スマホ', time: '約3分', hook: '頭を振っても、文字がぶれないのはなぜ？' },
  { id: 'iap', group: 'model', en: 'CORE PRESSURE', title: '腹圧のしくみ', desc: '横隔膜・お腹の壁・骨盤底で体幹を支えるしくみを3Dで', device: 'パソコン・スマホ', time: '約3分', hook: '息を吸うと、骨盤の底はどちらへ動く？' },
  { id: 'homunculus', group: 'model', en: 'BODY MAP IN THE BRAIN', title: '脳の中の体の地図', desc: '感覚の細かさで描き直した「脳の中の体」を3Dで', device: 'パソコン・スマホ', time: '約2分', hook: '脳の中では、手がこんなに大きい。' },
  { id: 'fascia', group: 'model', en: 'FASCIA LAYERS', title: '筋膜の層', desc: '皮膚のすぐ下の膜と、筋肉を包む膜の滑り方', device: 'パソコン・スマホ', time: '約2分', hook: '皮膚の下で、膜はどう滑っている？' },
  { id: 'fascia-network', group: 'model', en: 'FASCIA NETWORK', title: '筋膜のつながり', desc: '離れた場所の硬さが、動きに影響するという考え方', device: 'パソコン・スマホ', time: '約2分', hook: '前屈で動いているのは、股関節？ 腰？' },
  { id: 'breath', group: 'life', en: 'BREATHING', title: '呼吸と自律神経', desc: 'ゆっくり呼吸のガイドと、心拍のゆらぎのしくみ', device: 'パソコン・スマホ', time: '1〜5分', hook: 'ゆっくり呼吸で、心拍はどう揺れる？' },
  { id: 'pain', group: 'life', en: 'PAIN', title: '痛みのボリュームつまみ', desc: '危険・安全の手がかりで、痛みの感じ方が変わるしくみ', device: 'パソコン・スマホ', time: '約2分', hook: '同じ刺激でも、痛みの大きさは変わる？' },
  { id: 'nutri', group: 'life', en: 'NUTRITION', title: '食事バランスのラボ', desc: 'たんぱく質・脂質・炭水化物の割合と、食事の選び方', device: 'パソコン・スマホ', time: '約3分', hook: '同じカロリーでも、体の中では何が違う？' },
];

export const labNo = (id: string) => String(LABS.findIndex((l) => l.id === id) + 1).padStart(2, '0');
export const getLab = (id: string) => LABS.find((l) => l.id === id)!;
export const groupOf = (id: string) => LAB_GROUPS.find((g) => g.id === getLab(id).group)!;
