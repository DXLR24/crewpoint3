/*!
 * CrewPoint — crewpoint.ru
 * Copyright (c) 2024-2025. All rights reserved.
 */
(function(){
'use strict';

// ── Helpers ──

var $=function(sel,ctx){return(ctx||document).querySelector(sel);},$$=function(sel,ctx){return(ctx||document).querySelectorAll(sel);},getChipValue=function(id){var a=$('#'+id+' .chip.active');return a?parseInt(a.dataset.value):0;},formatRub=function(n){return n.toLocaleString('ru-RU')+' ₽';},setText=function(id,text){var el=$('#'+id);if(el)el.textContent=text;};

// ── Constants ──

var MONTHS_NOM=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],MONTHS_GEN=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

// ── Cached DOM ──

var header=$('#header'),floatingCta=$('#floatingCta'),floatingB2B=$('#floatingB2B'),contactTrigger=$('#contactTrigger'),mobileMenu=$('#mobileMenu'),sheet=$('#sheet'),sheetOverlay=$('#sheetOverlay'),stickyBar=$('#stickyBar'),formSection=$('#form');

// ── State ──

var ticking=false;

// ══════════════════════════════════════
// SCROLL LOCK (ПРЕДОТВРАЩЕНИЕ СДВИГА МАКЕТА)
// ══════════════════════════════════════

var scrollLocks=0;
function getScrollbarWidth(){return window.innerWidth-document.documentElement.clientWidth;}
function lockScroll(){if(scrollLocks===0){var scrollbarWidth=getScrollbarWidth();if(scrollbarWidth>0){var pad=scrollbarWidth+'px';document.body.style.paddingRight=pad;if(header)header.style.paddingRight=pad;if(stickyBar)stickyBar.style.paddingRight=pad;if(floatingCta)floatingCta.style.paddingRight=pad;if(floatingB2B)floatingB2B.style.paddingRight=pad;if(contactTrigger)contactTrigger.style.paddingRight=pad;}document.body.style.overflow='hidden';}scrollLocks++;}
function unlockScroll(){scrollLocks--;if(scrollLocks<=0){scrollLocks=0;document.body.style.paddingRight='';if(header)header.style.paddingRight='';if(stickyBar)stickyBar.style.paddingRight='';if(floatingCta)floatingCta.style.paddingRight='';if(floatingB2B)floatingB2B.style.paddingRight='';if(contactTrigger)contactTrigger.style.paddingRight='';document.body.style.overflow='';}}

// ══════════════════════════════════════
// SCROLL
// ══════════════════════════════════════

window.addEventListener('scroll',function(){if(ticking)return;ticking=true;requestAnimationFrame(function(){var y=window.scrollY;if(header)header.classList.toggle('scrolled',y>80);if(floatingCta)floatingCta.classList.toggle('visible',y>600);if(contactTrigger)contactTrigger.classList.toggle('visible',y>400);if(floatingB2B)floatingB2B.classList.toggle('hidden',y>500);if(stickyBar){var show=y>400;if(show&&formSection){var rect=formSection.getBoundingClientRect();if(rect.top<window.innerHeight&&rect.bottom>0)show=false;}stickyBar.classList.toggle('visible',show);}ticking=false;});});

// ══════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════

function toggleMenu(){if(!mobileMenu)return;mobileMenu.classList.toggle('active');var isOpen=mobileMenu.classList.contains('active');if(isOpen)lockScroll();else unlockScroll();if(burgerBtn){burgerBtn.classList.toggle('active',isOpen);burgerBtn.setAttribute('aria-expanded',isOpen);burgerBtn.setAttribute('aria-label',isOpen?'Закрыть меню':'Открыть меню');}}
var burgerBtn=$('#burgerBtn'),mobileClose=$('#mobileClose'),stickyContactBtn=$('#stickyContact');
if(burgerBtn)burgerBtn.addEventListener('click',toggleMenu);
if(mobileClose)mobileClose.addEventListener('click',toggleMenu);
if(stickyContactBtn)stickyContactBtn.addEventListener('click',openSheet);
if(mobileMenu)$$('a',mobileMenu).forEach(function(link){link.addEventListener('click',toggleMenu);});

// ══════════════════════════════════════
// FAQ
// ══════════════════════════════════════

var faqList=$('#faqList');
if(faqList)faqList.addEventListener('click',function(e){var btn=e.target.closest('.faq-q');if(!btn)return;var item=btn.parentElement,wasActive=item.classList.contains('active');$$('.faq-item',faqList).forEach(function(el){el.classList.remove('active');});if(!wasActive)item.classList.add('active');});

// ══════════════════════════════════════
// PRICING TABS
// ══════════════════════════════════════

var pricingTabs=$('#pricingTabs');
if(pricingTabs)pricingTabs.addEventListener('click',function(e){var tab=e.target.closest('.pricing-tab');if(!tab)return;$$('.pricing-tab',pricingTabs).forEach(function(t){t.classList.remove('active');});$$('.pricing-panel').forEach(function(p){p.classList.remove('active');});tab.classList.add('active');var panel=$('#'+(tab.dataset.tab==='newbie'?'panelNewbie':'panelExperienced'));if(panel)panel.classList.add('active');});

// ══════════════════════════════════════
// CALCULATOR
// ══════════════════════════════════════

function activatePackageChip(value){var chip=$('#chipPackage [data-value="'+value+'"]');if(!chip)return;$$('.chip',chip.parentElement).forEach(function(c){c.classList.remove('active');});chip.classList.add('active');updateSalaryAccess();updateMonthsAccess();updateFlightAccess();calculateFromChips();}
$$('.chip-group').forEach(function(group){group.addEventListener('click',function(e){var chip=e.target.closest('.chip');if(!chip||chip.classList.contains('locked-chip')||chip.classList.contains('disabled'))return;$$('.chip',group).forEach(function(c){c.classList.remove('active');});chip.classList.add('active');if(group.id==='chipPackage'){updateSalaryAccess();updateMonthsAccess();updateFlightAccess();}calculateFromChips();});});
var selectProCta=$('#selectProCta');if(selectProCta)selectProCta.addEventListener('click',function(){activatePackageChip(120000);});
var flightWarningEl=$('#flightWarning');if(flightWarningEl)flightWarningEl.addEventListener('click',function(e){if(e.target.classList.contains('warn-cta'))activatePackageChip(120000);});
function lockChips(groupId,allowed){var group=$('#'+groupId);if(!group)return false;var activeChip=$('.chip.active',group),activeVal=activeChip?parseInt(activeChip.dataset.value):0,needReset=false;$$('.chip',group).forEach(function(c){var val=parseInt(c.dataset.value);if(!allowed.length||allowed.indexOf(val)===-1){c.classList.add('locked-chip');if(val===activeVal){needReset=true;c.classList.remove('active');}}else c.classList.remove('locked-chip');});return needReset;}
function updateSalaryAccess(){var pkg=getChipValue('chipPackage'),map={55000:[],120000:[100000,150000],240000:[100000,150000,200000],270000:[100000,150000,300000,500000]},allowed=map[pkg]||[100000,150000];if(lockChips('chipSalary',allowed)&&allowed.length){var fb=$('#chipSalary [data-value="150000"]');if(fb)fb.classList.add('active');}}
function updateMonthsAccess(){var pkg=getChipValue('chipPackage'),map={55000:[],270000:[3,4,6]},allowed=map[pkg]||[3,4,6,9];if(lockChips('chipMonths',allowed)&&allowed.length){var fb=$('#chipMonths [data-value="6"]');if(fb)fb.classList.add('active');}}
function updateFlightAccess(){var flightGroup=$('#chipFlights'),warning=$('#flightWarning');if(!flightGroup||!warning)return;var pkg=getChipValue('chipPackage');if(pkg===240000){flightGroup.classList.remove('locked');warning.classList.remove('show');warning.innerHTML='';return;}flightGroup.classList.add('locked');$$('.chip',flightGroup).forEach(function(c){c.classList.remove('active');});var zero=$('[data-value="0"]',flightGroup);if(zero)zero.classList.add('active');if(pkg===55000){warning.classList.remove('show');warning.innerHTML='';}else{var isCrab=pkg===270000,flightCost=isCrab?'-60 000':'-80 000',reason=isCrab?'перелёт Камчатка':'перелёт Владивосток';warning.classList.add('show');warning.innerHTML='<p>Без повышения квалификации вы тратите <span class="warn-highlight">'+flightCost+' \u20BD/год</span> на '+reason+'. Это расходы которые другие компании вам не озвучат заранее. <span class="warn-cta">Выбрать Карьера PRO и забыть про Владивосток \u2192</span></p>';}}
function calculateFromChips(){
    var pkg=getChipValue('chipPackage'),resultEl=$('.calc-result'),noCalcMsg=$('#calcNoResult');if(!resultEl&&!noCalcMsg)return;
    if(pkg===55000){if(resultEl)resultEl.style.display='none';if(noCalcMsg)noCalcMsg.style.display='block';return;}
    if(resultEl)resultEl.style.display='';if(noCalcMsg)noCalcMsg.style.display='none';
    var salary=getChipValue('chipSalary'),months=getChipValue('chipMonths'),flights=getChipValue('chipFlights'),hasEconomy=pkg===240000,flightLoss=0;
    if(!hasEconomy){flightLoss=pkg===270000?60000:80000;flights=0;}
    var earnings=salary*months,profit=earnings-pkg+flights-flightLoss,roi=pkg>0?Math.round((profit/pkg)*100):0;
    setText('calcInvestment',formatRub(pkg));setText('calcEarnings',formatRub(earnings));setText('calcProfit',formatRub(profit));
    var savingsRow=$('#calcSavingsRow'),lossRow=$('#calcLossRow');
    if(hasEconomy){if(savingsRow)savingsRow.style.display='';setText('calcSavings',formatRub(flights));if(lossRow)lossRow.style.display='none';}
    else{if(savingsRow)savingsRow.style.display='none';if(lossRow){lossRow.style.display='';setText('calcLoss','-'+flightLoss.toLocaleString('ru-RU')+' \u20BD/год');}}
    updateRoiGauge(roi);
}

// ══════════════════════════════════════
// ROI GAUGE
// ══════════════════════════════════════

function updateRoiGauge(percent){var clamped=Math.min(Math.max(percent,0),1000),ratio=(clamped/1000)*100;setText('roiGaugeValue',percent+'%');setText('roiMarkerText',percent+'%');setTimeout(function(){var fill=$('#roiGaugeFill'),marker=$('#roiGaugeMarker'),tick=$('#roiGaugeTick');if(fill)fill.style.height=ratio+'%';if(marker)marker.style.bottom=ratio+'%';if(tick)tick.style.bottom=ratio+'%';},50);}

// ══════════════════════════════════════
// FORM → TELEGRAM (через Cloudflare Worker)
// ══════════════════════════════════════

var FORM_PROXY_URL='https://crewpoint-form.pubgdix.workers.dev';

function showFormError(){
    var form=$('#ctaForm');if(!form)return;
    var existing=$('#formError');if(existing){existing.style.display='block';return;}
    var errorEl=document.createElement('div');
    errorEl.id='formError';
    errorEl.style.cssText='margin-top:16px;padding:20px 24px;background:rgba(229,83,75,0.06);border:1px solid rgba(229,83,75,0.2);border-radius:12px;text-align:center';
    errorEl.innerHTML='<p style="font-size:.9rem;color:var(--red);font-weight:600;margin-bottom:12px">⚠ Не удалось отправить заявку — проблемы с сетью</p><p style="font-size:.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px">Напишите нам напрямую — ответим за 5 минут:</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a href="https://wa.me/79952337540" target="_blank" rel="noopener noreferrer" style="padding:12px 20px;background:#25D366;color:#fff;border-radius:8px;font-weight:600;font-size:.85rem;text-decoration:none">📱 WhatsApp</a><a href="https://t.me/crewpoint" target="_blank" rel="noopener noreferrer" style="padding:12px 20px;background:#2AABEE;color:#fff;border-radius:8px;font-weight:600;font-size:.85rem;text-decoration:none">✈ Telegram</a><a href="tel:+79952337540" style="padding:12px 20px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;font-weight:600;font-size:.85rem;text-decoration:none">📞 +7 (995) 233-75-40</a></div>';
    form.appendChild(errorEl);
}

var formSubmitBtn=$('#formSubmitBtn');
if(formSubmitBtn){
    formSubmitBtn.addEventListener('click',function(){
        var name=$('#formName'),phone=$('#formPhone'),pkg=$('#formPackage'),city=$('#formCity');
        if(!name.value.trim()){name.style.borderColor='var(--red)';name.focus();return;}
        var cleanPhone=phone.value.replace(/\D/g,'');
        if(cleanPhone.length!==11){phone.style.borderColor='var(--red)';phone.focus();return;}
        formSubmitBtn.disabled=true;formSubmitBtn.textContent='Отправка...';
        var packageNames={'docs':'Сопровождение (Документы) — 55 000 ₽','start':'Старт карьеры — 120 000 ₽','pro':'Карьера PRO — 240 000 ₽','upgrade':'Повышение до вахтенного — 120 000 ₽','crab':'Краболовный флот — 150 000 ₽','global':'Международный флот (под флагом)','unsure':'Пока не определился'};
        var now=new Date(),time=now.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),page=window.location.pathname.includes('details')?'details.html':'index.html';
        fetch(FORM_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.value.trim(),phone:phone.value.trim(),package:packageNames[pkg.value]||'Не выбран',city:city.value.trim()||'Не указан',page:page,time:time})})
        .then(function(response){
            if(response.ok){$('#ctaForm').style.display='none';$('#formSuccess').classList.add('show');}
            else throw new Error('Server error '+response.status);
        })
        .catch(function(error){
            console.error('Form send error:',error);
            formSubmitBtn.disabled=false;formSubmitBtn.textContent='Получить консультацию →';
            showFormError();
        });
    });
}
$$('#ctaForm input').forEach(function(input){input.addEventListener('focus',function(){input.style.borderColor='var(--border-subtle)';});input.addEventListener('input',function(){input.style.borderColor='var(--border-subtle)';});});
function applyPhoneMask(el){if(!el)return;function formatPhone(e){var v=e.target.value.replace(/\D/g,'');if(!v.length)return;if(v[0]==='8')v='7'+v.substring(1);if(v[0]!=='7')v='7'+v;var f='+7';if(v.length>1)f+=' ('+v.substring(1,4);if(v.length>4)f+=') '+v.substring(4,7);if(v.length>7)f+='-'+v.substring(7,9);if(v.length>9)f+='-'+v.substring(9,11);e.target.value=f;}el.addEventListener('input',formatPhone);el.addEventListener('paste',function(e){setTimeout(function(){el.dispatchEvent(new Event('input'));},0);});}
applyPhoneMask($('#formPhone'));

