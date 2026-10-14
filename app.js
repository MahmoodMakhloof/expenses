/* ميزان — personal budget app (Arabic, RTL). All data lives in localStorage on the device. */
(function(){
'use strict';
document.documentElement.lang='ar'; document.documentElement.dir='rtl';
const KEY='mizan.v1';
const NATIVE=window.MizanNative||null;
const LOC='ar-EG-u-nu-latn';
const nf=new Intl.NumberFormat(LOC,{maximumFractionDigits:0});
const nf1=new Intl.NumberFormat(LOC,{maximumFractionDigits:1});
const CUR='ج.م';
const money=n=>nf.format(Math.round(n||0));
const smoney=n=>`<bdi dir="ltr">${n<0?'−':''}${money(Math.abs(n))}</bdi>`;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const toNum=v=>{const s=String(v??'').trim().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٫,]/g,'.').replace(/[^\d.\-]/g,'');const n=parseFloat(s);return isFinite(n)?n:NaN};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>iso(new Date());
const curYM=()=>today().slice(0,7);
const fromISO=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d||1)};
const addDays=(s,k)=>{const d=fromISO(s);d.setDate(d.getDate()+k);return iso(d)};
const dayDiff=(a,b)=>Math.round((fromISO(a)-fromISO(b))/864e5);
const ymAdd=(ym,k)=>{let [y,m]=ym.split('-').map(Number);m+=k;while(m>12){m-=12;y++}while(m<1){m+=12;y--}return `${y}-${pad(m)}`};
const ymDiff=(a,b)=>{const[ay,am]=a.split('-').map(Number),[by,bm]=b.split('-').map(Number);return (ay-by)*12+(am-bm)};
const dim=ym=>{const[y,m]=ym.split('-').map(Number);return new Date(y,m,0).getDate()};
const clampDay=(ym,d)=>`${ym}-${pad(Math.max(1,Math.min(d,dim(ym))))}`;
const monthName=ym=>new Intl.DateTimeFormat(LOC,{month:'long',year:'numeric'}).format(fromISO(ym+'-01'));
const monthShort=ym=>new Intl.DateTimeFormat(LOC,{month:'short'}).format(fromISO(ym+'-01'));
const shortDate=ds=>new Intl.DateTimeFormat(LOC,{day:'numeric',month:'short'}).format(fromISO(ds));
const dayName=ds=>{const k=dayDiff(ds,today());if(k===0)return 'النهارده';if(k===1)return 'بكره';if(k===-1)return 'امبارح';return new Intl.DateTimeFormat(LOC,{weekday:'long',day:'numeric',month:'long'}).format(fromISO(ds))};
const sum=(arr,f=x=>x.amt)=>arr.reduce((a,x)=>a+(f(x)||0),0);

const ICONS=['🍽️','🛒','☕','🌐','📱','🚌','🚗','⛽','🏠','💡','💧','🔥','💊','🏥','👕','🎓','📚','🎁','🎉','✈️','🐾','👶','💇','🛠️','🏋️','🎮','🍿','💳','🕌','🧾','📦','💰'];
const UNK='__unknown';            // category id for money that left without a record
const FORGOT=[['📱','شحن رصيد/باقة'],['🛵','توصيل/دليفري'],['☕','قهوة/كافيه'],['🚕','تاكسي/أوبر'],['🪙','بقشيش وفكة'],['🛒','بقالة صغيرة'],['💊','صيدلية'],['🎁','هدية/عيدية'],['🍿','خروجة'],['💳','اشتراك/خصم بنك'],['🚬','سجاير/حاجة سريعة'],['🧾','رسوم/غرامة']];

/* ---------- state ---------- */
function sample(){
  const ym=curYM(), t=+today().slice(8);
  const d=k=>`${ym}-${pad(Math.max(1,Math.min(t,k)))}`;
  const c={food:uid(),net:uid(),tr:uid(),oth:uid()};
  const e=(amt,cat,note,day)=>({id:uid(),amt,cat,note,date:d(day),cx:0});
  return {v:2,sample:true,salary:15000,payday:25,autoSalary:true,goal:1000,since:ymAdd(ym,-1),
    cashSet:true,cash:3800,cashDate:addDays(today(),-6),salaryIn:{},
    cats:[{id:c.food,name:'أكل',icon:'🍽️',limit:4000},{id:c.net,name:'نت',icon:'🌐',limit:450},{id:c.tr,name:'مواصلات',icon:'🚌',limit:1200,carry:true},{id:c.oth,name:'أخرى',icon:'📦',limit:1500}],
    exp:[e(850,c.food,'طلبات البيت',1),e(450,c.net,'باقة النت',2),e(320,c.tr,'بنزين',3),e(640,c.food,'سوبر ماركت',4),e(180,c.tr,'أوبر',5),e(260,c.oth,'هدية عيد ميلاد',6),e(390,c.food,'غدا برا',7),e(410,c.tr,'بنزين',8),e(700,c.food,'خضار وفاكهة',9),e(340,c.oth,'صيدلية',10),e(450,c.tr,'صيانة عربية',11),e(520,c.food,'لحمة',12),e(210,c.food,'قهوة وحلويات',13),e(320,c.tr,'بنزين',3+28)],
    inc:[{id:uid(),amt:1200,note:'شغل فريلانس',date:d(6),cx:0}],
    recon:[{id:uid(),date:addDays(today(),-6),expected:4600,actual:3800,gap:-800}],
    debts:[{id:uid(),dir:'owe',name:'أحمد',amt:2000,paid:500,note:'سلفة تصليح التكييف',date:`${ymAdd(ym,-1)}-20`,due:''},
           {id:uid(),dir:'lent',name:'كريم',amt:1500,paid:0,note:'',date:`${ym}-03`,due:`${ym}-28`},
           {id:uid(),dir:'lent',name:'منى',amt:300,paid:0,note:'تذكرة سينما',date:`${ym}-09`,due:''}],
    coms:[{id:uid(),type:'gam',name:'جمعية الشغل',amt:1000,active:true,months:10,start:ymAdd(ym,-2),turn:6,due:27,paid:[]},
          {id:uid(),type:'bill',name:'فاتورة الكهربا',amt:450,active:true,due:5,paid:[ym]},
          {id:uid(),type:'bill',name:'باقة الموبايل',amt:200,active:true,due:10,paid:[ym]},
          {id:uid(),type:'bill',name:'فاتورة النت',amt:400,active:true,due:20,paid:[]}],
    set:{}};
}
function blank(){return {v:2,sample:false,salary:0,cats:[{id:uid(),name:'أكل',icon:'🍽️',limit:0},{id:uid(),name:'نت',icon:'🌐',limit:0},{id:uid(),name:'مواصلات',icon:'🚌',limit:0},{id:uid(),name:'أخرى',icon:'📦',limit:0}],exp:[],debts:[],coms:[],inc:[],recon:[],set:{}}}
function migrate(s){
  s.exp=s.exp||[];s.inc=s.inc||[];s.recon=s.recon||[];s.debts=s.debts||[];s.coms=s.coms||[];s.cats=s.cats||[];
  s.set=Object.assign({notif:true,nudge:false,reconRemind:true,lock:false,autoBackup:true,lastBackup:0,askedNotif:false},s.set||{});
  s.goal=+s.goal||0;if(s.carryMonth===undefined)s.carryMonth=true;s.payday=+s.payday||0;s.autoSalary=s.autoSalary!==false;s.salaryIn=s.salaryIn||{};
  s.cashSet=!!s.cashSet;s.cash=+s.cash||0;s.cashDate=s.cashDate||'';
  if(!s.since){const m=s.exp.map(x=>x.date.slice(0,7)).sort()[0];s.since=m&&m<curYM()?m:curYM()}
  s.coms.forEach(c=>{c.paid=c.paid||[];c.cx=c.cx||{};c.got=c.got||{}});
  s.debts.forEach(d=>{d.cxPay=d.cxPay||{};d.cxSum=d.cxSum||0;d.instPay=d.instPay||{}});
  s.v=2;return s;
}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!Array.isArray(S.cats))S=sample();
migrate(S);
let syncT;const remCache=new Map();
function save(){remCache.clear();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}clearTimeout(syncT);syncT=setTimeout(syncNative,400)}

const UI={tab:'home',ym:curYM(),showAll:false,debtDir:'owe'};

/* ---------- money movement on the balance ---------- */
const cashOn=date=>S.cashSet&&(!date||date>=S.cashDate);
function applyCash(r,sign){if(cashOn(r.date)){r.cx=1;S.cash+=sign*r.amt}else r.cx=0}
function revertCash(r,sign){if(r.cx)S.cash-=sign*r.amt;r.cx=0}
function creditSalary(){
  if(!S.cashSet||!S.autoSalary||!S.payday||!S.salary||S.sample)return 0;
  let ym=S.cashDate.slice(0,7),added=0;const cur=curYM(),t=today();
  while(ym<=cur){const pd=clampDay(ym,S.payday);
    if(!S.salaryIn[ym]){if(pd<=S.cashDate)S.salaryIn[ym]=1;else if(pd<=t){S.cash+=S.salary;S.salaryIn[ym]=1;added+=S.salary}}
    ym=ymAdd(ym,1)}
  return added;
}

/* ---------- calculations ---------- */
const catById=id=>id===UNK?{id:UNK,name:'مش معروف',icon:'❓',limit:0,subs:[]}:S.cats.find(c=>c.id===id);
const catLimit=c=>c.subs&&c.subs.length?sum(c.subs,x=>x.limit):(c.limit||0);
const subName=(c,id)=>{const x=c&&c.subs&&c.subs.find(y=>y.id===id);return x?x.name:''};
const catColor=i=>i<0?'var(--warm)':`var(--c${(i%8)+1})`;
const spentIn=(ym,cat)=>sum(S.exp.filter(x=>x.date.startsWith(ym)&&(!cat||x.cat===cat)));
function limitFor(c,ym){const base=catLimit(c);if(!c.carry||!base)return {limit:base,carry:0};
  const prev=ymAdd(ym,-1);if(prev<S.since)return {limit:base,carry:0};
  const carry=Math.max(0,base-spentIn(prev,c.id));return {limit:base+carry,carry}}
function comActive(c,ym){if(!c.active)return false;if(c.type==='gam'){const i=ymDiff(ym,c.start)+1;return i>=1&&i<=c.months}return true}
function instDue(d,ym){
  if(d.dir!=='owe'||!(d.inst>0)||!d.instStart||ym<d.instStart)return 0;
  const pay=(d.instPay||{})[ym];if(pay)return pay;
  if(ym<curYM())return 0;
  return Math.min(d.inst,Math.max(0,d.amt-d.paid));
}
function debtPlan(d){
  if(!(d.inst>0)||!d.instStart)return null;
  const cur=curYM(),left=Math.max(0,d.amt-d.paid),paidNow=!!(d.instPay||{})[cur];
  if(left<=0)return {inst:d.inst,left:0,done:true,paidNow};
  let base=d.instStart>cur?d.instStart:cur;if(paidNow&&base===cur)base=ymAdd(cur,1);
  const months=Math.ceil(left/d.inst);
  return {inst:d.inst,left,months,end:ymAdd(base,months-1),paidNow,start:d.instStart};
}
/* leftover of a month (income − commitments − spending) rolls into the next one */
function monthRemaining(ym){
  if(remCache.has(ym))return remCache.get(ym);
  const commit=sum(S.coms.filter(c=>comActive(c,ym)))+sum(S.debts,d=>instDue(d,ym));
  const v=carryFor(ym)+(S.salary||0)+sum(S.inc.filter(x=>x.date.startsWith(ym)))-commit-spentIn(ym);
  remCache.set(ym,v);return v;
}
function carryFor(ym){if(!S.carryMonth)return 0;const prev=ymAdd(ym,-1);if(prev<S.since)return 0;return Math.max(0,monthRemaining(prev))}
function calc(ym){
  const exp=S.exp.filter(x=>x.date.startsWith(ym));
  const spent=sum(exp);
  const unknown=sum(exp.filter(x=>x.cat===UNK));
  const coms=S.coms.filter(c=>comActive(c,ym));
  const debtInst=sum(S.debts,d=>instDue(d,ym));
  const commit=sum(coms)+debtInst;
  const extra=sum(S.inc.filter(x=>x.date.startsWith(ym)));
  const carry=carryFor(ym);const base=S.salary||0, salary=base+extra+carry, goal=S.goal||0;
  const remaining=salary-commit-spent;
  const days=dim(ym), cur=curYM();
  const day=ym<cur?days:ym>cur?0:+today().slice(8);
  const daysLeft=Math.max(0,days-day+(ym===cur?1:0));
  const avg=day?spent/day:0;
  const spendable=remaining-goal;
  const allowed=daysLeft?Math.max(0,spendable)/daysLeft:0;
  const forecastSpent=ym<cur?spent:avg*days;
  const forecastLeft=salary-commit-forecastSpent;
  const byCat=S.cats.map((c,i)=>{const ce=exp.filter(x=>x.cat===c.id);const s=sum(ce);const L=limitFor(c,ym);
    const subs=(c.subs||[]).map(sb=>{const sp=sum(ce.filter(x=>x.sub===sb.id));return {...sb,spent:sp,ratio:sb.limit?sp/sb.limit:0}});
    const general=sum(ce.filter(x=>!x.sub||!subs.some(sb=>sb.id===x.sub)));
    return {...c,i,limit:L.limit,carryIn:L.carry,spent:s,ratio:L.limit?s/L.limit:0,subs,general}});
  if(unknown)byCat.push({...catById(UNK),i:-1,limit:0,carryIn:0,spent:unknown,ratio:0,subs:[],general:0});
  const owe=sum(S.debts.filter(d=>d.dir==='owe'),d=>Math.max(0,d.amt-d.paid));
  const lent=sum(S.debts.filter(d=>d.dir==='lent'),d=>Math.max(0,d.amt-d.paid));
  return {carry,exp,spent,unknown,commit,debtInst,coms,base,extra,salary,goal,remaining,spendable,days,day,daysLeft,avg,allowed,forecastSpent,forecastLeft,byCat,owe,lent,net:lent-owe,
    used:salary?(spent+commit)/salary:0};
}
function payoffInfo(){
  const owe=S.debts.filter(d=>d.dir==='owe'&&d.paid<d.amt);
  if(!owe.length)return null;
  const planned=owe.filter(d=>debtPlan(d)),unplanned=owe.filter(d=>!debtPlan(d));
  const lastPlanned=planned.map(d=>debtPlan(d).end).sort().pop()||null;
  const rest=sum(unplanned,d=>d.amt-d.paid);
  const R=calc(curYM());const free=Math.max(0,R.forecastLeft-R.goal);
  let restEnd=null;if(rest>0&&free>0)restEnd=ymAdd(curYM(),Math.ceil(rest/free)-1);
  const end=rest>0?(restEnd?(lastPlanned&&lastPlanned>restEnd?lastPlanned:restEnd):null):lastPlanned;
  return {planned,unplanned,lastPlanned,rest,free,restEnd,end};
}

