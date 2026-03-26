/*!
 * CrewPoint — crewpoint.ru
 * Copyright (c) 2024-2025. All rights reserved.
 */
(function() {
'use strict';

// ── Helpers ──
var $ = function(sel, ctx) { return (ctx || document).querySelector(sel); };
var $$ = function(sel, ctx) { return (ctx || document).querySelectorAll(sel); };
var getChipValue = function(id) {
    var a = $('#' + id + ' .chip.active');
    return a ? parseInt(a.dataset.value) : 0;
};
var formatRub = function(n) { return n.toLocaleString('ru-RU') + ' ₽'; };
var setText = function(id, text) { var el = $('#' + id); if (el) el.textContent = text; };

// ── Constants ──
var MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
var MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

// ── Cached DOM ──
var header         = $('#header');
var floatingCta    = $('#floatingCta');
var contactTrigger = $('#contactTrigger');
var mobileMenu     = $('#mobileMenu');
var sheet          = $('#sheet');
var sheetOverlay   = $('#sheetOverlay');

// ── State ──
var ticking = false;


// ══════════════════════════════════════
// SCROLL
// ══════════════════════════════════════
window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
        var y = window.scrollY;
        if (header)         header.classList.toggle('scrolled', y > 80);
        if (floatingCta)    floatingCta.classList.toggle('visible', y > 600);
        if (contactTrigger) contactTrigger.classList.toggle('visible', y > 400);
        ticking = false;
    });
});


// ══════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════
function toggleMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

var burgerBtn   = $('#burgerBtn');
var mobileClose = $('#mobileClose');
if (burgerBtn)   burgerBtn.addEventListener('click', toggleMenu);
if (mobileClose) mobileClose.addEventListener('click', toggleMenu);

if (mobileMenu) {
    $$('a', mobileMenu).forEach(function(link) {
        link.addEventListener('click', toggleMenu);
    });
}


// ══════════════════════════════════════
// FAQ
// ══════════════════════════════════════
var faqList = $('#faqList');
if (faqList) {
    faqList.addEventListener('click', function(e) {
        var btn = e.target.closest('.faq-q');
        if (!btn) return;
        var item = btn.parentElement;
        var wasActive = item.classList.contains('active');
        $$('.faq-item', faqList).forEach(function(el) { el.classList.remove('active'); });
        if (!wasActive) item.classList.add('active');
    });
}


// ══════════════════════════════════════
// PRICING TABS
// ══════════════════════════════════════
var pricingTabs = $('#pricingTabs');
if (pricingTabs) {
    pricingTabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.pricing-tab');
        if (!tab) return;
        $$('.pricing-tab', pricingTabs).forEach(function(t) { t.classList.remove('active'); });
        $$('.pricing-panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panelId = tab.dataset.tab === 'newbie' ? 'panelNewbie' : 'panelExperienced';
        var panel = $('#' + panelId);
        if (panel) panel.classList.add('active');
    });
}


// ══════════════════════════════════════
// CALCULATOR
// ══════════════════════════════════════
function activatePackageChip(value) {
    var chip = $('#chipPackage [data-value="' + value + '"]');
    if (!chip) return;
    $$('.chip', chip.parentElement).forEach(function(c) { c.classList.remove('active'); });
    chip.classList.add('active');
    updateSalaryAccess();
    updateMonthsAccess();
    updateFlightAccess();
    calculateFromChips();
}

$$('.chip-group').forEach(function(group) {
    group.addEventListener('click', function(e) {
        var chip = e.target.closest('.chip');
        if (!chip || chip.classList.contains('locked-chip') || chip.classList.contains('disabled')) return;
        $$('.chip', group).forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        if (group.id === 'chipPackage') {
            updateSalaryAccess();
            updateMonthsAccess();
            updateFlightAccess();
        }
        calculateFromChips();
    });
});

var selectProCta = $('#selectProCta');
if (selectProCta) {
    selectProCta.addEventListener('click', function() { activatePackageChip(120000); });
}

var flightWarningEl = $('#flightWarning');
if (flightWarningEl) {
    flightWarningEl.addEventListener('click', function(e) {
        if (e.target.classList.contains('warn-cta')) activatePackageChip(120000);
    });
}