// ══════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════

function initReveal(){var els=$$('.reveal');if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('visible');});return;}var obs=new IntersectionObserver(function(entries){entries.forEach(function(en){if(en.isIntersecting){en.target.classList.add('visible');obs.unobserve(en.target);}});},{threshold:0.01});els.forEach(function(e){obs.observe(e);});setTimeout(function(){els.forEach(function(e){if(!e.classList.contains('visible'))e.classList.add('visible');});},4000);}

// ══════════════════════════════════════
// COHORTS
// ══════════════════════════════════════

function renderCohorts(){
    var curEl=$('#cohortCurrent'),nextEl=$('#cohortNext');if(!curEl||!nextEl)return;
    var now=new Date(),m=now.getMonth(),y=now.getFullYear(),dom=now.getDate(),phaseLabel,phaseDot,fillPct,phaseText,isClosing;
    if(dom<=10){phaseLabel='Набор открыт';phaseDot='green';fillPct=20;phaseText='Принимаем новых клиентов';isClosing=false;}
    else if(dom<=22){phaseLabel='Набор идёт';phaseDot='green';fillPct=50;phaseText='Есть свободные места — не откладывайте';isClosing=false;}
    else{phaseLabel='Набор завершается';phaseDot='orange';fillPct=80;phaseText='Остались последние места на этот месяц';isClosing=true;}
    curEl.className='cohort-card'+(isClosing?' cohort-card--hot':'');
    curEl.innerHTML='<div class="cohort-label cohort-label--'+(isClosing?'hot':'open')+'">'+phaseLabel+'</div><div class="cohort-title">'+MONTHS_NOM[m]+' '+y+'</div><div class="cohort-bar"><div class="cohort-fill cohort-fill--'+(isClosing?'hot':'open')+'" style="width:'+fillPct+'%"></div></div><div class="cohort-phase"><span class="cohort-phase-dot cohort-phase-dot--'+phaseDot+'"></span> '+phaseText+'</div>';
    var nextM=(m+1)%12,nextY=m===11?y+1:y;
    nextEl.className='cohort-card';
    nextEl.innerHTML='<div class="cohort-label cohort-label--open">Предварительная запись</div><div class="cohort-title">'+MONTHS_NOM[nextM]+' '+nextY+'</div><div class="cohort-bar"><div class="cohort-fill cohort-fill--open" style="width:8%"></div></div><div class="cohort-phase"><span class="cohort-phase-dot cohort-phase-dot--blue"></span> Запишитесь заранее — гарантия места</div>';
}