/* ---------- cash-flow forecast ---------- */
function dailyRate(){
  const ym=curYM(),R=calc(ym);
  const budget=sum(S.cats,c=>limitFor(c,ym).limit);
  const variable=R.spent-R.unknown;
  if(R.day>=5&&variable>0)return variable/R.day;
  if(budget>0)return budget/R.days;
  return R.day?variable/R.day:0;
}
function project(rate,H=45){
  const t=today();let bal=S.cash;const pts=[];const events=[];
  const left={};S.debts.forEach(d=>left[d.id]=Math.max(0,d.amt-d.paid));
  let firstNeg=null,nextPay=null,balBeforePay=null,minBal=bal,minDate=t;
  for(let k=0;k<=H;k++){
    const D=addDays(t,k),ym=D.slice(0,7);const ev=[];
    const hit=day=>{const x=clampDay(ym,day);return k===0?x<=D:x===D};
    if(S.payday&&S.salary){const pd=clampDay(ym,S.payday);if(pd===D&&!(k===0&&S.salaryIn[ym])&&!(k===0&&!S.autoSalary)){ev.push({label:'الراتب',amt:S.salary,kind:'in'});if(!nextPay)nextPay=D}}
    S.coms.forEach(c=>{if(!comActive(c,ym))return;
      const day=c.due||S.payday||1;
      if(!(c.paid||[]).includes(ym)&&hit(day))ev.push({label:c.name,amt:-c.amt,kind:c.type,late:k===0&&clampDay(ym,day)<D});
      if(c.type==='gam'&&ymDiff(ym,c.start)+1===c.turn&&!c.got[ym]&&hit(day))ev.push({label:'قبض '+c.name,amt:c.amt*c.months,kind:'in'})});
    S.debts.forEach(d=>{if(d.dir!=='owe'||left[d.id]<=0)return;
      if(d.inst>0&&d.instStart&&ym>=d.instStart&&!(d.instPay||{})[ym]&&hit(d.instDay||S.payday||1)){const a=Math.min(d.inst,left[d.id]);left[d.id]-=a;ev.push({label:'قسط '+d.name,amt:-a,kind:'debt'})}
      else if(!(d.inst>0)&&d.due&&(k===0?d.due<=D:d.due===D)){ev.push({label:'سداد '+d.name,amt:-left[d.id],kind:'debt',late:d.due<D});left[d.id]=0}});
    const fixed=sum(ev);
    const vari=k===0?0:rate;
    bal+=fixed-vari;
    if(vari)ev.push({label:'مصروفك اليومي',amt:-vari,kind:'daily'});
    pts.push({date:D,bal});
    ev.filter(e=>e.kind!=='daily').forEach(e=>events.push({...e,date:D}));
    if(bal<minBal){minBal=bal;minDate=D}
    if(bal<0&&!firstNeg){const big=ev.filter(e=>e.amt<0&&e.kind!=='daily').sort((a,b)=>a.amt-b.amt)[0];firstNeg={date:D,bal,cause:big?big.label:'مصروفك اليومي'}}
    if(nextPay===D&&balBeforePay===null)balBeforePay=bal-S.salary;
  }
  return {pts,events,firstNeg,nextPay,balBeforePay,minBal,minDate,rate,end:bal};
}
function forecast(){
  if(!S.cashSet)return null;
  const rate=dailyRate();const P=project(rate);
  const stop=P.nextPay||addDays(today(),30);
  const negBefore=p=>p.pts.some(x=>x.date<stop&&x.bal<0);
  let safe=null;
  if(P.firstNeg&&P.firstNeg.date<stop){
    if(negBefore(project(0)))safe=0;
    else{let lo=0,hi=rate;for(let i=0;i<20;i++){const m=(lo+hi)/2;negBefore(project(m))?hi=m:lo=m}safe=lo}
  }
  return {...P,safe,stop};
}

/* ---------- reconciliation (جرد) ---------- */
const lastRecon=()=>S.recon.length?S.recon[S.recon.length-1]:null;
function reconSince(){const r=lastRecon();return r?r.date:(S.cashDate||today())}
function silentDays(from){const out=[];const t=today();for(let d=from;d<=t;d=addDays(d,1)){if(!S.exp.some(x=>x.date===d))out.push(d)}return out}