function lockChips(groupId, allowed) {
    var group = $('#' + groupId);
    if (!group) return false;
    var activeChip = $('.chip.active', group);
    var activeVal  = activeChip ? parseInt(activeChip.dataset.value) : 0;
    var needReset  = false;
    $$('.chip', group).forEach(function(c) {
        var val = parseInt(c.dataset.value);
        if (!allowed.length || allowed.indexOf(val) === -1) {
            c.classList.add('locked-chip');
            if (val === activeVal) { needReset = true; c.classList.remove('active'); }
        } else {
            c.classList.remove('locked-chip');
        }
    });
    return needReset;
}

function updateSalaryAccess() {
    var pkg = getChipValue('chipPackage');
    var map = { 55000: [], 120000: [100000,150000], 240000: [100000,150000,200000], 270000: [100000,150000,300000,500000] };
    var allowed = map[pkg] || [100000,150000];
    if (lockChips('chipSalary', allowed) && allowed.length) {
        var fb = $('#chipSalary [data-value="150000"]');
        if (fb) fb.classList.add('active');
    }
}

function updateMonthsAccess() {
    var pkg = getChipValue('chipPackage');
    var map = { 55000: [], 270000: [3,4,6] };
    var allowed = map[pkg] || [3,4,6,9];
    if (lockChips('chipMonths', allowed) && allowed.length) {
        var fb = $('#chipMonths [data-value="6"]');
        if (fb) fb.classList.add('active');
    }
}

function updateFlightAccess() {
    var flightGroup = $('#chipFlights');
    var warning     = $('#flightWarning');
    if (!flightGroup || !warning) return;
    var pkg = getChipValue('chipPackage');

    if (pkg === 240000) {
        flightGroup.classList.remove('locked');
        warning.classList.remove('show');
        warning.innerHTML = '';
        return;
    }

    flightGroup.classList.add('locked');
    $$('.chip', flightGroup).forEach(function(c) { c.classList.remove('active'); });
    var zero = $('[data-value="0"]', flightGroup);
    if (zero) zero.classList.add('active');

    if (pkg === 55000) {
        warning.classList.remove('show');
        warning.innerHTML = '';
    } else {
        var isCrab     = pkg === 270000;
        var flightCost = isCrab ? '-60 000' : '-80 000';
        var reason     = isCrab ? 'перелёт Камчатка' : 'перелёт Владивосток';
        warning.classList.add('show');
        warning.innerHTML =
            '<p>Без повышения квалификации вы тратите <span class="warn-highlight">' + flightCost + ' \u20BD/год</span> на ' + reason +
            '. Это расходы которые другие компании вам не озвучат заранее. ' +
            '<span class="warn-cta">Выбрать Карьера PRO и забыть про Владивосток \u2192</span></p>';
    }
}

function calculateFromChips() {
    var pkg       = getChipValue('chipPackage');
    var resultEl  = $('.calc-result');
    var noCalcMsg = $('#calcNoResult');

    if (!resultEl && !noCalcMsg) return; // calculator not on this page

    if (pkg === 55000) {
        if (resultEl)  resultEl.style.display  = 'none';
        if (noCalcMsg) noCalcMsg.style.display = 'block';
        return;
    }
    if (resultEl)  resultEl.style.display  = '';
    if (noCalcMsg) noCalcMsg.style.display = 'none';

    var salary     = getChipValue('chipSalary');
    var months     = getChipValue('chipMonths');
    var flights    = getChipValue('chipFlights');
    var hasEconomy = pkg === 240000;
    var flightLoss = 0;

    if (!hasEconomy) {
        flightLoss = pkg === 270000 ? 60000 : 80000;
        flights = 0;
    }

    var earnings = salary * months;
    var profit   = earnings - pkg + flights - flightLoss;
    var roi      = pkg > 0 ? Math.round((profit / pkg) * 100) : 0;

    setText('calcInvestment', formatRub(pkg));
    setText('calcEarnings',   formatRub(earnings));
    setText('calcProfit',     formatRub(profit));

    var savingsRow = $('#calcSavingsRow');
    var lossRow    = $('#calcLossRow');

    if (hasEconomy) {
        if (savingsRow) savingsRow.style.display = '';
        setText('calcSavings', formatRub(flights));
        if (lossRow) lossRow.style.display = 'none';
    } else {
        if (savingsRow) savingsRow.style.display = 'none';
        if (lossRow) {
            lossRow.style.display = '';
            setText('calcLoss', '-' + flightLoss.toLocaleString('ru-RU') + ' \u20BD/год');
        }
    }
    updateRoiGauge(roi);
}