// ══════════════════════════════════════
// SEASON TIMER
// ══════════════════════════════════════

function getNextPutinaStart(){var now=new Date(),y=now.getFullYear(),dates=[new Date(y,0,15),new Date(y,8,1),new Date(y+1,0,15)];for(var i=0;i<dates.length;i++){if(dates[i]>now)return dates[i];}return dates[dates.length-1];}
function renderSeasonTimer(){
    var box=$('#seasonBox');if(!box)return;
    var target=getNextPutinaStart(),now=new Date(),diff=Math.max(0,target.getTime()-now.getTime()),days=Math.floor(diff/864e5),hours=Math.floor((diff%864e5)/36e5),mins=Math.floor((diff%36e5)/6e4),dateStr=target.getDate()+' '+MONTHS_GEN[target.getMonth()]+' '+target.getFullYear(),prepAdvice;
    if(days>90)prepAdvice='Есть время подготовиться — но лучше начать сейчас';else if(days>60)prepAdvice='Осталось достаточно времени, но не откладывайте';else if(days>30)prepAdvice='Время на исходе — документы + ценз занимают минимум 2 месяца';else prepAdvice='К этой путине уже сложно успеть — запишитесь на следующую';
    box.innerHTML='<span class="season-icon">\uD83E\uDD80</span><div class="season-title">Крабовая путина стартует '+dateStr+'</div><div class="season-subtitle">Подготовка документов + первый рейс для ценза = начните заранее</div><div class="season-countdown"><div class="season-unit"><span class="season-num">'+days+'</span><span class="season-lbl">дней</span></div><div class="season-unit"><span class="season-num">'+hours+'</span><span class="season-lbl">часов</span></div><div class="season-unit"><span class="season-num">'+mins+'</span><span class="season-lbl">минут</span></div></div><div class="season-tip"><strong>'+days+'</strong> дней до старта. '+prepAdvice+'.</div>';
}