/* ---------- home ---------- */
function renderHome(){
  const R=calc(UI.ym), cur=curYM(), isCur=UI.ym===cur;
  const usedPct=Math.round(R.used*100);
  const F=isCur?forecast():null;
  const alerts=[];
  R.byCat.forEach(c=>{
    if(!c.limit||c.id===UNK)return;
    if(c.ratio>1)alerts.push({k:'over',h:`<b>${esc(c.icon)} ${esc(c.name)}</b> عدّى ميزانيته بـ <span class="num">${money(c.spent-c.limit)}</span> ${CUR}`});
    else if(c.ratio===1)alerts.push({k:'warn',h:`<b>${esc(c.icon)} ${esc(c.name)}</b> خلّص ميزانيته بالظبط، أي صرف زيادة هيعدّيها`});
    else if(c.ratio>=.8)alerts.push({k:'warn',h:`<b>${esc(c.icon)} ${esc(c.name)}</b> قرّب يخلص: استهلكت ${Math.round(c.ratio*100)}%، فاضل <span class="num">${money(c.limit-c.spent)}</span> ${CUR}`});
    else if(isCur&&R.day>=5&&c.spent/R.day*R.days>c.limit*1.05)alerts.push({k:'warn',h:`بمعدلك ده <b>${esc(c.icon)} ${esc(c.name)}</b> هيعدّي ميزانيته بحوالي <span class="num">${money(c.spent/R.day*R.days-c.limit)}</span> ${CUR} قبل آخر الشهر`});
  });
  R.byCat.forEach(c=>c.subs.forEach(sb=>{if(sb.limit&&sb.ratio>1&&c.ratio<=1)alerts.push({k:'over',h:`<b>${esc(c.icon)} ${esc(sb.name)}</b> (${esc(c.name)}) عدّى ميزانيته بـ <span class="num">${money(sb.spent-sb.limit)}</span> ${CUR}`})}));
  if(R.salary&&R.remaining<0)alerts.unshift({k:'over',h:`صرفت أكتر من دخلك بـ <span class="num">${money(-R.remaining)}</span> ${CUR}`});
  else if(isCur&&R.salary&&R.forecastLeft<0)alerts.push({k:'warn',h:`لو كملت بنفس المعدل هتخلّص الشهر بعجز <span class="num">${money(-R.forecastLeft)}</span> ${CUR}`});
  S.coms.filter(c=>c.type==='gam'&&comActive(c,UI.ym)&&ymDiff(UI.ym,c.start)+1===c.turn&&!c.got[UI.ym]).forEach(c=>alerts.push({k:'warn',h:`<b>${esc(c.name)}</b>: دورك تقبض الشهر ده <span class="num">${money(c.amt*c.months)}</span> ${CUR}`}));
  if(isCur&&S.cashSet&&S.set.reconRemind){const since=reconSince();const k=dayDiff(today(),since);if(k>=7)alerts.push({k:'warn',h:`عدّى ${nf.format(k)} يوم من آخر جرد. اعمل جرد دلوقتي علشان تعرف لو فيه فلوس اتصرفت ومتسجلتش. <button type="button" class="link inline" data-act="recon">اعمل جرد</button>`})}

  const parts=R.byCat.filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent);
  const r=56,C=2*Math.PI*r;let off=0;
  const arcs=parts.map(c=>{const len=C*c.spent/R.spent;const g=parts.length>1?Math.min(3,len/3):0;const s=`<circle cx="75" cy="75" r="${r}" fill="none" stroke="${catColor(c.i)}" stroke-width="18" stroke-dasharray="${Math.max(0,len-g)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)"/>`;off+=len;return s}).join('');

  const tx=[...R.exp.map(x=>({...x,_k:'exp'})),...S.inc.filter(x=>x.date.startsWith(UI.ym)).map(x=>({...x,_k:'inc'}))].sort((a,b)=>b.date.localeCompare(a.date));
  const shown=tx.slice(0,6);

  $('#s-home').innerHTML=`
  ${S.sample?`<div class="banner"><p>دي بيانات تجريبية علشان تشوف التطبيق شغال إزاي.</p><button type="button" data-act="fresh">ابدأ ببياناتي</button></div>`:''}
  <div class="hero">
    <div class="row between"><span class="lbl">المتبقي من دخل ${isCur?'الشهر':esc(monthName(UI.ym))} حسب المتسجل</span>
      <button class="salary-btn lbl" data-act="salary">الراتب: <span class="num">${money(R.base)}</span>${R.extra?` + <span class="num">${money(R.extra)}</span>`:''} ✎</button></div>
    ${R.carry?`<span class="lbl carry-lbl">+ <span class="num">${money(R.carry)}</span> مرحّلين من ${esc(monthName(ymAdd(UI.ym,-1)))}</span>`:''}
    <div class="big num">${smoney(R.remaining)}<span>${CUR}</span></div>
    <div class="bar" role="img" aria-label="استهلكت ${usedPct}% من الدخل"><i class="${usedPct>100?'over':''}" style="width:${Math.min(100,usedPct)}%"></i></div>
    <div class="split">
      <div><b class="num">${money(R.spent)}</b><small>مصروفات</small></div>
      <div><b class="num">${money(R.commit)}</b><small>التزامات</small></div>
      <div><b class="num">${R.goal?money(R.goal):usedPct+'%'}</b><small>${R.goal?'هدف ادخار':'من الدخل'}</small></div>
    </div>
  </div>
  ${isCur&&S.cashSet&&R.remaining-S.cash>Math.max(500,R.salary*0.05)?`<div class="gap-hint"><p>حسب المتسجل المفروض يفضل معاك <b class="num">${money(R.remaining)}</b> من دخل الشهر، لكن رصيدك <b class="num">${money(S.cash)}</b>. الفرق <b class="num">${money(R.remaining-S.cash)}</b> ${CUR} غالبًا مصاريف متسجلتش${R.lent?' أو فلوس سلّفتها':''}.</p><button type="button" class="btn small-btn" data-act="reconMonth">اعمل جرد الشهر</button></div>`:''}
  ${!R.base?`<div class="banner"><p>سجّل راتبك ويوم القبض علشان التحليلات تتحسب صح.</p><button type="button" data-act="salary">سجّل الراتب</button></div>`:''}
  ${isCur?walletCard(R,F):''}
  ${alerts.length?`<div class="alerts" role="status">${alerts.map(a=>`<div class="alert ${a.k}"><span class="dot"></span><div>${a.h}</div></div>`).join('')}</div>`:''}
  <div class="stats">
    <div class="stat"><span class="k">نسبة الاستهلاك</span><div class="row between"><span class="v">${usedPct}<small>%</small></span><span class="ring" style="--p:${Math.min(100,usedPct)}"></span></div><span class="h">مصروف + التزامات ÷ الدخل</span></div>
    <div class="stat"><span class="k">متوسط الصرف اليومي</span><span class="v">${money(R.avg)}<small>${CUR}</small></span><span class="h">على ${nf.format(R.day)} يوم</span></div>
    <div class="stat ${R.allowed>0?'good':'bad'}"><span class="k">المسموح تصرفه يوميًا</span><span class="v">${isCur?money(R.allowed):'—'}<small>${isCur?CUR:''}</small></span><span class="h">${isCur?`لباقي ${nf.format(R.daysLeft)} يوم${R.goal?' بعد هدف الادخار':''}`:'للشهر الحالي بس'}</span></div>
    <div class="stat ${R.forecastLeft<0?'bad':''}"><span class="k">توقع آخر الشهر</span><span class="v">${smoney(R.forecastLeft)}<small>${CUR}</small></span><span class="h">${UI.ym<cur?'الفعلي اللي فضل':`لو صرفت ${money(R.avg)} يوميًا`}</span></div>
    <button type="button" class="stat wide debt" data-act="debts"><div class="row between" style="width:100%"><div><span class="k">صافي الديون</span><div class="v">${smoney(R.net)}<small>${CUR}</small></div></div>
      <div class="small muted" style="text-align:left">ليّا <span class="num">${money(R.lent)}</span><br>عليّا <span class="num">${money(R.owe)}</span></div></div>
      <span class="h">${(()=>{const P=R.owe>0?payoffInfo():null;return P&&P.end?`تخلص من ديونك في ${esc(monthName(P.end))}`:R.net>0?'الناس عليها ليك أكتر':R.net<0?'عليك للناس أكتر':'متعادل'})()}</span></button>
  </div>
  ${isCur&&R.goal?goalCard(R):''}
  ${whereCard(R)}
  <div class="card"><h3>توزيع المصاريف</h3>
    ${parts.length?`<div class="donut-wrap"><svg class="donut" viewBox="0 0 150 150" role="img" aria-label="توزيع المصاريف على البنود"><circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="18"/>${arcs}
      <text x="75" y="72" text-anchor="middle" font-size="19" font-weight="600">${money(R.spent)}</text><text x="75" y="92" text-anchor="middle" font-size="11" style="fill:var(--muted)">${CUR}</text></svg>
      <ul class="legend">${parts.map(c=>`<li><span class="sw" style="background:${catColor(c.i)}"></span><span class="nm">${esc(c.icon)} ${esc(c.name)}</span><span class="num">${money(c.spent)}</span><span class="pc num">${Math.round(c.spent/R.spent*100)}%</span></li>`).join('')}</ul></div>`
    :`<div class="empty">مفيش مصاريف متسجلة ${isCur?'الشهر ده لسه':'في الشهر ده'}.</div>`}
  </div>
  ${compareCard()}
  <div class="card"><div class="row between"><h3>آخر الحركات</h3><button type="button" class="link" data-act="search">🔍 بحث</button></div>
    <div class="list">${shown.map(txRow).join('')||`<div class="empty">اضغط "سجّل مصروف" تحت علشان تضيف أول مصروف.</div>`}</div>
    ${tx.length>6?`<button class="link" data-act="search">عرض الكل (${nf.format(tx.length)})</button>`:''}
  </div>`;
}
function txRow(x){
  if(x._k==='inc')return `<button type="button" class="item item-btn" data-open="inc" data-id="${x.id}"><div class="ic inc-ic">💰</div><div class="body"><div class="t">${esc(x.note||'دخل إضافي')}</div><div class="s">دخل إضافي · ${esc(shortDate(x.date))}</div></div><span class="amt inc-amt">+${money(x.amt)}</span></button>`;
  const c=catById(x.cat)||{icon:'❔',name:'—'};const sn=subName(c,x.sub);
  return `<button type="button" class="item item-btn" data-open="exp" data-id="${x.id}"><div class="ic ${x.cat===UNK?'unk-ic':''}">${esc(c.icon)}</div><div class="body"><div class="t">${esc(x.note||sn||c.name)}</div><div class="s">${esc(c.name)}${sn?' · '+esc(sn):''} · ${esc(shortDate(x.date))}</div></div><span class="amt">${money(x.amt)}</span></button>`;
}
function walletCard(R,F){
  if(!S.cashSet)return `<div class="card wallet"><h3>معاك كام دلوقتي؟</h3><p class="small muted" style="margin:0 0 10px">سجّل الفلوس اللي معاك كلها (كاش وبنك ومحافظ) ويوم القبض. التطبيق هيتابع رصيدك مع كل حركة، ويقولك لو فيه فلوس اتصرفت ومتسجلتش، ويحذرك قبل ما فلوسك تخلص.</p><button type="button" class="btn full" data-act="cash">سجّل رصيدي</button></div>`;
  const worth=S.cash+R.lent-R.owe;
  const since=reconSince();
  let msg='';
  if(F.firstNeg){
    msg=`<p class="fc bad">⚠ رصيدك هيخلص <b>${esc(dayName(F.firstNeg.date))}</b> وهيوصل ${smoney(F.firstNeg.bal)} ${CUR} بسبب <b>${esc(F.firstNeg.cause)}</b>.</p>`;
    if(F.safe!==null&&F.firstNeg.date<F.stop)msg+=F.safe>0?`<p class="fc-tip">علشان تعدّي لحد ${F.nextPay?'القبض '+esc(dayName(F.nextPay)):'آخر الشهر'}، متصرفش أكتر من <b class="num">${money(F.safe)}</b> ${CUR} في اليوم (بدل <span class="num">${money(F.rate)}</span>).</p>`
      :`<p class="fc-tip">حتى لو مصرفتش خالص، الالتزامات اللي جاية أكبر من رصيدك. ${R.lent?`حصّل جزء من <span class="num">${money(R.lent)}</span> اللي ليك عند الناس، أو `:''}أجّل أكبر دفعة لحد القبض.</p>`;
  }else if(F.nextPay)msg=`<p class="fc ok">رصيدك هيكفي لحد القبض ${esc(dayName(F.nextPay))}، وهيفضل معاك تقريبًا <b class="num">${money(F.balBeforePay)}</b> ${CUR} قبل الراتب.</p>`;
  else msg=`<p class="fc ok">بمعدل صرفك (<span class="num">${money(F.rate)}</span> في اليوم) هيفضل معاك تقريبًا <b class="num">${money(F.end)}</b> ${CUR} بعد 45 يوم. سجّل يوم القبض علشان التوقع يبقى أدق.</p>`;
  const upcoming=F.events.filter(e=>dayDiff(e.date,today())<=14).slice(0,6);
  return `<div class="card wallet">
    <div class="row between"><div><span class="k">معاك دلوقتي</span><div class="wal-big num">${smoney(S.cash)} <small>${CUR}</small></div></div>
      <div class="wal-actions"><button type="button" class="btn small-btn" data-act="recon">جرد</button><button type="button" class="icon-btn" data-act="cash" aria-label="عدّل الرصيد"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></button></div></div>
    <div class="wal-split">
      <div><small>ليّا</small><b class="num" style="color:var(--green)">${money(R.lent)}</b></div>
      <div><small>عليّا</small><b class="num" style="color:var(--warm)">${money(R.owe)}</b></div>
      <div><small>صافي فلوسك</small><b class="num">${smoney(worth)}</b></div>
    </div>
    ${spark(F)}
    ${msg}
    ${R.lent?`<p class="small muted" style="margin:0">مش محسوب في التوقع: <span class="num">${money(R.lent)}</span> ${CUR} ليك عند الناس.</p>`:''}
    ${upcoming.length?`<details class="upc"><summary>الجاي في أسبوعين (${nf.format(upcoming.length)})</summary><ul>${upcoming.map(e=>`<li><span>${esc(e.label)}${e.late?' <b class="late">متأخر</b>':''}</span><span class="muted small">${esc(dayName(e.date))}</span><b class="num ${e.amt>0?'pos':''}">${e.amt>0?'+':''}${money(e.amt)}</b></li>`).join('')}</ul></details>`:''}
    <p class="small muted" style="margin:0">آخر جرد: ${esc(dayName(since))}</p>
  </div>`;
}
function spark(F){
  const pts=F.pts;if(pts.length<2)return '';
  const W=320,H=84,pl=4,pr=4,pt=8,pb=16;
  const vals=pts.map(p=>p.bal);const mx=Math.max(0,...vals),mn=Math.min(0,...vals);const span=mx-mn||1;
  const x=i=>W-pr-(W-pl-pr)*i/(pts.length-1);const y=v=>pt+(H-pt-pb)*(mx-v)/span;
  const line=pts.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(p.bal).toFixed(1)}`).join('');
  const area=`${line}L${x(pts.length-1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
  const pays=pts.map((p,i)=>({p,i})).filter(o=>F.events.some(e=>e.date===o.p.date&&e.label==='الراتب'));
  const neg=F.firstNeg?pts.findIndex(p=>p.date===F.firstNeg.date):-1;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="توقع رصيدك لـ 45 يوم">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--teal-2)" stop-opacity=".28"/><stop offset="1" stop-color="var(--teal-2)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#sg)"/>
    <line x1="${pl}" x2="${W-pr}" y1="${y(0)}" y2="${y(0)}" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width="1" opacity=".6"/>
    <path d="${line}" fill="none" stroke="var(--teal-2)" stroke-width="2" stroke-linejoin="round"/>
    ${pays.map(o=>`<line x1="${x(o.i)}" x2="${x(o.i)}" y1="${pt}" y2="${H-pb}" stroke="var(--green)" stroke-width="1" opacity=".5"/><text x="${x(o.i)}" y="${H-3}" text-anchor="middle" font-size="9" fill="var(--green)">قبض</text>`).join('')}
    ${neg>=0?`<circle cx="${x(neg)}" cy="${y(pts[neg].bal)}" r="4" fill="var(--danger)"/><text x="${x(neg)}" y="${H-3}" text-anchor="middle" font-size="9" fill="var(--danger)">عجز</text>`:''}
    <circle cx="${x(0)}" cy="${y(pts[0].bal)}" r="3" fill="var(--teal-2)"/>
    <text x="${W-pr}" y="${H-3}" text-anchor="end" font-size="9" fill="var(--muted)">النهارده</text>
    <text x="${pl}" y="${H-3}" text-anchor="start" font-size="9" fill="var(--muted)">بعد 45 يوم</text>
  </svg>`;
}
function goalCard(R){
  const exp=R.forecastLeft;const p=Math.max(0,Math.min(100,exp/R.goal*100));
  const ok=exp>=R.goal;
  return `<button type="button" class="card goal" data-act="goal"><div class="row between" style="width:100%"><h3 style="margin:0">هدف الادخار</h3><span class="chip ${ok?'ok':'warn'}"><span class="num">${money(R.goal)}</span> ${CUR}</span></div>
    <div class="meter"><i class="${ok?'':'warn'}" style="width:${p}%"></i></div>
    <p class="small" style="margin:0">${ok?`ماشي صح: بمعدلك هتوفر حوالي <b class="num">${money(exp)}</b> ${CUR}.`:`بمعدلك هتوفر <b class="num">${money(Math.max(0,exp))}</b> بس، أقل من هدفك بـ <b class="num">${money(R.goal-Math.max(0,exp))}</b>. خلّي صرفك اليومي <b class="num">${money(R.allowed)}</b>.`}</p></button>`;
}
function whereCard(R){
  if(!R.salary&&!R.spent)return '';
  const known=R.spent-R.unknown;
  const lentM=sum(S.debts.filter(d=>d.dir==='lent'&&d.date&&d.date.startsWith(UI.ym)));
  const left=R.salary-R.commit-R.spent-lentM;
  const rows=[['مصروفات متسجلة',known,'var(--teal-2)'],['التزامات وأقساط',R.commit,'var(--c3)'],['سلّفت للناس',lentM,'var(--c8)'],['مش معروف',R.unknown,'var(--danger)'],[left>=0?'متبقي من دخل الشهر':'صرفت زيادة عن دخلك',Math.abs(left),left>=0?'var(--green)':'var(--danger)']].filter(r=>r[1]>0);
  const tot=Math.max(R.salary,R.spent+R.commit+lentM)||1;
  return `<div class="card where"><div class="row between"><h3 style="margin:0">فلوس ${UI.ym===curYM()?'الشهر':esc(monthName(UI.ym))} راحت فين؟</h3><span class="small muted">الدخل <span class="num">${money(R.salary)}</span>${R.carry?` (منه <span class="num">${money(R.carry)}</span> مرحّل)`:''}</span></div>
    <div class="stack" role="img" aria-label="توزيع دخل الشهر">${rows.map(r=>`<i style="width:${r[1]/tot*100}%;background:${r[2]}"></i>`).join('')}</div>
    <ul class="where-list">${rows.map(r=>`<li><span class="sw" style="background:${r[2]}"></span><span>${r[0]}</span><b class="num">${money(r[1])}</b><span class="pc num">${Math.round(r[1]/tot*100)}%</span></li>`).join('')}</ul>
    ${R.unknown?`<p class="small" style="margin:0;color:var(--danger)">فيه <b class="num">${money(R.unknown)}</b> ${CUR} اتصرفوا ومش عارف فين (${Math.round(R.unknown/(R.salary||R.spent)*100)}% من دخلك). لو افتكرت حاجة، افتحها من آخر الحركات وانقلها لبندها.</p>`
      :S.cashSet?`<p class="small muted" style="margin:0">اعمل جرد علشان تتأكد إن مفيش فلوس اتصرفت ومتسجلتش.</p>`:''}
  </div>`;
}
function compareCard(){
  const months=[...Array(6)].map((_,i)=>ymAdd(UI.ym,i-5));
  const vals=months.map(m=>spentIn(m));
  if(vals.slice(0,5).every(v=>!v))return '';
  const W=320,H=130,top=20,bot=22,bw=30;const mx=Math.max(...vals)||1;
  const gx=i=>W-((i+.5)*(W/6));
  const bars=vals.map((v,i)=>{const h=(H-top-bot)*v/mx;const x=gx(i)-bw/2;const y=H-bot-h;const curr=i===5;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h,v?2:0)}" rx="6" fill="${curr?'var(--teal-2)':'var(--c4)'}" opacity="${curr?1:.55}"/>
    <text x="${gx(i)}" y="${y-5}" text-anchor="middle" font-size="10" fill="var(--ink)">${v?(v>=1000?nf1.format(v/1000)+'K':money(v)):''}</text>
    <text x="${gx(i)}" y="${H-6}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${esc(monthShort(months[i]))}</text>`}).join('');
  const cur=UI.ym,prev=months[4],isCur=cur===curYM();
  const lim=isCur?+today().slice(8):dim(cur);
  const upto=(m,cat)=>sum(S.exp.filter(x=>x.date.startsWith(m)&&+x.date.slice(8)<=lim&&(!cat||x.cat===cat)));
  const a=upto(cur),b=upto(prev);
  const diffs=[...S.cats,catById(UNK)].map(c=>({c,d:upto(cur,c.id)-upto(prev,c.id)})).filter(o=>Math.abs(o.d)>=1).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)).slice(0,3);
  const pct=b?Math.round((a-b)/b*100):null;
  return `<div class="card"><h3>مقارنة بالشهور اللي فاتت</h3>
    <svg class="bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="مصروفات آخر 6 شهور">${bars}</svg>
    <p class="small" style="margin:6px 0 4px">${isCur?`لحد يوم ${nf.format(lim)}: `:''}صرفت <b class="num">${money(a)}</b> مقابل <b class="num">${money(b)}</b> في ${esc(monthName(prev))}${pct!==null?` <span class="chip ${a>b?'over':'ok'}">${a>b?'+':''}${pct}%</span>`:''}</p>
    ${diffs.length?`<ul class="deltas">${diffs.map(o=>`<li><span>${esc(o.c.icon)} ${esc(o.c.name)}</span><b class="num ${o.d>0?'up':'down'}">${o.d>0?'+':'−'}${money(Math.abs(o.d))}</b></li>`).join('')}</ul>`:''}
  </div>`;
}

/* ---------- budget ---------- */
function renderBudget(){
  const R=calc(UI.ym);
  const cats=R.byCat.filter(c=>c.id!==UNK);
  const total=sum(cats,c=>c.limit);
  const avail=R.salary-R.commit-R.goal;
  const free=avail-total;
  $('#s-budget').innerHTML=`
  <div class="card">
    <div class="row between"><h3 style="margin:0">ميزانية البنود</h3><span class="chip ${free<0?'over':'ok'}">${free<0?'موزّع زيادة':'غير موزّع'} <span class="num">${money(Math.abs(free))}</span></span></div>
    <p class="small muted" style="margin:6px 0 10px">وزّعت <span class="num">${money(total)}</span> من <span class="num">${money(avail)}</span> ${CUR} المتاحين بعد الالتزامات${R.debtInst?' وأقساط الديون':''}${R.goal?' وهدف الادخار':''}.</p>
    <div class="meter"><i class="${free<0?'over':''}" style="width:${avail>0?Math.min(100,total/avail*100):0}%"></i></div>
  </div>
  <div class="card"><div class="list">
    ${cats.map(c=>{const p=Math.round(c.ratio*100);const st=!c.limit?'':c.ratio>1?'over':c.ratio>=.8?'warn':'';
      return `<button class="cat" data-cat="${c.id}" aria-label="عدّل بند ${esc(c.name)}">
      <div class="row" style="width:100%"><div class="item" style="padding:0;border:0;flex:1;min-width:0"><div class="ic" style="background:color-mix(in srgb,${catColor(c.i)} 18%,transparent)">${esc(c.icon)}</div>
      <div class="body"><div class="t">${esc(c.name)}</div><div class="s"><span class="num">${money(c.spent)}</span> من <span class="num">${c.limit?money(c.limit):'بدون حد'}</span>${c.carryIn?` · <span style="color:var(--green)">+<span class="num">${money(c.carryIn)}</span> مرحّل</span>`:''}</div></div></div>
      ${c.limit?`<span class="chip ${st||'ok'}">${st==='over'?'عدّى ':''}${p}%</span>`:''}</div>
      ${c.limit?`<div class="meter" style="width:100%"><i class="${st}" style="width:${Math.min(100,p)}%"></i></div>`:''}
      </button>${c.subs.length?`<div class="subs">${c.subs.map(sb=>{const sp=Math.round(sb.ratio*100);const ss=!sb.limit?'':sb.ratio>1?'over':sb.ratio>=.8?'warn':'';
        return `<div class="sub"><div class="row between"><span class="sub-n">${esc(sb.name)}</span><span class="small"><span class="num">${money(sb.spent)}</span> <span class="muted">/ <span class="num">${sb.limit?money(sb.limit):'—'}</span></span></span></div>
        ${sb.limit?`<div class="meter thin"><i class="${ss}" style="width:${Math.min(100,sp)}%"></i></div>`:''}</div>`}).join('')}
        ${c.general?`<div class="sub"><div class="row between"><span class="sub-n muted">عام (من غير بند فرعي)</span><span class="small num">${money(c.general)}</span></div></div>`:''}</div>`:''}`}).join('')}
  </div></div>
  ${R.unknown?`<div class="alert over"><span class="dot"></span><div>❓ <b>مش معروف</b>: <span class="num">${money(R.unknown)}</span> ${CUR} الشهر ده من الجرد. لو افتكرت فين، افتح المصروف من الرئيسية وانقله لبنده.</div></div>`:''}
  <button class="btn ghost full" data-act="addCat">+ إضافة بند جديد</button>
  <p class="small muted" style="margin:0;text-align:center">اضغط على أي بند علشان تعدّله أو تمسحه أو تضيف تحته بنود فرعية.</p>`;
}

