/**
 * 親ページに埋め込まれた(iframe)場合だけ、コンテンツの高さを親へ通知する。
 * 親側は message('ml-height') を受けて iframe の height を追従させる。
 * 単独表示(トップウィンドウ)のときは何もしない。
 */
export function setupIframeResize() {
  if (window.self === window.top) return; // iframe 内でなければ無効

  let last = 0;
  const post = () => {
    const h = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    if (h === last) return;
    last = h;
    window.parent.postMessage({ type: 'ml-height', h }, '*');
  };

  // 初回・読み込み完了・レイアウト変化・画面回転で通知
  const ro = new ResizeObserver(post);
  ro.observe(document.body);
  window.addEventListener('load', post);
  window.addEventListener('resize', post);
  post();
}