// ══════════════════════════════════════
// CONTACT BOTTOM SHEET
// ══════════════════════════════════════

function openSheet(){if(!sheet||!sheetOverlay)return;sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');sheetOverlay.classList.add('active');lockScroll();if(openSheetBtn)openSheetBtn.setAttribute('aria-expanded','true');}
function closeSheet(){if(!sheet||!sheetOverlay)return;sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');sheetOverlay.classList.remove('active');unlockScroll();if(openSheetBtn)openSheetBtn.setAttribute('aria-expanded','false');}
var openSheetBtn=$('#openSheetBtn');if(openSheetBtn)openSheetBtn.addEventListener('click',openSheet);
if(sheetOverlay)sheetOverlay.addEventListener('click',closeSheet);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&sheet&&sheet.classList.contains('open'))closeSheet();});
if(sheet){var startY=0,curY=0,dragging=false;sheet.addEventListener('touchstart',function(e){startY=e.touches[0].clientY;dragging=true;},{passive:true});sheet.addEventListener('touchmove',function(e){if(!dragging)return;curY=e.touches[0].clientY;var diff=curY-startY;if(diff>0){sheet.style.transform='translateY('+diff+'px)';sheet.style.transition='none';}},{passive:true});sheet.addEventListener('touchend',function(){if(!dragging)return;dragging=false;sheet.style.transition='';sheet.style.transform='';if(curY-startY>80)closeSheet();curY=startY=0;},{passive:true});}