/* ---------- debts ---------- */
function renderDebts(){
  const R=calc(UI.ym), dir=UI.debtDir;
  const all=S.debts.filter(d=>d.dir===dir);
  const open=all.filter(d=>d.paid<d.amt).sort((a,b)=>(a.due||'9').localeCompare(b.due||'9'));
  const done=all.filter(d=>d.paid>=d.amt);
  const cur=curYM(), mName=monthShort(cur);
  const planBlock=d=>{const P=debtPlan(d);if(!P||P.done)return '';const pct=Math.min(100,Math.round(d.paid/d.amt*100));
    return `<div class="plan"><div class="row between small"><span>قسط <b class="num">${money(P.inst)}</b> شهريًا · فاضل <span class="num">${nf.format(P.months)}</span> ${P.months===1?'قسط':'أقساط'}</span><span>${d.dir==='owe'?'تخلص':'يخلص'} <b>${esc(monthName(P.end))}</b></span></div>
      <div class="meter"><i style="width:${pct}%"></i></div>
      ${P.start<=cur?`<button type="button" class="inst-btn" data-inst="${d.id}" aria-pressed="${P.paidNow}">${P.paidNow?'✓ ':''}${d.dir==='owe'?(P.paidNow?'دفعت':'ادفع'):(P.paidNow?'استلمت':'استلم')} قسط ${esc(mName)}</button>`:`<span class="small muted">الأقساط تبدأ ${esc(monthName(P.start))}</span>`}</div>`};
  const row=d=>{const left=d.amt-d.paid;const late=d.due&&d.due<today()&&left>0;
    return `<div class="debt-row"><div class="item"><div class="ic debt-ic">${dir==='owe'?'↗':'↙'}</div>
    <div class="body"><div class="t">${esc(d.name)}</div><div class="s">${d.note?esc(d.note)+' · ':''}${d.paid>0&&left>0?`اتسدد <span class="num">${money(d.paid)}</span> من <span class="num">${money(d.amt)}</span>`:esc(shortDate(d.date))}${d.due&&left>0?` · ${late?'<b style="color:var(--danger)">متأخر</b>':'الميعاد'} ${esc(shortDate(d.due))}`:''}</div></div>
    <span class="amt">${money(left>0?left:d.amt)}</span>
    ${left>0?`<button class="pay-btn" data-pay="${d.id}">سداد</button>`:`<span class="chip done">اتسدد</span>`}
    <button class="del" data-edit-debt="${d.id}" aria-label="عدّل">تعديل</button></div>${left>0?planBlock(d):''}</div>`};
  const P=dir==='owe'?payoffInfo():null;
  const payoff=!P?'':`<div class="card payoff"><h3>امتى تخلص من ديونك؟</h3>
    ${P.end?`<div class="big-when">${esc(monthName(P.end))}</div>`:''}
    <ul class="when-list">
      ${P.planned.length?`<li>اللي ليها أقساط (${nf.format(P.planned.length)}) بتخلص في <b>${esc(monthName(P.lastPlanned))}</b>.</li>`:''}
      ${P.rest>0?(P.free>0?`<li>الديون اللي من غير قسط (<span class="num">${money(P.rest)}</span> ${CUR}): لو حطيت الفايض المتوقع <span class="num">${money(P.free)}</span> ${CUR} عليها كل شهر، تخلص في <b>${esc(monthName(P.restEnd))}</b>.</li>`
        :`<li>الديون اللي من غير قسط (<span class="num">${money(P.rest)}</span> ${CUR}): مفيش فايض متوقع الشهر ده يكفي تسددها. حط لها قسط شهري من "تعديل".</li>`):''}
    </ul></div>`;
  $('#s-debts').innerHTML=`
  <div class="stats">
    <div class="stat debt"><span class="k">عليّا</span><span class="v">${money(R.owe)}<small>${CUR}</small></span></div>
    <div class="stat debt"><span class="k">ليّا</span><span class="v" style="color:var(--green)">${money(R.lent)}<small>${CUR}</small></span></div>
    <div class="stat wide"><div class="row between"><span class="k">الصافي</span><span class="v" style="color:${R.net<0?'var(--warm)':'var(--green)'}">${smoney(R.net)} <small>${CUR}</small></span></div></div>
  </div>
  ${payoff}
  <div class="seg warmseg" role="group" aria-label="نوع الدين">
    <button type="button" data-dir="owe" aria-pressed="${dir==='owe'}">عليّا</button>
    <button type="button" data-dir="lent" aria-pressed="${dir==='lent'}">ليّا</button>
  </div>
  <div class="card"><div class="list">${open.map(row).join('')||`<div class="empty">${dir==='owe'?'مفيش ديون عليك. ممتاز.':'مفيش حد عليه فلوس ليك.'}</div>`}</div>
    ${done.length?`<details><summary>المسدد (${nf.format(done.length)})</summary><div class="list">${done.map(row).join('')}</div></details>`:''}
  </div>
  <button class="btn warmb full" data-act="addDebt">+ ${dir==='owe'?'دين عليّا':'دين ليّا'}</button>`;
}

/* ---------- commitments ---------- */
function renderCommit(){
  const R=calc(UI.ym), ym=UI.ym;
  const gams=S.coms.filter(c=>c.type==='gam'), bills=S.coms.filter(c=>c.type==='bill');
  const check=(id,paid,label)=>`<button class="check" data-paid="${id}" aria-pressed="${paid}" aria-label="${label}"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></button>`;
  const gRow=c=>{const i=ymDiff(ym,c.start)+1;const on=comActive(c,ym);const paid=(c.paid||[]).includes(ym);const turnNow=on&&i===c.turn;
    const st=!c.active?'<span class="chip done">موقوفة</span>':i<1?'<span class="chip done">لسه مابدأتش</span>':i>c.months?'<span class="chip done">خلصت</span>':turnNow?'<span class="chip warm">دورك تقبض</span>':`<span class="chip ok">شهر ${nf.format(i)} من ${nf.format(c.months)}</span>`;
    const dots=Array.from({length:c.months},(_,k)=>`<i class="${k+1<i?'paid':''} ${k+1===c.turn?'turn':''} ${k+1===i?'now':''}"></i>`).join('');
    return `<div class="item" style="align-items:flex-start">${on?check(c.id,paid,paid?'اتدفع قسط الشهر':'علّم إن قسط الشهر اتدفع'):'<div class="ic">🤝</div>'}<div class="body"><div class="t">${esc(c.name)}</div>
      <div class="s"><span class="num">${money(c.amt)}</span> شهريًا${c.due?` يوم ${nf.format(c.due)}`:''} · دورك ${esc(monthName(ymAdd(c.start,c.turn-1)))} · القبض <span class="num">${money(c.amt*c.months)}</span></div>
      <div class="dots" aria-hidden="true">${dots}</div>
      ${turnNow?`<button type="button" class="inst-btn" data-got="${c.id}" aria-pressed="${!!c.got[ym]}" style="margin-top:8px">${c.got[ym]?'✓ قبضت':'قبضت الجمعية'}</button>`:''}</div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">${st}<button class="del" data-edit-com="${c.id}">تعديل</button></div></div>`};
  const bRow=c=>{const paid=(c.paid||[]).includes(ym);
    return `<div class="item">${check(c.id,paid,paid?'اتدفعت':'علّم إنها اتدفعت')}
      <div class="body"><div class="t">${esc(c.name)}</div><div class="s">${c.active?(c.due?`بتتدفع يوم ${nf.format(c.due)}`:'شهرية'):'موقوفة'} · ${paid?'اتدفعت':'لسه'}</div></div>
      <span class="amt">${money(c.amt)}</span><button class="del" data-edit-com="${c.id}">تعديل</button></div>`};
  $('#s-commit').innerHTML=`
  <div class="card"><div class="row between"><div><span class="small muted">بيتخصم من المتبقي ${ym===curYM()?'الشهر ده':'في '+esc(monthName(ym))}</span>
    <div class="num" style="font-size:24px;font-weight:600">${money(R.commit)} <small class="muted" style="font-size:13px;font-weight:400">${CUR}</small></div></div>
    <span class="chip ok">${R.salary?Math.round(R.commit/R.salary*100):0}% من الدخل</span></div>
    ${S.cashSet?'<p class="small muted" style="margin:8px 0 0">لما تعلّم ✓ إن حاجة اتدفعت، المبلغ بيتخصم من رصيدك.</p>':''}</div>
  <div class="card"><h3>الجمعيات</h3><div class="list">${gams.map(gRow).join('')||'<div class="empty">مفيش جمعيات.</div>'}</div></div>
  ${(()=>{const ds=S.debts.filter(d=>instDue(d,ym)>0);return ds.length?`<div class="card"><h3>أقساط الديون</h3><div class="list">${ds.map(d=>{const P=debtPlan(d);const paid=!!(d.instPay||{})[ym];return `<div class="item"><div class="ic debt-ic">↗</div><div class="body"><div class="t">${esc(d.name)}</div><div class="s">${paid?'اتدفع قسط الشهر':'لسه'}${P&&!P.done?` · تخلص ${esc(monthName(P.end))}`:''}</div></div><span class="amt">${money(instDue(d,ym))}</span><a class="del" href="#debts" data-act="debts">الديون</a></div>`}).join('')}</div></div>`:''})()}
  <div class="card"><h3>الفواتير الشهرية</h3><div class="list">${bills.map(bRow).join('')||'<div class="empty">مفيش فواتير.</div>'}</div></div>
  <div class="btn-row"><button class="btn ghost" data-act="addGam">+ جمعية</button><button class="btn ghost" data-act="addBill">+ فاتورة</button></div>`;
}