// ══════════════════════════════════════
// ROI GAUGE
// ══════════════════════════════════════
function updateRoiGauge(percent) {
    var clamped = Math.min(Math.max(percent, 0), 1000);
    var ratio   = (clamped / 1000) * 100;
    setText('roiGaugeValue', percent + '%');
    setText('roiMarkerText', percent + '%');
    setTimeout(function() {
        var fill   = $('#roiGaugeFill');
        var marker = $('#roiGaugeMarker');
        var tick   = $('#roiGaugeTick');
        if (fill)   fill.style.height   = ratio + '%';
        if (marker) marker.style.bottom = ratio + '%';
        if (tick)   tick.style.bottom   = ratio + '%';
    }, 50);
}


// ══════════════════════════════════════
// FORM
// ══════════════════════════════════════
var formSubmitBtn = $('#formSubmitBtn');
if (formSubmitBtn) {
    formSubmitBtn.addEventListener('click', function() {
        var name  = $('#formName');
        var phone = $('#formPhone');
        if (!name.value.trim())  { name.style.borderColor  = 'var(--red)'; name.focus();  return; }
        if (!phone.value.trim() || phone.value.length < 7) { phone.style.borderColor = 'var(--red)'; phone.focus(); return; }
        $('#ctaForm').style.display = 'none';
        $('#formSuccess').classList.add('show');
    });
}

$$('#ctaForm input').forEach(function(input) {
    input.addEventListener('focus', function() { input.style.borderColor = 'var(--border-subtle)'; });
});

function applyPhoneMask(el) {
    if (!el) return;
    el.addEventListener('input', function(e) {
        var v = e.target.value.replace(/\D/g, '');
        if (!v.length || (v[0] !== '7' && v[0] !== '8')) return;
        var f = '+7';
        if (v.length > 1)  f += ' (' + v.substring(1, 4);
        if (v.length > 4)  f += ') ' + v.substring(4, 7);
        if (v.length > 7)  f += '-' + v.substring(7, 9);
        if (v.length > 9)  f += '-' + v.substring(9, 11);
        e.target.value = f;
    });
}
applyPhoneMask($('#formPhone'));


// ══════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════
function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
        els.forEach(function(e) { e.classList.add('visible'); });
        return;
    }
    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
            if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
        });
    }, { threshold: 0.01 });
    els.forEach(function(e) { obs.observe(e); });
    setTimeout(function() {
        els.forEach(function(e) { if (!e.classList.contains('visible')) e.classList.add('visible'); });
    }, 4000);
}


