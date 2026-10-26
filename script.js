'use strict';
const SAVE='radio_2am_prototype_v1';
let s=load();
if(!s.simState)s.simState=createSimulationState();
if(!s.microWorld)s.microWorld=createMicroWorldState();
if(!s.socialWorld)s.socialWorld=createSocialWorldState();
if(!s.newListeners)s.newListeners=createNewListenerState();
if(!s.regular)s.regular=createRegularState();
if(!s.special)s.special=createSpecialState();
if(!s.storyPrograms)s.storyPrograms=createStoryProgramsState();
if(!s.climate)s.climate=createClimateState();
function migrateState(data){
  if(!data||data.version!==1||!data.listeners||!data.flags)return null;
  const defaults=defaultState();
  data.contentVersion=14;
  migrateClimate(data);
  migrateSpecial(data);
  migrateStoryPrograms(data);
  migrateRegular(data);
  migrateChapter2(data);
  migrateMicroWorld(data);
  migrateSimulation(data);
  migrateSocialWorld(data);
  migrateNewListeners(data);
  migrateLifePaths(data);
  data.storyState=initializeStoryState(data.storyState);
  data.stationTone=data.stationTone||{warmth:0,curiosity:0,quiet:0};
  data.pending=Array.isArray(data.pending)?data.pending:[];
  data.privateMemories=data.privateMemories||{};
  data.events=Array.isArray(data.events)?data.events:[];
  data.logs=Array.isArray(data.logs)?data.logs:[];
  data.played=Array.isArray(data.played)?data.played:[];
  data.letterSets=data.letterSets||{};
  for(const [id,base] of Object.entries(defaults.listeners)){
    if(!data.listeners[id])data.listeners[id]=structuredClone(base);
    if(!Array.isArray(data.listeners[id].memories))data.listeners[id].memories=[];
  }
  if((data.night===3||data.night===7)&&data.phase==='complete'){
    // 旧版で第3夜または第7夜を終えたセーブも、続きの夜へ進める。
    data.phase='after';
  }
  if(!Array.isArray(data.replyParts))data.replyParts=[null,null,null];
  if(!Array.isArray(data.chosen))data.chosen=[];
  if(!Number.isInteger(data.night)||data.night<1||data.night>100000)return null;
  return data;
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE);
    const data=raw?migrateState(JSON.parse(raw)):null;
    if(data)return data;
  }catch(e){console.warn('セーブデータの読込に失敗しました',e)}
  return defaultState();
}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(s))}catch(e){console.warn('save failed',e)}}
function rand(){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
function clamp(v){return Math.max(0,Math.min(100,v))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v){return esc(v).replace(/\n/g,'<br>')}
function letter(id){let l=letterDB[id]||s.regular?.letterArchive?.[id];if(!l)return null;if(l.regular)return {...l,id};let body=l.body;if(id==='clock3')body=body.replace('{wife}',s.flags.clockWifeKnown?'妻なら知っていたでしょうが、私は花の名前には疎いもので。':'昔なら、名前を知っている人に聞けたのですが、今は自分で調べるしかありません。');if(id==='echo_driver_clock'&&s.microWorld?.links?.['old-clock-street']?.greeted)body=body.replace('お店は閉まっていました。','お店は閉まっていました。店の前で年配の人とすれ違い、軽く会釈しました。');if(id==='cat2'&&s.flags.catReply==='reflection')body=body.replace('今日、上司と話しました。','昨日、辞めたい理由と辞めたあとにしたいことは別だと言ってくれましたよね。あれから少し考えていました。\n\n今日、上司と話しました。');const late=lateLetterText(id,s);const lifeNote=lifeLetterNote(id,s);return {...l,...(late||{}),id,body:(relationLetterText(id,s)?.body??late?.body??body)+lifeNote+(l.special?'':(simRelationshipPostscript(l.who,s.night)||simLetterPostscript(l.who,s.night)))}}
// v2.1.1: 同じ夜の「眠れないパン屋」は、手作り・日常・特別放送・持ち越しを合計して最大2通。
// 放送中や放送済みの手紙には触れず、準備中・未開始の便箋だけ整理する。
const NIGHTLY_LETTER_LIMITS={bread:2,umbrella:1,triangle:1,fridge:1};
function letterSenderId(id){return letterDB[id]?.who||s.regular?.letterArchive?.[id]?.who||null}
function applyNightlyLetterLimits(n,ids){
  if(n<s.night||n===s.night&&!['intro','prepare'].includes(s.phase))return ids;
  const selected=n===s.night&&s.phase==='prepare'?(s.chosen||[]):[];
  const retained=new Set(),counts={};
  // ユーザーがすでに選択した手紙は、上限の範囲内で優先する。
  for(const id of [...selected,...ids]){
    if(!ids.includes(id)||retained.has(id))continue;
    const who=letterSenderId(id),limit=NIGHTLY_LETTER_LIMITS[who];
    if(limit!==undefined&&(counts[who]||0)>=limit)continue;
    retained.add(id);
    counts[who]=(counts[who]||0)+1;
  }
  const result=ids.filter(id=>retained.has(id));
  if(n===s.night&&s.phase==='prepare')s.chosen=s.chosen.filter(id=>retained.has(id));
  return result;
}
function nightLetters(n){
  if(s.letterSets[n]){
    const original=s.letterSets[n];
    const limited=applyNightlyLetterLimits(n,original);
    if(limited.length!==original.length){s.letterSets[n]=limited;save()}
    newListenerOnLettersDelivered(n,s.letterSets[n]);
    return s.letterSets[n];
  }
  let fresh=[];
  if(n===1)fresh=['cat1','clock1','bread1','moon1'];
  else if(n===2)fresh=['driver2',s.flags.catRead?'cat2':'cat2unread',s.flags.clockRead&&s.flags.clockPast?'clock2':'clock2generic',s.flags.moonQuestion?'sugar2':'moon2'];
  else if(n===3)fresh=['fish3','clock3',s.flags.driverRead?'driver3':'driver3first','bread3','moon3'];
  else if(n>=15&&n<=28)fresh=chapter2Letters(n);
  else if(n>=29)fresh=specialActive(n)?specialCreateLetters(n):createRegularLetters(n);
  else fresh=createNightLetters(n);
  const carried=n>=5?(s.pending||[]).filter(x=>x.until>=n).map(x=>x.id):[];
  // 前夜までに実際に起きた出来事をもとに書かれた新しいお便り。
  // 最大1通のみ。既存の主要な物語の枠は奪わない。
  const echoes=n>=2?(s.microWorld?.queued?.[n]||[]):[];
  const socialMail=n>=29?(s.socialWorld?.queued?.[n]||[]):[];
  const aftermath=n>=29?(s.special?.followups?.[n]||[]):[];
  const climateMail=n>=29?climateCreateLetter(n):null;
  // 自律関係の手紙は通常の日常投稿と置き換え、同じ人の声が重なりすぎるのを防ぐ。
  const senders=new Set(socialMail.map(id=>letterSenderId(id)));
  const duringSpecial=Boolean(specialActive(n));
  const normalFresh=duringSpecial?fresh:fresh.filter(id=>!senders.has(letterSenderId(id)));
  // 特別放送で募集した投稿は、日常の社会的な手紙より先に残す。
  const supplemental=duringSpecial?socialMail.filter(id=>!fresh.some(x=>letterSenderId(x)===letterSenderId(id))):socialMail;
  const order=duringSpecial?[...normalFresh,...supplemental]:[...supplemental,...normalFresh];
  const picked=[...new Set([...order,...aftermath,...echoes,...carried,...(climateMail?[climateMail]:[])])].filter(id=>letterDB[id]||s.regular?.letterArchive?.[id]);
  s.letterSets[n]=applyNightlyLetterLimits(n,picked.slice(0,8));
  newListenerOnLettersDelivered(n,s.letterSets[n]);
  save();
  return s.letterSets[n];
}
function setTab(tab){s.tab=tab;save();render()}
function selectLetter(id){let i=s.chosen.indexOf(id);if(i>=0)s.chosen.splice(i,1);else if(s.chosen.length<3)s.chosen.push(id);save();render()}
function startNight(){s.phase='prepare';s.tab='studio';nightLetters(s.night);save();render()}
function beginBroadcast(){if(!s.chosen.length||s.opening===null)return;recordOpening();s.phase='broadcast';s.cursor=0;save();render()}
function chooseReply(i){let l=letter(s.current);let c=l.choices[i];applyReply(l,c[2],c[1])}
function finishBroadcast(){if(s.song===null)return;s.phase='after';log('曲',`「${songs[s.song][0]}」を流した。`);applySongMood();const omitted=nightLetters(s.night).filter(id=>!s.chosen.includes(id));log('未紹介',omitted.length?omitted.map(id=>NAMES[letter(id).who]).join('、')+'のお便りは放送で紹介されなかった。':'今夜届いたお便りはすべて紹介した。');updatePendingLetters();if(s.night<=14)advanceWorld();if(s.night>=29)specialBeginAnnouncement(s.night);simulateDailyLives(s.night);newListenerAfterDaily(s.night);simulateSocialWorld(s.night);if(s.night<=14){lifeAfterDaily(s.night);simulateMicroWorld(s.night)}else {regularAfterWorld(s.night);chapter2AfterWorld(s.night);specialProcessNight(s.night);storyProgramsAfterWorld(s.night)}save();render()}
function nextNight(){
  if(s.night===28&&s.chapter2?.legacyThrough<28){s.phase='chapter2_complete';save();render();return}
  if(s.night===14){s.phase='complete';save();render();return}
  s.night++;
  s.phase='intro';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;
  s.replyParts=[null,null,null];s.replyStep=0;s.song=null;s.tab='studio';
  nightLetters(s.night);save();render();
}
function beginRegular(){
  if(s.night!==14||s.phase!=='complete')return;
  s.regular ||= createRegularState();s.regular.started=true;s.chapter2 ||= createChapter2State();s.chapter2.started=true;
  s.night=15;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
  s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;
  nightLetters(s.night);save();render();
}
function resetGame(){if(!confirm('進行状況を最初からやり直しますか？ 現在のセーブは消えます。'))return;s=defaultState();s.simState=createSimulationState();s.newListeners=createNewListenerState();save();render()}
function downloadSave(){let blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='radio_2am_save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importSave(input){
  const file=input.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=migrateState(JSON.parse(reader.result));
      if(!data)throw new Error('セーブ形式が違います');
      if(!confirm('現在の進行状況をバックアップで上書きしますか？'))return;
      s=data;save();render();
    }catch(e){console.warn(e);alert('読み込めないセーブデータです。')}
  };
  reader.readAsText(file);
}
const dayTitles=['','はじめましての夜','誰かが聴いている','言えなかった言葉',
  '終点のひとつ前','いつもの道の途中','言いそびれた返事','ひとり分の余白','返事をしない自由','描かれなかった余白','窓の明かり','木曜日の駅','自分の声','返ってこない約束','それぞれの朝'];
