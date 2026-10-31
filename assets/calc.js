/* The missed-call calculator on /automations/missed-call-text-back/. Missed calls a week × 4.3 weeks ×
   the share who would have booked × what a job is worth. Every figure is the visitor's own; the
   working is printed under the answer. */
(function(){
  var d = document, f = d.getElementById('calc'); if (!f) return;
  var JOB = []; var add = function(a, b, s){ for (var v = a; v < b; v += s) JOB.push(v); };
  add(50, 500, 25); add(500, 1000, 50); add(1000, 3000, 250); add(3000, 5001, 500);
  var $ = function(id){ return d.getElementById(id); }, miss = $('clMiss'), job = $('clJob');
  var money = function(v){ return '£' + Math.round(v).toLocaleString('en-GB'); };
  var round = function(v){ return v >= 10000 ? Math.round(v / 500) * 500 : v >= 1000 ? Math.round(v / 50) * 50 : Math.round(v / 10) * 10; };
  var RATE = { '0.25': '1 in 4', '0.333': '1 in 3', '0.5': '1 in 2' };
  function fillTrack(el){ var p = (el.value - el.min) / (el.max - el.min) * 100; el.style.setProperty('--p', p + '%'); }
  function run(){
    var m = +miss.value, j = JOB[+job.value] || 0, r = f.querySelector('input[name=clRate]:checked'), rate = r ? +r.value : 1 / 3;
    var month = round(m * 4.33 * rate * j);
    $('clMissV').textContent = m; $('clJobV').textContent = money(j) + (+job.value === JOB.length - 1 ? '+' : '');
    $('clMonth').textContent = money(month); $('clYear').textContent = money(month * 12);
    $('clWork').textContent = m + ' missed calls a week × 4.3 weeks × ' + RATE[r ? r.value : '0.333'] + ' who would have booked × ' + money(j) + ' a job = ' + money(month) + ' a month. Your numbers, not a promise.';
    fillTrack(miss); fillTrack(job);
  }
  f.addEventListener('input', run); f.addEventListener('change', run); f.addEventListener('submit', function(e){ e.preventDefault(); });
  run();
})();