// ══════════════════════════════════════
// COHORTS
// ══════════════════════════════════════
function renderCohorts() {
    var curEl  = $('#cohortCurrent');
    var nextEl = $('#cohortNext');
    if (!curEl || !nextEl) return;

    var now = new Date();
    var m   = now.getMonth();
    var y   = now.getFullYear();
    var dom = now.getDate();

    var phaseLabel, phaseDot, fillPct, phaseText, isClosing;

    if (dom <= 10) {
        phaseLabel = 'Набор открыт';    phaseDot = 'green';  fillPct = 20; phaseText = 'Принимаем новых клиентов';               isClosing = false;
    } else if (dom <= 22) {
        phaseLabel = 'Набор идёт';       phaseDot = 'green';  fillPct = 50; phaseText = 'Есть свободные места — не откладывайте'; isClosing = false;
    } else {
        phaseLabel = 'Набор завершается'; phaseDot = 'orange'; fillPct = 80; phaseText = 'Остались последние места на этот месяц'; isClosing = true;
    }

    curEl.className = 'cohort-card' + (isClosing ? ' cohort-card--hot' : '');
    curEl.innerHTML =
        '<div class="cohort-label cohort-label--' + (isClosing ? 'hot' : 'open') + '">' + phaseLabel + '</div>' +
        '<div class="cohort-title">' + MONTHS_NOM[m] + ' ' + y + '</div>' +
        '<div class="cohort-bar"><div class="cohort-fill cohort-fill--' + (isClosing ? 'hot' : 'open') + '" style="width:' + fillPct + '%"></div></div>' +
        '<div class="cohort-phase"><span class="cohort-phase-dot cohort-phase-dot--' + phaseDot + '"></span> ' + phaseText + '</div>';

    var nextM = (m + 1) % 12;
    var nextY = m === 11 ? y + 1 : y;
    nextEl.className = 'cohort-card';
    nextEl.innerHTML =
        '<div class="cohort-label cohort-label--open">Предварительная запись</div>' +
        '<div class="cohort-title">' + MONTHS_NOM[nextM] + ' ' + nextY + '</div>' +
        '<div class="cohort-bar"><div class="cohort-fill cohort-fill--open" style="width:8%"></div></div>' +
        '<div class="cohort-phase"><span class="cohort-phase-dot cohort-phase-dot--blue"></span> Запишитесь заранее — гарантия места</div>';
}


// ══════════════════════════════════════
// SEASON TIMER
// ══════════════════════════════════════
function getNextPutinaStart() {
    var now = new Date();
    var y   = now.getFullYear();
    var dates = [new Date(y, 0, 15), new Date(y, 8, 1), new Date(y + 1, 0, 15)];
    for (var i = 0; i < dates.length; i++) {
        if (dates[i] > now) return dates[i];
    }
    return dates[dates.length - 1];
}

function renderSeasonTimer() {
    var box = $('#seasonBox');
    if (!box) return;

    var target  = getNextPutinaStart();
    var now     = new Date();
    var diff    = Math.max(0, target.getTime() - now.getTime());
    var days    = Math.floor(diff / 864e5);
    var hours   = Math.floor((diff % 864e5) / 36e5);
    var mins    = Math.floor((diff % 36e5) / 6e4);
    var dateStr = target.getDate() + ' ' + MONTHS_GEN[target.getMonth()] + ' ' + target.getFullYear();

    var prepAdvice;
    if      (days > 90) prepAdvice = 'Есть время подготовиться — но лучше начать сейчас';
    else if (days > 60) prepAdvice = 'Осталось достаточно времени, но не откладывайте';
    else if (days > 30) prepAdvice = 'Время на исходе — документы + ценз занимают минимум 2 месяца';
    else                prepAdvice = 'К этой путине уже сложно успеть — запишитесь на следующую';

    box.innerHTML =
        '<span class="season-icon">\uD83E\uDD80</span>' +
        '<div class="season-title">Крабовая путина стартует ' + dateStr + '</div>' +
        '<div class="season-subtitle">Подготовка документов + первый рейс для ценза = начните заранее</div>' +
        '<div class="season-countdown">' +
            '<div class="season-unit"><span class="season-num">' + days  + '</span><span class="season-lbl">дней</span></div>' +
            '<div class="season-unit"><span class="season-num">' + hours + '</span><span class="season-lbl">часов</span></div>' +
            '<div class="season-unit"><span class="season-num">' + mins  + '</span><span class="season-lbl">минут</span></div>' +
        '</div>' +
        '<div class="season-tip"><strong>' + days + '</strong> дней до старта. ' + prepAdvice + '.</div>';
}


// ══════════════════════════════════════
// CONTACT BOTTOM SHEET
// ══════════════════════════════════════
function openSheet() {
    if (!sheet || !sheetOverlay) return;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    sheetOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSheet() {
    if (!sheet || !sheetOverlay) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    sheetOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

var openSheetBtn = $('#openSheetBtn');
if (openSheetBtn) openSheetBtn.addEventListener('click', openSheet);
if (sheetOverlay) sheetOverlay.addEventListener('click', closeSheet);

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && sheet && sheet.classList.contains('open')) closeSheet();
});