// ══════════════════════════════════════
// CLIPBOARD & TOAST
// ══════════════════════════════════════

function showToast(msg){var t=$('#sheetToast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2500);}
function fallbackCopy(text){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(ta);return ok;}
function copyToClipboard(text,msg){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){if(msg)showToast(msg);}).catch(function(){if(fallbackCopy(text)&&msg)showToast(msg);});else{if(fallbackCopy(text)&&msg)showToast(msg);else if(msg)showToast('Не удалось скопировать');}}
$$('.sheet-util-btn[data-copy]').forEach(function(btn){btn.addEventListener('click',function(){copyToClipboard(btn.dataset.copy,btn.dataset.toast);});});

// ══════════════════════════════════════
// REFERRAL
// ══════════════════════════════════════

(function(){
    var mainToggle=$('#referralMainToggle'),hiddenContent=$('#referralHiddenContent'),condToggle=$('#referralConditionsToggle'),conditions=$('#referralConditions'),shareBtn=$('#referralShareBtn');if(!mainToggle||!hiddenContent)return;
    mainToggle.addEventListener('click',function(){mainToggle.classList.toggle('active');hiddenContent.classList.toggle('open');mainToggle.querySelector('span').textContent=hiddenContent.classList.contains('open')?'Свернуть':'Подробнее';});
    if(condToggle&&conditions)condToggle.addEventListener('click',function(){condToggle.classList.toggle('active');conditions.classList.toggle('open');});
    if(!shareBtn)return;
    var brochureUrl='assets/images/crewpoint-brochure.png',shareText='Карьера в море за 1 месяц. Документы за 14 дней, подбор контракта, зарплата от 150 000 ₽/мес. Мне помогли — рекомендую.',shareUrl='https://dxlr24.github.io/crewpoint/',shareBtnOrigHTML=shareBtn.innerHTML;
    shareBtn.addEventListener('click',function(){if(navigator.share)tryShareWithFile();else{copyToClipboard(shareText+'\n'+shareUrl);showShareFeedback();}});
    function tryShareWithFile(){fetch(brochureUrl).then(function(r){if(!r.ok)throw new Error();return r.blob();}).then(function(blob){var file=new File([blob],'CrewPoint-буклет.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]}))return navigator.share({text:shareText,url:shareUrl,files:[file]});return shareTextOnly();}).catch(function(err){if(err.name!=='AbortError')shareTextOnly();});}
    function shareTextOnly(){return navigator.share({title:'CrewPoint — карьера в море',text:shareText,url:shareUrl}).catch(function(){});}
    function showShareFeedback(){shareBtn.innerHTML='✓ Ссылка скопирована';shareBtn.style.background='#4caf50';shareBtn.style.color='#fff';setTimeout(function(){shareBtn.innerHTML=shareBtnOrigHTML;shareBtn.style.background='';shareBtn.style.color='';},2000);}
})();

// ══════════════════════════════════════
// CURSOR GLOW
// ══════════════════════════════════════

function initGlow(){
    var isTouch='ontouchstart' in window&&!window.matchMedia('(pointer: fine)').matches;if(isTouch)return;
    var cards=$$('.p-card, .branch, .g-item, .review-card');if(!cards.length)return;
    cards.forEach(function(card){
        var pos=getComputedStyle(card).position;if(pos==='static')card.style.position='relative';
        card.classList.add('glow-card');var glow=document.createElement('div');glow.className='glow-effect';card.appendChild(glow);
        card.addEventListener('mousemove',(function(){var pending=false;return function(e){if(pending)return;pending=true;requestAnimationFrame(function(){var rect=card.getBoundingClientRect();card.style.setProperty('--glow-x',(e.clientX-rect.left)+'px');card.style.setProperty('--glow-y',(e.clientY-rect.top)+'px');pending=false;});};})());
    });
}

// ══════════════════════════════════════
// COUNTER ANIMATION
// ══════════════════════════════════════

function initCounters(){
    var stats=$$('.hero-stats .stat-value');if(!stats.length||!('IntersectionObserver' in window))return;
    var targets=[];stats.forEach(function(el){var text=el.textContent.trim(),suffix='',value=0,isFloat=false;if(text.indexOf('+')!==-1){suffix='+';value=parseInt(text.replace(/[^0-9]/g,''),10);}else if(text.indexOf('.')!==-1){isFloat=true;value=parseFloat(text);}else value=parseInt(text,10);if(!isNaN(value))targets.push({el:el,value:value,suffix:suffix,isFloat:isFloat});});
    if(!targets.length)return;var container=$('.hero-stats');if(!container)return;
    var fired=false,obs=new IntersectionObserver(function(entries){if(fired)return;entries.forEach(function(en){if(en.isIntersecting){fired=true;obs.disconnect();targets.forEach(function(t,i){t.el.textContent=t.isFloat?'0.0':'0'+t.suffix;setTimeout(function(){countUp(t);},i*200);});}});},{threshold:0.3});
    obs.observe(container);
}
function countUp(t){
    var duration=1800,startTime=performance.now();
    function tick(now){var elapsed=now-startTime,progress=Math.min(elapsed/duration,1),eased=progress===1?1:1-Math.pow(2,-10*progress),current;if(t.isFloat)current=(eased*t.value).toFixed(1);else current=Math.floor(eased*t.value);t.el.textContent=current+t.suffix;if(progress<1)requestAnimationFrame(tick);else{t.el.textContent=(t.isFloat?t.value.toFixed(1):t.value)+t.suffix;t.el.classList.add('counted');}}
    requestAnimationFrame(tick);
}

// ══════════════════════════════════════
// AMBIENT BLOBS + GLASS + MESH (FinTech)
// ══════════════════════════════════════

function initAmbientBlobs(){
    var isTouch='ontouchstart' in window&&!window.matchMedia('(pointer: fine)').matches,isMobile=window.innerWidth<=768;if(isTouch||isMobile)return;
    var configs=[
        {selector:'#career',mesh:'mesh-bg--career',blobs:[{color:'blue',drift:'2',top:'15%',left:'65%'},{color:'purple',drift:'3',top:'65%',left:'5%'},{color:'blue',drift:'4',top:'40%',left:'85%',sm:true}]},
        {selector:'#pricing',mesh:'mesh-bg--pricing',blobs:[{color:'gold',drift:'1',top:'20%',left:'75%'},{color:'blue',drift:'3',top:'70%',left:'10%'},{color:'gold',drift:'4',top:'50%',left:'50%',sm:true}]},
        {selector:'#trust',mesh:'mesh-bg--trust',blobs:[{color:'green',drift:'2',top:'10%',left:'20%'},{color:'blue',drift:'1',top:'60%',left:'75%'}]},
        {selector:'#reviews',mesh:'mesh-bg--reviews',blobs:[{color:'gold',drift:'3',top:'25%',left:'60%'},{color:'purple',drift:'4',top:'70%',left:'15%',sm:true}]},
        {selector:'#career-paths',blobs:[{color:'blue',drift:'1',top:'15%',left:'60%'},{color:'purple',drift:'3',top:'70%',left:'20%'}]},
        {selector:'#path-comfort',blobs:[{color:'blue',drift:'2',top:'25%',left:'70%'},{color:'blue',drift:'4',top:'60%',left:'15%',sm:true}]},
        {selector:'#path-capital',blobs:[{color:'orange',drift:'3',top:'20%',left:'10%'},{color:'orange',drift:'1',top:'65%',left:'75%',sm:true}]},
        {selector:'#path-global',blobs:[{color:'cyan',drift:'1',top:'15%',left:'65%'},{color:'cyan',drift:'4',top:'60%',left:'20%',sm:true}]},
        {selector:'#calc',blobs:[{color:'gold',drift:'2',top:'30%',left:'75%'},{color:'blue',drift:'3',top:'60%',left:'10%',sm:true}]},
        {selector:'#faq',blobs:[{color:'purple',drift:'4',top:'20%',left:'70%',sm:true},{color:'gold',drift:'1',top:'60%',left:'15%',sm:true}]}
    ];
    var ctaSections=$$('.cta');if(ctaSections.length)ctaSections.forEach(function(section){configs.push({el:section,mesh:'mesh-bg--cta',blobs:[{color:'gold',drift:'2',top:'30%',left:'50%'},{color:'gold',drift:'4',top:'60%',left:'30%',sm:true}]});});
    var problemsSections=$$('.bg-navy');if(problemsSections.length&&problemsSections[0])configs.push({el:problemsSections[0],mesh:'mesh-bg--hero-problems',blobs:[{color:'blue',drift:'3',top:'30%',left:'70%',sm:true}]});
    configs.forEach(function(config){var section=config.el||$(config.selector);if(!section)return;section.classList.add('has-ambient');if(config.mesh)section.classList.add(config.mesh);var wrap=document.createElement('div');wrap.className='ambient-wrap';config.blobs.forEach(function(b){var blob=document.createElement('div'),classes='ambient-blob ambient-blob--'+b.color+' ambient-blob--drift-'+b.drift;if(b.sm)classes+=' ambient-blob--sm';blob.className=classes;blob.style.top=b.top;blob.style.left=b.left;wrap.appendChild(blob);});section.insertBefore(wrap,section.firstChild);});
    var glassTargets=['.hero-card','.p-card','.branch','.g-item','.review-card'];glassTargets.forEach(function(sel){$$(sel).forEach(function(card){card.classList.add('glass-card');});});
}

// ══════════════════════════════════════
// 3D TILT
// ══════════════════════════════════════

function initTilt(){
    var isTouch='ontouchstart' in window&&!window.matchMedia('(pointer: fine)').matches;if(isTouch)return;
    var cards=$$('.branch, .p-card');if(!cards.length)return;
    cards.forEach(function(card){
        card.classList.add('tilt-card');
        card.addEventListener('mousemove',(function(){var pending=false;return function(e){if(pending)return;pending=true;requestAnimationFrame(function(){var rect=card.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,centerX=rect.width/2,centerY=rect.height/2,max=parseFloat(getComputedStyle(card).getPropertyValue('--tilt-max'))||5,rotateX=((centerY-y)/centerY)*max,rotateY=((x-centerX)/centerX)*max;card.classList.remove('tilt-reset');card.style.setProperty('--tilt-x',rotateX.toFixed(2)+'deg');card.style.setProperty('--tilt-y',rotateY.toFixed(2)+'deg');pending=false;});};})());
        card.addEventListener('mouseleave',function(){card.classList.add('tilt-reset');card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
    });
}

// ══════════════════════════════════════
// ACTIVE NAV HIGHLIGHT
// ══════════════════════════════════════

function initNavHighlight(){
    var navLinks=$$('.nav a:not(.btn)');if(!navLinks.length||!('IntersectionObserver' in window))return;
    var sectionMap=[];navLinks.forEach(function(link){var href=link.getAttribute('href');if(!href)return;var hash=href.indexOf('#')!==-1?href.substring(href.indexOf('#')):null;if(!hash)return;var section=$(hash);if(section)sectionMap.push({link:link,section:section});});
    if(!sectionMap.length)return;
    var currentActive=null,observer=new IntersectionObserver(function(entries){
        var visible=[];entries.forEach(function(entry){var match=null;for(var i=0;i<sectionMap.length;i++){if(sectionMap[i].section===entry.target){match=sectionMap[i];break;}}if(match){match._ratio=entry.intersectionRatio;match._intersecting=entry.isIntersecting;}});
        var best=null,bestRatio=0;sectionMap.forEach(function(item){if(item._intersecting&&item._ratio>bestRatio){bestRatio=item._ratio;best=item;}});
        if(best&&best.link!==currentActive){navLinks.forEach(function(l){l.classList.remove('nav-active');});best.link.classList.add('nav-active');currentActive=best.link;}
    },{threshold:[0,0.1,0.2,0.3,0.4,0.5],rootMargin:'-80px 0px -30% 0px'});
    sectionMap.forEach(function(item){item._ratio=0;item._intersecting=false;observer.observe(item.section);});
}

// ══════════════════════════════════════
// HOVER RIPPLE
// ══════════════════════════════════════

function initRipple(){var isTouch='ontouchstart' in window&&!window.matchMedia('(pointer: fine)').matches;if(isTouch)return;document.addEventListener('mousedown',function(e){var btn=e.target.closest('.btn');if(!btn)return;var existing=$$('.btn-ripple',btn);existing.forEach(function(r){r.remove();});var rect=btn.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2,x=e.clientX-rect.left-size/2,y=e.clientY-rect.top-size/2,ripple=document.createElement('div');ripple.className='btn-ripple';ripple.style.width=size+'px';ripple.style.height=size+'px';ripple.style.left=x+'px';ripple.style.top=y+'px';btn.appendChild(ripple);setTimeout(function(){ripple.remove();},800);});}

// ══════════════════════════════════════
// DYNAMIC ONLINE STATUS
// ══════════════════════════════════════

function initOnlineStatus(){
    var statusDot=$('.sheet-status-dot'),statusText=$('.sheet-status-text');if(!statusDot||!statusText)return;
    var now=new Date(),hour=now.getHours(),minute=now.getMinutes(),day=now.getDay(),isWeekday=day>=1&&day<=5,isSaturday=day===6,isSunday=day===0,online=false,message='';
    if(isWeekday&&hour>=9&&hour<20){online=true;if(hour<12)message='Онлайн · Ответим за 5–10 минут';else if(hour<17)message='Онлайн · Ответим за 5 минут';else message='Онлайн · Ответим до конца дня';}
    else if(isSaturday&&hour>=10&&hour<18){online=true;message='Онлайн · Работаем в субботу';}
    else{online=false;if(isSunday||(isSaturday&&hour>=18))message='Офлайн · Ответим в понедельник в 9:00';else if(isWeekday&&hour<9)message='Офлайн · Ответим сегодня в 9:00';else if(isWeekday&&hour>=20)message='Офлайн · Ответим '+(day===5?'в понедельник':'завтра')+' в 9:00';else message='Офлайн · Скоро будем онлайн';}
    statusDot.style.background=online?'var(--green)':'var(--text-muted)';statusDot.style.animationPlayState=online?'running':'paused';
    statusText.innerHTML='<span class="sheet-status-dot" style="background:'+(online?'var(--green)':'var(--text-muted)')+';animation-play-state:'+(online?'running':'paused')+'"></span>'+message;
}

// ══════════════════════════════════════
// CALC CTA → SHEET
// ══════════════════════════════════════

var calcCtaSheet=$('#calcCtaSheet');if(calcCtaSheet)calcCtaSheet.addEventListener('click',openSheet);

// ══════════════════════════════════════
// FOR-OWNERS: CALCULATOR
// ══════════════════════════════════════

(function(){
  var fleetSelect=$('#calcFleet'),daysRange=$('#calcDays'),daysDisplay=$('#calcDaysDisplay'),lossEl=$('#calcLoss'),costEl=$('#calcCost'),saveEl=$('#calcSave'),ourDaysEl=$('#calcOurDays'),saveInline=$('#calcSaveInline'),costInline=$('#calcCostInline');
  var costMap={100000:20000,150000:30000,200000:40000,300000:40000};
  var fmt=function(n){return n>=1000000?(n/1000000).toFixed(1).replace('.',',')+' млн ₽':n.toLocaleString('ru-RU')+' ₽';};
  var update=function(){
    var dailyLoss=parseInt(fleetSelect.value,10),days=parseInt(daysRange.value,10),ourDays=12,serviceCost=costMap[dailyLoss]||40000,totalLoss=dailyLoss*days,ourLoss=dailyLoss*ourDays,saved=totalLoss-ourLoss-serviceCost;
    daysDisplay.textContent=days+' '+(days===1?'день':days<5?'дня':'дней');
    lossEl.textContent=fmt(totalLoss); costEl.textContent='от '+fmt(serviceCost); saveEl.textContent=saved>0?fmt(saved):'0 ₽';
    if(ourDaysEl)ourDaysEl.textContent=ourDays+' дней';
    if(saveInline)saveInline.textContent=saved>0?fmt(saved):'0 ₽';
    if(costInline)costInline.textContent='от '+fmt(serviceCost);
  };
  if(fleetSelect&&daysRange){fleetSelect.addEventListener('change',update);daysRange.addEventListener('input',update);update();}
})();

// ══════════════════════════════════════
// FOR-OWNERS: TIMELINE REVEAL
// ══════════════════════════════════════

(function(){
  var steps=$$('.tl-step');
  if(!steps.length||!('IntersectionObserver' in window))return;
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(x){if(x.isIntersecting){x.target.classList.add('visible');obs.unobserve(x.target);}});},{threshold:0.3});
  steps.forEach(function(s){obs.observe(s);});
})();

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════

function init(){applyConfig();initReveal();initOnlineStatus();renderCohorts();renderSeasonTimer();calculateFromChips();initGlow();initCounters();initAmbientBlobs();initTilt();initNavHighlight();initRipple();setInterval(function(){var box=$('#seasonBox');if(!box)return;renderSeasonTimer();},60000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.addEventListener('load',function(){$$('.reveal').forEach(function(e){if(!e.classList.contains('visible'))e.classList.add('visible');});});

// ══════════════════════════════════════
// APPLY CONFIG — подставляет контакты из config.js
// ══════════════════════════════════════
function applyConfig(){
    var c=window.CREWPOINT;if(!c)return;

    // Телефоны — ссылки href
    $$('a[href^="tel:"]').forEach(function(el){
        el.href='tel:'+c.phone;
        if(el.textContent.trim().startsWith('+'))el.textContent=c.phoneDisplay;
    });

    // Email — ссылки href
    $$('a[href^="mailto:"]').forEach(function(el){
        el.href='mailto:'+c.email;
        if(el.textContent.includes('@'))el.textContent=c.email;
    });

    // WhatsApp
    $$('a[href*="wa.me"]').forEach(function(el){
        var hasText=el.href.includes('text=');
        el.href=hasText?c.waText:c.wa;
    });

    // Telegram crewpoint
    $$('a[href*="t.me/crewpoint"]').forEach(function(el){
        el.href=c.tg;
    });

    // Telegram owner
    $$('a[href*="t.me/DXBiller"]').forEach(function(el){
        el.href=c.tgOwner;
    });

    // Футер — ИНН и название компании
    $$('.footer-bottom div:first-child').forEach(function(el){
        if(el.textContent.includes('ИП')){
            el.textContent='© 2024–2025 CrewPoint. '+c.companyName+' ИНН: '+c.inn+'. Консалтинговые услуги.';
        }
    });

    // sheet-util — email текст
    $$('.sheet-util-value').forEach(function(el){
        if(el.textContent.includes('@'))el.textContent=c.email;
    });

    // data-copy для кнопок копирования
    $$('[data-copy]').forEach(function(el){
        var val=el.dataset.copy;
        if(val&&val.includes('@'))el.dataset.copy=c.email;
        if(val&&val.startsWith('+'))el.dataset.copy=c.phone;
    });
}

})();