/* ---------- sheets ---------- */
const sheet=$('#sheet');
sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close()});
function openSheet(title,body,onSubmit,onReady){
  if(sheet.open)sheet.close();
  sheet.innerHTML=`<form novalidate><div class="grab"></div><div class="row between"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="إغلاق"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>${body}<p class="err" id="err" hidden></p></form>`;
  const f=sheet.querySelector('form');
  f.querySelector('[data-close]').onclick=()=>sheet.close();
  f.addEventListener('submit',e=>{e.preventDefault();const msg=onSubmit(f);if(typeof msg==='string'){showErr(f,msg);return}if(msg===false)return;save();sheet.close();render();if(msg&&msg.toast)toast(msg.toast)});
  sheet.showModal();
  onReady&&onReady(f);
}
const showErr=(f,m)=>{const er=$('#err',f);er.textContent=m;er.hidden=false};
function done(t){save();if(sheet.open)sheet.close();render();if(t)toast(t)}
function arm(btn,fn,label='اضغط تاني للتأكيد'){
  btn.addEventListener('click',()=>{if(btn.dataset.armed){fn();return}const t=btn.textContent;btn.dataset.armed='1';btn.textContent=label;setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent=t}},3500)});
}
function picker(f,name,val,onChange){$$(`[data-pick="${name}"]`,f).forEach(b=>{b.setAttribute('aria-pressed',b.dataset.v===val);b.onclick=()=>{$$(`[data-pick="${name}"]`,f).forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');f.dataset[name]=b.dataset.v;onChange&&onChange()}});f.dataset[name]=val??''}
function toast(t){$$('.toast').forEach(x=>x.remove());const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}

function frequent(){
  const from=addDays(today(),-90);const m=new Map();
  S.exp.filter(x=>x.date>=from&&x.cat!==UNK&&catById(x.cat)).forEach(x=>{const k=[x.cat,x.sub||'',x.amt,x.note||''].join('|');const o=m.get(k)||{n:0,last:'',x};o.n++;if(x.date>o.last)o.last=x.date;m.set(k,o)});
  return [...m.values()].filter(o=>o.n>=2).sort((a,b)=>b.n-a.n||b.last.localeCompare(a.last)).slice(0,4).map(o=>{const c=catById(o.x.cat);return {...o.x,label:o.x.note||subName(c,o.x.sub)||c.name,icon:c.icon}});
}
function txSheet(opts={}){
  const edit=opts.edit||null;let kind=opts.kind||'exp';
  const src=edit||opts.prefill||{};
  const def=edit?edit.date:(UI.ym===curYM()?today():`${UI.ym}-01`);
  const quick=edit?[]:frequent();
  const cats=S.cats.concat(edit&&edit.cat===UNK?[catById(UNK)]:[]);
  openSheet(edit?(kind==='inc'?'تعديل دخل':'تعديل مصروف'):'سجّل حركة',`
    ${edit?'':`<div class="seg" role="group" aria-label="نوع الحركة"><button type="button" data-pick="kind" data-v="exp">مصروف</button><button type="button" data-pick="kind" data-v="inc">دخل إضافي</button></div>`}
    <div class="field" id="quick" ${quick.length?'':'hidden'}><span>متكرر، اضغط علشان تسجّله</span><div class="picks">${quick.map((q,i)=>`<button type="button" class="pick" data-q="${i}">${esc(q.icon)} ${esc(q.label)} · <span class="num">${money(q.amt)}</span></button>`).join('')}</div></div>
    <label class="field"><span>المبلغ (${CUR})</span><input class="input amount" id="f-amt" inputmode="decimal" autocomplete="off" placeholder="0" value="${src.amt||''}"></label>
    <div id="catBlock"><div class="field"><span>البند</span><div class="picks">${cats.map(c=>`<button type="button" class="pick" data-pick="cat" data-v="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div></div>
    <div class="field" id="subField" hidden style="margin-top:12px"><span>البند الفرعي</span><div class="picks" id="subPicks"></div></div></div>
    <div class="two"><label class="field"><span>ملاحظة</span><input class="input" id="f-note" placeholder="اختياري" value="${esc(src.note||'')}"></label>
    <label class="field"><span>التاريخ</span><input class="input" id="f-date" type="date" value="${def}"></label></div>
    <p class="small muted" id="cashHint" style="margin:-4px 0 0"></p>
    <button class="btn full">${edit?'حفظ':'سجّل'}</button>`,
  f=>{const a=toNum($('#f-amt',f).value);if(!(a>0))return 'اكتب مبلغ أكبر من صفر.';
    const date=$('#f-date',f).value||today(),note=$('#f-note',f).value.trim();kind=f.dataset.kind||kind;
    if(kind==='inc'){
      if(edit){revertCash(edit,1);Object.assign(edit,{amt:a,note,date});applyCash(edit,1)}
      else{const r={id:uid(),amt:a,note,date};applyCash(r,1);S.inc.push(r)}
      UI.ym=date.slice(0,7);return {toast:'اتسجل الدخل'};
    }
    if(!f.dataset.cat)return 'اختار البند.';
    const cc=catById(f.dataset.cat);const sub=cc&&cc.subs&&cc.subs.length&&f.dataset.sub?f.dataset.sub:undefined;
    if(edit){const wasUnk=edit.cat===UNK;if(!wasUnk)revertCash(edit,-1);Object.assign(edit,{amt:a,cat:f.dataset.cat,sub,note,date});if(!wasUnk)applyCash(edit,-1);if(!sub)delete edit.sub}
    else{const r={id:uid(),amt:a,cat:f.dataset.cat,sub,note,date};if(!sub)delete r.sub;applyCash(r,-1);S.exp.push(r)}
    UI.ym=date.slice(0,7);
    const c=calc(UI.ym).byCat.find(x=>x.id===f.dataset.cat);
    return {toast:c&&c.limit&&c.ratio>1?`اتسجل. ${c.name} عدّى ميزانيته`:c&&c.limit&&c.ratio>=.8?`اتسجل. ${c.name} قرّب يخلص`:(edit?'اتحفظ':'اتسجل المصروف')}},
  f=>{
    const subs=()=>{const c=catById(f.dataset.cat),list=(c&&c.subs)||[];$('#subField',f).hidden=!list.length;
      $('#subPicks',f).innerHTML=list.map(x=>`<button type="button" class="pick" data-pick="sub" data-v="${x.id}">${esc(x.name)}</button>`).join('')+(list.length?`<button type="button" class="pick" data-pick="sub" data-v="">عام</button>`:'');
      picker(f,'sub',src.sub&&list.some(x=>x.id===src.sub)?src.sub:(list[0]?list[0].id:''))};
    const hint=()=>{const h=$('#cashHint',f);const d=$('#f-date',f).value||today();const k=f.dataset.kind||kind;
      if(edit&&edit.cat===UNK){h.textContent='ده فرق جرد. لو افتكرت هو اتصرف في إيه، غيّر البند. رصيدك مش هيتغيّر.';return}
      h.textContent=S.cashSet?(cashOn(d)?(k==='inc'?'هيتضاف لرصيدك.':'هيتخصم من رصيدك.'):'التاريخ قبل آخر تسجيل للرصيد، فمش هيأثر عليه.'):''};
    const mode=()=>{const k=f.dataset.kind||kind;$('#catBlock',f).hidden=k==='inc';$('#quick',f).hidden=k==='inc'||!quick.length;hint()};
    picker(f,'cat',src.cat||opts.cat||S.cats[0]?.id,subs);subs();
    if(!edit)picker(f,'kind',kind,mode);else f.dataset.kind=kind;
    mode();$('#f-date',f).addEventListener('input',hint);
    $$('[data-q]',f).forEach(b=>b.onclick=()=>{const q=quick[+b.dataset.q];const r={id:uid(),amt:q.amt,cat:q.cat,sub:q.sub,note:q.note,date:today()};if(!r.sub)delete r.sub;applyCash(r,-1);S.exp.push(r);UI.ym=curYM();done(`اتسجل: ${q.label} ${money(q.amt)}`)});
    setTimeout(()=>{const i=$('#f-amt',f);if(i&&!edit)i.focus()},60)});
}
function itemSheet(kind,id){
  const list=kind==='inc'?S.inc:S.exp;const r=list.find(x=>x.id===id);if(!r)return;
  const c=kind==='exp'?catById(r.cat)||{icon:'❔',name:'—'}:null;const sn=c?subName(c,r.sub):'';const unk=kind==='exp'&&r.cat===UNK;
  openSheet(kind==='inc'?'دخل إضافي':(unk?'فلوس مش معروفة':'مصروف'),`
    <div class="detail"><div class="d-amt num ${kind==='inc'?'inc-amt':''}">${kind==='inc'?'+':''}${money(r.amt)} <small>${CUR}</small></div>
      <div class="d-meta">${kind==='inc'?'💰 دخل إضافي':`${esc(c.icon)} ${esc(c.name)}${sn?' · '+esc(sn):''}`} · ${esc(dayName(r.date))}</div>
      ${r.note?`<div class="d-note">${esc(r.note)}</div>`:''}
      ${unk?'<p class="small" style="margin:6px 0 0">الفلوس دي طلعت ناقصة في الجرد. لو افتكرت راحت فين، اضغط "انقله لبنده" واختار البند. ممكن تقسمها على أكتر من بند.</p>':''}</div>
    ${unk?`<button type="button" class="btn full" id="it-split">انقله لبنده</button>`:`<div class="btn-row">${kind==='exp'?'<button type="button" class="btn ghost" id="it-again">كرّره النهارده</button>':''}<button type="button" class="btn ghost" id="it-edit">تعديل</button></div>`}
    <button type="button" class="btn dangerb full" id="it-del">مسح</button>`,()=>false,
  f=>{
    const ag=$('#it-again',f);ag&&(ag.onclick=()=>{const n={...r,id:uid(),date:today()};delete n.cx;applyCash(n,-1);S.exp.push(n);UI.ym=curYM();done('اتسجل تاني النهارده')});
    const ed=$('#it-edit',f);ed&&(ed.onclick=()=>txSheet({edit:r,kind}));
    const sp=$('#it-split',f);sp&&(sp.onclick=()=>splitSheet(r));
    arm($('#it-del',f),()=>{if(kind==='inc'){revertCash(r,1);S.inc=S.inc.filter(x=>x!==r)}else{if(!unk)revertCash(r,-1);S.exp=S.exp.filter(x=>x!==r)}done('اتمسح')},unk?'اضغط تاني: الرصيد مش هيتغيّر':'اضغط تاني للتأكيد');
  });
}
/* move part (or all) of an "unknown" amount into a real category */
function splitSheet(r){
  openSheet('افتكرت راحت فين؟',`<p class="muted" style="margin:0">من <span class="num">${money(r.amt)}</span> ${CUR} مش معروفين. اكتب اللي افتكرته، والباقي يفضل "مش معروف".</p>
    <label class="field"><span>المبلغ</span><input class="input amount" id="f-amt" inputmode="decimal" value="${r.amt}"></label>
    <div class="field"><span>البند</span><div class="picks">${S.cats.map(c=>`<button type="button" class="pick" data-pick="cat" data-v="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div></div>
    <label class="field"><span>ملاحظة</span><input class="input" id="f-note" placeholder="مثلاً: شحن رصيد"></label>
    <button class="btn full">انقل</button>`,
  f=>{const a=toNum($('#f-amt',f).value);if(!(a>0))return 'اكتب مبلغ أكبر من صفر.';if(a>r.amt+.001)return `أكبر من المبلغ المش معروف (${money(r.amt)}).`;if(!f.dataset.cat)return 'اختار البند.';
    const n={id:uid(),amt:a,cat:f.dataset.cat,note:$('#f-note',f).value.trim()||'من فرق الجرد',date:r.date,cx:0};S.exp.push(n);
    r.amt-=a;if(r.amt<0.5)S.exp=S.exp.filter(x=>x!==r);return {toast:r.amt<0.5?'اتنقل كله لبنده':`اتنقل. فاضل ${money(r.amt)} مش معروف`}},
  f=>picker(f,'cat',S.cats[0]?.id));
}
function searchSheet(){
  openSheet('كل الحركات',`
    <input class="input" id="q" type="search" placeholder="ابحث بالملاحظة أو البند" autocomplete="off">
    <div class="picks scroll-x">${[{id:'',icon:'',name:'الكل'},...S.cats,catById(UNK),{id:'inc',icon:'💰',name:'دخل'}].map(c=>`<button type="button" class="pick" data-pick="qc" data-v="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div>
    <div class="seg"><button type="button" data-pick="qs" data-v="m">${esc(monthName(UI.ym))}</button><button type="button" data-pick="qs" data-v="all">كل الشهور</button></div>
    <div class="row between small muted"><span id="qcount"></span><span id="qsum"></span></div>
    <div class="list" id="qres"></div>`,()=>false,
  f=>{const run=()=>{const q=$('#q',f).value.trim().toLowerCase(),cat=f.dataset.qc||'',all=f.dataset.qs==='all';
      let items=[...S.exp.map(x=>({...x,_k:'exp'})),...S.inc.map(x=>({...x,_k:'inc'}))];
      if(!all)items=items.filter(x=>x.date.startsWith(UI.ym));
      if(cat==='inc')items=items.filter(x=>x._k==='inc');else if(cat)items=items.filter(x=>x.cat===cat);
      if(q)items=items.filter(x=>{const c=x._k==='exp'?catById(x.cat):null;return [x.note,c&&c.name,c&&subName(c,x.sub),String(x.amt)].join(' ').toLowerCase().includes(q)});
      items.sort((a,b)=>b.date.localeCompare(a.date));
      $('#qcount',f).textContent=`${nf.format(items.length)} حركة`;
      const se=sum(items.filter(x=>x._k==='exp')),si=sum(items.filter(x=>x._k==='inc'));
      $('#qsum',f).textContent=`صرف ${money(se)}${si?` · دخل ${money(si)}`:''}`;
      $('#qres',f).innerHTML=items.slice(0,200).map(txRow).join('')||'<div class="empty">مفيش نتايج.</div>'};
    picker(f,'qc','',run);picker(f,'qs','m',run);$('#q',f).addEventListener('input',run);run()});
}
function salarySheet(){
  openSheet('الراتب ويوم القبض',`<label class="field"><span>صافي الراتب (${CUR})</span><input class="input amount" id="f-sal" inputmode="decimal" value="${S.salary||''}" placeholder="0"></label>
    <label class="field"><span>يوم القبض في الشهر</span><input class="input" id="f-pay" inputmode="numeric" value="${S.payday||''}" placeholder="مثلاً 25"></label>
    <label class="toggle"><span>ضيف الراتب لرصيدي تلقائيًا يوم القبض</span><input type="checkbox" id="f-auto" ${S.autoSalary?'checked':''}></label>
    <button class="btn full">حفظ</button>`,
  f=>{const a=toNum($('#f-sal',f).value);if(!(a>=0))return 'اكتب رقم صحيح.';const pv=$('#f-pay',f).value.trim();const p=pv?Math.round(toNum(pv)):0;if(pv&&!(p>=1&&p<=31))return 'يوم القبض بين 1 و 31.';
    S.salary=a;S.payday=p;S.autoSalary=$('#f-auto',f).checked;if(S.cashSet&&p&&clampDay(curYM(),p)<=today()&&!S.salaryIn[curYM()])S.salaryIn[curYM()]=1;return {toast:'اتحفظ'}},f=>$('#f-sal',f).select());
}
function cashSheet(){
  openSheet(S.cashSet?'عدّل رصيدك':'سجّل رصيدك',`<p class="muted" style="margin:0">اكتب الفلوس اللي معاك كلها دلوقتي: كاش + بنك + محافظ.</p>
    <label class="field"><span>معايا (${CUR})</span><input class="input amount" id="f-cash" inputmode="decimal" value="${S.cashSet?Math.round(S.cash):''}" placeholder="0"></label>
    ${S.cashSet?'<p class="small muted" style="margin:0">لو عايز تعرف الفرق بين اللي معاك واللي المفروض يكون معاك، استخدم "جرد" بدل التعديل.</p>':`<label class="field"><span>يوم القبض في الشهر</span><input class="input" id="f-pay" inputmode="numeric" value="${S.payday||''}" placeholder="مثلاً 25"></label>`}
    <button class="btn full">حفظ</button>`,
  f=>{const a=toNum($('#f-cash',f).value);if(isNaN(a))return 'اكتب رقم.';
    const pi=$('#f-pay',f);if(pi&&pi.value.trim()){const p=Math.round(toNum(pi.value));if(!(p>=1&&p<=31))return 'يوم القبض بين 1 و 31.';S.payday=p}
    S.cash=a;S.cashSet=true;S.cashDate=today();S.sample=false;
    if(S.payday&&clampDay(curYM(),S.payday)<=today())S.salaryIn[curYM()]=1;
    if(!S.recon.length)S.recon.push({id:uid(),date:today(),expected:a,actual:a,gap:0,start:true});
    return {toast:'اتسجل رصيدك. من هنا كل حركة هتتخصم أو تتضاف عليه.'}},f=>$('#f-cash',f).select());
}
function goalSheet(){
  openSheet('هدف الادخار الشهري',`<p class="muted" style="margin:0">المبلغ اللي عايز يفضل معاك كل شهر. هيتشال من المسموح تصرفه يوميًا.</p>
    <label class="field"><span>الهدف (${CUR})</span><input class="input amount" id="f-goal" inputmode="decimal" value="${S.goal||''}" placeholder="0"></label><button class="btn full">حفظ</button>`,
  f=>{const v=$('#f-goal',f).value.trim();const a=v?toNum(v):0;if(isNaN(a)||a<0)return 'اكتب رقم صحيح.';S.goal=a;return {toast:a?'اتحفظ الهدف':'اتشال الهدف'}},f=>$('#f-goal',f).select());
}
/* جرد: compare what you actually have with what the app expects.
   mode "since": from the last reconciliation (expected = tracked balance).
   mode "month": from payday (expected = money before salary + income − everything recorded as going out). */
function periodStart(){
  if(S.payday){let d=clampDay(curYM(),S.payday);if(d>today())d=clampDay(ymAdd(curYM(),-1),S.payday);return d}
  return curYM()+'-01';
}
function monthFlow(start){
  const t=today(),inP=d=>!!d&&d>=start&&d<=t;
  const months=[];for(let ym=start.slice(0,7);ym<=curYM();ym=ymAdd(ym,1))months.push(ym);
  const exp=sum(S.exp.filter(x=>inP(x.date)));
  const inc=sum(S.inc.filter(x=>inP(x.date)));
  let coms=0,gamIn=0;S.coms.forEach(c=>months.forEach(ym=>{
    const dd=c.due?clampDay(ym,c.due):null;const within=dd?inP(dd):ym===curYM();
    if((c.paid||[]).includes(ym)&&within)coms+=c.amt;
    if(c.got&&c.got[ym]&&within)gamIn+=c.amt*c.months}));
  let instOut=0,instIn=0;S.debts.forEach(d=>months.forEach(ym=>{const a=(d.instPay||{})[ym];if(!a)return;
    const dd=clampDay(ym,d.instDay||S.payday||1);if(!(inP(dd)||ym===curYM()))return;if(d.dir==='owe')instOut+=a;else instIn+=a}));
  const lentNew=S.debts.filter(d=>d.dir==='lent'&&inP(d.date));
  const borrowed=S.debts.filter(d=>d.dir==='owe'&&inP(d.date));
  return {exp,inc,coms,gamIn,instOut,instIn,lentNew,borrowed};
}
/* the "help me remember" block shared by both modes */
function rememberBlock(since){
  const silent=silentDays(since).slice(-12);
  return `<div id="rc-help" hidden>
      <p class="small" style="margin:0 0 6px"><b>قبل ما تقفل، حاول تفتكر.</b> من ${esc(dayName(since))}:</p>
      ${silent.length?`<p class="small muted" style="margin:0 0 6px">أيام مسجّلتش فيها ولا مصروف (${nf.format(silentDays(since).length)}): ${silent.map(d=>`<button type="button" class="day-chip" data-day="${d}">${esc(shortDate(d))}</button>`).join(' ')}</p>`:''}
      <p class="small muted" style="margin:0 0 6px">حاجات الناس بتنساها كتير، اضغط على اللي حصل وسجّله:</p>
      <div class="picks">${FORGOT.map((x,i)=>`<button type="button" class="pick" data-forgot="${i}">${x[0]} ${esc(x[1])}</button>`).join('')}</div>
      <div id="rc-add" class="rc-add" hidden><div class="two"><input class="input" id="rc-amt" inputmode="decimal" placeholder="المبلغ" aria-label="المبلغ"><select class="input" id="rc-cat" aria-label="البند">${S.cats.map(c=>`<option value="${c.id}">${esc(c.icon)} ${esc(c.name)}</option>`).join('')}</select></div>
        <div class="two"><input class="input" id="rc-note" placeholder="ملاحظة" aria-label="ملاحظة"><input class="input" id="rc-date" type="date" value="${today()}" aria-label="التاريخ"></div>
        <button type="button" class="btn ghost full" id="rc-save">سجّله</button></div>
      <p class="small" id="rc-added" style="margin:8px 0 0"></p>
    </div>`;
}
function wireRemember(f,onAdd){
  let added=0;
  $$('[data-forgot]',f).forEach(b=>b.onclick=()=>{const x=FORGOT[+b.dataset.forgot];$('#rc-add',f).hidden=false;$('#rc-note',f).value=x[1];$('#rc-amt',f).focus()});
  $$('[data-day]',f).forEach(b=>b.onclick=()=>{$('#rc-add',f).hidden=false;$('#rc-date',f).value=b.dataset.day;$('#rc-note',f).value='';$('#rc-amt',f).focus()});
  $('#rc-save',f).onclick=()=>{const a=toNum($('#rc-amt',f).value);if(!(a>0)){$('#rc-amt',f).focus();return}
    const r={id:uid(),amt:a,cat:$('#rc-cat',f).value,note:$('#rc-note',f).value.trim(),date:$('#rc-date',f).value||today(),cx:0};
    S.exp.push(r);onAdd(r);added+=a;save();
    $('#rc-added',f).innerHTML=`سجّلت <b class="num">${money(added)}</b> ${CUR}. الفرق قلّ.`;$('#rc-amt',f).value='';$('#rc-add',f).hidden=true};
}
const gapHtml=gap=>Math.abs(gap)<0.5?'مظبوط. كل فلوسك متسجلة.':gap<0?`ناقص <b class="num">${money(-gap)}</b> ${CUR} مش متسجلين`:`معاك <b class="num">${money(gap)}</b> ${CUR} زيادة عن المتسجل`;
function closeRecon(actual,expected,since,label){
  const gap=actual-expected;
  if(gap<-0.5)S.exp.push({id:uid(),amt:-gap,cat:UNK,note:`فرق ${label} من ${shortDate(since)}`,date:today(),cx:0});
  else if(gap>0.5)S.inc.push({id:uid(),amt:gap,note:`زيادة في ${label} من ${shortDate(since)}`,date:today(),cx:0});
  S.recon.push({id:uid(),date:today(),since,expected,actual,gap});
  S.cash=actual;S.cashSet=true;if(!S.cashDate)S.cashDate=today();
  return {toast:Math.abs(gap)<0.5?'مظبوط بالمليم. مفيش فلوس ضايعة.':gap<0?`اتسجل ${money(-gap)} مش معروف. لو افتكرت، انقله لبنده.`:`معاك ${money(gap)} زيادة، اتسجلت دخل.`};
}
const modeSeg=m=>`<div class="seg" role="group" aria-label="نوع الجرد"><button type="button" data-rmode="month" aria-pressed="${m==='month'}">من يوم القبض</button><button type="button" data-rmode="since" aria-pressed="${m==='since'}">من آخر جرد</button></div>`;
function wireModeSeg(f){$$('[data-rmode]',f).forEach(b=>b.onclick=()=>b.dataset.rmode==='month'?reconMonthSheet():reconSheet('since'))}
function reconSheet(mode){
  if(!S.cashSet&&mode!=='month'){reconMonthSheet();return}
  if(!mode)mode=S.recon.filter(r=>!r.start).length?'since':'month';
  if(mode==='month'){reconMonthSheet();return}
  const since=reconSince();
  openSheet('جرد',`${modeSeg('since')}
    <p class="muted small" style="margin:0">من آخر جرد (${esc(dayName(since))}). عدّ الفلوس اللي معاك فعلًا دلوقتي (كاش + بنك + محافظ) واكتبها.</p>
    <div class="recon-top"><div><small>المفروض معاك</small><b class="num" id="rc-exp">${money(S.cash)}</b></div><div><small>معاك فعلًا</small><input class="input amount" id="f-act" inputmode="decimal" placeholder="0" aria-label="معاك فعلًا"></div></div>
    <div id="rc-gap" class="rc-gap" hidden></div>
    ${rememberBlock(since)}
    <button class="btn full">اقفل الجرد</button>`,
  f=>{const a=toNum($('#f-act',f).value);if(isNaN(a))return 'اكتب الفلوس اللي معاك فعلًا.';return closeRecon(a,S.cash,since,'جرد')},
  f=>{wireModeSeg(f);const act=$('#f-act',f);
    const upd=()=>{$('#rc-exp',f).textContent=money(S.cash);const v=toNum(act.value);const g=$('#rc-gap',f),h=$('#rc-help',f);
      if(isNaN(v)){g.hidden=true;h.hidden=true;return}const gap=v-S.cash;g.hidden=false;
      g.className='rc-gap '+(Math.abs(gap)<0.5?'ok':gap<0?'bad':'plus');g.innerHTML=gapHtml(gap);h.hidden=!(gap<-0.5)};
    act.addEventListener('input',upd);act.focus();
    wireRemember(f,r=>{S.cash-=r.amt;upd()})});
}
function reconMonthSheet(){
  const start=periodStart();
  const F0=monthFlow(start);
  const lastBefore=S.recon.filter(r=>r.date<start&&!r.start).pop();
  const dl=(d,sign)=>`<label class="flow-row chk ${sign<0?'out':''}"><input type="checkbox" data-debt="${d.id}" checked><span>${sign>0?'استلفت من':'سلّفت'} ${esc(d.name)} <small class="muted">${esc(shortDate(d.date))}</small></span><b class="num"><bdi dir="ltr">${sign>0?'+':'−'}${money(d.amt)}</bdi></b></label>`;
  openSheet('جرد الشهر',`${modeSeg('month')}
    <p class="muted small" style="margin:0">من يوم القبض لحد النهارده. التطبيق بيحسب الفلوس اللي المفروض تكون معاك من اللي اتسجل، ويقارنها باللي معاك فعلًا.</p>
    <div class="flow">
      <label class="flow-row"><span>بداية الفترة</span><input class="input mini" type="date" id="m-start" value="${start}"></label>
      <label class="flow-row"><span>كان معاك قبل الراتب</span><input class="input mini" id="m-before" inputmode="decimal" placeholder="0" value="${lastBefore?Math.round(lastBefore.actual):''}"></label>
      <label class="flow-row chk"><input type="checkbox" id="m-sal" checked><span>الراتب</span><input class="input mini" id="m-salv" inputmode="decimal" value="${S.salary||''}" aria-label="الراتب"></label>
      <div class="flow-row" id="m-inc-row"><span>دخل إضافي</span><b class="num" id="m-inc"></b></div>
      <div class="flow-row" id="m-gam-row"><span>قبض جمعية</span><b class="num" id="m-gam"></b></div>
      <div class="flow-row" id="m-instin-row"><span>أقساط استلمتها</span><b class="num" id="m-instin"></b></div>
      <div id="m-borrow">${F0.borrowed.map(d=>dl(d,1)).join('')}</div>
      <div class="flow-row out"><span>مصروفات متسجلة</span><b class="num" id="m-exp"></b></div>
      <div class="flow-row out" id="m-coms-row"><span>التزامات علّمت إنها اتدفعت</span><b class="num" id="m-coms"></b></div>
      <div class="flow-row out" id="m-inst-row"><span>أقساط ديون دفعتها</span><b class="num" id="m-inst"></b></div>
      <div id="m-lent">${F0.lentNew.map(d=>dl(d,-1)).join('')}</div>
      <div class="flow-row total"><span>المفروض معاك</span><b class="num" id="m-expct"></b></div>
    </div>
    <label class="field"><span>معاك فعلًا دلوقتي (كاش + بنك + محافظ)</span><input class="input amount" id="f-act" inputmode="decimal" value="${S.cashSet?Math.round(S.cash):''}" placeholder="0"></label>
    <div id="rc-gap" class="rc-gap" hidden></div>
    <p class="small muted" style="margin:0">مش داخل في الحساب: الالتزامات اللي لسه متعلّمتش ✓، لأنها لسه مطلعتش من جيبك.</p>
    ${rememberBlock(start)}
    <button class="btn full">اقفل جرد الشهر</button>`,
  f=>{const r=compute(f);if(isNaN(r.actual))return 'اكتب الفلوس اللي معاك فعلًا.';
    if($('#m-sal',f).checked&&S.payday){for(let ym=r.start.slice(0,7);ym<=curYM();ym=ymAdd(ym,1))if(clampDay(ym,S.payday)<=today())S.salaryIn[ym]=1}
    S.cashDate=today();return closeRecon(r.actual,r.expected,r.start,'جرد الشهر')},
  f=>{wireModeSeg(f);
    window.__mf=f;
    const show=(id,v,sign)=>{const row=$('#'+id+'-row',f);if(row)row.hidden=!v;$('#'+id,f).innerHTML=`<bdi dir="ltr">${sign>0?'+':'−'}${money(v)}</bdi>`};
    const upd=()=>{const r=compute(f);
      show('m-inc',r.F.inc,1);show('m-gam',r.F.gamIn,1);show('m-instin',r.F.instIn,1);
      $('#m-exp',f).innerHTML=`<bdi dir="ltr">−${money(r.F.exp)}</bdi>`;show('m-coms',r.F.coms,-1);show('m-inst',r.F.instOut,-1);
      $('#m-expct',f).innerHTML=smoney(r.expected);
      const g=$('#rc-gap',f),h=$('#rc-help',f);if(isNaN(r.actual)){g.hidden=true;h.hidden=true;return}
      const gap=r.actual-r.expected;g.hidden=false;g.className='rc-gap '+(Math.abs(gap)<0.5?'ok':gap<0?'bad':'plus');g.innerHTML=gapHtml(gap);h.hidden=!(gap<-0.5)};
    f.addEventListener('input',upd);f.addEventListener('change',e=>{if(e.target.id==='m-start'){const st=e.target.value||start;const F=monthFlow(st);$('#m-borrow',f).innerHTML=F.borrowed.map(d=>dl(d,1)).join('');$('#m-lent',f).innerHTML=F.lentNew.map(d=>dl(d,-1)).join('')}upd()});
    wireRemember(f,()=>upd());upd()});
  function compute(f){
    const st=$('#m-start',f).value||start;const F=monthFlow(st);
    const before=toNum($('#m-before',f).value)||0;const sal=$('#m-sal',f).checked?(toNum($('#m-salv',f).value)||0):0;
    let debtNet=0;$$('[data-debt]',f).forEach(cb=>{if(!cb.checked)return;const d=S.debts.find(x=>x.id===cb.dataset.debt);if(d)debtNet+=d.dir==='owe'?d.amt:-d.amt});
    const expected=before+sal+F.inc+F.gamIn+F.instIn-F.exp-F.coms-F.instOut+debtNet;
    return {start:st,F,expected,actual:toNum($('#f-act',f).value)};
  }
}
function catSheet(c){
  const isNew=!c;c=c||{name:'',icon:'📦',limit:'',subs:[]};
  const subRow=x=>`<div class="sub-edit" data-sid="${x.id||''}"><input class="input" data-k="name" value="${esc(x.name||'')}" placeholder="الاسم، مثلاً: فاتورة أمي" aria-label="اسم البند الفرعي"><input class="input" data-k="limit" inputmode="decimal" value="${x.limit||''}" placeholder="الميزانية" aria-label="ميزانية البند الفرعي"><button type="button" class="del" data-rm aria-label="شيل البند الفرعي">✕</button></div>`;
  openSheet(isNew?'بند جديد':'تعديل البند',`
    <label class="field"><span>اسم البند</span><input class="input" id="f-name" value="${esc(c.name)}" placeholder="مثلاً: فواتير الموبايل والنت"></label>
    <label class="field"><span>الميزانية الشهرية (${CUR})</span><input class="input" id="f-lim" inputmode="decimal" value="${c.limit||''}" placeholder="سيبها فاضية لو مش عايز حد"></label>
    <div class="field"><span>البنود الفرعية (اختياري)</span><div id="subList" class="sub-list">${(c.subs||[]).map(subRow).join('')}</div>
      <button type="button" class="link" id="addSub" style="align-self:flex-start">+ بند فرعي</button>
      <span class="small muted" id="subHint"></span></div>
    <label class="toggle"><span>رحّل الفايض للشهر الجاي<br><small class="muted">اللي يفضل من ميزانية البند يتضاف للشهر اللي بعده</small></span><input type="checkbox" id="f-carry" ${c.carry?'checked':''}></label>
    <div class="field"><span>الأيقونة</span><div class="emojis">${ICONS.map(i=>`<button type="button" class="pick" data-pick="icon" data-v="${i}" aria-label="أيقونة ${i}">${i}</button>`).join('')}</div></div>
    <button class="btn full">${isNew?'أضف البند':'حفظ'}</button>
    ${!isNew&&S.cats.length>1?`<button type="button" class="btn dangerb full" id="delCat">مسح البند</button>`:''}`,
  f=>{const name=$('#f-name',f).value.trim();if(!name)return 'اكتب اسم البند.';const v=$('#f-lim',f).value.trim();let lim=v?toNum(v):0;if(isNaN(lim)||lim<0)return 'الميزانية لازم تكون رقم.';
    const subs=[];for(const r of $$('.sub-edit',f)){const n=r.querySelector('[data-k=name]').value.trim(),lv=r.querySelector('[data-k=limit]').value.trim();if(!n&&!lv)continue;if(!n)return 'اكتب اسم كل بند فرعي.';const l=lv?toNum(lv):0;if(isNaN(l)||l<0)return `ميزانية "${n}" لازم تكون رقم.`;subs.push({id:r.dataset.sid||uid(),name:n,limit:l})}
    if(subs.length)lim=sum(subs,x=>x.limit);const carry=$('#f-carry',f).checked;
    if(isNew)S.cats.push({id:uid(),name,icon:f.dataset.icon,limit:lim,subs,carry});
    else{const keep=new Set(subs.map(x=>x.id));S.exp.forEach(x=>{if(x.cat===c.id&&x.sub&&!keep.has(x.sub))delete x.sub});Object.assign(c,{name,icon:f.dataset.icon,limit:lim,subs,carry})}
    return {toast:isNew?'اتضاف البند':'اتحفظ'}},
  f=>{picker(f,'icon',ICONS.includes(c.icon)?c.icon:'📦');
    const list=$('#subList',f),limIn=$('#f-lim',f);
    const sync=()=>{const rows=$$('.sub-edit',list);const has=rows.length>0;const s=rows.reduce((a,r)=>a+(toNum(r.querySelector('[data-k=limit]').value)||0),0);
      limIn.disabled=has;if(has)limIn.value=s||'';$('#subHint',f).textContent=has?`ميزانية البند = مجموع الفرعيين (${money(s)} ${CUR}).`:''};
    list.addEventListener('input',sync);
    list.addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(b){b.parentElement.remove();sync()}});
    $('#addSub',f).onclick=()=>{list.insertAdjacentHTML('beforeend',subRow({}));list.lastElementChild.querySelector('input').focus();sync()};
    sync();const d=$('#delCat',f);if(d){const n=S.exp.filter(x=>x.cat===c.id).length;const to=S.cats.find(x=>x.id!==c.id&&x.name==='أخرى')||S.cats.find(x=>x.id!==c.id);
    arm(d,()=>{S.exp.forEach(x=>{if(x.cat===c.id){x.cat=to.id;delete x.sub}});S.cats=S.cats.filter(x=>x.id!==c.id);done('اتمسح البند')},n?`اضغط تاني: ${n} مصروف هيتنقلوا لـ"${to.name}"`:'اضغط تاني للتأكيد')}});
}
function debtSheet(d,dir){
  const isNew=!d;d=d||{dir,name:'',amt:'',paid:0,note:'',date:today(),due:''};
  openSheet(isNew?(d.dir==='owe'?'دين عليّا':'دين ليّا'):'تعديل الدين',`
    <div class="seg warmseg"><button type="button" data-pick="dir" data-v="owe">عليّا (أنا مدين)</button><button type="button" data-pick="dir" data-v="lent">ليّا (حد مدين لي)</button></div>
    <label class="field"><span>الاسم</span><input class="input" id="f-name" value="${esc(d.name)}" placeholder="مين؟"></label>
    <label class="field"><span>المبلغ (${CUR})</span><input class="input amount" id="f-amt" inputmode="decimal" value="${d.amt}" placeholder="0"></label>
    <label class="field"><span>ملاحظة</span><input class="input" id="f-note" value="${esc(d.note)}" placeholder="اختياري"></label>
    <div class="two"><label class="field"><span>التاريخ</span><input class="input" type="date" id="f-date" value="${d.date}"></label>
    <label class="field"><span>ميعاد السداد</span><input class="input" type="date" id="f-due" value="${d.due||''}"></label></div>
    <div class="two"><label class="field"><span>قسط شهري (اختياري)</span><input class="input" id="f-inst" inputmode="decimal" value="${d.inst||''}" placeholder="مثلاً 20000"></label>
    <label class="field"><span>الأقساط تبدأ شهر</span><input class="input" type="month" id="f-istart" value="${d.instStart||curYM()}"></label></div>
    <label class="field"><span>يوم دفع القسط (اختياري)</span><input class="input" id="f-iday" inputmode="numeric" value="${d.instDay||''}" placeholder="${S.payday?'يوم القبض ('+S.payday+')':'مثلاً 1'}"></label>
    <p class="small muted" id="planHint" style="margin:-4px 0 0"></p>
    ${isNew&&S.cashSet?`<label class="toggle"><span id="cxLbl"></span><input type="checkbox" id="f-cx"></label>`:''}
    <button class="btn warmb full">${isNew?'أضف':'حفظ'}</button>
    ${!isNew?`<div class="btn-row">${d.paid>0?'<button type="button" class="btn ghost" id="unpay">إلغاء السداد</button>':''}<button type="button" class="btn dangerb" id="delDebt">مسح</button></div>`:''}`,
  f=>{const name=$('#f-name',f).value.trim(),a=toNum($('#f-amt',f).value);if(!name)return 'اكتب الاسم.';if(!(a>0))return 'اكتب مبلغ أكبر من صفر.';
    const iv=$('#f-inst',f).value.trim(),inst=iv?toNum(iv):0;if(isNaN(inst)||inst<0)return 'القسط لازم يكون رقم.';
    const ist=$('#f-istart',f).value||curYM();if(inst&&!/^\d{4}-\d{2}$/.test(ist))return 'اختار شهر بداية الأقساط.';
    const idv=$('#f-iday',f).value.trim(),iday=idv?Math.round(toNum(idv)):0;if(idv&&!(iday>=1&&iday<=31))return 'يوم القسط بين 1 و 31.';
    const v={dir:f.dataset.dir,name,amt:a,note:$('#f-note',f).value.trim(),date:$('#f-date',f).value||today(),due:$('#f-due',f).value,inst,instStart:inst?ist:'',instDay:iday||0};
    if(isNew){const nd={id:uid(),paid:0,cxPay:{},cxSum:0,instPay:{},...v};const cx=$('#f-cx',f);if(cx&&cx.checked){nd.openCx=v.dir==='owe'?a:-a;S.cash+=nd.openCx}S.debts.push(nd)}
    else{Object.assign(d,v);d.paid=Math.min(d.paid,a)}UI.debtDir=v.dir;return {toast:'اتحفظ'}},
  f=>{picker(f,'dir',d.dir,()=>{hint();cxl()});
    const cxl=()=>{const l=$('#cxLbl',f);if(!l)return;l.textContent=f.dataset.dir==='owe'?'الفلوس دي دخلت رصيدي (استلفتها دلوقتي)':'الفلوس دي طلعت من رصيدي (سلّفتها دلوقتي)';const cb=$('#f-cx',f);cb.checked=($('#f-date',f).value||today())===today()};
    const del=$('#delDebt',f);del&&arm(del,()=>{S.debts=S.debts.filter(x=>x.id!==d.id);done('اتمسح')},'اضغط تاني: الرصيد مش هيتغيّر');
    const u=$('#unpay',f);u&&(u.onclick=()=>{S.cash-=(d.cxSum||0)+sum(Object.values(d.cxPay||{}),x=>x);d.paid=0;d.instPay={};d.cxPay={};d.cxSum=0;done('اتلغى السداد')});
    const hint=()=>{const a=toNum($('#f-amt',f).value),i=toNum($('#f-inst',f).value),st=$('#f-istart',f).value||curYM();const h=$('#planHint',f);
      if(!(a>0)||!(i>0)){h.textContent='';return}const left=Math.max(0,a-(d.paid||0));const m=Math.ceil(left/i);
      h.innerHTML=`${nf.format(m)} ${m===1?'قسط':m<=10?'أقساط':'قسط'}، ${f.dataset.dir==='lent'?'يخلص':'تخلص'} في <b>${esc(monthName(ymAdd(st>curYM()?st:curYM(),m-1)))}</b>${f.dataset.dir==='owe'?'، والقسط هيتخصم من المتبقي كل شهر':''}.`};
    ['f-amt','f-inst','f-istart'].forEach(id=>$('#'+id,f).addEventListener('input',hint));$('#f-date',f).addEventListener('input',cxl);hint();cxl()});
}
function paySheet(d){
  const left=d.amt-d.paid;
  openSheet(`سداد: ${esc(d.name)}`,`<p class="muted" style="margin:0">فاضل <span class="num">${money(left)}</span> ${CUR} ${d.dir==='owe'?'عليك':'ليك'}.</p>
    <label class="field"><span>المبلغ اللي اتسدد</span><input class="input amount" id="f-amt" inputmode="decimal" value="${left}"></label>
    ${S.cashSet?`<label class="toggle"><span>${d.dir==='owe'?'اتخصم من رصيدي':'اتضاف لرصيدي'}</span><input type="checkbox" id="f-cx" checked></label>`:''}
    <button class="btn warmb full">${d.dir==='owe'?'سددت':'اتسدد لي'}</button>`,
  f=>{const a=toNum($('#f-amt',f).value);if(!(a>0))return 'اكتب مبلغ أكبر من صفر.';if(a>left+0.001)return `أكبر من المتبقي (${money(left)}).`;d.paid+=a;
    const cx=$('#f-cx',f);if(cx&&cx.checked){const v=d.dir==='owe'?-a:a;d.cxSum=(d.cxSum||0)+v;S.cash+=v}
    return {toast:d.paid>=d.amt?'اتسدد بالكامل':'اتسجل سداد جزئي'}},
  f=>$('#f-amt',f).select());
}
function comSheet(c,type){
  const isNew=!c;c=c||{type,name:'',amt:'',active:true,months:10,start:UI.ym,turn:1,due:'',paid:[],cx:{},got:{}};
  const g=c.type==='gam';
  openSheet(isNew?(g?'جمعية جديدة':'فاتورة جديدة'):(g?'تعديل الجمعية':'تعديل الفاتورة'),`
    <label class="field"><span>الاسم</span><input class="input" id="f-name" value="${esc(c.name)}" placeholder="${g?'جمعية الشغل':'فاتورة النت'}"></label>
    <label class="field"><span>${g?'القسط الشهري':'المبلغ الشهري'} (${CUR})</span><input class="input" id="f-amt" inputmode="decimal" value="${c.amt}" placeholder="0"></label>
    ${g?`<div class="two"><label class="field"><span>عدد الشهور</span><input class="input" id="f-months" inputmode="numeric" value="${c.months}"></label>
      <label class="field"><span>دورك في الشهر رقم</span><input class="input" id="f-turn" inputmode="numeric" value="${c.turn}"></label></div>
      <label class="field"><span>بدأت شهر</span><input class="input" id="f-start" type="month" value="${c.start}"></label>`:''}
    <label class="field"><span>يوم الدفع في الشهر</span><input class="input" id="f-due" inputmode="numeric" value="${c.due||''}" placeholder="مثلاً 5 (علشان التذكير والتوقع)"></label>
    <label class="toggle"><span>شغّالة (بتتخصم من المتبقي)</span><input type="checkbox" id="f-active" ${c.active?'checked':''}></label>
    <button class="btn full">${isNew?'أضف':'حفظ'}</button>
    ${!isNew?'<button type="button" class="btn dangerb full" id="delCom">مسح</button>':''}`,
  f=>{const name=$('#f-name',f).value.trim(),a=toNum($('#f-amt',f).value);if(!name)return 'اكتب الاسم.';if(!(a>0))return 'اكتب مبلغ أكبر من صفر.';
    const v={name,amt:a,active:$('#f-active',f).checked};
    if(g){const m=Math.round(toNum($('#f-months',f).value)),t=Math.round(toNum($('#f-turn',f).value)),s=$('#f-start',f).value;
      if(!(m>=1))return 'عدد الشهور لازم يكون 1 أو أكتر.';if(!(t>=1&&t<=m))return `دورك لازم يكون بين 1 و ${m}.`;if(!/^\d{4}-\d{2}$/.test(s))return 'اختار شهر البداية.';Object.assign(v,{months:m,turn:t,start:s})}
    const dv=$('#f-due',f).value.trim();const dd=dv?Math.round(toNum(dv)):'';if(dv&&!(dd>=1&&dd<=31))return 'يوم الدفع بين 1 و 31.';v.due=dd;
    if(isNew)S.coms.push({id:uid(),type:c.type,paid:[],cx:{},got:{},...v});else Object.assign(c,v);return {toast:'اتحفظ'}},
  f=>{const d=$('#delCom',f);d&&arm(d,()=>{S.coms=S.coms.filter(x=>x.id!==c.id);done('اتمسح')},'اضغط تاني: الرصيد مش هيتغيّر')});
}
function freshSheet(){
  openSheet('ابدأ ببياناتك',`<p class="muted" style="margin:0">هنمسح البيانات التجريبية ونبدأ ببنود أكل ونت ومواصلات وأخرى فاضية.</p>
    <label class="field"><span>صافي راتبك (${CUR})</span><input class="input amount" id="f-sal" inputmode="decimal" placeholder="0"></label>
    <div class="two"><label class="field"><span>يوم القبض</span><input class="input" id="f-pay" inputmode="numeric" placeholder="مثلاً 25"></label>
    <label class="field"><span>معاك دلوقتي</span><input class="input" id="f-cash" inputmode="decimal" placeholder="كاش + بنك"></label></div>
    <button class="btn full">ابدأ</button>`,
  f=>{const a=toNum($('#f-sal',f).value),p=Math.round(toNum($('#f-pay',f).value)),c=toNum($('#f-cash',f).value);const set=S.set;
    S=migrate(blank());S.set=Object.assign(set,{lastBackup:set.lastBackup});if(a>0)S.salary=a;if(p>=1&&p<=31)S.payday=p;
    if(!isNaN(c)){S.cash=c;S.cashSet=true;S.cashDate=today();S.recon.push({id:uid(),date:today(),expected:c,actual:c,gap:0,start:true});if(S.payday&&clampDay(curYM(),S.payday)<=today())S.salaryIn[curYM()]=1}
    UI.ym=curYM();return {toast:'جاهز. وزّع ميزانيتك من شاشة الميزانية'}},f=>$('#f-sal',f).focus());
}
function settingsSheet(){
  const N=!!NATIVE;
  openSheet('الإعدادات',`
    <div class="set-group"><h4>الفلوس</h4>
      <button type="button" class="set-row" data-go="salary"><span>الراتب ويوم القبض</span><b class="num">${money(S.salary)}${S.payday?` · يوم ${S.payday}`:''}</b></button>
      <button type="button" class="set-row" data-go="cash"><span>رصيدي</span><b class="num">${S.cashSet?money(S.cash):'مش متسجل'}</b></button>
      <label class="toggle"><span>رحّل المتبقي من كل شهر للشهر اللي بعده</span><input type="checkbox" id="st-carry" ${S.carryMonth?'checked':''}></label>
      <button type="button" class="set-row" data-go="goal"><span>هدف الادخار</span><b class="num">${S.goal?money(S.goal):'مفيش'}</b></button>
    </div>
    <div class="set-group"><h4>التنبيهات</h4>
      ${N?`<label class="toggle"><span>إشعارات الفواتير والأقساط والعجز</span><input type="checkbox" id="st-notif" ${S.set.notif?'checked':''}></label>
      <label class="toggle"><span>فكّرني أسجّل مصروفاتي كل يوم 9 بالليل</span><input type="checkbox" id="st-nudge" ${S.set.nudge?'checked':''}></label>`:'<p class="small muted" style="margin:0">الإشعارات شغالة في نسخة الأندرويد بس.</p>'}
      <label class="toggle"><span>فكّرني أعمل جرد كل أسبوع</span><input type="checkbox" id="st-recon" ${S.set.reconRemind?'checked':''}></label>
    </div>
    ${N&&NATIVE.lockAvailable&&NATIVE.lockAvailable()?`<div class="set-group"><h4>الأمان</h4><label class="toggle"><span>اقفل التطبيق بالبصمة أو قفل الشاشة</span><input type="checkbox" id="st-lock" ${S.set.lock?'checked':''}></label></div>`:''}
    <div class="set-group"><h4>نسخة احتياطية</h4>
      <p class="small muted" style="margin:0">${N?`بتتحفظ تلقائيًا كل أسبوع في Downloads/Mizan. آخر نسخة: ${S.set.lastBackup?esc(dayName(iso(new Date(S.set.lastBackup)))):'لسه'}`:'بياناتك محفوظة على الجهاز ده بس. احفظ نسخة كل فترة.'}</p>
      <div class="btn-row"><button type="button" class="btn ghost" id="st-backup">احفظ نسخة دلوقتي</button><label class="btn ghost file-btn">استرجع من ملف<input type="file" id="st-file" accept="application/json,.json,text/plain"></label></div>
      <details><summary>نسخ كنص</summary><textarea class="input" id="st-json" readonly>${esc(JSON.stringify(S))}</textarea>
      <div class="btn-row"><button type="button" class="btn ghost" id="st-copy">انسخ</button><button type="button" class="btn ghost" id="st-imp">استرجع من نص</button></div></details>
    </div>
    <div class="set-group"><h4>البيانات</h4>
      <button type="button" class="btn dangerb full" id="st-reset">امسح كل البيانات</button>
      <button type="button" class="btn ghost full" id="st-sample">رجّع البيانات التجريبية</button></div>`,
  ()=>false,f=>{
    $$('[data-go]',f).forEach(b=>b.onclick=()=>({salary:salarySheet,cash:cashSheet,goal:goalSheet})[b.dataset.go]());
    const tg=(id,fn)=>{const el=$('#'+id,f);el&&el.addEventListener('change',()=>{fn(el.checked);save();render()})};
    tg('st-notif',v=>{S.set.notif=v;if(v&&NATIVE&&NATIVE.requestNotif)NATIVE.requestNotif()});
    tg('st-nudge',v=>{S.set.nudge=v;if(v&&NATIVE&&NATIVE.requestNotif)NATIVE.requestNotif()});
    tg('st-recon',v=>S.set.reconRemind=v);
    tg('st-carry',v=>{S.carryMonth=v;toast(v?'المتبقي هيترحّل للشهر الجاي':'اتقفل الترحيل')});
    tg('st-lock',v=>{S.set.lock=v;NATIVE&&NATIVE.setLock(v);toast(v?'التطبيق هيطلب البصمة لما تفتحه':'اتشال القفل')});
    $('#st-backup',f).onclick=()=>backupNow(false);
    $('#st-file',f).onchange=e=>{const file=e.target.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>restoreFrom(rd.result,f);rd.readAsText(file)};
    $('#st-copy',f).onclick=async e=>{const ta=$('#st-json',f);try{await navigator.clipboard.writeText(ta.value);e.target.textContent='اتنسخت'}catch(_){ta.focus();ta.select();e.target.textContent='النص متحدد، انسخه'}};
    $('#st-imp',f).onclick=e=>{const ta=$('#st-json',f);if(ta.readOnly){ta.readOnly=false;ta.value='';ta.placeholder='الصق النسخة الاحتياطية هنا ثم اضغط استرجع';ta.focus();e.target.textContent='استرجع';return}restoreFrom(ta.value,f)};
    arm($('#st-reset',f),()=>{const set=S.set;S=migrate(blank());S.set=set;done('اتمسحت البيانات')});
    arm($('#st-sample',f),()=>{S=migrate(sample());UI.ym=curYM();done()});
  });
}
function restoreFrom(text,f){
  try{const o=JSON.parse(text);if(!o||!Array.isArray(o.cats)||!Array.isArray(o.exp))throw 0;S=migrate(Object.assign(blank(),o,{sample:false}));done(`اتسترجعت البيانات (${nf.format(S.exp.length)} مصروف)`)}
  catch(_){showErr(f,'الملف ده مش نسخة احتياطية من ميزان.')}
}
function backupNow(silent){
  const json=JSON.stringify(S),name=`mizan-backup-${today()}.json`;
  if(NATIVE&&NATIVE.saveBackup){const loc=NATIVE.saveBackup(json,name);if(loc){S.set.lastBackup=Date.now();save();if(!silent)toast(`اتحفظت في ${loc}`);else toast('اتعملت نسخة احتياطية أسبوعية');return true}if(!silent)toast('محصلش حفظ. جرّب تاني.');return false}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();S.set.lastBackup=Date.now();save();toast('اتنزلت النسخة الاحتياطية')}catch(_){toast('استخدم "نسخ كنص" واحفظه في مكان آمن')}
  return true;
}

/* ---------- Android bridge: reminders + widget ---------- */
const at=(d,h,m=0)=>{const x=fromISO(d);x.setHours(h,m,0,0);return x.getTime()};
function buildReminders(){
  const out=[],now=Date.now(),t=today();
  const push=(id,ms,title,body)=>{if(ms>now+60000)out.push({id,at:ms,title,body})};
  for(let k=0;k<=35;k++){const D=addDays(t,k),ym=D.slice(0,7);
    S.coms.forEach(c=>{if(!comActive(c,ym)||(c.paid||[]).includes(ym))return;const day=c.due||(c.type==='gam'?S.payday:0);if(!day||clampDay(ym,day)!==D)return;
      const what=c.type==='gam'?`قسط ${c.name}`:c.name;
      push('cb'+c.id+ym,at(addDays(D,-1),19),`بكره: ${what}`,`${money(c.amt)} ${CUR}. جهّز المبلغ.`);
      push('cd'+c.id+ym,at(D,10),`النهارده: ${what}`,`${money(c.amt)} ${CUR}. لما تدفع علّم ✓ في الالتزامات.`)});
    S.debts.forEach(d=>{const left=d.amt-d.paid;if(left<=0)return;
      if(d.dir==='owe'&&d.inst>0&&d.instStart&&ym>=d.instStart&&!(d.instPay||{})[ym]&&clampDay(ym,d.instDay||S.payday||1)===D)push('di'+d.id+ym,at(addDays(D,-1),19),`بكره قسط ${d.name}`,`${money(Math.min(d.inst,left))} ${CUR}.`);
      if(d.due===D)push('dd'+d.id,at(D,10),d.dir==='owe'?`النهارده ميعاد سداد ${d.name}`:`النهارده ميعاد ${d.name} يسددلك`,`${money(left)} ${CUR}.`)});
    if(S.payday&&clampDay(ym,S.payday)===D)push('pay'+ym,at(D,10),'النهارده يوم القبض',S.cashSet&&S.autoSalary?`الراتب ${money(S.salary)} هيتضاف لرصيدك لما تفتح ميزان.`:'سجّل الراتب في رصيدك.');
    if(S.set.nudge)push('n'+D,at(D,21),'سجّلت مصروفات النهارده؟','ثواني تسجّل فيها اللي صرفته، علشان آخر الشهر تعرف فلوسك راحت فين.');
  }
  if(S.cashSet&&S.set.reconRemind){const nx=addDays(reconSince(),7);push('recon',at(nx>t?nx:addDays(t,1),20),'وقت الجرد','عدّ الفلوس اللي معاك واعمل جرد في ميزان علشان تعرف لو فيه فلوس اتصرفت ومتسجلتش.')}
  const F=forecast();
  if(F&&F.firstNeg){let ms=at(addDays(F.firstNeg.date,-3),10);if(ms<now+60000){const n=new Date();n.setMinutes(0,0,0);n.setHours(n.getHours()<10?10:n.getHours()<20?20:34);ms=n.getTime()}
    push('short',ms,'تحذير: رصيدك هيخلص',`${dayName(F.firstNeg.date)} رصيدك هيوصل ${F.firstNeg.bal<0?'−':''}${money(Math.abs(F.firstNeg.bal))} بسبب ${F.firstNeg.cause}.${F.safe>0?` متصرفش أكتر من ${money(F.safe)} في اليوم.`:''}`)}
  return out.sort((a,b)=>a.at-b.at).slice(0,60);
}
function widgetData(){
  const R=calc(curYM());const F=forecast();
  const counts={};S.exp.filter(x=>x.date>=addDays(today(),-60)).forEach(x=>counts[x.cat]=(counts[x.cat]||0)+1);
  const top=S.cats.slice().sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0)).slice(0,4).map(c=>({id:c.id,icon:c.icon,name:c.name}));
  return {allowed:money(R.allowed),remaining:money(R.remaining),cash:S.cashSet?money(S.cash):'',cur:CUR,
    warn:F&&F.firstNeg?`رصيدك هيخلص ${dayName(F.firstNeg.date)}`:'',cats:top};
}
function syncNative(){
  if(!NATIVE)return;
  try{NATIVE.scheduleReminders(JSON.stringify(S.set.notif||S.set.nudge?buildReminders().filter(r=>S.set.notif||r.id[0]==='n'):[]))}catch(e){}
  try{NATIVE.updateWidget(JSON.stringify(widgetData()))}catch(e){}
}

/* ---------- global click handling ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act],[data-open],[data-cat],[data-dir],[data-pay],[data-inst],[data-edit-debt],[data-edit-com],[data-paid],[data-got]');if(!t)return;
  const ds=t.dataset;
  if(ds.act){e.preventDefault();({
    salary:salarySheet,cash:cashSheet,recon:()=>reconSheet(),reconMonth:reconMonthSheet,goal:goalSheet,search:searchSheet,fresh:freshSheet,addCat:()=>catSheet(),
    addDebt:()=>debtSheet(null,UI.debtDir),addGam:()=>comSheet(null,'gam'),addBill:()=>comSheet(null,'bill'),
    debts:()=>{if(sheet.open)sheet.close();go('debts')}})[ds.act]?.();return}
  if(ds.open){itemSheet(ds.open,ds.id);return}
  if(ds.cat&&t.classList.contains('cat')){catSheet(catById(ds.cat));return}
  if(ds.dir){UI.debtDir=ds.dir;renderDebts();return}
  if(ds.pay){paySheet(S.debts.find(d=>d.id===ds.pay));return}
  if(ds.editDebt){debtSheet(S.debts.find(d=>d.id===ds.editDebt));return}
  if(ds.editCom){comSheet(S.coms.find(c=>c.id===ds.editCom));return}
  if(ds.inst){const d=S.debts.find(x=>x.id===ds.inst),cur=curYM();
    if(d.instPay[cur]){d.paid=Math.max(0,d.paid-d.instPay[cur]);S.cash-=(d.cxPay[cur]||0);delete d.cxPay[cur];delete d.instPay[cur];done('اتلغى قسط الشهر')}
    else{const a=Math.min(d.inst,d.amt-d.paid);d.instPay[cur]=a;d.paid+=a;if(S.cashSet){const v=d.dir==='owe'?-a:a;d.cxPay[cur]=v;S.cash+=v}done(d.paid>=d.amt?'اتسدد الدين بالكامل':'اتسجل القسط')}return}
  if(ds.paid){const c=S.coms.find(x=>x.id===ds.paid),ym=UI.ym;const k=c.paid.indexOf(ym);
    if(k>=0){c.paid.splice(k,1);if(c.cx[ym]){S.cash+=c.cx[ym];delete c.cx[ym]}done()}
    else{c.paid.push(ym);if(S.cashSet&&ym===curYM()){c.cx[ym]=c.amt;S.cash-=c.amt}done(S.cashSet&&ym===curYM()?`اتخصم ${money(c.amt)} من رصيدك`:'')}return}
  if(ds.got){const c=S.coms.find(x=>x.id===ds.got),ym=UI.ym,v=c.amt*c.months;
    if(c.got[ym]){if(c.got[ym]>1)S.cash-=c.got[ym];delete c.got[ym];done()}else{c.got[ym]=S.cashSet?v:1;if(S.cashSet)S.cash+=v;done(S.cashSet?`اتضاف ${money(v)} لرصيدك`:'')}return}
});

/* ---------- routing ---------- */
const TABS={home:'الرئيسية',budget:'الميزانية',debts:'الديون',commit:'الالتزامات'};
function render(){
  const t=UI.tab;
  Object.keys(TABS).forEach(k=>{$('#s-'+k).hidden=k!==t;const a=document.querySelector(`[data-tab="${k}"]`);if(k===t)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  $('#title').firstChild.textContent=t==='home'?'ميزان':TABS[t];
  $('#monthLbl').textContent=monthName(UI.ym)+(UI.ym===curYM()?' · الشهر الحالي':'');
  $('#nextM').disabled=UI.ym>=curYM();
  $('#prevM').hidden=$('#nextM').hidden=t==='debts';
  $('#fab').hidden=t!=='home'&&t!=='budget';
  ({home:renderHome,budget:renderBudget,debts:renderDebts,commit:renderCommit})[t]();
}
function go(t){UI.tab=TABS[t]?t:'home';try{history.replaceState(null,'','#'+UI.tab)}catch(_){}render();window.scrollTo(0,0)}
function fromHash(){const h=(location.hash||'').slice(1);UI.tab=TABS[h]?h:'home';render();window.scrollTo(0,0)}
$$('[data-tab]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.tab)}));
window.addEventListener('hashchange',fromHash);
$('#prevM').onclick=()=>{UI.ym=ymAdd(UI.ym,-1);render()};
$('#nextM').onclick=()=>{if(UI.ym<curYM()){UI.ym=ymAdd(UI.ym,1);render()}};
$('#settingsBtn').onclick=settingsSheet;
$('#fab').onclick=()=>txSheet();

/* startup */
const added=creditSalary();
save();
fromHash();
if(added)setTimeout(()=>toast(`اتضاف الراتب لرصيدك: ${money(added)} ${CUR}`),500);
if(NATIVE&&!S.sample){
  if(S.set.autoBackup&&Date.now()-(S.set.lastBackup||0)>7*864e5)setTimeout(()=>backupNow(true),1500);
  if(S.set.notif&&!S.set.askedNotif&&NATIVE.requestNotif){S.set.askedNotif=true;save();setTimeout(()=>NATIVE.requestNotif(),2500)}
}
// Android: back button, widget shortcuts, app returning to the foreground
window.mizanBack=function(){if(sheet.open){sheet.close();return true}if(UI.tab!=='home'){go('home');return true}return false};
window.mizanQuickAdd=function(cat){go('home');txSheet(cat?{cat}:{})};
window.mizanResume=function(){if(UI.ym!==curYM()&&UI.ym>curYM())UI.ym=curYM();const a=creditSalary();if(a){save();toast(`اتضاف الراتب لرصيدك: ${money(a)} ${CUR}`)}if(!sheet.open)render();syncNative()};
syncNative();

if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();