function shell(content){let done=s.phase==='complete',done2=s.phase==='chapter2_complete',sp=specialActive(s.night);return `<header class="header"><div><div class="brand">MIDNIGHT LETTERS / A RADIO STORY</div><h1>午前2時のラジオ局</h1><div class="small">${done?'第1章 14夜 終了':done2?'第2章 14夜 終了':`第${s.night}夜　${regularDayTitle(s.night)}`}</div><div class="climate-meta">${esc(climateCaption(s.night))}</div></div><div class="chip">${s.phase==='broadcast'||s.phase==='reply'?'● ON AIR':'◌ OFF AIR'}</div></header><div class="studio ${sp?'studio-special':''} weather-${climateForNight(s.night).weather} season-${climateForNight(s.night).season}" role="img" aria-label="月明かりの差す深夜のラジオスタジオ。机にマイクとランプが置かれている"><div class="studio-caption">${sp?'SPECIAL PROGRAM · '+esc(SPECIAL_THEMES[sp.themeId].short):'02:00 AM · YOUR VOICE, SOMEWHERE'}</div><div class="climate-studio-label">${esc(climateCaption(s.night))}</div><div class="moon"></div><div class="lamp"></div><div class="mic"></div><div class="desk"></div><div class="onair">${s.phase==='broadcast'||s.phase==='reply'?'ON AIR':'STANDBY'}</div></div><div class="layout"><main id="main">${content}</main><aside class="sidebar"><div class="panel"><div class="overline">BROADCAST DESK</div>${navButtons()}</div><div class="panel"><div class="overline">${sp?'特別放送':s.night>=15&&s.night<=28?'第2章':s.night>=29?'通常放送':'今夜の放送'}</div><div class="status"><span>紹介枠</span><span>${s.chosen.length} / 3</span></div><div class="progress"><div style="width:${s.chosen.length/3*100}%"></div></div><div class="status"><span>放送済み</span><span>${s.played.filter(x=>x.night===s.night).length}通</span></div><div class="status"><span>保存</span><span>自動保存</span></div></div></aside></div><nav class="bottomnav" aria-label="メニュー"><button class="${s.tab==='studio'?'active':''}" onclick="setTab('studio')"><span>◉</span>放送</button><button class="${s.tab==='letters'?'active':''}" onclick="setTab('letters')"><span>✉</span>お便り</button><button class="${s.tab==='journal'?'active':''}" onclick="setTab('journal')"><span>▤</span>記録</button><button class="${s.tab==='listeners'?'active':''}" onclick="setTab('listeners')"><span>♧</span>リスナー</button><button class="${s.tab==='settings'?'active':''}" onclick="setTab('settings')"><span>⚙</span>設定</button></nav><div class="footer">『午前2時のラジオ局』v2.5 · 第1章／第2章・通常放送／特別放送 · オフライン対応</div>`}
function navButtons(){return [['studio','◉ 放送'],['letters','✉ お便り'],['journal','▤ 放送日誌'],['listeners','♧ リスナー'],['settings','⚙ 設定・セーブ']].map(([id,t])=>`<button class="navbtn ${s.tab===id?'active':''}" onclick="setTab('${id}')">${t}</button>`).join('')}
function intro(){
  if(s.night>=15&&s.night<=28)return chapter2Intro();
  if(s.night>=29)return specialActive(s.night)?specialIntro():regularIntro();
  const t=s.night;
  const texts={
    1:'雨が、窓を叩いている。\n\n机の上には、冷めかけたコーヒーと、何通かのお便り。\n\n壁の時計が、小さな音を立てて進んでいる。\n\n今夜から、この番組を担当することになった。\n\n午前2時からの1時間。\n\n眠れない誰かに、声を届ける仕事だ。',
    2:'昨日の雨は上がった。\n\nスタジオの机には、新しいお便りが届いている。\n\n昨夜、マイクの向こうには、どんな人がいたのだろう。\n\nその答えが、少しだけわかる夜になるかもしれない。',
    3:'窓の外は、静かに晴れている。\n\nお便りの束に、見慣れないラジオネームを見つけた。\n\n誰かが言えなかった言葉は、午前2時の声に変えられるだろうか。',
    4:'机の隅に、昨夜スタッフが見つけた古い封筒がある。\n\n「終点のひとつ前で、待っています。」\n\n誰の言葉なのか、まだわからない。\n\n郵便受けには、今夜も新しい便箋が届いている。',
    5:'金曜日の夜。\n\nガラス越しに、遠くの道路の灯りが流れていく。\n\n昨日と同じ街を走る人にも、昨日と違う一日があった。\n\n届いた手紙は、どれも少しだけ体温が違う。',
    6:'土曜日。スタジオの前の廊下は、いつもより静かだ。\n\n宛名のない封筒、書き直された便箋、短い近況報告。\n\n言いそびれた返事は、どこへ行くのだろう。',
    7:'一週間の最後の夜。\n\n窓の外の月が、いつもより近く見える。\n\n手紙の中には、まだ結末のついていない話がいくつもある。\n\n今夜は、どんな言葉を届けよう。',
    8:'二週目の月曜日。\n\nスタジオのマイクに、小さなほこりが積もっている。\n\n誰かは久しぶりの連絡に迷い、誰かは一枚の紙を見つめている。\n\n届いた手紙には、昨日とは違う声がある。',
    9:'火曜日。\n\n机の端には、使いかけの鉛筆が一本。\n\n描き始めることと、描き続けることは違う。\n\n名前のつかない明日にも、また郵便が届いた。',
    10:'窓の向こうのビルに、ぽつぽつと明かりがついている。\n\nみんなが同じ時刻に眠るわけではない。\n\nまだ帰らない人も、もう眠った人もいる。\n\n午前2時の声を、どこへ届けよう。',
    11:'また木曜日が来た。\n\n机の隅には、古い封筒。\n\n終点のひとつ前の駅では、今夜も電車が止まる。\n\n待つことをやめない人と、出かけるか迷っている人がいる。',
    12:'金曜日の深夜。\n\n放送の準備をしながら、何度も書き直された便箋を広げる。\n\n言葉は、ちゃんとできあがってからでなければ送れないものだろうか。',
    13:'土曜日。\n\n今日はいつもの曜日ではない人から、手紙が届いている。\n\n何度も同じ場所に戻ること。そこを離れてみること。\n\nどちらにも、それぞれの勇気がある。',
    14:'二週間が経った。\n\nスタジオの机には、今日も新しいお便りが届いている。\n\n何かを決めた人も、まだ考えている人もいる。\n\n最後の放送ではなく、いまの物語の一区切りだ。'
  };
  const times=['','01:48','01:42','01:36','01:43','01:45','01:39','01:41','01:44','01:40','01:46','01:38','01:43','01:37','01:49'];
  return `<section class="panel"><div class="overline">${times[t]} / STUDIO</div><h2>${dayTitles[t]}</h2><p>${fmt(texts[t])}</p><div class="actions"><button class="btn" onclick="startNight()">お便りを確認する →</button></div></section>`;
}
function prepare(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">BEFORE BROADCAST / 01:48</div><h2>今夜のお便り</h2>${s.night>=15?`<div class="notice">${s.night<=28?'第2章：'+esc(CH2_NIGHTS[s.night][0]):specialActive(s.night)?'特別放送：'+esc(SPECIAL_THEMES[s.special.planned.themeId].title):'今夜のテーマ：'+esc(regularTheme(s.night)[0])+' · '+esc(regularTheme(s.night)[1])}</div>`:""}<p class="muted">最大3通を紹介できます。読まなかったお便りの送り主も、明日を生きていきます。まずお便りを選びましょう。</p>${ids.map(id=>{let l=letter(id),selected=s.chosen.includes(id);return `<div class="letter"><div class="letter-top"><span class="letter-title">${esc(NAMES[l.who])}</span><span class="tag">${l.special?'特別返答':''}</span></div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div><div class="actions"><button class="btn ${selected?'secondary':'ghost'}" onclick="selectLetter('${id}')" ${!selected&&s.chosen.length>=3?'disabled':''}>${selected?'✓ 紹介する予定':'＋ このお便りを紹介'}</button></div></div>`}).join('')}<div class="notice">紹介予定：${s.chosen.length} / 3通　${s.chosen.map(id=>NAMES[letter(id).who]).join('・')||'まだ選んでいません'}</div>${specialActive(s.night)?`<div class="notice">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}<br><span class="small">この言葉は特別放送の冒頭で紹介します。</span></div>`:''}<h3>オープニングの言葉</h3>${opening.map((o,i)=>`<button class="choice ${s.opening===i?'selected':''}" onclick="s.opening=${i};save();render()"><strong>${'ABC'[i]}.</strong> ${esc(o)}</button>`).join('')}<div class="actions"><button class="btn" ${s.chosen.length===0||s.opening===null?'disabled':''} onclick="beginBroadcast()">午前2時、放送を始める →</button></div></section>`}
function broadcast(){if(s.cursor>=s.chosen.length){return `<section class="panel"><div class="overline">02:53 / ENDING</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p>${songs.map((a,i)=>`<button class="choice ${s.song===i?'selected':''}" onclick="s.song=${i};save();render()"><strong>♪ ${esc(a[0])}</strong><br><span class="small">${esc(a[1])}</span></button>`).join('')}<div class="actions"><button class="btn" ${s.song===null?'disabled':''} onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`}let id=s.chosen[s.cursor],l=letter(id);return `<section class="panel"><div class="overline">${['02:08','02:23','02:39'][s.cursor]} / ON AIR · LETTER ${s.cursor+1} / ${s.chosen.length}</div><h2>お便りを紹介する</h2>${s.cursor===0&&specialActive(s.night)?`<div class="special-opening">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}</div>`:''}<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div><div class="actions"><button class="btn" onclick="s.current='${id}';s.phase='reply';save();render()">このお便りに返答する →</button></div></section>`}
function reply(){
  const l=letter(s.current);
  if(!l){s.phase='broadcast';return broadcast()}
  if(!l.special){
    return `<section class="panel"><div class="overline">ON AIR / REPLY</div><h2>${esc(NAMES[l.who])}への返答</h2><div class="quote">${fmt(l.body)}</div><h3>どんな言葉を返しますか？</h3>${l.choices.map((c,i)=>`<button class="choice" onclick="chooseReply(${i})"><strong>${esc(c[0])}</strong><br>${esc(c[1])}</button>`).join('')}<p class="small">※ 返答は確定すると取り消せません。人物の変化は後日の投稿から見えてきます。</p></section>`;
  }
  const parts=partsForLetter(l);
  const step=s.replyStep,part=parts[step];
  const preview=s.replyParts.map((index,i)=>index===null?null:parts[i].options[index][1]).filter(Boolean).join('\n\n');
  return `<section class="panel special-reply-panel"><div class="overline">SPECIAL REPLY / ON AIR</div><h2>言葉を組み立てる</h2><p class="muted">お便りを読み返しながら、${esc(NAMES[l.who])}へ届ける言葉を選びましょう。</p><div class="special-reply-layout"><details id="special-reply-letter" class="special-reply-letter" open><summary><span class="special-letter-summary-title">✉ お便りを読み返す</span><span class="special-letter-summary-sub">${esc(NAMES[l.who])} · ${esc(l.subject)}</span></summary><div class="special-letter-content"><div class="letter-text">${fmt(l.body)}</div><button class="btn secondary special-letter-return" type="button" onclick="document.getElementById('special-reply-choices').scrollIntoView({block:'start',behavior:'auto'})">返答の選択に戻る ↓</button></div></details><div id="special-reply-choices" class="special-reply-choices"><div class="steps">${parts.map((x,i)=>`<span class="${i===step?'active':''}">${i+1}. ${esc(x.name)}</span>`).join('')}</div><h3>STEP ${step+1}：${esc(part.name)}</h3><button type="button" class="special-review-link" onclick="showSpecialLetter()">✉ 元のお便りを確認する</button>${part.options.map((option,i)=>`<button class="choice ${s.replyParts[step]===i?'selected':''}" onclick="s.replyParts[${step}]=${i};save();render()"><strong>${esc(option[0])}</strong><br>${esc(option[1])}</button>`).join('')}<h3>放送原稿プレビュー</h3><div class="quote">${preview?fmt(preview):'まだ言葉を選んでいません。'}</div><div class="actions">${step>0?`<button class="btn secondary" onclick="s.replyStep--;save();render()">← 戻る</button>`:''}${step<2?`<button class="btn" ${s.replyParts[step]===null?'disabled':''} onclick="s.replyStep++;save();render()">次の言葉へ →</button>`:`<button class="btn" ${s.replyParts.some(x=>x===null)?'disabled':''} onclick="confirmSpecial()">この言葉を放送する →</button>`}</div></div></div></section>`;
}
function showSpecialLetter(){
  const el=document.getElementById('special-reply-letter');
  if(!el)return;
  el.open=true;
  el.scrollIntoView({block:'start',behavior:'auto'});
}
function confirmSpecial(){
  const l=letter(s.current);
  if(!l||!l.special||s.replyParts.some(v=>v===null))return;
  const parts=partsForLetter(l);
  const text=s.replyParts.map((v,i)=>parts[i].options[v][1]).join('\n\n');
  if(!confirm('この返答を放送しますか？'))return;
  applyReply(l,'special',text);
}
function after(){
  if(s.night>=15&&s.night<=28)return chapter2After();
  if(s.night>=29)return specialActive(s.night)?specialAfter():regularAfter();
  const n=s.night;
  const scenes={
    1:'マイクの赤いランプが消えた。\n\nスタジオには、雨の音だけが残っている。\n\n今夜、あなたの言葉を聴いた人がいる。\n\nその人が明日、どんな朝を迎えるのか。\n\nまだ、誰にもわからない。',
    2:'マイクを切ったあと、短いメッセージが届いた。\n\n「こんばんは。昨日の放送を聴いていました。お便りは送らなかったけれど、なんとなく今日もラジオをつけています。それだけです。おやすみなさい。」\n\nラジオネームは「名前はまだありません」。\n\n聴いているだけの人も、確かにここにいる。',
    3:'放送が終わり、スタジオの照明が少し明るくなる。\n\nスタッフが郵送物を整理していたところ、古い封筒が紛れていたという。宛名はない。消印はずいぶん前の日付だ。\n\n封筒の裏には、短い文章が書かれていた。\n\n「終点のひとつ前で、待っています。」\n\n誰が、誰を待っているのだろう。',
    4:s.played.some(x=>x.night===4&&x.id==='terminal4')?'封筒の裏に書かれていた駅と、今夜紹介したお便りの駅。\n\n同じ場所のことなのかもしれない。\n\nけれど、同じ人だと決めつける理由もない。\n\nスタジオの時計が、静かに進んでいく。':'古い封筒の言葉を、もう一度読み返す。\n\n「終点のひとつ前で、待っています。」\n\nあの手紙の続きを、まだ知らない。\n\n窓の向こうで、遠い電車の音がした。',
    5:'今夜、誰かは仕事で失敗し、誰かは次に読む本を考えている。\n\n一日の中で起こることには、放送で紹介されないもののほうが多い。\n\nそれでも、たった一通の便箋から、その人の暮らしが少し見えることがある。',
    6:'放送の最後の曲が終わる。\n\n言いたいことを言えた人も、まだ言葉を探している人もいる。\n\nマイクを切ったら、その先はそれぞれの夜になる。\n\n窓の外を、一台の配送車がゆっくり通り過ぎた。',
    7:'マイクの赤いランプが消えた。\n\n一週間で紹介したのは、ほんの一部のお便りだった。\n\n話してくれた人にも、話さなかった人にも、明日が来る。\n\n机の上には、まだ白い便箋が何枚も残っている。\n\n次の木曜日が来たら、あの駅にも灯りがつくだろうか。',
    8:'いつか送るつもりの返事も、出せないままの便箋もある。\n\nきょうラジオで読まれた言葉とは別に、誰かの下書きが増えていく。\n\nそれも、ひとつの夜だ。',
    9:'言葉にできたことと、まだ言葉にできないこと。\n\n机の灯りを消すと、窓の向こうに別の灯りが見える。\n\nあの明かりの下でも、誰かが今日を終えようとしている。',
    10:'マイクのランプが消えた。\n\n今夜は、帰る場所の明かりの話をした。\n\n見知らぬ人の窓が、誰かの安心になっている。\n\nそのことを知らないまま、朝は来る。',
    11:'駅の名前は、まだ聞いていない。\n\n古い写真の駅と、誰かが毎週立ち寄る駅。\n\n同じ場所かもしれないし、違うのかもしれない。\n\n今夜は、確かめずに便箋をしまう。',
    12:'マイクの前には、書き直された言葉が残る。\n\n放送で何を言ったとしても、誰かの人生の結論にはならない。\n\nそれでも、次の一文を考える夜は続いていく。',
    13:'いつもの木曜日ではない夜に、届いた声があった。\n\n待ち合わせの言葉を、守ることも、手放すことも。\n\n人によっては、そのどちらでもない明日を選ぶのだろう。',
    14:'最後の曲が終わった。\n\n読み終えた便箋と、読めなかった便箋を揃える。\n\n二週間、たしかに何人かの声がこの部屋を通り過ぎた。\n\nマイクが消えた街でも、明日の生活は始まっていく。'
  };
  return `<section class="panel end"><div class="overline">03:00 / OFF AIR</div><h2>放送が終わった</h2><p>${fmt(scenes[n])}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">放送しなかったお便り：${nightLetters(n).length-s.chosen.length}通</div><p class="small">リスナーたちは、それぞれの一日を過ごします。変化の一部は、次の放送で届くかもしれません。</p><div class="actions"><button class="btn" onclick="nextNight()">${n===14?'第1章を振り返る →':'次の夜へ進む →'}</button></div></section>`;
}
function complete(){
  const seenIds=['cat','driver','fish','clock','terminal'];
  const visible=seenIds.map(id=>{
    const past=s.played.filter(x=>x.who===id);
    if(!past.length)return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">第1章では、その声を放送で紹介する機会がなかった。</div><div class="small">それでも、この人の生活は放送の外で続いている。</div></div>`;
    const last=past[past.length-1];
    const final=last.night===14;
    return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">${final?'最終夜に届いた近況':'最後に読んだのは第'+last.night+'夜'}：「${esc(last.subject)}」</div><div class="small">${final?'今夜の言葉が、また次の一日へ続いていく。':'それから先に何があったか、まだすべては知らない。'}</div></div>`;
  }).join('');
  return `<section class="panel end"><div class="overline">CHAPTER ONE / FOURTEEN NIGHTS</div><h2>それぞれの朝</h2><p>${fmt('十四夜の放送が終わった。\n\n毎晩この局へ届いたのは、誰かの人生のほんの一部分だった。\n\n読むことのできた手紙と、読みそびれた手紙。\n\n何かを選んだ人と、まだ選ばずにいる人。\n\nそのどちらにも、次の朝が来る。\n\nあなたの声が届かない夜にも、誰かの人生は続いている。')}</p><hr class="divider"><h3>この局に残った声</h3><p class="muted">放送で実際に紹介した手紙からわかることだけを振り返ります。未紹介の人の結末は明かしません。</p>${visible}<div class="notice">第1章 完了。これまでの返答とリスナーの生活状態は保存されています。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を読む</button><button class="btn" onclick="beginRegular()">第2章・第15夜へ進む →</button><button class="btn secondary" onclick="setTab('settings')">バックアップを保存</button></div></section>`;
}
function lettersTab(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">POST OFFICE</div><h2>届いたお便り</h2><p class="muted">第${s.night}夜のお便り一覧。内容を読み返せます。</p>${ids.map(id=>{let l=letter(id),played=s.played.some(x=>x.id===id),sel=s.chosen.includes(id);return `<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)} · ${played?'放送済み':sel?'紹介予定':'未紹介'}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div>`}).join('')}</section>`}
function journal(){
  const n=s.night;
  s.journalPage=Math.max(0,Math.floor(s.journalPage||0));
  const maxPage=Math.max(0,Math.floor((n-1)/10));
  s.journalPage=Math.min(s.journalPage,maxPage);
  const latest=n-s.journalPage*10;
  const oldest=Math.max(1,latest-9);
  const nights=Array.from({length:latest-oldest+1},(_,i)=>latest-i);
  const content=nights.map(n=>{
    let a=s.logs.filter(x=>x.night===n),b=s.events.filter(x=>x.night===n&&x.public===true);
    return `<div class="timeline"><h3>第${n}夜 — ${esc(regularDayTitle(n))}</h3>${a.length?a.map(x=>`<div class="timeline-item"><div class="tag">${esc(x.type)}</div>${esc(x.message)}</div>`).join(''):'<p class="small">まだ放送の記録はありません。</p>'}${b.length?`<div class="subtle">公開された近況</div>${b.map(x=>`<div class="timeline-item small">${esc(x.message)}</div>`).join('')}`:''}</div>`;
  }).join('');
  const replies=s.played.filter(x=>x.night>=oldest&&x.night<=latest).slice().reverse();
  return `<section class="panel"><div class="overline">BROADCAST JOURNAL</div><h2>放送日誌</h2><p class="muted">放送で伝えた言葉を記録しています。生活の秘密や内部数値は表示されません。</p><div class="actions"><button class="btn secondary" ${s.journalPage>=maxPage?'disabled':''} onclick="s.journalPage++;save();render()">← 前の10夜</button><button class="btn secondary" ${s.journalPage===0?'disabled':''} onclick="s.journalPage--;save();render()">新しい10夜 →</button></div><p class="small">第${oldest}〜${latest}夜を表示（全${n}夜）</p>${content}<h3>あなたが届けた言葉</h3>${replies.length?replies.map(x=>`<div class="letter"><div class="small">第${x.night}夜 · ${esc(NAMES[x.who])}</div><b>${esc(x.subject)}</b><div class="quote">${fmt(x.response)}</div></div>`).join(''):'<p class="muted">この期間には返答の記録がありません。</p>'}</section>`;
}
function listeners(){let bios={cat:'会社員。仕事と創作への気持ちの間で揺れている。',clock:'元時計修理職人。古い時計と日々の思い出を大切にしている。',bread:'パン屋で働く。新しいパン作りに挑戦している。',moon:'少し変わった空想を投稿するリスナー。',driver:'夜間配送ドライバー。駐車場の猫を「主任」と呼んでいる。',fish:'大学生。友人との関係で、自分の気持ちを伝えられずにいる。',terminal:'木曜日、終点のひとつ前の駅を訪れる。待つ理由はまだわからない。',anon:'以前から番組を聴いている静かなリスナー。',umbrella:'花屋の店主。花束を渡すのは得意だが、自分の休みを作るのはまだ練習中。',triangle:'高校生。将来の夢がいくつもあり、まだ一つに決めたくない。',fridge:'料理人。仕事では料理を作るが、自分の夕食は簡単に済ませることが多い。'};return `<section class="panel"><div class="overline">LISTENER ARCHIVE</div><h2>リスナーの記録</h2><p class="muted">放送で紹介されたお便りからわかったことだけが記録されます。人々の交流は、番組の外でも続いています。</p>${Object.keys(bios).filter(id=>!REGULAR_NEW.includes(id)||newListenerIntroduced(id,s.night)||s.played.some(x=>x.who===id)).map(id=>{let o=s.listeners[id],seen=s.played.some(x=>x.who===id)||o.known;return `<div class="listener"><b>${seen?esc(NAMES[id]):'まだよく知らないリスナー'}</b><div class="small">${seen?esc(bios[id]):'これからお便りが届くかもしれません。'}</div>${seen&&o.memories.length?`<hr class="divider"><div class="small">これまでにわかったこと</div>${o.memories.map(m=>`<div class="small">・${esc(m)}</div>`).join('')}`:''}</div>`}).join('')}</section>`}
function settings(){return `<section class="panel"><div class="overline">SETTINGS</div><h2>設定・セーブデータ</h2><p>進行状況は、この端末のブラウザ内に自動保存されます。別の端末に引き継ぐ場合は、バックアップを書き出してください。</p><div class="actions"><button class="btn" onclick="downloadSave()">バックアップを保存</button><label class="btn secondary" style="cursor:pointer">バックアップを読み込む<input class="screen-reader" type="file" accept=".json,application/json" onchange="importSave(this)"></label></div><hr class="divider"><h3>最初から遊ぶ</h3><p class="small">現在のセーブデータを消して、第1夜からやり直します。必要なら先にバックアップしてください。</p><button class="btn secondary" onclick="resetGame()">進行状況をリセット</button><hr class="divider"><p class="small">バージョン 2.5 · 第1章14夜＋第2章14夜＋継続放送・特別放送・四季と天候・物語連動企画・自律的な出会いと再会・新リスナー3人。音楽は文章演出のみで、音声は再生されません。画像・外部ライブラリを使用せず、オフラインで遊べます。</p></section>`}
function specialPlanningPanel(){
 const n=s.night;
 const p=s.special?.planned;
 if(p&&p.status==='announced'&&p.announceNight===n){
  const t=SPECIAL_THEMES[p.themeId];
  return `<div class="special-planning"><div class="overline">NEXT SPECIAL / 予告</div><h3>${esc(t.title)}</h3><p>今夜の放送の終わりに募集を告知し、第${p.night}夜に特別放送を行います。今夜の通常のお便りも、いつもどおり紹介できます。</p>${p.storySource?`<p class="small">きっかけ：第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」</p>`:''}<div class="actions"><button class="btn secondary" onclick="specialCancel()">企画を取り消す</button></div></div>`;
 }
 const choices=specialAvailable(n);
 if(!choices.length)return '';
 const fromLife=choices.filter(id=>id.startsWith('story_'));
 const other=choices.filter(id=>!id.startsWith('story_'));
 const offered=fromLife.map(id=>{
  const t=SPECIAL_THEMES[id],offer=storyOfferFor(id);
  return `<button class="choice story-proposal" onclick="specialPlan('${id}')"><span class="story-proposal-kicker">届いた声から生まれた企画</span><strong>${esc(t.title)}</strong><br><span class="small">${esc(t.invitation)}</span>${offer?`<span class="story-source">きっかけ：第${offer.originNight}夜に紹介した「${esc(offer.sourceSubject)}」</span>`:''}</button>`;
 }).join('');
 return `<div class="special-planning"><div class="overline">SPECIAL PROGRAM / 企画の相談</div><h3>次の夜、特別な放送をしてみませんか？</h3><p class="muted">企画しないまま、いつもの放送を続けても大丈夫です。募集は今夜、本番は翌夜です。</p>${fromLife?`<div class="story-offer-title">✧ リスナーの暮らしから生まれた企画</div>${offered}<hr class="divider">`:''}${other.map(id=>{const t=SPECIAL_THEMES[id];return `<button class="choice" onclick="specialPlan('${id}')"><strong>${esc(t.title)}</strong><br><span class="small">${esc(t.invitation)}</span></button>`}).join('')}</div>`;
}
function specialIntro(){
 const p=s.special.planned,t=SPECIAL_THEMES[p.themeId];
 return `<section class="panel special-panel"><div class="overline">SPECIAL PROGRAM / 第${s.night}夜 · 01:46</div><h2>${esc(t.title)}</h2><p>${fmt('昨日の放送の終わりに、小さな企画を告知した。\n\n届いた手紙には、書いた人の一日がある。\n送らずに聴いていた人にも、一日があった。\n\n今夜はいつもより少しだけ、机の灯りが明るい。')}</p>${p.storySource?`<div class="story-origin">この企画は、第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」をきっかけに生まれました。<br>同じ話題でも、今夜の手紙はそれぞれ別の暮らしから届いています。</div>`:''}<div class="notice">${esc(t.invitation)}<br>通常のお便りも届いています。最大3通を選んで放送しましょう。</div><div class="actions"><button class="btn" onclick="startNight()">特別放送のお便りを確認する →</button></div></section>`;
}
function specialAfter(){
 const p=s.special.planned,t=SPECIAL_THEMES[p.themeId];
 return `<section class="panel end special-panel"><div class="overline">03:00 / SPECIAL PROGRAM END</div><h2>${esc(t.title)}</h2><p>${fmt(t.closing+'\n\n声を出さなかった人にも、この時間は流れていた。\n\nマイクの赤いランプが消える。')}</p><hr class="divider"><div class="small">紹介したお便り：${s.played.filter(x=>x.night===s.night).length}通</div><div class="small">募集に応じて届いたお便り：${p.submissions.length}通</div>${p.storySource?`<p class="small">きっかけ：第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」</p>`: ''}<p class="small">聴いた人の記憶や、明日届くかもしれない感想は、放送後の世界に残ります。</p><div class="actions"><button class="btn" onclick="nextNight()">次の夜へ進む →</button></div></section>`;
}
function regularIntro(){
 const n=s.night,theme=regularTheme(n),day=['月','火','水','木','金','土','日'][(n-1)%7];
 const intro=['手紙の束に新しい宛名を見つけた。','窓の外に、帰りの遅い人の灯りが見える。','昨夜の放送から、街ではまた一日が過ぎた。','スタジオに湯気の立つカップが置かれている。'][simHash(`reg:scene:${n}`)%4];
 return `<section class="panel"><div class="overline">REGULAR BROADCAST / 第${n}夜・${day}曜日</div><h2>今日も、午前2時</h2><p>${fmt(intro+'\n\n第2章も一区切りを迎えた。でも、ラジオはまだ続いている。\n\n今夜の小さなテーマは「'+theme[0]+'」。\n'+theme[1]+'。\n\n読む手紙は、まだ決まっていない。')}</p><div class="notice">通常放送では、これまでの人生分岐・感情・自律生活からお便りが届きます。</div>${specialPlanningPanel()}<div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function regularAfter(){
 const messages=['放送が終わったあと、スタジオには時計の音が残った。','曲が止み、誰かの街の夜はまだ続いている。','机の上には、読み上げなかった便箋も残っている。','マイクの向こうに、今夜もいくつかの生活があった。'];
 const text=messages[simHash(`reg:after:${s.night}`)%messages.length];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · 通常放送</div><h2>また明日の午前2時に</h2><p>${fmt(text+'\n\n声が届いた人も、届かなかった人もいる。\n\n放送の外では、今日もそれぞれの暮らしが続いている。')}</p>${s.special?.planned?.announceNight===s.night&&s.special.planned.status==='ready'?`<div class="special-planning"><div class="overline">SPECIAL PROGRAM · 募集の告知</div><h3>${esc(SPECIAL_THEMES[s.special.planned.themeId].title)}</h3><p>${esc(SPECIAL_THEMES[s.special.planned.themeId].invitation)}</p><p class="small">第${s.special.planned.night}夜に放送します。</p></div>`:''}<hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===s.night).length}通</div><div class="small">次の夜には、今日の出来事から別のお便りが届くかもしれません。</div><div class="actions"><button class="btn" onclick="nextNight()">次の夜へ進む →</button></div></section>`;
}

function chapter2Intro(){
 const n=s.night,theme=CH2_NIGHTS[n],first=n===15;
 const text=(first?'第1章の放送から一夜が過ぎた。\n\n何かを決めた人にも、決められなかった人にも、朝が来た。\n\n今夜からまた、新しい便箋が机に積まれていく。':'前夜の放送から、街ではまた一日が過ぎた。\n\n')+theme[1]+'\n\n今夜も、誰かの暮らしから届いた手紙を開く。';
 return `<section class="panel"><div class="overline">CHAPTER TWO / NIGHT ${n} · 01:46</div><h2>${esc(theme[0])}</h2><p>${fmt(text)}</p><div class="notice">第2章「選んだ道の、その先」。第1章で選んだ人生の方針と、続いている日常を引き継ぎます。手紙を読まなかった人にも出来事が起こります。</div><div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function chapter2After(){
 const n=s.night,scenes=[
 '今日も、決めた道を歩いている人と、まだ立ち止まっている人がいた。',
 '同じ街の、違う窓に明かりがともっている。',
 '便箋に書かれなかった出来事も、明日につながっていく。',
 '誰かの返事を待っているあいだにも、生活は続く。',
 '大きな決断のあとに来るのは、たいてい何でもない一日だ。'
 ];
 const scene=scenes[simHash(`ch2:after:${n}`)%scenes.length];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · CHAPTER TWO</div><h2>今夜の放送が終わった</h2><p>${fmt(scene+'\n\nマイクを切ると、机にはまだ開いていない便箋が残る。\n\nその人が明日どうするかは、まだ誰にもわからない。')}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">今夜紹介しなかったお便り：${Math.max(0,nightLetters(n).length-s.chosen.length)}通</div><div class="actions"><button class="btn" onclick="nextNight()">${n===28?'第2章の放送を振り返る →':'次の夜へ進む →'}</button></div></section>`;
}
function chapter2Complete(){
 const heard=['cat','driver','fish','clock','terminal'].map(id=>{
  const read=s.played.filter(x=>x.who===id&&x.night>=15&&x.night<=28);
  if(!read.length)return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">この二週間、番組では近況を紹介しなかった。けれど、その人の生活は続いている。</div></div>`;
  const last=read[read.length-1];
  return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">最後に紹介したのは第${last.night}夜：「${esc(last.subject)}」</div><div class="small">続きがどうなるかは、まだわからない。</div></div>`;
 }).join('');
 const prose='十四夜をもう一度重ねた。\n\n何かを選んだ日のあとにも、失敗したり、笑ったり、何も起こらなかった日があった。\n\n今夜読めなかった手紙の向こうにも、明日の予定がある。\n\nラジオ局は、まだ閉まらない。';
 return `<section class="panel end"><div class="overline">CHAPTER TWO / FOURTEEN MORE NIGHTS</div><h2>まだ続く声</h2><p>${fmt(prose)}</p><hr class="divider"><h3>放送で知ったその後</h3><p class="muted">番組で実際に紹介した近況だけを振り返ります。本人が話していない出来事は表示しません。</p>${heard}<div class="notice">第2章 完了。記憶・生活・関係・選んだ道はそのまま保存されます。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を読む</button><button class="btn" onclick="beginAfterChapter2()">第29夜から通常放送へ →</button><button class="btn secondary" onclick="setTab('settings')">バックアップを保存</button></div></section>`;
}
function beginAfterChapter2(){
 if(s.night!==28||s.phase!=='chapter2_complete')return;
 s.night=29;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;
 nightLetters(29);save();render();
}

let lastViewKey=null;
function render(){
  if(!['studio','letters','journal','listeners','settings'].includes(s.tab))s.tab='studio';
  const content=s.tab==='letters'?lettersTab():s.tab==='journal'?journal():s.tab==='listeners'?listeners():s.tab==='settings'?settings():
    s.phase==='intro'?intro():s.phase==='prepare'?prepare():s.phase==='broadcast'?broadcast():s.phase==='reply'?reply():s.phase==='after'?after():s.phase==='chapter2_complete'?chapter2Complete():complete();
  const decorated=s.tab==='studio'&&s.phase==='intro'?climateIntroText(s.night)+content:content;
  const key=`${s.tab}:${s.tab==='studio'?s.phase:''}:${s.phase==='broadcast'?s.cursor:''}:${s.phase==='reply'?s.replyStep:''}`;
  const y=window.scrollY;
  const changed=lastViewKey!==null&&lastViewKey!==key;
  const specialStepChanged=changed&&s.tab==='studio'&&s.phase==='reply'&&lastViewKey.startsWith('studio:reply:');
  const oldSource=document.getElementById('special-reply-letter');
  const oldSourceOpen=oldSource?oldSource.open:null;
  document.getElementById('app').innerHTML=shell(decorated);
  const newSource=document.getElementById('special-reply-letter');
  if(newSource&&oldSourceOpen!==null)newSource.open=oldSourceOpen;
  lastViewKey=key;
  // 同じ画面内の選択は位置維持。特別返答のSTEP移動では選択肢を表示する。
  const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  if(changed){
    const anchor=specialStepChanged?document.getElementById('special-reply-choices'):document.getElementById('main');
    const target=Math.max(0,anchor.getBoundingClientRect().top+window.scrollY-12);
    window.scrollTo(0,Math.min(target,maxY));
  }else{
    window.scrollTo(0,Math.min(y,maxY));
  }
}

nightLetters(s.night);render();