if (sheet) {
    var startY = 0, curY = 0, dragging = false;
    sheet.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY; dragging = true;
    }, { passive: true });
    sheet.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        curY = e.touches[0].clientY;
        var diff = curY - startY;
        if (diff > 0) { sheet.style.transform = 'translateY(' + diff + 'px)'; sheet.style.transition = 'none'; }
    }, { passive: true });
    sheet.addEventListener('touchend', function() {
        if (!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        sheet.style.transform  = '';
        if (curY - startY > 80) closeSheet();
        curY = startY = 0;
    }, { passive: true });
}


// ══════════════════════════════════════
// CLIPBOARD & TOAST
// ══════════════════════════════════════
function showToast(msg) {
    var t = $('#sheetToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    return ok;
}

function copyToClipboard(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(function()  { if (msg) showToast(msg); })
            .catch(function() { if (fallbackCopy(text) && msg) showToast(msg); });
    } else {
        if (fallbackCopy(text) && msg) showToast(msg);
        else if (msg) showToast('Не удалось скопировать');
    }
}

$$('.sheet-util-btn[data-copy]').forEach(function(btn) {
    btn.addEventListener('click', function() {
        copyToClipboard(btn.dataset.copy, btn.dataset.toast);
    });
});


// ══════════════════════════════════════
// REFERRAL
// ══════════════════════════════════════
(function() {
    var mainToggle    = $('#referralMainToggle');
    var hiddenContent = $('#referralHiddenContent');
    var condToggle    = $('#referralConditionsToggle');
    var conditions    = $('#referralConditions');
    var shareBtn      = $('#referralShareBtn');

    if (!mainToggle || !hiddenContent) return;

    mainToggle.addEventListener('click', function() {
        mainToggle.classList.toggle('active');
        hiddenContent.classList.toggle('open');
        mainToggle.querySelector('span').textContent =
            hiddenContent.classList.contains('open') ? 'Свернуть' : 'Подробнее';
    });

    if (condToggle && conditions) {
        condToggle.addEventListener('click', function() {
            condToggle.classList.toggle('active');
            conditions.classList.toggle('open');
        });
    }

    if (!shareBtn) return;

    var brochureUrl      = 'assets/images/crewpoint-brochure.png';
    var shareText        = 'Карьера в море за 1 месяц. Документы за 14 дней, подбор контракта, зарплата от 150 000 ₽/мес. Мне помогли — рекомендую.';
    var shareUrl         = 'https://crewpoint.ru';
    var shareBtnOrigHTML = shareBtn.innerHTML;

    shareBtn.addEventListener('click', function() {
        if (navigator.share) {
            tryShareWithFile();
        } else {
            copyToClipboard(shareText + '\n' + shareUrl);
            showShareFeedback();
        }
    });

    function tryShareWithFile() {
        fetch(brochureUrl)
            .then(function(r) { if (!r.ok) throw new Error(); return r.blob(); })
            .then(function(blob) {
                var file = new File([blob], 'CrewPoint-буклет.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    return navigator.share({ text: shareText, url: shareUrl, files: [file] });
                }
                return shareTextOnly();
            })
            .catch(function(err) {
                if (err.name !== 'AbortError') shareTextOnly();
            });
    }

    function shareTextOnly() {
        return navigator.share({ title: 'CrewPoint — карьера в море', text: shareText, url: shareUrl })
            .catch(function() {});
    }

    function showShareFeedback() {
        shareBtn.innerHTML        = '✓ Ссылка скопирована';
        shareBtn.style.background = '#4caf50';
        shareBtn.style.color      = '#fff';
        setTimeout(function() {
            shareBtn.innerHTML        = shareBtnOrigHTML;
            shareBtn.style.background = '';
            shareBtn.style.color      = '';
        }, 2000);
    }
})();


// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
function init() {
    initReveal();
    renderCohorts();
    renderSeasonTimer();
    calculateFromChips();
    setInterval(renderSeasonTimer, 60000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('load', function() {
    $$('.reveal').forEach(function(e) {
        if (!e.classList.contains('visible')) e.classList.add('visible');
    });
});

})();