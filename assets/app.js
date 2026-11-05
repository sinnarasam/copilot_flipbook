(() => {
  'use strict';

  const bookEl = document.getElementById('book');
  const pages = Array.from(document.querySelectorAll('#book > .page'));
  const totalPages = pages.length;
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');
  const pageIndicator = document.getElementById('pageIndicator');
  const progressBar = document.getElementById('progressBar');
  const orientationLabel = document.getElementById('orientationLabel');
  const contentsPanel = document.getElementById('contentsPanel');
  const contentsToggle = document.getElementById('contentsToggle');
  const contentsClose = document.getElementById('contentsClose');
  const contentsList = document.getElementById('contentsList');
  const scrim = document.getElementById('scrim');
  const motionToggle = document.getElementById('motionToggle');
  const restartButton = document.getElementById('restartButton');
  const toast = document.getElementById('toast');

  let pageFlip = null;
  let fallbackIndex = 0;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let toastTimer = null;

  const pad = value => String(value).padStart(2, '0');
  const clampIndex = value => Math.max(0, Math.min(totalPages - 1, Number(value) || 0));

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function currentIndex() {
    if (pageFlip) {
      try { return clampIndex(pageFlip.getCurrentPageIndex()); } catch (_) { /* fallback below */ }
    }
    return fallbackIndex;
  }

  function updateUI(index = currentIndex(), orientation) {
    const safeIndex = clampIndex(index);
    fallbackIndex = safeIndex;
    pageIndicator.textContent = `${pad(safeIndex + 1)} / ${pad(totalPages)}`;
    progressBar.style.width = `${((safeIndex + 1) / totalPages) * 100}%`;
    prevButton.disabled = safeIndex <= 0;
    nextButton.disabled = safeIndex >= totalPages - 1;
    document.querySelectorAll('#contentsList button').forEach((button, i) => {
      if (i === safeIndex) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (orientation) orientationLabel.textContent = String(orientation).toUpperCase();
    document.title = `${pages[safeIndex].dataset.title} · Copilot Field Guide`;
  }

  function buildContents() {
    pages.forEach((page, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = page.dataset.title || `${index + 1}페이지`;
      button.addEventListener('click', () => {
        goTo(index, false);
        setContents(false);
      });
      item.appendChild(button);
      contentsList.appendChild(item);
    });
  }

  function setContents(open) {
    contentsPanel.hidden = !open;
    scrim.hidden = !open;
    contentsToggle.setAttribute('aria-expanded', String(open));
    if (open) contentsClose.focus();
    else contentsToggle.focus();
  }

  function setFallbackPage(index) {
    const safeIndex = clampIndex(index);
    pages.forEach((page, i) => page.classList.toggle('fallback-current', i === safeIndex));
    fallbackIndex = safeIndex;
    updateUI(safeIndex, 'simple');
  }

  function goTo(index, animate = true) {
    const target = clampIndex(index);
    if (pageFlip) {
      try {
        if (!animate || reducedMotion) pageFlip.turnToPage(target);
        else pageFlip.flip(target, 'top');
        window.setTimeout(() => updateUI(target), reducedMotion ? 20 : 380);
        return;
      } catch (_) { /* use fallback below */ }
    }
    setFallbackPage(target);
  }

  function move(direction) {
    if (pageFlip) {
      try {
        if (direction > 0) {
          reducedMotion ? pageFlip.turnToNextPage() : pageFlip.flipNext('top');
        } else {
          reducedMotion ? pageFlip.turnToPrevPage() : pageFlip.flipPrev('top');
        }
        return;
      } catch (_) { /* use fallback below */ }
    }
    setFallbackPage(fallbackIndex + direction);
  }

  function initFlipbook() {
    if (!window.St || !window.St.PageFlip) {
      document.body.classList.add('fallback-mode');
      setFallbackPage(0);
      orientationLabel.textContent = 'SIMPLE';
      console.warn('StPageFlip을 불러오지 못해 단순 페이지 보기로 전환했습니다.');
      return;
    }

    const availableHeight = Math.max(420, window.innerHeight - 160);
    const maxHeight = Math.min(820, availableHeight);
    const maxWidth = Math.round(maxHeight * 600 / 820);

    try {
      pageFlip = new window.St.PageFlip(bookEl, {
        width: 600,
        height: 820,
        size: 'stretch',
        minWidth: 260,
        maxWidth,
        minHeight: 355,
        maxHeight,
        drawShadow: true,
        flippingTime: reducedMotion ? 150 : 720,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 0.34,
        showCover: true,
        mobileScrollSupport: false,
        swipeDistance: 22,
        clickEventForward: true,
        useMouseEvents: true,
        disableFlipByClick: false
      });

      pageFlip.on('init', event => updateUI(event.data.page, event.data.mode));
      pageFlip.on('flip', event => updateUI(event.data));
      pageFlip.on('changeOrientation', event => updateUI(currentIndex(), event.data));
      pageFlip.loadFromHTML(document.querySelectorAll('#book > .page'));
      updateUI(0, pageFlip.getOrientation());
    } catch (error) {
      console.error('StPageFlip 초기화 실패:', error);
      pageFlip = null;
      document.body.classList.add('fallback-mode');
      setFallbackPage(0);
    }
  }

  async function copyText(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const text = target.innerText.trim();
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    showToast('프롬프트를 복사했습니다');
  }

  function initSavedPlan() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('copilot-field-guide-plan') || '{}'); } catch (_) { saved = {}; }
    document.querySelectorAll('[data-plan]').forEach(input => {
      input.checked = Boolean(saved[input.dataset.plan]);
    });
  }

  function savePlan(changedInput) {
    const key = changedInput.dataset.plan;
    document.querySelectorAll(`[data-plan="${key}"]`).forEach(input => { input.checked = changedInput.checked; });
    const state = {};
    document.querySelectorAll('#planList [data-plan]').forEach(input => { state[input.dataset.plan] = input.checked; });
    try { localStorage.setItem('copilot-field-guide-plan', JSON.stringify(state)); } catch (_) { /* storage may be disabled */ }
  }

  function setReducedMotion(value) {
    reducedMotion = Boolean(value);
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    motionToggle.setAttribute('aria-pressed', String(reducedMotion));
    motionToggle.querySelector('.desktop-label').textContent = reducedMotion ? '모션 켜기' : '모션 줄이기';
    try { localStorage.setItem('copilot-field-guide-reduced-motion', String(reducedMotion)); } catch (_) { /* noop */ }
    showToast(reducedMotion ? '전환 모션을 줄였습니다' : '전환 모션을 켰습니다');
  }

  function initEvents() {
    prevButton.addEventListener('click', () => move(-1));
    nextButton.addEventListener('click', () => move(1));
    restartButton.addEventListener('click', () => goTo(0));
    contentsToggle.addEventListener('click', () => setContents(contentsPanel.hidden));
    contentsClose.addEventListener('click', () => setContents(false));
    scrim.addEventListener('click', () => setContents(false));
    motionToggle.addEventListener('click', () => setReducedMotion(!reducedMotion));

    document.addEventListener('keydown', event => {
      if (!contentsPanel.hidden && event.key === 'Escape') return setContents(false);
      const tag = document.activeElement?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); move(-1); }
      if (event.key === 'Home') { event.preventDefault(); goTo(0, false); }
      if (event.key === 'End') { event.preventDefault(); goTo(totalPages - 1, false); }
    });

    document.addEventListener('click', event => {
      const copyButton = event.target.closest('[data-copy-target]');
      if (copyButton) {
        event.preventDefault();
        event.stopPropagation();
        copyText(copyButton.dataset.copyTarget);
        return;
      }

      const answerButton = event.target.closest('[data-answer]');
      if (answerButton) {
        event.preventDefault();
        event.stopPropagation();
        const panel = answerButton.closest('[data-quiz]');
        panel.querySelectorAll('[data-answer]').forEach(button => button.classList.remove('correct', 'incorrect'));
        const correct = answerButton.dataset.answer === '1';
        answerButton.classList.add(correct ? 'correct' : 'incorrect');
        panel.querySelector('.quiz-feedback').textContent = correct
          ? '정답! 목표와 독자가 정해지면 내용·톤·구조를 설계할 수 있습니다.'
          : '다시 생각해 보세요. 표현과 분량보다 먼저 “왜, 누구에게”를 정해야 합니다.';
      }
    });

    document.addEventListener('change', event => {
      if (event.target.matches('[data-plan]')) savePlan(event.target);
    });
  }

  function boot() {
    if (totalPages !== 10) console.warn(`교재 페이지 수가 10이 아닙니다: ${totalPages}`);
    buildContents();
    initSavedPlan();
    initEvents();

    try {
      const savedMotion = localStorage.getItem('copilot-field-guide-reduced-motion');
      if (savedMotion !== null) reducedMotion = savedMotion === 'true';
    } catch (_) { /* noop */ }
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    motionToggle.setAttribute('aria-pressed', String(reducedMotion));
    motionToggle.querySelector('.desktop-label').textContent = reducedMotion ? '모션 켜기' : '모션 줄이기';

    initFlipbook();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
