/* ================= game over card ================= */
// shows when a round ends; it stays until the player starts again (tap, Space, or the button)
const overEl = document.getElementById('over');
function showOver(title, text) {
  document.getElementById('over-title').textContent = title;
  document.getElementById('over-text').textContent = text;
  overEl.hidden = false;
}
function hideOver() { overEl.hidden = true; }
function replayGame() { if (G.phase === 'over' && G.phaseT > .6) reset(); }
document.getElementById('again').addEventListener('click', e => { e.stopPropagation(); replayGame(); });
// any reset (tap, Space, the button) moves the game off 'over', so the card goes with it
setInterval(() => { if (!overEl.hidden && G.phase !== 'over') overEl.hidden = true; }, 120);

// the status ticker slides each new message in
(() => {
  const st = document.getElementById('status');
  if (!st) return;
  new MutationObserver(() => { st.classList.remove('tick'); void st.offsetWidth; st.classList.add('tick'); }).observe(st, { childList: true, characterData: true, subtree: true });
})();
