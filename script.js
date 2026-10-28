'use strict';
const SAVE='radio_2am_prototype_v1'; // 本編の従来キーは変更しない
const READER_SAVE='radio_2am_reader_v48';
const ACTIVE_PROFILE_KEY='radio_2am_active_profile_v48';
const READER_POSITION_KEY='radio_2am_reader_position_v420';
const MAIN_VIEW_KEY='radio_2am_main_view_v421'; // 表示専用。物語のセーブとは独立
let activeProfile='main';
try{if(localStorage.getItem(ACTIVE_PROFILE_KEY)==='reader'&&localStorage.getItem(READER_SAVE))activeProfile='reader'}catch(e){console.warn(e)}
let readerBatch=false,readerSetupOpen=false,readerSaveWarning=false;
let mainDataRevision=0; // 読書モードの表示操作とは独立した本編データの更新番号
let s=load();
if(!s.simState)s.simState=createSimulationState();
if(!s.microWorld)s.microWorld=createMicroWorldState();
if(!s.socialWorld)s.socialWorld=createSocialWorldState();
if(!s.newListeners)s.newListeners=createNewListenerState();
if(!s.chapter3)s.chapter3=createChapter3State();
if(!s.chapter4)s.chapter4=createChapter4State();
if(!s.regular)s.regular=createRegularState();
if(!s.quiet)s.quiet=createQuietState();
if(!s.radioCulture)s.radioCulture=createRadioCultureState();
if(!s.radioMemory)s.radioMemory=createRadioMemoryState39();
if(!s.dailyThreads)s.dailyThreads=createDailyThreadsState41();
if(!s.relationThreads)s.relationThreads=createRelationThreadsState42();
if(!s.longEcho43)s.longEcho43=createLongEchoState43();
if(!s.surprise46)s.surprise46=createSurpriseState46();
if(!s.special)s.special=createSpecialState();
if(!s.finale)s.finale=createFinaleState();
if(!s.crossTalk4830)s.crossTalk4830=createCrossTalkState4830();
if(!s.crossAfter4831)s.crossAfter4831=createCrossAfterState4831();
if(!s.storyPrograms)s.storyPrograms=createStoryProgramsState();
if(!s.climate)s.climate=createClimateState();
function migrateState(data){
  if(!data||data.version!==1||!data.listeners||!data.flags)return null;
  const defaults=defaultState();
  data.contentVersion=14;
  migrateFinaleState(data);
  migrateClimate(data);
  migrateSpecial(data);
  migrateStoryPrograms(data);
  migrateRegular(data);
  migrateCrossTalk4830(data);
  migrateCrossAfter4831(data);
  migrateQuiet(data);
  migrateRadioCulture(data);
  migrateRadioMemory39(data);
  migrateDailyThreads41(data);
  migrateRelationThreads42(data);
  migrateLongEcho43(data);
  migrateSurprise46(data);
  migrateChapter2(data);
  migrateChapter3(data);
  migrateChapter4(data);
  migrateMicroWorld(data);
  migrateSimulation(data);
  migrateSocialWorld(data);
  migrateNewListeners(data);
  migrateLifePaths(data);
  data.storyState=initializeStoryState(data.storyState);
  // v3.6: 表示専用のスタジオ演出は旧セーブからも安全に復元する。
  data.studioVisuals=normalizeStudioVisuals(data.studioVisuals);
  data.stationTone=data.stationTone||{warmth:0,curiosity:0,quiet:0};
  // v3.5: 旧版の途中セーブから再開するときは、すでに読んだ手紙の間へ新しい選択画面を割り込ませない。
  const hadStyle=!!data.broadcastStyle;
  data.broadcastStyle ||= createBroadcastStyle();
  // v4.7: 旧セーブは手動放送を維持。進行中の放送モードは当夜のみ固定する。
  if(!['manual','letters'].includes(data.broadcastModePref))data.broadcastModePref='manual';
  if(!['manual','letters'].includes(data.nightBroadcastMode)){
    data.nightBroadcastMode=['broadcast','reply','after'].includes(data.phase)?'manual':null;
  }
  data.broadcastStyle.interludes ||= {};
  data.broadcastStyle.completed ||= {};
  if(!Array.isArray(data.broadcastStyle.history))data.broadcastStyle.history=[];
  if(!hadStyle){
    if((data.phase==='broadcast'||data.phase==='reply')&&data.cursor>0){
      for(let i=1;i<=data.cursor;i++)data.broadcastStyle.completed[i]=true;
    }
    // 旧版でエンディング曲を選択済みの夜は、そのまま終えられる。
    if(data.song!==null&&data.song!==undefined&&data.phase==='broadcast')data.broadcastStyle.closing=0;
  }

  data.pending=Array.isArray(data.pending)?data.pending:[];
  data.privateMemories=data.privateMemories||{};
  data.events=Array.isArray(data.events)?data.events:[];
  data.logs=Array.isArray(data.logs)?data.logs:[];
  data.played=Array.isArray(data.played)?data.played:[];
  // アップデート済みのユーザーへ、初回案内を突然表示しない。
  if(!data.guidance || typeof data.guidance!=='object')data.guidance={welcomeSeen:true,suppressHints:false,seen:{},bookmarksOnly:false};
  data.guidance.seen ||= {};
  data.bookmarks=Array.isArray(data.bookmarks)?data.bookmarks:[];
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
// v4.8.20: 保存容量不足時の読書データを可逆圧縮して保持する。
// 圧縮は容量エラーに遭遇したときだけ使い、日常的な保存は高速な従来のJSON形式を保つ。
// 旧版のJSON保存は引き続き読み込め、ダウンロードするJSONは圧縮しない。
// Offline-capable lossless LZW coding of UTF-8 JSON as base64; format token R20-LZW1:.
function radioCompactEncode(json){
 const bytes=new TextEncoder().encode(json), map=new Map(), out=[];
 let next=257, word=-1;
 for(let i=0;i<bytes.length;i++){
  const byte=bytes[i];
  if(word<0){word=byte;continue;}
  const pair=word*256+byte, known=map.get(pair);
  if(known!==undefined){word=known;continue;}
  out.push(word);
  if(next<65536)map.set(pair,next++);
  else {out.push(256);map.clear();next=257;}
  word=byte;
 }
 if(word>=0)out.push(word);
 const pieces=[];for(let i=0;i<out.length;i+=16384){const part=out.slice(i,i+16384);let bin='';for(let j=0;j<part.length;j++)bin+=String.fromCharCode(part[j]>>8,part[j]&255);pieces.push(bin);}
 return 'R20-LZW1:'+btoa(pieces.join(''));
}
function radioCompactDecode(packed){
 if(typeof packed!=='string'||!packed.startsWith('R20-LZW1:'))throw Error('保存形式が不正です');
 const bytes=atob(packed.slice(9));
 if(bytes.length%2)throw Error('圧縮データが途中で壊れています');
 const table=new Array(65536), pieces=[];
 let next=257, prev='';
 for(let i=0;i<bytes.length;i+=2){
  const code=bytes.charCodeAt(i)*256+bytes.charCodeAt(i+1);
  if(code===256){next=257;table.fill(undefined,257);prev='';continue;}
  let entry;
  if(code<256)entry=String.fromCharCode(code);
  else if(code<next&&table[code]!==undefined)entry=table[code];
  else if(code===next&&prev)entry=prev+prev[0];
  else throw Error('圧縮データを復号できません');
  pieces.push(entry);
  if(prev&&next<65536)table[next++]=prev+entry[0];
  prev=entry;
 }
 const binary=pieces.join(''),decoded=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)decoded[i]=binary.charCodeAt(i);
 return new TextDecoder('utf-8',{fatal:true}).decode(decoded);
}

function readerDecodeSaved(raw){
 if(typeof raw!=='string')throw Error('読書用セーブがありません');
 return JSON.parse(raw.startsWith('R20-LZW1:')?radioCompactDecode(raw):raw);
}
function readerSaveRaw(raw,allowCompression=true){
 // 既に圧縮で保存されている場合は、容量上限を再び踏まないよう圧縮形式を保つ。
 const prior=localStorage.getItem(READER_SAVE)||'';
 if(!prior.startsWith('R20-LZW1:')){
  try{localStorage.setItem(READER_SAVE,raw);return true}catch(e){if(!allowCompression)throw e}
 }
 if(!allowCompression)throw Error('読書記録の保存に失敗しました');
 const packed=radioCompactEncode(raw);
 // 圧縮しても原本より大きければ、不必要な変換をしない。
 if(packed.length>=raw.length&&prior.startsWith('R20-LZW1:'))throw Error('圧縮しても十分な保存容量を確保できません');
 localStorage.setItem(READER_SAVE,packed);
 return true;
}
// 夜の位置移動で巨大な全セーブを上書きしない。原稿自体は別キーに保存済み。
function readerSavePosition(){
 if(activeProfile!=='reader'||!s?.reader)return true;
 try{localStorage.setItem(READER_POSITION_KEY,JSON.stringify({night:s.reader.pages.length,index:s.reader.viewIndex,y:s.reader.scrollY}));return true}
 catch(e){console.warn('読書位置の保存に失敗しました',e);return false}
}
function readerApplyPosition(state){
 const target=state||s;
 if(activeProfile!=='reader'||!target?.reader)return;
 try{const v=JSON.parse(localStorage.getItem(READER_POSITION_KEY)||'null');
  if(v&&v.night===target.reader.pages.length&&Number.isInteger(v.index)&&v.index>=0&&v.index<target.reader.pages.length){
   target.reader.viewIndex=v.index; target.reader.scrollY=Number.isFinite(v.y)&&v.y>=0?v.y:0;
  }
 }catch(e){console.warn('読書位置の復元を省略しました',e)}
}
// v4.8.20: JSONとして正しくても原稿一覧が壊れた読書用バックアップを拒否する。
// 過去の版には無い表示用の補助情報は安全な初期値で補う。保存済みの原稿は変更しない。
function validateReaderState(data){
 const r=data?.reader;
 if(!r||r.schema!==1||!Array.isArray(r.pages)||!Array.isArray(data.played))return false;
 if(!r.pages.every(p=>p&&Number.isInteger(p.night)&&p.night>=1&&Array.isArray(p.letterIds)&&(p.letterIds.length>0||p.isFinale===true)&&p.letterIds.every(id=>typeof id==='string')&&Array.isArray(p.interludes)&&Array.isArray(p.song)))return false;
 const byNight=new Map();for(const x of data.played){if(!x||!Number.isInteger(x.night)||typeof x.id!=='string')continue;if(!byNight.has(x.night))byNight.set(x.night,new Set());byNight.get(x.night).add(x.id)}
 if(r.pages.some(p=>p.letterIds.some(id=>!byNight.get(p.night)?.has(id))))return false;
 if(!r.dj||typeof r.dj!=='object')r.dj={tags:[],lastPlanNight:-999};
 if(!Array.isArray(r.dj.tags))r.dj.tags=[];
 if(!Number.isInteger(r.viewIndex)||r.viewIndex<0||r.viewIndex>=r.pages.length)r.viewIndex=r.pages.length-1;
 if(!Number.isFinite(r.scrollY)||r.scrollY<0)r.scrollY=0;
 return true;
}
// v4.8.37: タブと日誌ページは表示だけの状態。重い本編セーブに触れない。
function applyMainViewState(state){
 if(!state||activeProfile!=='main')return;
 try{
  const v=JSON.parse(localStorage.getItem(MAIN_VIEW_KEY)||'null');
  if(v&&['studio','letters','journal','listeners','settings'].includes(v.tab))state.tab=v.tab;
  if(v&&Number.isInteger(v.journalPage)&&v.journalPage>=0)state.journalPage=v.journalPage;
 }catch(e){console.warn('表示位置の読込を省略しました',e)}
}
function saveMainViewState(){
 if(activeProfile!=='main')return true;
 try{
  localStorage.setItem(MAIN_VIEW_KEY,JSON.stringify({tab:s.tab,journalPage:Math.max(0,Math.floor(s.journalPage||0))}));
  return true;
 }catch(e){console.warn('表示位置の保存を省略しました',e);return false}
}
function journalMovePage(delta){
 const next=Math.max(0,Math.min(Math.floor((s.night-1)/10),Math.floor(s.journalPage||0)+delta));
 if(next===s.journalPage)return;
 s.journalPage=next;saveMainViewState();render();
}
function load(){
 try{
  const raw=localStorage.getItem(activeProfile==='reader'?READER_SAVE:SAVE);
  const data=raw?migrateState(activeProfile==='reader'?readerDecodeSaved(raw):JSON.parse(raw)):null;
  if(data&&(activeProfile!=='reader'||validateReaderState(data))){if(activeProfile==='reader')readerApplyPosition(data);else applyMainViewState(data);return data;}
 }catch(e){console.warn('セーブデータの読込に失敗しました',e)}
 // 読書データが壊れても本編へ退避できるようにする。破損データ自体は消さない。
 if(activeProfile==='reader'){
  activeProfile='main';
  try{localStorage.setItem(ACTIVE_PROFILE_KEY,'main')}catch(e){console.warn(e)}
  try{
   const raw=localStorage.getItem(SAVE),data=raw?migrateState(JSON.parse(raw)):null;
   if(data){applyMainViewState(data);return data;}
  }catch(e){console.warn('本編セーブの読込に失敗しました',e)}
 }
 return defaultState();
}

function save(){
 if(readerBatch)return true;
 if(activeProfile==='main')mainDataRevision++; // 放送内容の更新時は部分描画を無効化する
 try{const raw=JSON.stringify(s);if(activeProfile==='reader')readerSaveRaw(raw);else{localStorage.setItem(SAVE,raw);saveMainViewState()}readerSaveWarning=false;return true}
 catch(e){console.warn('save failed',e);readerSaveWarning=true;return false}
}
function rand(){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
function clamp(v){return Math.max(0,Math.min(100,v))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v){return esc(v).replace(/\n/g,'<br>')}
function letter(id){
 let l=letterDB[id]||s.regular?.letterArchive?.[id];
 if(!l)return null;
 // 原文はそのままに、本文に依存する既存の追伸・条件付きの話題も適用する。
 let result;
 if(l.regular){
   result={...l,id};
   // v4.8.37: 旧版で受信済み・未紹介の日常便りも、新しい第3返答を表示する。
   // 保存済みの返答本文と元のアーカイブは書き換えない。選択肢の番号・タグも不変。
   if(result.kind==='everyday47'&&Array.isArray(result.choices)&&result.choices.length>=3&&
      /こんな何でもない日のことも、また聞かせてください。/.test(String(result.choices[2][1]||''))){
     const key=String(result.tag||'').replace(/^everyday47:/,'');
     const entry=EVERYDAY_LETTERS_4827[result.who]?.find(x=>x.key===key);
     if(entry)result.choices=result.choices.map((row,i)=>i===2?[...entry.choices[2]]:[...row]);
   }
 }else{
   let body=l.body;
   if(id==='clock3')body=body.replace('{wife}',s.flags.clockWifeKnown?'妻なら知っていたでしょうが、私は花の名前には疎いもので。':'昔なら、名前を知っている人に聞けたのですが、今は自分で調べるしかありません。');
   if(id==='echo_driver_clock'&&s.microWorld?.links?.['old-clock-street']?.greeted)body=body.replace('お店は閉まっていました。','お店は閉まっていました。店の前で年配の人とすれ違い、軽く会釈しました。');
   if(id==='cat2'&&s.flags.catReply==='reflection')body=body.replace('今日、上司と話しました。','昨日、辞めたい理由と辞めたあとにしたいことは別だと言ってくれましたよね。あれから少し考えていました。\n\n今日、上司と話しました。');
   const late=lateLetterText(id,s);
   const lifeNote=lifeLetterNote(id,s);
   result={...l,...(late||{}),id,body:(relationLetterText(id,s)?.body??late?.body??body)+lifeNote+(l.special?'':(simRelationshipPostscript(l.who,s.night)||simLetterPostscript(l.who,s.night)))};
 }
 // 以前の手書き専用返答はそのまま使い、汎用返答だけを内容別の返答へ差し替える。
 // 既に放送した手紙の返答履歴には手を触れない。
 // v4.8.37: 旧版で受信済みの物語連動型企画も、未放送の候補だけ
 // 実際の手紙を基に改めて選ぶ。放送済みの返答履歴は変更しない。
 const storyReplyReviewNeeded=result.programSpecial&&
   ['story_creative','story_unsaid','story_taught','story_crossing'].includes(result.themeId)&&
   !l.replyReview437;
 if(!result.special && isGenericReplySet(result) && (l.replyVersion!==REPLY_CONTENT_VERSION||storyReplyReviewNeeded)){
   const choices=replyTopicChoices(result);
   if(!Array.isArray(choices)||choices.length<3)throw new Error('通常返答の生成に失敗しました: '+id);
   result.choices=choices;
   if(s.regular?.letterArchive?.[id]===l){
     l.choices=choices.map(x=>[...x]);
     l.replyVersion=REPLY_CONTENT_VERSION;
     if(storyReplyReviewNeeded)l.replyReview437=true;
   }
 }
 return result;
}
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
    const who=letterSenderId(id);
    // 第1〜3章で意図的に同一人物が複数書いた物語は維持。
    // 継続放送では同じ夜に同じ人の投稿が集中しないようにする。
    const limit=NIGHTLY_LETTER_LIMITS[who]??(n>=29&&!chapter3IsNight(n)&&who?1:undefined);
    if(limit!==undefined&&(counts[who]||0)>=limit)continue;
    retained.add(id);
    counts[who]=(counts[who]||0)+1;
  }
  const result=ids.filter(id=>retained.has(id));
  if(n===s.night&&s.phase==='prepare')s.chosen=s.chosen.filter(id=>retained.has(id));
  return result;
}
function nightLetters(n){
  chapter3MaybeShift(n);
  if(s.letterSets[n]){
    const original=s.letterSets[n];
    const limited=applyNightlyLetterLimits(n,original);
    if(limited.length!==original.length){s.letterSets[n]=limited;save()}
    regularConfirmDelivered40(n,s.letterSets[n]);
    quietConfirmDelivered(n,s.letterSets[n]);
    radioCultureConfirmDelivered(n,s.letterSets[n]);
  radioVarietyConfirmDelivered38(n,s.letterSets[n]);
  radioMemoryConfirmDelivered39(n,s.letterSets[n]);
  dailyThreadConfirmDelivered41(n,s.letterSets[n]);
  relationThreadConfirmDelivered42(n,s.letterSets[n]);
  longEchoConfirmSource43(n,s.letterSets[n]);
  longEchoConfirmDelivered43(n,s.letterSets[n]);
  listenerCrossConfirmDelivered4830(n,s.letterSets[n]);
  listenerCrossAfterConfirm4831(n,s.letterSets[n]);
  surpriseConfirmDelivered46(n,s.letterSets[n]);
    newListenerOnLettersDelivered(n,s.letterSets[n]);
    return s.letterSets[n];
  }
  let fresh=[];
  if(n===1)fresh=['cat1','clock1','bread1','moon1'];
  else if(n===2)fresh=['driver2',s.flags.catRead?'cat2':'cat2unread',s.flags.clockRead&&s.flags.clockPast?'clock2':'clock2generic',s.flags.moonQuestion?'sugar2':'moon2'];
  else if(n===3)fresh=['fish3','clock3',s.flags.driverRead?'driver3':'driver3first','bread3','moon3'];
  else if(n>=15&&n<=28)fresh=chapter2Letters(n);
  else if(chapter3IsNight(n))fresh=chapter3Letters(n);
  else if(n>=29)fresh=chapter4Letters(n);
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
  const picked=[...new Set([...order,...aftermath,...echoes,...carried,...(climateMail?[climateMail]:[])])].filter(id=>{
    const l=letterDB[id]||s.regular?.letterArchive?.[id];
    // 自律投稿だけを控える。物語の手書きイベントには介入しない。
    return l&&(!l.regular||l.chapter2||l.chapter3||l.chapter4||!quietScheduledFor(l.who,n));
  });
  s.letterSets[n]=applyNightlyLetterLimits(n,picked.slice(0,8));
  regularConfirmDelivered40(n,s.letterSets[n]);
  quietConfirmDelivered(n,s.letterSets[n]);
  radioCultureConfirmDelivered(n,s.letterSets[n]);
  radioVarietyConfirmDelivered38(n,s.letterSets[n]);
  radioMemoryConfirmDelivered39(n,s.letterSets[n]);
  dailyThreadConfirmDelivered41(n,s.letterSets[n]);
  relationThreadConfirmDelivered42(n,s.letterSets[n]);
  longEchoConfirmSource43(n,s.letterSets[n]);
  longEchoConfirmDelivered43(n,s.letterSets[n]);
  listenerCrossConfirmDelivered4830(n,s.letterSets[n]);
  listenerCrossAfterConfirm4831(n,s.letterSets[n]);
  surpriseConfirmDelivered46(n,s.letterSets[n]);
  newListenerOnLettersDelivered(n,s.letterSets[n]);
  // 便箋が確定した時点で返答候補も確定し、セーブに一緒に保存する。
  for(const id of s.letterSets[n])letter(id);
  save();
  return s.letterSets[n];
}
// v3.6 視覚演出。自律生活や放送判定とは独立している。
function normalizeStudioVisuals(v){
  return {enabled:v?.enabled!==false,motion:['normal','reduced','off'].includes(v?.motion)?v.motion:'normal'};
}
function setStudioVisuals(kind,value){
  s.studioVisuals=normalizeStudioVisuals(s.studioVisuals);
  if(kind==='enabled')s.studioVisuals.enabled=!!value;
  if(kind==='motion'&&['normal','reduced','off'].includes(value))s.studioVisuals.motion=value;
  save();render();
}
function studioDisplayPhase(){
  if(s.phase==='after'||['complete','chapter2_complete','chapter3_complete','chapter4_complete','final_complete'].includes(s.phase))return 'finished';
  if(s.phase==='intro'||s.phase==='prepare'||s.phase==='final_intro')return 'preparing';
  if(s.phase==='final_broadcast')return s.finale?.stage===0?'opening':s.finale?.stage>=(s.finale?.snapshot?.letters?.length||0)+2?'music':'speaking';
  if(s.phase==='reply')return 'speaking';
  if(s.phase!=='broadcast')return 'preparing';
  if(s.cursor>=s.chosen.length)return s.song!==null?'music':'speaking';
  if(s.cursor>0&&!s.broadcastStyle.completed[s.cursor])return 'bridging';
  if(s.cursor>0&&s.broadcastStyle.interludes[s.cursor]===-1)return 'silent';
  return s.cursor===0?'opening':'speaking';
}
function studioWeatherText(n){
  const weather=climateForNight(n).weather;
  return ({clear:'窓の向こうに、遠くの街灯が見える。',cloudy:'今夜は、月の場所がよくわからない。',rain:'窓を伝う雨粒が、外の灯りをぼかしている。',snow:'窓の外では、白いものがゆっくり降っている。'})[weather]||'窓の外にも、まだ眠らない灯りがある。';
}
function studioScene(compact=false){
 const phase=studioDisplayPhase(),on=['opening','speaking','bridging','silent','music'].includes(phase);
 const time=phase==='finished'?'03:00':phase==='preparing'?(s.phase==='prepare'?'01:59':'01:48'):phase==='opening'?'02:00':phase==='music'?'02:53':phase==='bridging'?'02:34':phase==='silent'?'02:35':s.phase==='reply'?'02:23':'02:18';
 const visuals=normalizeStudioVisuals(s.studioVisuals),climate=climateForNight(s.night),sp=specialActive(s.night);
 const meter=visuals.enabled?`<div class="studio-level" aria-hidden="true">${Array.from({length:7},(_,i)=>`<span class="studio-level-bar" style="--bar:${i};--bar-height:${[10,17,25,20,29,15,12][i]}px"></span>`).join('')}</div>`:'';
 return `<div class="studio ${compact?'studio-compact ':''}${sp?'studio-special':''} weather-${climate.weather} season-${climate.season} studio-phase-${phase} ${!visuals.enabled?'studio-minimal':''} studio-motion-${visuals.motion}" role="group" aria-label="スタジオ・${time}・${on?'放送中':'放送外'}"><div class="studio-caption">${sp?'SPECIAL PROGRAM · '+esc(SPECIAL_THEMES[sp.themeId].short):'SOMEWHERE ON AIR · STUDIO'}</div><div class="climate-studio-label">${esc(climateCaption(s.night))}</div><div class="moon"></div><div class="lamp"></div><div class="mic"></div><div class="desk"></div><div class="studio-clock" aria-label="スタジオ時刻">${time}</div><div class="onair" aria-label="${on?'ON AIR':'OFF AIR'}"><span class="onair-light" aria-hidden="true"></span>${on?'ON AIR':'OFF AIR'}</div>${meter}</div>`;
}
function studioPrelude(){
 if(!s.studioVisuals?.enabled)return '';
 return `<div class="studio-prelude"><div class="overline">01:59 / BEFORE ON AIR</div><p>${esc(studioWeatherText(s.night))} 机の上には、今夜届いた手紙が並んでいる。</p><p class="small">マイクはまだオフ。今夜紹介する手紙を選びましょう。</p></div>`;
}
function studioSilenceText(){
 // 未紹介の情報や内部記憶を使わず、実際に紹介した直前のお便りだけ参照。
 const previous=letter(s.chosen[s.cursor-1]);
 const subject=String(previous?.subject||'');
 if(/うれし|嬉し|おめでとう|成功|できた|完成|自慢|楽しい/.test(subject))return '笑みの残るまま、原稿を一枚めくる。';
 if(/思い出|昔|記憶|懐かし/.test(subject))return '机の上で、次の手紙が待っている。';
 if(/悩|迷|別れ|不安|寂し|後悔|失敗/.test(subject))return '少しのあいだ、言葉が途切れた。';
 return '時計の針が、静かに進んでいる。';
}
function studioSilentBridge(){
 if(!s.studioVisuals?.enabled||s.cursor<=0||s.broadcastStyle.interludes[s.cursor]!==-1)return '';
 return `<div class="studio-silent-bridge" role="note"><div class="overline">02:34 / A QUIET MOMENT</div><p>${esc(studioSilenceText())}</p><span>そのまま、次のお便りへ。</span></div>`;
}
function studioAfterQuiet(){
 if(!s.studioVisuals?.enabled)return '';
 return `<div class="studio-after-quiet"><div class="overline">03:00 / OFF AIR</div><p>マイクの灯りが消え、スタジオに静けさが戻る。</p><span>机の上には、今夜読んだ手紙が残っている。</span></div>`;
}
// v4.8.20: 準備画面の表示段階のみを管理。選んだ手紙・演出は従来どおりセーブに保存する。
let prepareStepUI='letters';
let prepareStepNight=null;
function prepareUIStage(stage){
 if(s.phase!=='prepare'||s.tab!=='studio'||!['letters','style'].includes(stage))return;
 if(stage==='style'&&!s.chosen.length)return;
 prepareStepUI=stage;
 render();
}
function setTab(tab){if(!['studio','letters','journal','listeners','settings'].includes(tab))return;readerSetupOpen=false;s.tab=tab;saveMainViewState();render()}
function selectLetter(id){let i=s.chosen.indexOf(id);if(i>=0)s.chosen.splice(i,1);else if(s.chosen.length<3)s.chosen.push(id);save();render()}
function startNight(){if(['on_air','completed'].includes(s.finale?.status)||!['intro','prepare'].includes(s.phase))return;if(s.finale?.status==='planned'&&s.night===s.finale.announcedNight&&s.finale.announcementChoice===null){alert('閉局のお知らせの言葉を選んでください。');return;}prepareStepUI='letters';prepareStepNight=s.night;s.phase='prepare';s.tab='studio';nightLetters(s.night);for(const id of s.letterSets[s.night]||[])letter(id);save();render()}
function beginBroadcast(){
 if(s.phase!=='prepare'||!s.chosen.length)return;
 if(s.broadcastModePref==='letters')s.opening=automaticStylePick('opening',opening.length);
 if(!Number.isInteger(s.opening)||s.opening<0||s.opening>=opening.length)return;
 s.nightBroadcastMode=s.broadcastModePref;
 // v4.9.16: 新規開始した『おたより中心』の夜だけ表示文バリエーションを適用。
 // アップデート時に進行中だった旧版の放送原稿は書き換えない。
 s.lettersPhrase4916=activeProfile==='main'&&s.nightBroadcastMode==='letters'?s.night:null;
 s.guidance.seen.choose=true;recordOpening();s.phase='broadcast';s.cursor=0;save();render();
}
function chooseReply(i){let l=letter(s.current);let c=l.choices[i];applyReply(l,c[2],c[1])}
function finishBroadcast(){
 if(s.phase!=='broadcast'||s.song===null||s.song<0||s.song>=songs.length||!Number.isInteger(s.broadcastStyle.closing)||s.broadcastStyle.closing<0||s.broadcastStyle.closing>=STATION_CLOSINGS.length)return;
 s.phase='after';
 if(s.finale?.status==='planned'&&s.night===s.finale.announcedNight){s.finale.status='announced';log('閉局予告',FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1]);}
 log('曲',`「${songs[s.song][0]}」を流した。`);
 log('エンディング',lettersBroadcastPhrase4916('closing',s.broadcastStyle.closing));
 s.broadcastStyle.history.push(nightStyleRecord());
 if(s.broadcastStyle.history.length>120)s.broadcastStyle.history.splice(0,s.broadcastStyle.history.length-120);
 applySongMood();radioCultureAfterBroadcast(s.night);radioMemoryAfterBroadcast39(s.night);longEchoAfterBroadcast43(s.night);const omitted=nightLetters(s.night).filter(id=>!s.chosen.includes(id));log('未紹介',omitted.length?omitted.map(id=>NAMES[letter(id).who]).join('、')+'のお便りは放送で紹介されなかった。':'今夜届いたお便りはすべて紹介した。');updatePendingLetters();if(s.night<=14)advanceWorld();if(s.night>=29)specialBeginAnnouncement(s.night);simulateDailyLives(s.night);newListenerAfterDaily(s.night);dailyThreadsAfterWorld41(s.night);relationThreadsAfterWorld42(s.night);surpriseAfterWorld46(s.night);simulateSocialWorld(s.night);quietAfterDaily(s.night);if(s.night<=14){lifeAfterDaily(s.night);simulateMicroWorld(s.night)}else {regularAfterWorld(s.night);chapter2AfterWorld(s.night);chapter3AfterWorld(s.night);specialProcessNight(s.night);storyProgramsAfterWorld(s.night)}save();render()}
function nextNight(){
  if(!['after','complete','chapter2_complete','chapter3_complete','chapter4_complete'].includes(s.phase)||s.finale?.status==='completed'||s.finale?.status==='on_air')return;
  if(s.finale?.status==='announced'&&s.night===s.finale.announcedNight){s.night=s.finale.finalNight;s.phase='final_intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;s.replyParts=[null,null,null];s.replyStep=0;s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;save();render();return;}
  if(s.phase==='after')s.guidance.seen.after=true;
  if(chapter3Offset(s.night)===CH3_DAYS.length-1&&s.chapter3?.finished){s.phase='chapter3_complete';save();render();return}
  if(s.night===92&&chapter4IsNight(92)&&!s.chapter4.finished){s.chapter4.finished=true;s.phase='chapter4_complete';save();render();return}
  if(s.night===28&&s.chapter2?.legacyThrough<28){s.phase='chapter2_complete';save();render();return}
  if(s.night===14){s.phase='complete';save();render();return}
  s.night++;
  s.phase='intro';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;
  s.replyParts=[null,null,null];s.replyStep=0;s.song=null;s.tab='studio';s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
  nightLetters(s.night);save();render();
}
function beginRegular(){
  if(s.night!==14||s.phase!=='complete')return;
  s.regular ||= createRegularState();s.regular.started=true;s.chapter2 ||= createChapter2State();s.chapter2.started=true;
  s.night=15;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
  s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
  nightLetters(s.night);save();render();
}
function resetGame(){
 if(!confirm('進行状況を最初からやり直しますか？ 現在のセーブは消えます。'))return;
 const old=s;
 s=defaultState();s.simState=createSimulationState();s.newListeners=createNewListenerState();s.chapter3=createChapter3State();s.quiet=createQuietState();s.radioCulture=createRadioCultureState();s.radioMemory=createRadioMemoryState39();s.longEcho43=createLongEchoState43();s.surprise46=createSurpriseState46();
 if(!save()){s=old;alert('保存できなかったため、リセットを取り消しました。保存領域を確認してください。');return}
 saveMainViewState();render();
}
function downloadSave(){let blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='radio_2am_save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importSave(input){
  const file=input.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=migrateState(JSON.parse(reader.result));
      if(!data)throw new Error('セーブ形式が違います');
      if(!confirm('現在の進行状況をバックアップで上書きしますか？'))return;
      // 復元先への保存を先に完了させ、失敗時は表示中の進行も元のままにする。
      try{localStorage.setItem(SAVE,JSON.stringify(data))}
      catch(e){console.warn(e);alert('バックアップを保存できませんでした。現在の進行は変更していません。');return}
      s=data;saveMainViewState();render();
    }catch(e){console.warn(e);alert('読み込めないセーブデータです。')}
  };
  reader.readAsText(file);
}

// v3.2: ゲームの楽しみ方を伝える案内。攻略数値を公開せず、実際の放送で知った内容のみ扱う。
let guideOpen=false;
let guideReturnFocus=null; // 手引きを開く前のボタンへフォーカスを戻す

// v4.7: 選んだ操作スタイルは翌夜へ引き継ぐ。放送開始後は当夜のスタイルを固定する。
function isLettersMode(){return s.nightBroadcastMode==='letters'}
function setBroadcastMode(mode){
 if(!['manual','letters'].includes(mode)||!['intro','prepare'].includes(s.phase))return;
 s.broadcastModePref=mode;
 // 準備中に手動へ戻ったとき、以前の挨拶を勝手に確定させない。
 save();render();
}
function broadcastModePicker(){
 const active=s.broadcastModePref;
 return `<div class="broadcast-mode-picker" role="group" aria-label="今夜の放送スタイル"><div class="overline">BROADCAST STYLE / 今夜の放送スタイル</div><div class="broadcast-mode-options"><button type="button" class="broadcast-mode-option ${active==='manual'?'is-active':''}" aria-pressed="${active==='manual'}" onclick="setBroadcastMode('manual')"><strong class="broadcast-mode-title">${uiIcon('radio')}<span>いつもの放送</span></strong><span>挨拶・つなぎの言葉・曲・締めを自分で選ぶ</span></button><button type="button" class="broadcast-mode-option ${active==='letters'?'is-active':''}" aria-pressed="${active==='letters'}" onclick="setBroadcastMode('letters')"><strong class="broadcast-mode-title">${uiIcon('mail')}<span>おたより中心</span></strong><span>演出の選択はおまかせ。手紙と返答は自分で選ぶ</span></button></div><p class="broadcast-mode-tip">選んだスタイルは次の夜にも引き継がれます。放送開始後は今夜のスタイルを変更できません。</p><button class="reader-inline-entry" type="button" onclick="openReaderSetup()">${uiIcon('moon')}<span class="reader-entry-copy">今夜は聴くだけにする <small>別の物語として読みます</small></span></button></div>`;
}
// 物語を動かす乱数を消費しない、放送演出専用の安定した選択。
function automaticStyleHash(value){
 let hash=2166136261;
 for(const c of String(value)){hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0}
 return hash>>>0;
}
// v4.7.2 自動演出ディレクター：公開・放送済みの文章だけから「夜の空気」を推定する。
// 感情の正誤を判定するものではない。判断が曖昧なら穏やかな汎用演出に寄せる。
const STATION_AUTO_KEYS=['gentle','bright','reflective','curious','playful','road','heavy'];
const STATION_AUTO_PROFILES={
 opening:[
  {gentle:1.2,bright:.4},             // 眠れない夜のおとも
  {gentle:1.8,heavy:1.2},             // ねぎらい
  {curious:2.1,bright:.5},            // 今夜はどんな夜
  {reflective:1.3,gentle:1.3,heavy:.6}, // 静かな夜
  {road:2.3,gentle:.9},               // 帰り道
  {curious:1.4,road:1.1}             // 街の声
 ],
 interlude:[
  {gentle:.8,reflective:.6},          // 封筒を開く
  {gentle:1.3,reflective:1.5,heavy:1.6}, // 間を置く
  {curious:1.8,road:.5},              // 聴いている人へ
  {playful:2.3,bright:1.2}            // 封筒たちの順番
 ],
 song:[
  {reflective:2.0,gentle:.9,heavy:.5},
  {gentle:1.7,bright:.6,heavy:.9},
  {curious:2.1,road:.9},
  {gentle:1.0,reflective:1.0,heavy:.5},
  {bright:2.3,playful:1.0},
  {road:1.3,gentle:1.5,reflective:1.1,heavy:.5}
 ],
 closing:[
  {gentle:1.0},
  {gentle:2.0,heavy:1.3},
  {reflective:2.2,heavy:1.4},
  {road:2.5,gentle:.5},
  {playful:2.6,bright:1.3},
  {curious:1.1,gentle:1.1}
 ]
};
// v4.7.2 断片的な単語一致で、否定された気持ちまで確定扱いしない。
// 本文の解釈を保証する機能ではなく、はっきりした否定表現に限って誤判定を抑える。
function stationAutoHasAffirmed(text,pattern){
 const input=String(text||'');
 const matcher=new RegExp(pattern.source,pattern.flags.replace('g','')+'g');
 for(const hit of input.matchAll(matcher)){
  const tail=input.slice(hit.index+hit[0].length,hit.index+hit[0].length+20);
  const head=input.slice(Math.max(0,hit.index-7),hit.index);
  // 「悲しいわけではない」「不安はない」「怖くない」「悲しかったわけじゃない」など。
  if(/^(?:い|かった|た|く|さ|い気持ち)?(?:わけ(?:で|じゃ)?は?ない|わけじゃない|というわけではない|とは限らない|ではない|じゃない|はない|もない|くない|くはない|かったわけではない|かったわけじゃない|を感じていない|はありません|ではありません)/.test(tail))continue;
  if(/(?:決して|全然|まったく)\s*$/.test(head)&&/^(?:くない|ではない|じゃない)/.test(tail))continue;
  return true;
 }
 return false;
}
// 代表的な婉曲な表現だけを限定的に追加。新しいストーリー情報は参照しない。
function stationAutoIndirectDistress(text){
 const words=String(text||'');
 if(/(?:もう限界|限界です|手が震え|居場所がない|責められ続け|毎日責められ|無視されて|夜も眠れなく|行き場がない|帰る場所がない)/.test(words))return true;
 if(/(?:祖父|祖母|父|母|家族|大切な人|親友|長年一緒に暮らした人).{0,14}(?:見送りました|見送った|見送ってから)/.test(words))return true;
 if(/(?:いなくなった|もう会えない).{0,18}(?:静けさ|空席|寂しい|慣れない)/.test(words))return true;
 return false;
}
function stationAutoMood(item,replyText='',replyTag=''){
 const subject=String(item?.subject||'');
 const body=String(item?.body||'').slice(0,1400);
 const words=subject+'\n'+body;
 const reply=String(replyText||'').slice(0,750);
 const mood={gentle:.9,bright:0,reflective:0,curious:0,playful:0,road:0,heavy:0};
 // 文中の単語だけで決めず、明確な話題・返答を優先する。複数感情は併存させる。
 const hard=/(?:傷つ|悲し|怖かっ|怖く|恐ろし|不安|悩ん|悩み|迷っ|迷い|つら|辛い|苦し|寂し|後悔|亡く|泣い|失っ|別れ|言えな|辞めた|辞めよ)/;
 const positive=/(?:嬉し|うれし|楽しかっ|楽しい|おめでとう|成功|売り切れ|できた|完成|自慢|幸せ|ほっとした|よかった|良かった|助かった|喜ん)/;
 const funny=/(?:冗談|ユーモア|ふざけ|おかしな|面白かっ|面白い|おもしろ|笑い話|猫主任|プリン|妙な質問)/;
 if(stationAutoHasAffirmed(words,hard)||stationAutoIndirectDistress(words)){mood.heavy+=2.3;mood.gentle+=.7;mood.reflective+=.45}
 // 軽い失敗談まで深刻な相談と決めつけない。
 if(stationAutoHasAffirmed(words,/(?:失敗|うまくいかな|上手くいかな)/)){mood.heavy+=.7;mood.reflective+=.35}
 if(stationAutoHasAffirmed(words,positive)){mood.bright+=1.8;mood.gentle+=.3}
 if(/(?:昔|思い出|懐かし|記憶|振り返|考え直|気づ|気付|変わっ|決め|選ん|心に残)/.test(words))mood.reflective+=1.6;
 if(/(?:不思議|想像|空想|もしも|なぜ|どうして|月の裏|星|質問|発見)/.test(words))mood.curious+=1.5;
 if(/(?:駅|電車|道路|帰り道|夜道|配送|車窓|始発|終点|散歩|街灯|道を歩)/.test(words))mood.road+=1.35;
 if(stationAutoHasAffirmed(words,funny))mood.playful+=1.65;
 if(/(?:疲れ|眠れ|休憩|休みた|忙し|ひと息|一息|落ち着)/.test(words))mood.gentle+=.65;
 if(/(?:笑っ|笑顔|楽しい)/.test(words)&&mood.heavy<1.8)mood.bright+=.5;
 // 返答はプレイヤーが決めた、もっとも信頼できる放送情報。
 if(['empathy','caution','space'].includes(replyTag))mood.gentle+=1.7;
 if(['reflection','past'].includes(replyTag))mood.reflective+=1.7;
 if(['wonder','question','curiosity','followup'].includes(replyTag))mood.curious+=1.7;
 if(replyTag==='celebrate')mood.bright+=2.6;
 if(replyTag==='humor')mood.playful+=2.2;
 if(replyTag==='agency')mood.bright+=.7;
 if(/(?:無理に|急がなく|苦しかった|辛かった|つらかった|悲しかった|嫌だった|傷つ|不安)/.test(reply)){mood.gentle+=1.0;mood.heavy+=.7}
 if(/(?:おめでとう|嬉しいですね|うれしいですね|よかったですね)/.test(reply))mood.bright+=1.1;
 if(/(?:冗談|笑っ|おかしな|主任|プリン)/.test(reply)&&mood.heavy<1.8)mood.playful+=.5;
 // 深刻な文脈での「笑い」は祝福でも笑い話でもない。
 if(mood.heavy>=2.3&&replyTag!=='humor'){
  mood.playful=Math.min(mood.playful,.4);
  mood.bright=Math.min(mood.bright,1.0);
 }
 return mood;
}
function stationAutoReplyTag(play){
 const l=letter(play.id);
 const found=l?.choices?.find(c=>c[1]===play.response);
 return found?.[2]||'';
}
function stationAutoNightMood(kind){
 const mood=Object.fromEntries(STATION_AUTO_KEYS.map(key=>[key,0]));
 let inputs=[];
 if(kind==='opening'){
  // 既にプレイヤーが紹介予定に選んだ、今夜の手紙のみ。
  inputs=(s.chosen||[]).map(id=>({item:letter(id),response:'',tag:''}));
 }else{
  const broadcast=(s.played||[]).filter(p=>p.night===s.night);
  inputs=(kind==='interlude'?broadcast.slice(-1):broadcast).map(p=>({item:{subject:p.subject,body:p.body},response:p.response||'',tag:stationAutoReplyTag(p)}));
 }
 for(let j=0;j<inputs.length;j++){
  const entry=inputs[j],point=stationAutoMood(entry.item,entry.response,entry.tag);
  // 曲・締めだけは最後に交わした言葉を少し重視。
  const weight=(kind!=='opening'&&kind!=='interlude'&&j===inputs.length-1)?1.25:1;
  for(const key of STATION_AUTO_KEYS)mood[key]+=point[key]*weight;
 }
 const amount=inputs.reduce((sum,_,j)=>sum+((kind!=='opening'&&kind!=='interlude'&&j===inputs.length-1)?1.25:1),0)||1;
 for(const key of STATION_AUTO_KEYS)mood[key]/=amount;
 // テーマは会話と混同せず、控えめに考慮する。気象は情景に限る。
 const climate=climateForNight(s.night);
 if(climate?.weather==='rain'||climate?.weather==='snow')mood.gentle+=.3;
 return mood;
}
// 夜の中に強い相談が一通でもあったかを覚える。最後に明るくなっても、禁止ではなく弱い注意信号。
function stationAutoNightSensitivity(){
 const played=(s.played||[]).filter(p=>p.night===s.night);
 if(!played.length)return {peak:0,soft:0};
 const peak=Math.max(...played.map(p=>stationAutoMood({subject:p.subject,body:p.body},p.response||'',stationAutoReplyTag(p)).heavy));
 const latest=played[played.length-1];
 const end=stationAutoMood({subject:latest.subject,body:latest.body},latest.response||'',stationAutoReplyTag(latest));
 // 最後の返答が冗談や祝福なら穏やかに締める余地を残す。
 const lighterEnd=end.heavy<1.5&&(end.playful>1.7||end.bright>2);
 return {peak,soft:peak>=2.3?(lighterEnd?1.4:2.6):0};
}
function stationAutoScore(kind,i,mood){
 const profile=STATION_AUTO_PROFILES[kind]?.[i];
 if(!profile)return -999;
 let score=0;
 for(const key of STATION_AUTO_KEYS)score+=(profile[key]||0)*Math.min(mood[key],3.1);
 // 深刻なお便りを読んだ直後に冗談を置くことは避ける。
 if(mood.heavy>=1.8){
  if(kind==='interlude'&&i===3)score-=9;
  if(kind==='closing'&&i===4)score-=8;
  if(kind==='song'&&i===4)score-=3.5;
 }
 if(kind==='interlude'&&i===3){
  // 幕間の次に読む予定の手紙も確認。真剣な話へ唐突に冗談で入らない。
  const next=letter(s.chosen[s.cursor]);
  if(next&&stationAutoMood(next).heavy>=2.0)score-=6;
 }
 if((kind==='closing'&&i===4)||(kind==='song'&&i===4)){
  // 平均だけでは消えてしまう前半の強い相談も、少しだけ考慮。
  score-=stationAutoNightSensitivity().soft*(kind==='closing'?1.2:.7);
 }
 // 明るい報告の多い夜は明るい曲を候補に残すが、全曲均等にはしない。
 if(kind==='song'&&i===4&&mood.bright>=.6&&mood.heavy<.5)score+=1.8;
 if(kind==='song'&&i===3){
  const weather=climateForNight(s.night)?.weather;
  if(weather==='rain')score+=2.3;
  if(weather==='snow')score+=.5;
 }
 if(kind==='opening'&&i===4&&mood.road>1)score+=.9;
 // 選択に使う情報が薄い場合は、汎用的な演出へ。
 if(kind==='interlude'&&i===0)score+=1.3;
 if(kind==='opening'&&i===0)score+=.9;
 if(kind==='closing'&&(i===0||i===5))score+=.7;
 return score;
}
function automaticStylePick(kind,count){
 if(!Number.isInteger(count)||count<=0)return null;
 const values=kind==='opening'?opening:kind==='song'?songs.map(x=>x[0]):kind==='closing'?STATION_CLOSINGS.map(x=>x[1]):STATION_INTERLUDES.map(x=>x[1]);
 const mood=stationAutoNightMood(kind);
 const past=(s.broadcastStyle?.history||[]).slice(-7);
 const current=kind==='interlude'?Object.keys(s.broadcastStyle.interludes||{}).sort((a,b)=>Number(a)-Number(b)).map(k=>STATION_INTERLUDES[s.broadcastStyle.interludes[k]]?.[1]).filter(Boolean):[];
 const ranked=Array.from({length:count},(_,i)=>{
  const value=values[i],lastNight=past[past.length-1];
  const attr=kind==='opening'?'opening':kind==='song'?'song':kind==='closing'?'closing':'interludes';
  const historyCount=past.reduce((sum,h,index)=>{
   const entries=attr==='interludes'?h.interludes||[]:[h[attr]];
   return sum+(entries.includes(value)?(index>=past.length-2?1.15:.42):0);
  },0);
  let score=stationAutoScore(kind,i,mood)-Math.min(historyCount,3.1);
  if(kind!=='interlude'&&lastNight?.[attr]===value)score-=1.1;
  if(kind==='interlude'&&current.includes(value))score-=2.0;
  // 複数候補が似合う夜のための、小さい決定的なゆらぎ。s.rng は使わない。
  const noise=(automaticStyleHash(`${s.night}:${kind}:${s.cursor}:${i}`)%1000)/1000;
  score+=noise*.85;
  return {i,score};
 });
 ranked.sort((a,b)=>b.score-a.score||a.i-b.i);
 if(kind==='interlude'&&current.length&&current.includes(values[ranked[0].i])){
  // 一夜の幕間は同文を二度読まない。別の候補が著しく不自然なら無言の間を採用。
  const alternative=ranked.find(c=>!current.includes(values[c.i]));
  if(!alternative||ranked[0].score-alternative.score>2.8)return -1;
  return alternative.i;
 }
 return ranked[0].i;
}
function ensureAutomaticBroadcastSelections(){
 if(s.phase!=='broadcast'||!isLettersMode())return;
 let dirty=false;
 if(s.cursor>0&&s.cursor<s.chosen.length&&!s.broadcastStyle.completed[s.cursor]){
  const i=automaticStylePick('interlude',STATION_INTERLUDES.length);
  s.broadcastStyle.interludes[s.cursor]=i;
  s.broadcastStyle.completed[s.cursor]=true;
  if(i>=0)log('つなぎの一言',lettersBroadcastPhrase4916('bridge',i,s.cursor));dirty=true;
 }
 if(s.cursor>=s.chosen.length){
  if(!Number.isInteger(s.song)||s.song<0||s.song>=songs.length){s.song=automaticStylePick('song',songs.length);dirty=true}
  if(!Number.isInteger(s.broadcastStyle.closing)||s.broadcastStyle.closing<0||s.broadcastStyle.closing>=STATION_CLOSINGS.length){s.broadcastStyle.closing=automaticStylePick('closing',STATION_CLOSINGS.length);dirty=true}
 }
 if(dirty)save();
}
// v3.5 放送のスタイル：リスナーの秘密や攻略用の数値を公開しない。
function createBroadcastStyle(){return {closing:null,interludes:{},completed:{},history:[]}}
const STATION_CLOSINGS=[
 ['また、午前2時に','今夜も聴いてくださってありがとうございました。また明日の午前2時に、お会いしましょう。'],
 ['ゆっくり休んで','眠る人も、まだ起きている人も。どうかそれぞれの夜を、穏やかに過ごせますように。'],
 ['少し余白を残す','答えの出ない話も、今日はここに置いておきましょう。続きがあれば、また聞かせてください。'],
 ['帰り道へ送り出す','夜の道を歩いている人は、どうか足元に気をつけて。家の灯りも、どこかで待っています。'],
 ['小さく笑って','今夜の放送はここまで。スタッフが飲み残したコーヒーにも、そろそろ帰宅してもらいましょう。'],
 ['次の手紙を楽しみに','今日の手紙も、まだ届いていない手紙も。次の夜、またここでお待ちしています。']
];
const STATION_INTERLUDES=[
 ['話題をつなぐ','ひとつの手紙を閉じて、次の封筒を開きます。誰かの別の一日へ、少しだけお邪魔しましょう。'],
 ['静かな間を置く','少しだけ、言葉のない時間を挟みます。……それでは、次のお便りです。'],
 ['聴いている人に話しかける','ラジオの向こうで聴いている皆さんは、今、何をしているでしょう。次の声も聴いてみましょう。'],
 ['軽く息を抜く','机の上の手紙は、まだあります。封筒たちにも順番を守ってもらいましょう。続いてのお便りです。']
];
function chooseOpening(i){if(s.broadcastModePref==='letters'||!Number.isInteger(i)||i<0||i>=opening.length||s.phase!=='prepare')return;s.opening=i;save();render()}
function chooseSong(i){if(isLettersMode()||!Number.isInteger(i)||i<0||i>=songs.length||s.phase!=='broadcast')return;s.song=i;save();render()}
function chooseClosing(i){if(isLettersMode()||!Number.isInteger(i)||i<0||i>=STATION_CLOSINGS.length||s.phase!=='broadcast')return;s.broadcastStyle.closing=i;save();render()}
function closeInterlude(i){
 if(isLettersMode()||s.phase!=='broadcast'||s.cursor<=0||s.cursor>=s.chosen.length||s.broadcastStyle.completed[s.cursor])return;
 if(i!==-1&&(!Number.isInteger(i)||i<0||i>=STATION_INTERLUDES.length))return;
 const step=s.cursor;
 s.broadcastStyle.interludes[step]=i;
 s.broadcastStyle.completed[step]=true;
 if(i>=0)log('つなぎの一言',STATION_INTERLUDES[i][1]);
 save();render();
}
function interludeScreen(){
 const slot=s.cursor;
 return `<section class="panel station-interlude"><div class="overline">02:${slot===1?'21':'36'} / BETWEEN LETTERS</div><h2>次のお便りまで、ひと呼吸</h2><p class="muted">前の手紙に返答しました。次の一通へ進む前に、短い言葉を添えてもいいし、何も言わずに手紙を開いても構いません。</p><div class="station-choice-grid">${STATION_INTERLUDES.map((item,i)=>`<button type="button" class="choice station-compact-choice" onclick="closeInterlude(${i})"><strong>${esc(item[0])}</strong><span>${esc(item[1])}</span></button>`).join('')}</div><div class="actions"><button type="button" class="btn secondary" onclick="closeInterlude(-1)">一言を添えず、次のお便りへ →</button></div></section>`;
}
function nightStyleRecord(){
 return {night:s.night,opening:opening[s.opening]||'',song:songs[s.song]?.[0]||'',closing:STATION_CLOSINGS[s.broadcastStyle.closing]?.[1]||'',interludes:Object.keys(s.broadcastStyle.interludes).sort().map(k=>s.broadcastStyle.interludes[k]).filter(i=>Number.isInteger(i)&&i>=0&&i<STATION_INTERLUDES.length).map(i=>STATION_INTERLUDES[i][1])};
}
function stationHabitText(){
 const recent=(s.broadcastStyle?.history||[]).slice(-8);
 if(recent.length<4)return '今夜はどんな声で放送しよう。毎晩違っても、それがこの番組らしさかもしれません。';
 const counts={};
 for(const entry of recent){counts[entry.opening]=(counts[entry.opening]||0)+1}
 const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
 if(!dominant||dominant[1]<3)return '最近は、いろいろな言葉で番組を始めています。決まった型がなくても、ここは午前二時の小さな放送室です。';
 return '最近は、こんな言葉で放送を始める夜が多いようです。\n「'+dominant[0]+'」\nもちろん、今夜は違う言葉でも構いません。';
}
function stationStylePanel(){
 const now=(s.broadcastStyle?.history||[]).find(x=>x.night===s.night);
 if(!now)return '';
 const actualOpen=s.logs.find(x=>x.night===s.night&&x.type==='オープニング')?.message||now.opening;
 const actualClosing=s.logs.find(x=>x.night===s.night&&x.type==='エンディング')?.message||now.closing;
 return `<section class="night-style-note"><div class="overline">TONIGHT'S VOICE / 今夜の放送の言葉</div><p>始まりの一言：${esc(actualOpen)}</p>${now.interludes.length?`<p class="small">お便りの間に添えた言葉：${now.interludes.length}回</p>`:'<p class="small">手紙の合間には、言葉を足さない夜でした。</p>'}<p>最後の一曲：「${esc(now.song)}」</p><p>締めの言葉：${esc(actualClosing)}</p><p class="small">言葉に点数や正解はありません。放送日誌にも記録されます。</p></section>`;
}
const GUIDE_SECTIONS=[
  ['enjoy','どんなゲーム？','真夜中に届くお便りを選び、言葉を返していく、小さなラジオ局の物語です。点数や正解はありません。気になる人の声を覚えたり、少しずつ変わる近況を楽しんでみてください。'],
  ['special','特別放送や記念放送はある？','放送を続けていると、いつもとは少し違う夜が訪れることがあります。\n\nリスナーの何気ないおたよりから特別な企画が生まれたり、放送を重ねてきた節目に、みんなで記念の夜を迎えたり。\n\nどんな放送になるかは、そのときまでのお楽しみ。いつものおたよりにも耳を傾けながら、そんな夜を楽しみにしていてください。'],
  ['finale','このラジオ局に終わりはある？','第100夜の放送を終えると、いつか番組を閉じる夜を選べます。最終放送を迎える必要はなく、続けたいだけ放送を続けてかまいません。閉局を選んだら、通常放送で予告してから最後の夜を迎えます。閉局後は新しい放送はできませんが、最終回と記念画像を残せます。'],
  ['letters','お便りはどう選ぶ？','すべての手紙を読む必要はありません。今日いちばん気になった声、続きを聞いてみたい人、思わず笑った話を選んでみましょう。紹介しなかった人も、放送の外で生活を続けています。'],
  ['replies','返答の選び方','どれが正解かを探すよりも、あなたなら何を伝えたいかで選んで大丈夫。特別返答は、元の手紙を見ながら言葉を組み立てられます。'],
  ['lives','リスナーたちの暮らし','リスナーたちは仕事や学校へ行き、誰かと会い、迷いながら自分で行動します。忙しかったり、一人で考えたかったりして、しばらくお便りが届かないこともあります。あなたの言葉がきっかけになることはあっても、彼らの人生すべてを決めるわけではありません。'],
  ['history','変化を見つけるには？','放送日誌やリスナーの記録を読み返してみてください。以前は仕事のことばかり話していた人が、いつの間にか好きなことの話をしているかもしれません。気に入った放送には、しおりを付けておけます。'],
  ['style','放送のスタイルは？','「いつもの放送」は挨拶や幕間・曲・締めを自分で選び、「おたより中心」はそれらの選択をおまかせにできます。手紙と返答はどちらも自分で選びます。どれも攻略上の正解ではなく、自分らしいラジオ局を作るための選択です。'],
  ['listening','聴くだけの夜って？','ときには、ラジオ局の向こう側で放送を聴いてみませんか。「聴くだけの夜」では、別のDJがお便りも返答も演出も選びます。あなたは一人のリスナーとして、その夜の放送を小説のように読み進められます。放送画面の「☾ 今夜は聴くだけにする」から始められ、第1夜から読むことも、本編の途中から別の物語として分岐することもできます。読書用の進行と記憶は本編とは別に保存されるので、自分の放送は変わりません。'],
  ['community','番組で生まれるつながり','放送で読まれた話を、その夜実際に聴いていた人が覚えることがあります。何日か後に別の人から似た話題の手紙が届いても、必ず誰かが反応するわけではありません。リスナーたちは放送を聴いていない夜の話までは知りません。']
];
// v4.8.42: 手引きだけを独立して開閉する。大きな日誌の再描画を避け、
// 閲覧タブの部分描画が背後に透明なオーバーレイを残す問題も防ぐ。
function openGuide(){
  guideReturnFocus=document.activeElement;
  guideOpen=true;
  const portal=document.getElementById('guide-portal');
  if(!portal){render();document.getElementById('guide-dialog')?.focus();return}
  portal.innerHTML=guideDialog();
  document.body.classList.add('guide-open');
  portal.querySelector('#guide-dialog')?.focus({preventScroll:true});
}
function closeGuide(){
  guideOpen=false;
  const portal=document.getElementById('guide-portal');
  if(portal)portal.replaceChildren();
  document.body.classList.remove('guide-open');
  const previous=guideReturnFocus;
  guideReturnFocus=null;
  if(!portal)render();
  if(previous?.isConnected&&typeof previous.focus==='function')previous.focus({preventScroll:true});
}
function closeWelcome(){s.guidance.welcomeSeen=true;save();render()}
function toggleHints(){s.guidance.suppressHints=!s.guidance.suppressHints;save();render()}
function dismissHint(id){s.guidance.seen[id]=true;save();render()}
function hideableHint(id,copy){
  if(s.guidance.suppressHints||s.guidance.seen?.[id]||s.night>3)return '';
  return `<aside class="play-hint" aria-label="楽しみ方のヒント"><span class="play-hint-symbol">✧</span><p>${esc(copy)}</p><button type="button" onclick="dismissHint('${id}')" aria-label="このヒントを閉じる">×</button></aside>`;
}
function guideDialog(){
 const welcome=!s.guidance.welcomeSeen;
 if(!welcome&&!guideOpen)return '';
 return `<div class="guide-overlay"><section class="guide-dialog" id="guide-dialog" role="dialog" aria-modal="true" aria-label="${welcome?'はじめに':'ラジオ局の手引き'}" tabindex="-1"><div class="overline">✦ SOMEWHERE ON AIR · ${welcome?'BEFORE THE FIRST NIGHT':'LITTLE HANDBOOK'}</div><h2>${welcome?'このラジオ局で過ごす時間':'ラジオ局の小さな手引き'}</h2>${welcome?`<p>ここには、決まった正解はありません。放送を重ねた先には、自分で決められる最終回もあります。</p><p>夜ごとに届くお便りを読んで、気になる声を紹介してください。返す言葉は、あなたが伝えたいものを。</p><p>次の夜にはまた別のお便りが届きます。同じ人の、少し違う一日かもしれません。</p><div class="guide-whisper">好きなリスナーを見つける。小さな変化に気づく。何も起こらない夜を楽しむ。</div>`:`<p class="muted">必要になったときだけ、気になる項目を開いてください。攻略の正解ではなく、楽しみ方のヒントを集めました。</p>${GUIDE_SECTIONS.map(([id,title,desc],i)=>`<details class="guide-topic" ${i===0?'open':''}><summary>${esc(title)}</summary><p>${esc(desc)}</p></details>`).join('')}<label class="guide-toggle"><input type="checkbox" ${s.guidance.suppressHints?'checked':''} onchange="toggleHints()"> 操作中の小さなヒントを表示しない</label>`}<div class="actions"><button type="button" class="btn" onclick="${welcome?'closeWelcome()':'closeGuide()'}">${welcome?'今夜の放送を始める →':'放送に戻る'}</button></div></section></div>`;
}
// 公開されたお便りを参照するだけの余韻。内部の感情値や未紹介の出来事は参照しない。
// v4.8.37 — DJの小さな物語・第一幕〜第五幕。
// 放送後の情景。乱数やゲーム進行を消費せず、放送した手紙のみを参照する。
// 本編は「プレイヤーの気持ち」を代弁しない客観的な風景だけにする。
const DJ_SMALL_STORY_NIGHTS_4832=[33,45,58,72,86,99,112,127,144,161,180,198,212,229,246,263,281,297,309,320,331,343,355,365,382,405,427,451,478,500];
const DJ_SMALL_STORY_4832={
 33:{title:'空いている椅子',main:'マイクを切ったあと、机の横にある小さな椅子が見える。放送中、そこに誰かが座ることはなかった。\n\nそれでも机の上には、違う筆跡の便箋が三通、並んでいる。',reader:'マイクの赤いランプが消えてから、DJは机の横の椅子を見た。誰かを待つために置いたわけでもない、予備の椅子だ。\n\n「一人で喋っているつもりだったんだけどな」\n\n小さく呟いて、読み終えた三通を揃える。今夜も椅子は空いている。それなのに、部屋には誰かの言葉が残っていた。'},
 45:{title:'書き留めた題名',main:'書類を揃えると、以前の放送の日付が小さく書かれた付箋が出てきた。便箋の題名も一緒に記されている。\n\n声に出した言葉は過ぎていくけれど、文字はもう少し長く机の上にいる。',reader:'封筒のあいだから、過去の放送の題名を書いた紙が落ちた。DJはそれを拾い、読み返す。\n\n「……覚えているものだな」\n\n話の全部を知っているわけではない。けれど、一度声に出した題名には、思いがけず見覚えがあった。紙を捨てず、原稿の間にはさみ直す。'},
 58:{title:'忘れないための付箋',main:'放送卓に「マイクを切る」と書いた付箋が貼られている。毎晩きちんと消しているランプのすぐ横だ。\n\nいつ書かれたものか、もうわからない。それでも今日も付箋は剥がされていない。',reader:'DJは片づけの途中で、マイクの横の付箋を見つけた。\n\n「マイクを切る」\n\n書かれているとおり、今日もとっくに切ってある。わざわざ忘れるために残してあるみたいで、少し笑ってしまった。\n\n付箋は剥がさずにおく。明日の自分も、同じところで笑うかもしれない。'},
 72:{title:'返事を書かない時間',main:'一枚だけ、文字のない便箋が残っていた。今夜のおたよりの返事ではない。最初から何も書かれていない、ただの予備だ。\n\n使われないままの紙も、机の上にあっていい。',reader:'机の端に、まっさらな便箋があった。DJはペンを持ち上げ、それから戻した。\n\n聞いた話のすべてに、今すぐ言葉を返せるわけではない。\n\n「また何か届いたら、そのとき考えよう」\n\n白い紙を引き出しにしまう。答えを急がない夜も、放送の続きにあった。'},
 86:{title:'冷めかけたお茶',main:'カップの底に、少しだけお茶が残っている。湯気はもう見えない。\n\n窓の外では帰りの遅い車が一台、交差点を曲がっていった。スタジオの時計は、明日の午前二時にも動いているだろう。',reader:'放送のあと、DJは冷めかけたお茶を一口飲んだ。\n\n机の向こうにある予備の椅子は、相変わらず空っぽだ。けれど最近、その椅子を見ても「誰もいない」とは思わなくなった。\n\nもちろん、そこに誰かがいるわけじゃない。\n\nただ、今夜の三通が確かに届いた。それで十分な気がした。'},
 112:{title:'百夜を過ぎても',main:'放送卓の端に、百夜目の予告を書いた小さな紙が残っていた。数字の下には、今夜の新しい原稿が重なっている。\n\n記念の印も、ふだんの便箋も、同じ机の上にある。',reader:'百夜目のお祝いから、少し夜が過ぎた。DJは引き出しから「100」と書いた紙を見つける。\n\n「大きな数字だったなあ」\n\nその紙の上に、今夜の原稿をそっと重ねた。百夜続いたあとの一夜にも、いつもどおり新しい話が届く。記念日は終わったけれど、番組は終わっていない。'},
 127:{title:'封筒の角',main:'机の隅に封筒が一通置かれている。端が少し丸くなっていて、何度か持ち上げられたらしい。\n\n同じ大きさの封筒でも、手に取るとそれぞれ紙の手触りが違う。',reader:'DJは原稿の整理中、一通の封筒の角が少し丸くなっているのに気づいた。\n\n「こういうところにも、誰かの一日があるんだな」\n\n大げさな発見じゃない。送り主がその角をどう折ったかまではわからない。ただ、声になる前の手紙にも、ちゃんと形がある。'},
 144:{title:'見覚えのある文字',main:'今夜の原稿を閉じると、放送日誌の古いページが一枚、紙の束からのぞいていた。\n\n日付は違っても、便箋を置く場所は変わらない。ここから届いた声は、また別の夜へ続いていく。',reader:'DJは今日の原稿を片づける途中、放送日誌を開いた。\n\n名前を覚えた気がしても、その人の暮らしを全部知ることにはならない。\n\n「次の手紙は、また違う話かもしれないな」\n\n古いページを閉じ、今夜の原稿を上に重ねた。'},
 161:{title:'一呼吸のメモ',main:'放送卓に、小さな紙が貼ってある。\n\n「ここで一呼吸」\n\nそのすぐ下には、少し小さい字で「一呼吸しすぎない」とも書かれていた。誰が見ても、少し難しい注文だ。',reader:'机の端に、いつ書いたのか覚えていない進行メモがあった。\n\n「ここで一呼吸」\n\nその下に「一呼吸しすぎない」。\n\nDJは二行を順番に読んで、思わず笑った。\n\n「どっちにすればいいんだろう」\n\n結局、メモはそのまま残しておく。明日もたぶん、ちょうどいいところで困る。'},
 180:{title:'聞こえない拍手',main:'マイクのランプが消え、机の上にいつもの静けさが戻る。窓ガラスには、卓上ランプの明かりが小さく映っている。\n\n誰かの反応はここから見えない。それでも今夜の言葉は、電波に乗って外へ出ていった。',reader:'放送を終えると、スタジオには拍手も歓声もない。いつもどおり、ランプの小さな音だけがする。\n\n以前はそれが、ずいぶん静かな終わり方に思えた。\n\n今は、返事がその場で聞こえなくてもいいと思う。どこで誰が聴いているかは、たいていわからないのだから。\n\n「今夜も、ここまで」\n\nDJは静かな部屋に、小さく言った。'},
 198:{title:'紙飾りの練習',main:'放送卓の脇に、小さな紙の輪飾りが置かれている。二百夜目の放送祭の準備らしい。\n\n輪は三つだけ。ひとつは糊が乾くまで、机の端で少し傾いている。',reader:'もうすぐ二百夜目の放送祭だ。DJは紙で輪飾りをつくってみた。\n\n一つ目は細すぎてほどけ、二つ目は糊が多すぎて机に貼りついた。三つ目は、まあまあ丸い。\n\n「局に飾るには、これくらいで十分かな」\n\n小さな輪飾りをマイクの横に置く。大げさな祭りじゃなくても、ちょっと楽しみにはできそうだった。'},
 212:{title:'紙の輪の、そのあと',main:'二百夜目の放送祭に使った紙の輪が、机の端に一つだけ残っている。継ぎ目の糊はすっかり乾き、輪の内側には薄い影が落ちていた。\n\n祝った夜のあとにも、いつもどおり三通ぶんの原稿が並ぶ。',reader:'二百夜目のお祭りは終わった。DJが机を拭くと、紙の輪飾りが一つだけ転がってきた。\n\n「これ、結局ずっと残ってるな」\n\nほどくのも惜しくて、壁の隅へ掛け直す。特別な放送の次の日にも、まったく別の誰かの普通の一日が届いていた。\n\nDJはそちらの封筒を先に開けた。'},
 229:{title:'まじめな遊び',main:'放送卓に「調査項目」と書いた紙がある。その下には「夜のお茶は、なぜ最後のひと口だけぬるいのか」。\n\nよく見ると、結論の欄だけ空白だ。研究は今のところ、何の役にも立っていない。',reader:'DJはメモ帳の「調査項目」という見出しを見つけた。\n\n「夜のお茶は、なぜ最後のひと口だけぬるいのか」\n\n「……最後まで飲まなかったから、かな」\n\n自分で書いた問いに、自分で答えてしまった。答えを書き込もうとして、やめる。\n\n今夜の放送にも、結論なんていらない話があった。そういう話を聴くのは、案外悪くない。'},
 246:{title:'冗談も、同じ机の上',main:'放送台の上に、薄い便箋が三通分重なっている。まじめな相談も、ちょっと変わった話も、封筒の形だけでは区別がつかない。\n\nマイクの前では、どれも同じ大きさの紙だった。',reader:'今日の手紙を揃えながら、DJはふと気づいた。\n\n可笑しい話は、まじめに受け取ってもいい。まじめな話に、無理に立派な答えを用意しなくてもいい。\n\n「そういう番組だったんだな、ここは」\n\n誰かの冗談を笑うときも、その人自身を笑いものにしない。\n\n一番上の封筒を、ほかの二通と同じように大事にしまった。'},
 263:{title:'読み返した題名',main:'放送日誌の間に、少し折れた紙のしおりがある。書き込まれた題名は、ひと晩の放送が終わっても、ページの中に残っていた。\n\n今夜の記録も、次に開く人を待っている。',reader:'DJは放送日誌を開き、以前のページに挟まれたしおりを見つけた。\n\n「あの夜は、こんな題名だったんだ」\n\n手紙を書いた人が今どんな一日を過ごしているかは知らない。けれど、放送した言葉を大事に取っておくことはできる。\n\nしおりを戻し、今夜のページを一枚めくった。'},
 281:{title:'訂正の訂正',main:'机に新しい進行メモが一枚増えている。\n\n「終わりの挨拶は、短く」\n\nその下に、もっと小さな字で「短すぎないように」。どちらも間違ってはいないが、少し注文が多い。',reader:'DJは新しい進行メモを読み上げてみた。\n\n「終わりの挨拶は、短く」\n\nその下には「短すぎないように」。\n\n「前もこんなこと書かなかったっけ」\n\n日誌をめくれば、似たようなメモがきっとある。上達していないのかもしれない。でも、最近は少し困ったくらいで、放送を嫌いにはならなくなった。\n\n二つの注意書きを残して、ペンの蓋を閉じた。'},
 297:{title:'囲まなかった数字',main:'机のカレンダーには、もうすぐ来る三百夜目の日付がある。百夜目のときと違って、数字は丸で囲まれていない。\n\nその代わり、横には翌日の分の白い便箋が三枚、きちんと用意されていた。',reader:'カレンダーの「300」という数字に気づいて、DJはペンを持った。\n\n百夜目の前には、赤い丸をつけた。今夜も同じようにしようとして、手を止める。\n\n「明日になったら、ちゃんと三百夜目だ」\n\n印がなくても、夜は数えられる。変わっていないものを探す記念放送なら、まずいつものように手紙を読むところから始めたい。\n\nDJはペンを置き、次の夜の封筒を三枚揃えた。'},
 309:{title:'机の上の、いつもの順番',main:'三百夜の記念放送で使った案内の紙が、引き出しの奥に収まっている。放送卓にはまた、今日読んだ便箋と、明日のための何も書かれていない紙が並んでいた。\n\n時計とランプの位置は、以前から変わらない。',reader:'三百夜の記念放送を終え、少し日が経った。DJは引き出しにしまった案内の紙を見つける。\n\n「あれからも、普通の夜が続いてるな」\n\n見慣れた放送卓に戻すのは、今夜読んだ原稿と、明日のための白い紙。記念日がなくても、机の上に新しい一日は増えていく。'},
 320:{title:'空いた椅子の背',main:'窓際の小さな予備椅子は、今夜も空いている。背に落ちる卓上ランプの影だけが、夜更けの時間とともに少し動いた。\n\n机の上には、読み終えた便箋が重なっている。椅子の数は変わらなくても、放送日誌のページは増えた。',reader:'DJは、あの予備の椅子の背を指で軽くなぞった。何十夜も前から、同じ場所にある。\n\n「結局、ここには誰も座ってないんだよな」\n\nそう言ってから、少し笑う。空いていることと、何も届いていないことは、別の話だった。\n\n椅子はそのまま。今夜の原稿も、棚にきちんとしまった。'},
 331:{title:'二行目の注意書き',main:'放送卓の進行メモに、鉛筆で小さく「急がない」と書かれている。すぐ下には「曲が終わる前に喋らない」。\n\nどちらも当たり前の注意書きなのに、二行並ぶと妙に切実に見える。',reader:'DJは進行メモの隅に、新しい注意書きを足した。\n\n「急がない」\n\nその下に「曲が終わる前に喋らない」。\n\n「……どっちもできていてほしいな」\n\n以前の、呼吸をめぐる矛盾したメモもまだ残っている。あまり上手なメモの取り方ではない。でも、今のところ放送は続いている。'},
 343:{title:'しおりの位置',main:'放送日誌の古いページから、紙のしおりが少し飛び出している。\n\nその日の便箋も、今夜の便箋も、同じ棚へしまわれる。何かを覚えておく方法は、案外こういう小さなことなのかもしれない。',reader:'DJは放送日誌の端に飛び出したしおりを見つけ、ページを開いた。\n\nいつの夜も、誰かの話を全部理解できたわけではない。でも、紹介した言葉は記録の中に残っている。\n\n「前と同じ人でも、次は違う話をするんだろうな」\n\nしおりを少しだけ内側へ戻す。今日は今日のページを閉じておく。'},
 355:{title:'最後のひと口',main:'放送が終わった机には、湯気の消えたカップと、きれいに重なった原稿がある。\n\n変わらず冷めるお茶と、少しずつ厚くなった放送日誌。卓上ランプは、どちらにも同じ明かりを落としている。',reader:'DJはカップを持ち上げ、ぬるくなった最後のひと口を飲んだ。\n\n「やっぱり最後は冷めるな」\n\n前にも似たようなことを考えた気がする。何百夜かけても、そこはちっとも変わらない。\n\n変わらないことが残っていて、少しほっとする。マイクのスイッチを確かめ、明日の原稿を入れる場所を空けた。'},
 365:{title:'いつもの灯り',main:'三百六十五夜目の放送が終わる。机の上には、記念企画の案内と、今夜紹介された三通の原稿。隣には、明日のための白い便箋が一枚置かれている。\n\n予備の椅子も、進行メモも、卓上ランプもいつものままだ。\n\n小さな灯りが消え、窓の向こうには次の朝が近づいていた。',reader:'三百六十五夜目の放送が終わった。DJは、マイクを切ったあとも少しだけ席に座っていた。\n\n「一年分、か」\n\nこの放送局で数えてきた夜が、三百六十五になった。大げさな言葉を用意してみたけれど、今夜も最後にしたのは、原稿を揃えてランプを落とすことだった。\n\n空いた椅子は空いたまま。進行メモの注意書きも、ちっとも立派にはなっていない。\n\nそれでも、この時間はいつの間にか、DJの普通の一日の一部になっていた。\n\n「じゃあ、また次の夜に」\n\n誰に聞かせるでもなくそう言って、明日のための白い便箋を一枚、机に残した。'},
 382:{title:'白紙の次の日',main:'三百六十五夜目に机へ残した白い便箋は、いつの間にか今日の原稿の下敷きになっていた。紙の端には、引き出しの木目が少しだけ写っている。\n\n記念日の次の日からも、放送卓には毎晩、違う話が積まれていく。',reader:'あの記念日のあと、DJは机に残した白い便箋を見つけた。\n\n「これ、何か書くつもりだったんだっけ」\n\n覚えていないので、裏を向けて今夜の原稿の下に敷いた。きれいな余白にも、案外いろんな役割がある。\n\n昨日までの放送日誌が厚くなっても、今夜の話は今夜初めて届く。'},
 405:{title:'知っている名前、知らない話',main:'放送日誌の索引に、何度も見た差出人の名前がある。ページごとに、題名も紙の並び方も少しずつ違う。\n\n同じ名前の下に、まだ知らない明日の欄が空いていた。',reader:'DJは放送日誌の索引をめくり、見覚えのある差出人の名前を指でなぞった。\n\n「もう、ずいぶん聞いてる人だな」\n\nけれど、過去の題名を見ても、次に何が届くかはわからない。名前を知っていることと、その人の全部を知ることは違う。\n\nそれでも、次に届く封筒を少し楽しみにしている。'},
 427:{title:'開封済みの印',main:'原稿箱の隅に、手作りの「開封済み」印が置かれている。台紙が少し曲がっていて、押すと文字が斜めになる。\n\nその横には、「読んだ」と「わかった」は別、と鉛筆で書かれた小さなメモがある。',reader:'DJは、手作りの「開封済み」印を試しに紙へ押した。文字が思いきり斜めになった。\n\n「……今夜も曲がるのか」\n\n箱にしまうとき、ふと気づいて、別のメモに書き足す。\n\n「読んだ」と「わかった」は別。\n\n誰かの暮らしは、印を押して終わりにはならない。印は曲がったままでも、次のおたよりは読める。'},
 451:{title:'索引にない一行',main:'長く使った放送日誌には、出来事や題名の索引が増えている。けれど、巻末の余白にはまだ何も記されていない。\n\n鉛筆が一本、その白い場所の上に置かれていた。',reader:'DJは放送日誌の索引を見返した。何度も登場した言葉もある。こんな話が来るとは思わなかった、という題名もある。\n\n「次の欄には、何が入るんだろう」\n\n予想を書こうとして、やめた。リスナーの明日まで、こちらで決めることはない。\n\n白い欄は白いままにして、日誌を閉じた。'},
 478:{title:'数字の外側',main:'カレンダーの端に、「500」と書いた小さな付箋がある。特別放送の準備を示すものらしい。\n\nそのすぐ下には、今夜読む三通の題名。大きな節目の数字の外側にも、毎晩の小さな題名は増えていく。',reader:'もうすぐ五百夜目になる。DJは「500」と書いた付箋を、マイクの横に貼り直した。\n\n「五百回も喋ったら、もう知らない話はなくなると思ってたかな」\n\nそんなことはない。昔から届く差出人の、新しい一日だって知らない。\n\n付箋はそのままに、今夜の封筒を先に開けた。'},
 500:{title:'まだ空いている場所',main:'五百夜目の放送が終わった。記念企画の案内を片づけると、放送卓には、明日の原稿を置くための空いた場所が残った。\n\n五百夜分の記録は棚の中にある。机の上の空きは、そのままにしておく。',reader:'五百夜目の記念放送を終え、DJは長くなった放送日誌を棚に戻した。\n\n「これだけ聞いても、まだ知らないことがあるんだな」\n\n知っている名前にも、知らない明日がある。そのことが、今は少し楽しみだった。\n\nマイクの隣には、明日の原稿を置ける場所が空いている。\n\n「じゃあ、また次の夜に」\n\n今夜だけの大きな言葉は探さず、いつものように明かりを落とした。'},
 99:{title:'百夜目の前に',main:'机のカレンダーに、明日の「100」という数字が小さく囲まれている。\n\n紙の束を数え直しても、今夜の放送はいつもと同じように終わった。百夜目もきっと、まずは一通の便箋から始まる。',reader:'机のカレンダーには、明日の欄に「100」とだけ書かれていた。\n\nDJはその数字を眺めてから、ふっと肩の力を抜いた。百夜続いたからといって、急に上手な言葉が出てくるわけじゃない。\n\n「まあ、明日もまずは一通から、かな」\n\nマイクを拭き、便箋を揃える。誰の声が届くか、まだ全部は知らない。だから、明日の放送も少し楽しみだった。'}
};
function djSmallStory4832(n,mode='main'){
 const scene=DJ_SMALL_STORY_4832[n];
 if(!scene)return null;
 let text=scene[mode==='reader'?'reader':'main'];
 // 以前の放送の題名を記す場合は、実際に紹介済みの手紙だけを根拠にする。
 if(n===45){
  const earlier=s.played.find(x=>x.night>=29&&x.night<=n-8&&typeof x.subject==='string'&&x.subject.trim());
  if(earlier){
   text=mode==='reader'
    ?text.replace('過去の放送の題名を書いた紙',`第${earlier.night}夜「${earlier.subject}」と書かれた紙`)
    :text.replace('便箋の題名も一緒に記されている。',`第${earlier.night}夜「${earlier.subject}」という題名が記されていた。`);
  }
 }
 if(n===144){
  // 第144夜に実際に読んだおたよりと、以前に読んだ同じ人の手紙だけを参照する。
  const today=s.played.filter(x=>x.night===n);
  const match=today.map(now=>({now,prior:[...s.played].reverse().find(x=>x.night<n&&x.who===now.who&&typeof x.subject==='string'&&x.subject.trim())}))
    .find(x=>x.prior&&typeof x.now.subject==='string'&&x.now.subject.trim());
  if(match){
   const name=NAMES[match.now.who]||'あるリスナー';
   const detail=`第${match.prior.night}夜に紹介した${name}の「${match.prior.subject}」。今夜は「${match.now.subject}」。`;
   text=mode==='reader'
    ?text.replace('名前を覚えた気がしても、',`${detail}\n\n名前を覚えた気がしても、`)
    :text.replace('日付は違っても、',`${detail}\n\n日付は違っても、`);
  }
 }
 if(n===263){
  // 題名は第200〜262夜に実際に放送で紹介済みの手紙だけから選ぶ。
  const past=s.played.find(x=>x.night>=200&&x.night<n&&typeof x.subject==='string'&&x.subject.trim());
  if(past){
   const detail=`第${past.night}夜の「${past.subject}」`;
   text=mode==='reader'
    ?text.replace('以前のページに挟まれたしおり',`${detail}のページに挟まれたしおり`)
    :text.replace('書き込まれた題名は、',`${detail}という題名は、`);
  }
 }
 if(n===343){
  // 紹介されていないお便りを「昔聞いた」と誤認しない。
  // 第300〜342夜に実際に放送された本文のある手紙のみを対象にする。
  const past=s.played.find(x=>x.night>=300&&x.night<n&&typeof x.subject==='string'&&x.subject.trim());
  if(past){
   const detail=`第${past.night}夜に紹介した「${past.subject}」`;
   text=mode==='reader'
    ?text.replace('ページを開いた。',`${detail}のページを開いた。`)
    :text.replace('放送日誌の古いページから、',`${detail}のページから、`);
  }
 }
 if(n===405){
  // 第365〜404夜の間に実際に紹介した人物と題名だけを思い返す。
  const prior=s.played.find(x=>x.night>=365&&x.night<n&&typeof x.subject==='string'&&x.subject.trim()&&x.who&&NAMES[x.who]);
  if(prior){
   const label=`第${prior.night}夜に紹介した${NAMES[prior.who]}の「${prior.subject}」`;
   text=mode==='reader'
    ?text.replace('見覚えのある差出人の名前を指でなぞった。',`${label}のページを開いた。`)
    :text.replace('何度も見た差出人の名前がある。',`${label}がある。`);
  }
 }
 return {night:n,title:scene.title,text};
}
function djSmallStoryPanel4832(n){
 if(s.phase!=='after'||s.tab!=='studio')return '';
 const scene=djSmallStory4832(n,'main');
 if(!scene)return '';
 return `<aside class="dj-small-story" aria-label="放送後の小さな情景"><div class="overline">03:07 / AFTER THE LIGHTS · 小さな情景</div><h3>${esc(scene.title)}</h3><p>${fmt(scene.text)}</p></aside>`;
}
function tonightReflection(n){
  const heard=s.played.filter(x=>x.night===n);
  if(!heard.length)return '今夜はまだ、放送で紹介された声がありません。窓の向こうでは、いつもと同じように夜が続いています。';
  // 以前の放送で、同じ人の別の手紙を実際に読んだときだけ比較する。
  for(const now of heard){
    const previous=[...s.played].reverse().find(x=>x.night<n&&x.who===now.who);
    if(previous&&previous.subject!==now.subject){
      const gap=n-previous.night;
      if(gap>=22)return `${NAMES[now.who]||'あるリスナー'}から、久しぶりにお便りが届きました。前に放送で紹介したのは第${previous.night}夜の「${previous.subject}」。紹介していなかった夜にも、この人の日々は続いていたんですね。今夜は「${now.subject}」という手紙です。`;
      return `${NAMES[now.who]||'あるリスナー'}から、またお便りが届きました。前に紹介したのは「${previous.subject}」。今夜の件名は「${now.subject}」。同じ人から届く手紙にも、いろいろな日があるんですね。`;
    }
  }
  if(heard.length>=2){
    const a=heard[0],b=heard.find(x=>x.who!==a.who);
    if(b)return `今夜は「${a.subject}」と「${b.subject}」という、違う暮らしからの声を紹介しました。二人は同じ放送を聴いていたかもしれません。でも、それぞれの一日は別々に続いています。`;
  }
  const a=heard[0],prior=s.played.some(x=>x.night<n&&x.who===a.who);
  return prior?`${NAMES[a.who]||'リスナー'}から届いた「${a.subject}」。何度か手紙を読んでいても、まだ知らない一面があるのかもしれません。`:`今夜、${NAMES[a.who]||'あるリスナー'}の「${a.subject}」を紹介しました。この先、また声が届くかもしれません。`;
}
function reflectionPanel(){
  const tonight=s.played.filter(x=>x.night===s.night);
  if(!tonight.length)return '';
  const hint=hideableHint('after','次の夜のお便りで、以前の話の続きを知ることもあります。すぐに結果が見えなくても大丈夫。');
  return `<div class="night-reflection"><div class="overline">✦ AFTER BROADCAST / 今夜の余韻</div><p>${esc(tonightReflection(s.night))}</p><p class="reflection-sub">これは今夜放送した手紙からの振り返りです。誰かの本心や未来を、決めつけるものではありません。</p>${hint}</div>`;
}
function bookmarkKey(x){return String(x.night)+'|'+String(x.id)}
function hasBookmark(x){return s.bookmarks.includes(bookmarkKey(x))}
function toggleBookmark(night,id){
 const item=s.played.find(x=>x.night===night&&x.id===id);
 if(!item)return;
 const k=bookmarkKey(item),pos=s.bookmarks.indexOf(k);
 if(pos>=0)s.bookmarks.splice(pos,1);else s.bookmarks.push(k);
 save();render();
}
function toggleBookmarksView(){s.guidance.bookmarksOnly=!s.guidance.bookmarksOnly;save();render()}
function bookmarkButton(x){return `<button class="bookmark-btn ${hasBookmark(x)?'bookmarked':''}" type="button" aria-pressed="${hasBookmark(x)}" onclick="toggleBookmark(${x.night},'${esc(x.id)}')">${hasBookmark(x)?'◆ しおりを外す':'◇ しおりを付ける'}</button>`}
function bookmarkArchive(){
 const saved=s.played.filter(x=>hasBookmark(x)).slice().reverse();
 return `<section class="panel"><div class="overline">BOOKMARKED LETTERS</div><h2>心に残ったお便り</h2><p class="muted">好きだった言葉を、あとから読み返すための場所です。しおりは物語の分岐やリスナーの気持ちに影響しません。</p><div class="actions"><button class="btn secondary" onclick="toggleBookmarksView()">← 通常の放送日誌に戻る</button></div>${saved.length?saved.map(x=>`<article class="letter"><div class="small">第${x.night}夜 · ${esc(NAMES[x.who]||'リスナー')}</div><h3>${esc(x.subject)}</h3>${x.body?`<div class="letter-text">${fmt(x.body)}</div>`:'<p class="small">以前のバージョンの記録です。手紙の全文は保存されていません。</p>'}<div class="quote">${fmt(x.response)}</div>${bookmarkButton(x)}</article>`).join(''):'<p class="notice">まだしおりを付けたお便りはありません。放送日誌から、好きな手紙を選べます。</p>'}</section>`;
}

// v4.8.20 — 通常画面と読書モードで共通の線画アイコンを使う。
function uiIcon(kind){
 const icons={
  radio:'<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 16.24a6 6 0 0 1 0-8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.07.07-1.91 1.91-.07-.07A1.7 1.7 0 0 0 16 18.45a1.7 1.7 0 0 0-1.13 1.57V21h-5.74v-.98A1.7 1.7 0 0 0 8 18.45a1.7 1.7 0 0 0-1.83.34l-.07.07-1.91-1.91.07-.07A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.57-1.13H2v-3.74h1.03A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.07-.07 1.91-1.91.07.07A1.7 1.7 0 0 0 8 5.55a1.7 1.7 0 0 0 1.13-1.57V3h5.74v.98A1.7 1.7 0 0 0 16 5.55a1.7 1.7 0 0 0 1.83-.34l.07-.07 1.91 1.91-.07.07A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.57 1.13H22v3.74h-1.03A1.7 1.7 0 0 0 19.4 15Z"/>',
  moon:'<path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/>',
  help:'<circle cx="12" cy="12" r="10"/><path d="M9.2 9a3 3 0 0 1 5.7 1.2c0 2-2.9 2.5-2.9 4.4"/><path d="M12 17.4h.01"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
 };
 return `<svg class="ui-icon" aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[kind]||icons.radio}</svg>`;
}
const UI_NAV=[['studio','radio','放送'],['letters','mail','お便り'],['journal','book','記録'],['listeners','users','リスナー'],['settings','settings','設定']];

const dayTitles=['','はじめましての夜','誰かが聴いている','言えなかった言葉',
  '終点のひとつ前','いつもの道の途中','言いそびれた返事','ひとり分の余白','返事をしない自由','描かれなかった余白','窓の明かり','木曜日の駅','自分の声','返ってこない約束','それぞれの朝'];
// 第4章・放送後の情景。未紹介の章便箋を知っていることにしない。
const CH4_INTRO_SCENES={"79":"よく知る差出人の名前が、今夜も机の上にある。\n\n手紙の外で過ぎてきた時間は、きっと誰にも全部はわからない。","80":"まだ開いていない便箋が、机の隅に重なっている。","81":"窓の外を走る車のライトが、スタジオの壁を一瞬照らした。","82":"卓上の時計を見て、針が進むのを確かめる。","83":"放送予定の欄に、今夜の日付を書き込む。","84":"便箋の折り目をそろえて、マイクのそばに置く。","85":"放送用のメモに、また新しい日付を書き足した。","86":"マグカップの中身が少し冷めるころ、放送の時刻が近づいた。","87":"ペンを置くと、机の上の原稿が少し浮いた。","88":"スタジオの外には、夜更けの静けさがある。","89":"今日の日付の下は、まだ空白のままだ。","90":"放送台本の最後のページが、まだ白い。","91":"届いた声を選ぶ前の、短い静けさがある。","92":"今夜も、午前二時のマイクが開く。"};
const CH4_AFTER_SCENES={"79":["放送終了のランプが消えた。時計は、もう午前三時を回っている。","机の端で原稿をそろえる。紙の手ざわりだけが残った。","いつもの名前にも、まだ聞いていない話がある。"],"80":["窓の向こうは暗いまま、原稿の上に小さな影が落ちている。","開いたままのノートと、しまっておく言葉のことを考える。","言葉になるものも、ならないものも、朝まで急がなくていい。"],"81":["ヘッドホンを外すと、スタジオの空調の音が戻ってくる。","マイクの前では、遠くの道も少し近くに感じられた。","放送が終われば、それぞれが自分の道へ戻っていく。"],"82":["卓上の時計を確かめる。針が進む音は、マイクを切っても変わらない。","手になじんだ道具も、毎回同じようには役立たない。","使い道を決めずに置く時間があってもいい。"],"83":["放送卓に残ったメモには、行き先のない線が一本引かれていた。","予定のない道を歩いてみたくなる夜もある。","次の角を曲がるかどうかは、まだ誰にもわからない。"],"84":["読み終えた便箋の端をそろえ、マイクを覆う。","誰にも見せるつもりのない言葉は、きっとまだある。","この放送が聞けたのは、そのほんの一部分だった。"],"85":["時計の針が午前三時を指す。片づける紙が、少しだけ増えた。","短い会話も、あとから思い出すと違う顔をしている。","今日の言葉が明日どう残るかは、まだ決めなくていい。"],"86":["スタジオのドアの向こうから、遠い足音が聞こえる。","早めに帰ることにも、いくつもの理由がある。","家に着いてから始まる時間も、誰かの大事な一日だ。"],"87":["マイクを切ったあとも、返答の下書きが手元に残っている。","言い切れない感想は、書き直さずに置いておける。","一つの言葉で全部を説明しなくても、手紙は届く。"],"88":["放送終了の時刻を日誌に書く。紙にペン先が触れる音だけがする。","いつもと違う午後を過ごしても、それで何かが終わるわけではない。","次の木曜日も、何が起こるかはまだ知らない。"],"89":["明日の放送準備の欄は、まだ空いている。","予定は、決めることだけでできているわけではない。","書き込まずに残した時間にも、きっと使い道がある。"],"90":["放送卓に一枚、何も書かれていない紙が残った。","紙の余白は、今夜すべて埋めなくてもいい。","また次に、書きたくなることがあれば書けばいい。"],"91":["今夜の原稿を片づけると、引き出しの奥に少し空きができた。","紹介した手紙は違っても、夜が明ければそれぞれに用事がある。","誰かの普通の一日を、次も聞けるとは限らない。それでも放送は続く。"],"92":["午前三時。読み終えた原稿が、放送卓の上に重ねられている。","この局に届くのは、それぞれの暮らしのほんの一部分だ。","窓の外はまだ暗い。誰かの朝は、このあとも続いていく。"]};
const CH4_HEARD_DETAILS={"79:cat":"喫茶店では、開かなかったスケッチブックの代わりに、窓の外の歩幅が記憶に残った。","79:bread":"パン売り場では、同じパンに違う名前がつく。その呼び方を聞く楽しみもあるらしい。","80:fish":"閉められなかった窓の場面が、感想の一行に残った。理由はまだ言葉になっていない。","80:moon":"月の忘れ物係には、星くずの夜勤手当と、冷蔵庫のプリンの管理責任がある。","81:driver":"猫主任は尻尾だけの出勤だったのかもしれない。次の点検を待つしかない。","81:sugar":"砂糖はいつもと同じ三杯。それでも、友人と飲むと甘さの感じ方が違うらしい。","82:clock":"古い小さなドライバーには、今日は出番がなかった。磨かれて箱に戻ったという。","82:umbrella":"三冊の青いノートから選んだのは、まだ名前のない色だった。","83:terminal":"駅とは反対の道で、古い地図のある店を見つけた。今日は窓の外から眺めるだけ。","83:triangle":"架空の街の地図には、用途を決めない四角い土地が残された。","84:fridge":"自分のために選んだ茶碗で、温かいご飯を食べたという手紙だった。","84:anon":"「今日は、何も決めませんでした。」消されなかった読点の場所が残っている。","85:bread":"「くるみ寄り」の札は訂正されたけれど、捨てずに取っておいたという。","85:clock":"思い出せなかった本の名前は、次に図書室で会うときの話題になりそうだ。","86:moon":"家庭内委員会では、プリンの提案より洗い物の対案が支持された。","86:driver":"仕事帰りに買ったハンカチ。猫主任の査定には関係ないけれど、本人は気に入っている。","87:sugar":"理由を決めないまま、紙コップで乾杯した短い時間があった。","87:fish":"同じ本でも、友達とは好きな場面が違った。その違いを、まだうまく説明できない。","88:umbrella":"花のためではないお湯を、自分のカップに注いだ午後があった。","88:terminal":"誰も待たない午後に、窓の向こうの食器の音が聞こえてきた。","89:triangle":"予定表には、調べたい角と雲の形、そしてまだ決まらない空き地のことが書かれていた。","89:fridge":"まかないを食べ損ねた帰り道、自分の夕食は帰ってから決めることにした。","90:anon":"読みかけの本には、何も書かれていないしおりが残っている。","90:cat":"白い紙の端に一本だけ引かれた線は、まだ何にもならなくていい。","91:cat":"雨宿りの時間に、窓に映る自分の姿を見たと書かれていた。","91:bread":"パンを入れる袋の向きだけで、同僚と長い相談になった。","91:fish":"本の返却前に、折れたページの角を見つけたという。","91:moon":"「何も見つからなかった日」は、架空の暦に加わった新しい祝日だ。","91:driver":"停車場で拾った短い鉛筆を、落とし物入れに届けたらしい。","91:sugar":"氷がぶつかる音のするコーヒーも、砂糖は三杯のままだった。","91:clock":"本棚の下から、日焼けした栞が出てきた。","91:umbrella":"花の色を見比べる人が、靴下には迷わず灰色を選んだ。","91:terminal":"買い物メモの半分だけを済ませて帰る日もある。","91:triangle":"丸くなった消しゴムの角を見ながら、図形のことを考えた。","91:fridge":"冷蔵庫の残りご飯を、どう食べるか迷った夜の話だった。","91:anon":"探していたものとは別の、小さな白い紙を引き出しへ戻した。","92:cat":"掃除のために動かした椅子が、夕方になっても窓のほうを向いていた。","92:bread":"明日の焼き上がり表に、理由のない丸が一つ加わった。","92:fish":"本の返却日を書いた手帳には、曜日も一緒に残っている。","92:moon":"次の月面委員会は、雲に隠れた月の勤怠を話し合うらしい。","92:driver":"明日の上着のポケットへ、食べ忘れた飴を移した。","92:sugar":"朝に使うカップが、洗われて伏せてある。","92:clock":"机の上の時計は、ねじを巻かないまま明日の朝を待っている。","92:umbrella":"名前を書いていない白い札が、窓辺の鉢に差してある。","92:terminal":"中身のない紙袋が、玄関で明日の寄り道を待っている。","92:triangle":"明日の予定表には、埋めないままの一枠が残った。","92:fridge":"明日の食事のために、洗った箸が一膳、見えるところに置かれた。","92:anon":"手帳の明日の欄には、時間だけが書かれている。"};
const CH4_READER_CODA='放送卓の隅には、次の放送のための白い紙が一枚残されている。';



function shell(content){let done=s.phase==='complete',done2=s.phase==='chapter2_complete',done3=s.phase==='chapter3_complete',sp=specialActive(s.night);return `<header class="header"><div class="header-identity"><div class="brand">SOMEWHERE ON AIR</div><h1>午前二時の周波数</h1><div class="small">${done?'第1章 14夜 終了':done2?'第2章 14夜 終了':done3?'第3章 14夜 終了':s.phase==='chapter4_complete'?'第4章 14夜 終了':`第${s.night}夜　${s.finale?.status==='completed'?'閉局':s.phase.startsWith('final_')?'最終放送':regularDayTitle(s.night)}`}</div><div class="climate-meta">${esc(climateCaption(s.night))}</div></div><div class="header-tools" aria-label="放送の補助操作と状態"><button class="guide-launch" type="button" onclick="openGuide()" aria-label="あそび方・手引きを開く">${uiIcon('help')}<span>あそび方</span></button><div class="chip" role="status" aria-label="放送状態">${s.phase==='broadcast'||s.phase==='reply'||s.phase==='final_broadcast'?'● ON AIR':'◌ OFF AIR'}</div></div></header>${studioScene(s.tab!=='studio'||readerSetupOpen)}<div class="layout"><main id="main">${content}</main><aside class="sidebar"><div class="panel"><div class="overline">BROADCAST DESK</div>${navButtons()}${readerEntry()}</div><div class="panel"><div class="overline">${sp?'特別放送':s.night>=15&&s.night<=28?'第2章':chapter3IsNight(s.night)?'第3章':chapter4IsNight(s.night)?'第4章':s.night>=29?'通常放送':'今夜の放送'}</div><div class="status"><span>放送スタイル</span><span>${s.phase==='intro'||s.phase==='prepare'?(s.broadcastModePref==='letters'?'おたより中心':'いつもの放送'):(isLettersMode()?'おたより中心':'いつもの放送')}</span></div><div class="status"><span>紹介枠</span><span>${s.chosen.length} / 3</span></div><div class="progress"><div style="width:${s.chosen.length/3*100}%"></div></div><div class="status"><span>放送済み</span><span>${s.played.filter(x=>x.night===s.night).length}通</span></div><div class="status"><span>保存</span><span>自動保存</span></div></div></aside></div><nav class="bottomnav" aria-label="メニュー">${UI_NAV.map(([id,icon,label])=>`<button type="button" class="${s.tab===id?'active':''}" ${s.tab===id?'aria-current="page"':''} onclick="setTab('${id}')">${uiIcon(icon)}<span class="nav-label">${label}</span></button>`).join('')}</nav><div class="footer">『午前二時の周波数』 · SOMEWHERE ON AIR · v4.9.16</div>`}
function navButtons(){return UI_NAV.map(([id,icon,label])=>`<button type="button" class="navbtn ${s.tab===id?'active':''}" ${s.tab===id?'aria-current="page"':''} onclick="setTab('${id}')">${uiIcon(icon)}<span>${id==='journal'?'放送日誌':id==='settings'?'設定・セーブ':label}</span></button>`).join('')}

function intro(){
  milestoneEnsure(s.night);
  if(s.night>=15&&s.night<=28)return chapter2Intro();
  if(chapter3IsNight(s.night))return chapter3Intro();
  if(chapter4IsNight(s.night)&&!specialActive(s.night))return chapter4Intro();
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
function prepare(){
 const ids=nightLetters(s.night);
 if(prepareStepNight!==s.night){prepareStepNight=s.night;prepareStepUI='letters';}
 const styleStep=prepareStepUI==='style'&&s.chosen.length>0;
 const selectedNames=s.chosen.map(id=>NAMES[letter(id).who]).join('・')||'まだ選んでいません';
 // 番組向けの募集投稿と普段のお便りを混同しない。実際に届いた情報だけ表示する。
 const currentSpecial=Boolean(specialActive(s.night));
 const specialCount=currentSpecial?ids.filter(id=>letter(id)?.programSpecial).length:0;
 const specialSelectionNote=currentSpecial?`<p class="prepare-special-guide">${specialCount?`今夜は特別企画への投稿が${specialCount}通届いています。`:'今夜は特別企画への投稿がありません。'}普段のお便りも自由に選べます。</p>`:'';
 const steps=`<div class="prepare-steps" aria-label="放送準備の進行状況"><span class="${!styleStep?'active':''}">1 · おたよりを選ぶ</span><span class="${styleStep?'active':''}">2 · 放送の準備</span></div>`;
 const theme=s.night>=15?`<div class="notice">${s.night<=28?'第2章：'+esc(CH2_NIGHTS[s.night][0]):chapter3IsNight(s.night)?'第3章：'+esc(CH3_DAYS[chapter3Offset(s.night)][0]):chapter4IsNight(s.night)&&!specialActive(s.night)?'第4章：'+esc(CH4_DAYS[s.night-79][0]):specialActive(s.night)?'特別放送：'+esc(SPECIAL_THEMES[s.special.planned.themeId].title):'今夜のテーマ：'+esc(regularTheme(s.night)[0])+' · '+esc(regularTheme(s.night)[1])}</div>`:'';
 if(!styleStep){
  return `<section class="panel prepare-panel prepare-letters"><div class="overline">BEFORE BROADCAST / 01:59</div><h2>今夜のお便り</h2>${steps}${studioPrelude()}${theme}${specialSelectionNote}<p class="muted">最大3通を紹介できます。読まなかったお便りの送り主も、明日を生きていきます。まずお便りを選びましょう。</p><div class="prepare-selection-bar" role="status" aria-live="polite"><div class="prepare-selection-count"><strong>紹介予定 ${s.chosen.length} / 3通</strong><span>${esc(selectedNames)}</span></div><button type="button" class="btn" ${s.chosen.length===0?'disabled':''} onclick="prepareUIStage('style')">放送準備へ →</button></div>${ids.map(id=>{let l=letter(id),selected=s.chosen.includes(id);return `<div class="letter"><div class="letter-top"><span class="letter-title">${esc(NAMES[l.who])}</span><span class="tag">${l.programSpecial?'企画への投稿':l.kind==='everyday47'?'日常のおたより':l.special?'特別返答':''}</span></div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div><div class="actions"><button class="btn ${selected?'secondary':'ghost'}" onclick="selectLetter('${id}')" ${!selected&&s.chosen.length>=3?'disabled':''}>${selected?'✓ 紹介する予定':'＋ このお便りを紹介'}</button></div></div>`}).join('')}<div class="prepare-later"><button type="button" class="btn secondary" ${s.chosen.length===0?'disabled':''} onclick="prepareUIStage('style')">${s.chosen.length}通を選んで、放送準備へ →</button></div><button class="reader-inline-entry" type="button" onclick="openReaderSetup()">${uiIcon('moon')}<span class="reader-entry-copy">今夜は聴くだけにする <small>本編とは別の物語として読みます</small></span></button></section>`;
 }
 return `<section class="panel prepare-panel prepare-style"><div class="overline">BEFORE BROADCAST / 01:59</div><h2>放送の準備</h2>${steps}<div class="prepare-summary"><div><strong>今夜紹介するお便り ${s.chosen.length}通</strong><span>${esc(selectedNames)}</span></div><button type="button" class="btn secondary" onclick="prepareUIStage('letters')">← 選び直す</button></div>${broadcastModePicker()}${specialActive(s.night)?`<div class="notice">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}<span class="small">この言葉は特別放送の冒頭で紹介します。</span></div>`:''}${s.broadcastModePref==='letters'?`<div class="broadcast-auto-explain"><strong>オープニングはおまかせ</strong><p>今夜の挨拶は放送開始時に自動で決まります。文章は放送中に表示されます。</p></div>`:`<h3>オープニングの言葉</h3><p class="muted station-tiny-hint">今夜、どんな声で番組を始めますか？　放送の正解や評価はありません。</p><div class="station-choice-grid">${opening.map((o,i)=>`<button type="button" class="choice station-compact-choice ${s.opening===i?'selected':''}" aria-pressed="${s.opening===i}" onclick="chooseOpening(${i})"><strong>${['あたたかく','ねぎらい','問いかけ','静かな夜','帰り道に','街の声'][i]}</strong><span>${esc(o)}</span></button>`).join('')}</div>${s.night>3?`<p class="station-habit">${fmt(stationHabitText())}</p>`:''}`}<div class="actions prepare-start-actions"><button class="btn" ${s.chosen.length===0||(s.broadcastModePref==='manual'&&s.opening===null)?'disabled':''} onclick="beginBroadcast()">午前2時、放送を始める →</button></div></section>`;
}
function broadcast(){
 if(s.cursor>=s.chosen.length){
  if(isLettersMode())return `<section class="panel station-ending"><div class="overline">02:53 / ENDING · おたより中心</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p><div class="station-script-preview"><div class="overline">自動で選んだ曲</div><p>♪ ${esc(songs[s.song]?.[0]||'')}</p><p class="small">${esc(songs[s.song]?.[1]||'')}（実際の音声は再生されません）</p></div><h3>エンディングの言葉</h3><div class="station-script-preview"><p>${esc(lettersBroadcastPhrase4916('closing',s.broadcastStyle.closing))}</p></div><p class="muted station-tiny-hint">演出の選択は自動ですが、最後の言葉はそのまま読めます。</p>${finaleAnnouncementPreview()}<div class="actions"><button type="button" class="btn" onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`;
  return `<section class="panel station-ending"><div class="overline">02:53 / ENDING</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p><p class="muted station-tiny-hint">曲は文字で描く架空の楽曲です。実際の音声は再生されません。</p><div class="station-choice-grid">${songs.map((a,i)=>`<button type="button" class="choice station-compact-choice ${s.song===i?'selected':''}" aria-pressed="${s.song===i}" onclick="chooseSong(${i})"><strong>♪ ${esc(a[0])}</strong><span>${esc(a[1])}</span></button>`).join('')}</div><h3>エンディングの言葉</h3><p class="muted station-tiny-hint">誰かの人生を締めくくるのではなく、今夜の放送をそっと閉じる言葉を選びましょう。</p><div class="station-choice-grid">${STATION_CLOSINGS.map((c,i)=>`<button type="button" class="choice station-compact-choice ${s.broadcastStyle.closing===i?'selected':''}" aria-pressed="${s.broadcastStyle.closing===i}" onclick="chooseClosing(${i})"><strong>${esc(c[0])}</strong><span>${esc(c[1])}</span></button>`).join('')}</div>${s.song!==null&&s.broadcastStyle.closing!==null?`<div class="station-script-preview"><div class="overline">放送原稿 / PREVIEW</div><p>♪ ${esc(songs[s.song][0])}</p><p>${esc(STATION_CLOSINGS[s.broadcastStyle.closing][1])}</p></div>`:''}${finaleAnnouncementPreview()}<div class="actions"><button type="button" class="btn" ${s.song===null||s.broadcastStyle.closing===null?'disabled':''} onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`;
 }
 if(s.cursor>0&&!s.broadcastStyle.completed[s.cursor])return interludeScreen();
 let id=s.chosen[s.cursor],l=letter(id);
 return `<section class="panel"><div class="overline">${['02:08','02:23','02:39'][s.cursor]} / ON AIR · LETTER ${s.cursor+1} / ${s.chosen.length}</div><h2>お便りを紹介する</h2>${s.cursor===0?`<div class="station-onair-voice"><div class="overline">02:00 / あなたのオープニング</div><p>${esc(lettersBroadcastPhrase4916('opening',s.opening))}</p></div>`:Number.isInteger(s.broadcastStyle.interludes[s.cursor])&&s.broadcastStyle.interludes[s.cursor]>=0?`<div class="station-onair-voice"><div class="overline">BETWEEN LETTERS / つなぎの一言</div><p>${esc(lettersBroadcastPhrase4916('bridge',s.broadcastStyle.interludes[s.cursor],s.cursor))}</p></div>`:studioSilentBridge()}${s.cursor===0&&specialActive(s.night)?`<div class="special-opening">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}</div>`:''}<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div><div class="actions"><button class="btn" onclick="s.current='${id}';s.phase='reply';save();render()">このお便りに返答する →</button></div></section>`;
}

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
  if(chapter3IsNight(s.night))return chapter3After();
  if(chapter4IsNight(s.night)&&!specialActive(s.night))return chapter4After();
  if(s.night>=29)return specialActive(s.night)?specialAfter():regularAfter();
  const n=s.night;
  // 第1章の情景は、実際に放送で紹介したお便りしか知り得ない。
  // 「届いている」と「読んだ」を混同しないようにする（初見の選択自由を維持）。
  const heardMoonWindow=s.played.some(x=>x.night===10&&x.id==='moon10');
  const heardClockPhoto=s.played.some(x=>x.id==='clock10');
  const heardStation=s.played.some(x=>['terminal4','terminal11','terminal11first'].includes(x.id));
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
    10:heardMoonWindow?'マイクのランプが消えた。\n\n今夜は、帰る場所の明かりの話をした。\n\n見知らぬ人の窓が、誰かの安心になっている。\n\nそのことを知らないまま、朝は来る。':'マイクのランプが消えた。\n\n今夜も、別々の場所から違う話が届いた。\n\n窓の向こうには、まだ灯りが残っている。あの明かりの下にも、放送で紹介しなかった一日があるのだろう。\n\nそのすべてを知らないまま、朝は来る。',
    11:heardClockPhoto&&heardStation?'駅の名前は、まだ聞いていない。\n\n古い写真の駅と、誰かが毎週立ち寄る駅。\n\n同じ場所かもしれないし、違うのかもしれない。\n\n今夜は、確かめずに便箋をしまう。':'机の隅には、あの古い封筒がまだある。\n\n「終点のひとつ前で、待っています。」\n\n駅へ続く道にも、こちらの知らない日々があるのだろう。\n\n今夜はそれ以上確かめず、便箋をしまう。',
    12:'マイクの前には、書き直された言葉が残る。\n\n放送で何を言ったとしても、誰かの人生の結論にはならない。\n\nそれでも、次の一文を考える夜は続いていく。',
    13:'いつもの木曜日ではない夜に、届いた声があった。\n\n待ち合わせの言葉を、守ることも、手放すことも。\n\n人によっては、そのどちらでもない明日を選ぶのだろう。',
    14:'最後の曲が終わった。\n\n読み終えた便箋と、読めなかった便箋を揃える。\n\n二週間、たしかに何人かの声がこの部屋を通り過ぎた。\n\nマイクが消えた街でも、明日の生活は始まっていく。'
  };
  return `<section class="panel end"><div class="overline">03:00 / OFF AIR</div><h2>放送が終わった</h2><p>${fmt(scenes[n])}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">放送しなかったお便り：${nightLetters(n).length-s.chosen.length}通</div>${n<=3?'<p class="small">リスナーたちは、それぞれの一日を過ごします。変化の一部は、次の放送で届くかもしれません。</p>':''}<div class="actions"><button class="btn" onclick="nextNight()">${n===14?'第1章を振り返る →':'次の夜へ進む →'}</button></div></section>`;
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
function lettersTab(){if(s.finale?.status==='completed')return `<section class="panel"><div class="overline">POST OFFICE / CLOSED</div><h2>最後の便箋は、日誌の中に。</h2><p>このラジオ局の郵便受けには、もう新しいお便りは届きません。最後に放送した声は記録として読み返せます。</p><div class="actions"><button class="btn secondary" onclick="finaleReview()">最終放送を読み返す</button></div></section>`;let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">POST OFFICE</div><h2>届いたお便り</h2><p class="muted">第${s.night}夜のお便り一覧。内容を読み返せます。</p>${ids.map(id=>{let l=letter(id),played=s.played.some(x=>x.id===id),sel=s.chosen.includes(id);return `<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}${l.programSpecial?' · 企画への投稿':l.kind==='everyday47'?' · 日常のおたより':l.kind==='crossTalk4830'?' · ラジオからつながるおたより':l.kind==='crossAfter4831'?' · 交流のその後':''} · ${played?'放送済み':sel?'紹介予定':'未紹介'}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div>`}).join('')}</section>`}
function journal(){
  if(s.guidance.bookmarksOnly)return bookmarkArchive();
  const n=s.night;
  s.journalPage=Math.max(0,Math.floor(s.journalPage||0));
  const maxPage=Math.max(0,Math.floor((n-1)/10));
  s.journalPage=Math.min(s.journalPage,maxPage);
  const latest=n-s.journalPage*10;
  const oldest=Math.max(1,latest-9);
  const nights=Array.from({length:latest-oldest+1},(_,i)=>latest-i);
  // 10夜分を取り出すために、日ごとに大きな配列全体を繰り返し走査しない。
  const logsByNight=new Map(),eventsByNight=new Map();
  for(const x of s.logs){if(x.night>=oldest&&x.night<=latest){if(!logsByNight.has(x.night))logsByNight.set(x.night,[]);logsByNight.get(x.night).push(x)}}
  for(const x of s.events){if(x.public===true&&x.night>=oldest&&x.night<=latest){if(!eventsByNight.has(x.night))eventsByNight.set(x.night,[]);eventsByNight.get(x.night).push(x)}}
  const content=nights.map(n=>{
    const a=logsByNight.get(n)||[],b=eventsByNight.get(n)||[];
    return `<div class="timeline"><h3>第${n}夜 — ${esc(regularDayTitle(n))}</h3>${a.length?a.map(x=>`<div class="timeline-item"><div class="tag">${esc(x.type)}</div>${esc(x.message)}</div>`).join(''):'<p class="small">まだ放送の記録はありません。</p>'}${b.length?`<div class="subtle">公開された近況</div>${b.map(x=>`<div class="timeline-item small">${esc(x.message)}</div>`).join('')}`:''}</div>`;
  }).join('');
  const replies=s.played.filter(x=>x.night>=oldest&&x.night<=latest).slice().reverse();
  return `<section class="panel"><div class="overline">BROADCAST JOURNAL</div><h2>放送日誌</h2><p class="muted">放送で伝えた言葉を記録しています。生活の秘密や内部数値は表示されません。</p>${s.broadcastStyle.history.length?`<div class="station-history-hint"><div class="overline">YOUR RADIO VOICE</div><p>${fmt(stationHabitText())}</p></div>`:''}<div class="actions journal-bookmark-actions"><button class="btn secondary" onclick="toggleBookmarksView()">◇ 心に残ったお便り（${s.bookmarks.length}）</button></div><div class="actions journal-page-actions"><button class="btn secondary" ${s.journalPage>=maxPage?'disabled':''} onclick="journalMovePage(1)">← 前の10夜</button><button class="btn secondary" ${s.journalPage===0?'disabled':''} onclick="journalMovePage(-1)">新しい10夜 →</button></div><p class="small journal-page-caption">第${oldest}〜${latest}夜を表示（全${n}夜）</p>${content}<h3>あなたが届けた言葉</h3>${replies.length?replies.map(x=>`<div class="letter"><div class="small">第${x.night}夜 · ${esc(NAMES[x.who])}</div><b>${esc(x.subject)}</b><div class="quote">${fmt(x.response)}</div>${bookmarkButton(x)}</div>`).join(''):'<p class="muted">この期間には返答の記録がありません。</p>'}</section>`;
}
// v4.0.1: 届いた手紙ではなく「実際に放送で紹介した手紙」を根拠に人物記録を公開する。
// 内部のknownフラグ・初投稿時刻・自律生活の秘密は、記録の解放判定に使わない。
const LISTENER_ARCHIVE_ORDER=['cat','clock','bread','moon','driver','fish','terminal','anon','sugar','umbrella','triangle','fridge'];
function archiveExcerpt(body){
  const paragraphs=String(body||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  // 挨拶よりも、その人が伝えた話を選ぶ。本文以外の記憶から補わない。
  const meaningful=paragraphs.find(x=>x.length>=15&&!/^(こんばんは|お久しぶりです|ご無沙汰しています|ラジオネーム)/.test(x))||paragraphs.find(x=>x.length>=8)||paragraphs[0]||'';
  return meaningful.length>92?meaningful.slice(0,89)+'…':meaningful;
}
function listeners(){
  const known=LISTENER_ARCHIVE_ORDER.map(id=>({id,letters:s.played.filter(x=>x.who===id&&Number.isInteger(x.night)&&x.night<=s.night)}));
  const discovered=known.filter(x=>x.letters.length);
  const undiscovered=known.filter(x=>!x.letters.length);
  const published=discovered.map(({id,letters})=>{
    const first=letters[0],last=letters[letters.length-1];
    // 手紙の件名・本文は本人がラジオで実際に公開したものだけ。
    const selected=first===last?[first]:[first,last];
    const source=selected.map(l=>`<div class="archive-letter"><div class="small">第${l.night}夜に紹介した「${esc(l.subject)}」</div><div class="archive-excerpt">「${esc(archiveExcerpt(l.body))}」</div></div>`).join('');
    // ほかのリスナーとのつながりも、紹介済みのおたよりだけを根拠に記録する。
    // 古い便箋の一時キャッシュが整理されても、放送済み記録と配達履歴は残る。
    const crossIds=new Set();
    for(const [arc,entries] of Object.entries(s.crossTalk4830?.delivered||{})){
      (entries||[]).forEach((entry,stage)=>{if(stage>0&&entry?.id)crossIds.add(entry.id)});
    }
    for(const entries of Object.values(s.crossAfter4831?.delivered||{})){
      (entries||[]).forEach(entry=>{if(entry?.id)crossIds.add(entry.id)});
    }
    const linked=letters.filter(l=>crossIds.has(l.id)).slice(-3);
    const crossRecord=linked.length?`<div class="small archive-notes-label">ラジオを通じて残った出来事</div>${linked.map(l=>`<div class="small">・第${l.night}夜「${esc(l.subject)}」を放送した</div>`).join('')}`:'';
    const memories=Array.isArray(s.listeners[id]?.memories)?s.listeners[id].memories:[];
    // 公開済み返答から蓄積した従来の人物記録も残す。未紹介の人には絶対表示しない。
    const unique=[...new Set(memories.filter(m=>typeof m==='string'&&m.trim()))].slice(-5);
    return `<article class="listener archive-known"><div class="archive-person-heading"><b>${esc(NAMES[id])}</b><span class="small">はじめて紹介した夜：第${first.night}夜</span></div><p class="archive-person-intro">放送で紹介した「${esc(first.subject)}」から、少しずつこの人のことがわかってきました。</p>${unique.length?`<div class="small archive-notes-label">これまでにわかったこと</div><div class="archive-notes">${unique.map(m=>`<div class="small">・${esc(m)}</div>`).join('')}</div>`:''}<div class="small archive-notes-label">放送で聴いた声</div>${source}${crossRecord}</article>`;
  }).join('');
  const unknown=undiscovered.length?`<div class="archive-undiscovered"><h3>まだ出会っていない声</h3><p class="small">お便りを放送で紹介すると、その人の記録が開きます。まだ紹介していない人の名前や暮らしは、ここでは明かされません。</p><div class="archive-unknown-grid">${undiscovered.map(()=>`<div class="listener archive-unknown"><span class="archive-unknown-mark" aria-hidden="true">✧</span><span>まだよく知らないリスナー</span></div>`).join('')}</div></div>`:'';
  return `<section class="panel"><div class="overline">LISTENER ARCHIVE</div><h2>リスナーの記録</h2><p class="muted">放送で紹介したお便りからわかったことを記録します。お便りを紹介していない人の暮らしも、番組の外で続いています。</p>${published}${unknown}</section>`;
}
function settings(){return `<section class="panel"><div class="overline">SETTINGS</div><h2>設定・セーブデータ</h2><button class="btn secondary settings-guide-btn" type="button" onclick="openGuide()">${uiIcon('help')}<span>ラジオ局の手引きを読む</span></button><p class="settings-save-note">進行状況は、この端末のブラウザ内に自動保存されます。別の端末に引き継ぐ場合は、バックアップを書き出してください。「聴くだけの夜」の保存と復元は読書画面から別に行います。</p><div class="actions settings-backup-actions"><button class="btn" onclick="downloadSave()">バックアップを保存</button><label class="btn secondary" style="cursor:pointer">バックアップを読み込む<input class="screen-reader" type="file" accept=".json,application/json" onchange="importSave(this)"></label></div><hr class="divider"><h3>スタジオ演出</h3><p class="small">放送前後の静けさと、マイク横の小さなメーターです。効果音や音声はありません。</p><label class="studio-setting"><input type="checkbox" ${s.studioVisuals?.enabled!==false?'checked':''} onchange="setStudioVisuals('enabled',this.checked)"> スタジオ演出を表示する</label><div class="studio-setting-modes settings-motion-modes"><span class="small">アニメーション：</span>${[['normal','通常'],['reduced','控えめ'],['off','動きなし']].map(([id,name])=>`<label><input type="radio" name="studio-motion" value="${id}" ${s.studioVisuals?.motion===id?'checked':''} ${s.studioVisuals?.enabled===false?'disabled':''} onchange="setStudioVisuals('motion',this.value)"> ${name}</label>`).join('')}</div><p class="small settings-motion-note">動きを止めても、時計とON AIRの表示は残ります。端末で動きを減らす設定を使用している場合は、その設定が優先されます。</p><hr class="divider"><h3>最初から遊ぶ</h3><p class="small">現在のセーブデータを消して、第1夜からやり直します。必要なら先にバックアップしてください。</p><button class="btn secondary" onclick="${s.finale?.status==='completed'?'finaleRestart()':'resetGame()'}">進行状況をリセット</button><hr class="divider"><p class="small">バージョン 4.9.16</p></section>`}
function specialPlanningPanel(){
 const n=s.night;
 const p=s.special?.planned;
 if(p&&p.status==='announced'&&p.announceNight===n){
  const t=SPECIAL_THEMES[p.themeId];
  return `<div class="special-planning"><div class="overline">NEXT SPECIAL / 予告</div><h3>${esc(t.title)}</h3><p>今夜の放送の終わりに募集を告知し、第${p.night}夜に特別放送を行います。今夜の通常のお便りも、いつもどおり紹介できます。</p>${p.storySource?`<p class="small">きっかけ：第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」</p>`:''}${p.milestone?'<p class="small">節目の夜の記念放送は自動開催します。ほかの特別放送とは重なりません。</p>':'<div class="actions"><button class="btn secondary" onclick="specialCancel()">企画を取り消す</button></div>'}</div>`;
 }
 const choices=specialAvailable(n);
 if(!choices.length)return '';
 const fromLife=choices.filter(id=>id.startsWith('story_'));
 const other=choices.filter(id=>!id.startsWith('story_')&&!WHIMSICAL_SPECIAL_CHOICES[id]);
 const odd=choices.filter(id=>Boolean(WHIMSICAL_SPECIAL_CHOICES[id]));
 const offered=fromLife.map(id=>{
  const t=SPECIAL_THEMES[id],offer=storyOfferFor(id);
  return `<button class="choice story-proposal" onclick="specialPlan('${id}')"><span class="story-proposal-kicker">届いた声から生まれた企画</span><strong>${esc(t.title)}</strong><br><span class="small">${esc(t.invitation)}</span>${offer?`<span class="story-source">きっかけ：第${offer.originNight}夜に紹介した「${esc(offer.sourceSubject)}」</span>`:''}</button>`;
 }).join('');
 return `<div class="special-planning"><div class="overline">SPECIAL PROGRAM / 企画の相談</div><h3>次の夜、特別な放送をしてみませんか？</h3><p class="muted">企画しないまま、いつもの放送を続けても大丈夫です。募集は今夜、本番は翌夜です。</p>${fromLife?`<div class="story-offer-title">✧ リスナーの暮らしから生まれた企画</div>${offered}<hr class="divider">`:''}${other.map(id=>{const t=SPECIAL_THEMES[id];return `<button class="choice" onclick="specialPlan('${id}')"><strong>${esc(t.title)}</strong><br><span class="small">${esc(t.invitation)}</span></button>`}).join('')}${odd.length?`<details class="special-whimsy-list"><summary>☾ 少し不思議な特別放送（${odd.length}企画）</summary><p class="small">日常の小さな疑問や空想を、みんなで楽しむ特別な夜です。</p>${odd.map(id=>{const t=SPECIAL_THEMES[id];return `<button type="button" class="choice" onclick="specialPlan('${id}')"><strong>${esc(t.title)}</strong><br><span class="small">${esc(t.invitation)}</span></button>`}).join('')}</details>`:''}</div>`;
}
function specialIntro(){
 const p=s.special.planned,t=SPECIAL_THEMES[p.themeId];
 return `<section class="panel special-panel"><div class="overline">SPECIAL PROGRAM / 第${s.night}夜 · 01:46</div><h2>${esc(t.title)}</h2><p>${fmt((p.legacyNoAnnouncement?'今夜は記念の放送。予告なしでも、届いた声を大切に聴いていこう。':'昨日の放送の終わりに、小さな企画を告知した。')+'\n\n届いた手紙には、書いた人の一日がある。\n送らずに聴いていた人にも、一日があった。\n\n今夜はいつもより少しだけ、机の灯りが明るい。')}</p>${p.storySource?`<div class="story-origin">この企画は、第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」をきっかけに生まれました。<br>同じ話題でも、今夜の手紙はそれぞれ別の暮らしから届いています。</div>`:''}<div class="notice">${esc(t.invitation)}<br>通常のお便りも届いています。最大3通を選んで放送しましょう。</div><div class="actions"><button class="btn" onclick="startNight()">特別放送のお便りを確認する →</button></div></section>`;
}
function specialAfter(){
 const p=s.special.planned,t=SPECIAL_THEMES[p.themeId];
 return `<section class="panel end special-panel"><div class="overline">03:00 / SPECIAL PROGRAM END</div><h2>${esc(t.title)}</h2><p>${fmt(t.closing+'\n\n声を出さなかった人にも、この時間は流れていた。\n\nマイクの赤いランプが消える。')}</p><hr class="divider"><div class="small">紹介したお便り：${s.played.filter(x=>x.night===s.night).length}通</div><div class="small">募集に応じて届いたお便り：${p.submissions.length}通</div>${p.storySource?`<p class="small">きっかけ：第${p.storySource.originNight}夜に紹介した「${esc(p.storySource.sourceSubject)}」</p>`: ''}<p class="small">聴いた人の記憶や、明日届くかもしれない感想は、放送後の世界に残ります。</p><div class="actions"><button class="btn" onclick="nextNight()">次の夜へ進む →</button></div></section>`;
}
function regularIntro(){
 const n=s.night,theme=regularTheme(n),day=['月','火','水','木','金','土','日'][(n-1)%7];
 const intro=['手紙の束に新しい宛名を見つけた。','窓の外に、帰りの遅い人の灯りが見える。','昨夜の放送から、街ではまた一日が過ぎた。','スタジオに湯気の立つカップが置かれている。'][simHash(`reg:scene:${n}`)%4];
 // 章を抜けた説明は初回のみ。第100夜以降も「章を終えた」説明を繰り返さない。
 const afterThird=!!s.chapter3?.finished&&n===s.chapter3.startNight+CH3_DAYS.length;
 const afterFourth=!!s.chapter4?.finished&&s.chapter4.fromNight<=92&&n===93;
 const transition=n===29?'第2章も一区切りを迎えた。でも、ラジオはまだ続いている。':afterThird?'第3章の十四夜も過ぎた。ここからは、いつもの放送が続いていく。':afterFourth?'第4章も一区切りを迎えた。でも、ラジオはまだ続いている。':'';
 const text=intro+(transition?'\n\n'+transition:'')+'\n\n今夜の小さなテーマは「'+theme[0]+'」。\n'+theme[1]+'。\n\n読む手紙は、まだ決まっていない。';
 const guidance=n===29?'<div class="notice">通常放送では、これまでの人生分岐・感情・自律生活からお便りが届きます。</div>':'';
 return `<section class="panel"><div class="overline">REGULAR BROADCAST / 第${n}夜・${day}曜日</div><h2>今日も、午前2時</h2><p>${fmt(text)}</p>${guidance}${s.finale?.status==='planned'&&s.night===s.finale.announcedNight?finaleAnnounceIntro():specialPlanningPanel()}<div class="actions"><button class="btn" ${s.finale?.status==='planned'&&s.finale.announcementChoice===null?'disabled':''} onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function regularAfter(){
 const n=s.night;
 const messages=['放送が終わったあと、スタジオには時計の音が残った。','曲が止み、誰かの街の夜はまだ続いている。','机の上には、読み上げなかった便箋も残っている。','マイクの向こうに、今夜もいくつかの生活があった。'];
 const tails=[
  '窓の向こうでは、家々の灯りが少しずつ変わっていく。明日届く言葉は、まだ誰も知らない。',
  '封筒を束ねて、机の端に置く。今夜の放送が終わっても、街の時間は止まらない。',
  '選ばれた便箋にも、紹介されなかった便箋にも、それぞれの持ち主がいる。',
  'スタジオの明かりを落とす。次の夜に何が届くかは、まだ決まっていない。',
  'マイクを切ったあとも、時計の針はいつもの速さで進んでいく。',
  '机の上の紙をそろえる。放送の外にも、まだ語られていない日常がある。'
 ];
 const text=messages[simHash(`reg:after:${n}`)%messages.length]+'\n\n'+tails[n%tails.length];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · 通常放送</div><h2>また明日の午前2時に</h2><p>${fmt(text)}</p>${s.special?.planned?.announceNight===n&&s.special.planned.status==='ready'?`<div class="special-planning"><div class="overline">SPECIAL PROGRAM · 募集の告知</div><h3>${esc(SPECIAL_THEMES[s.special.planned.themeId].title)}</h3><p>${esc(SPECIAL_THEMES[s.special.planned.themeId].invitation)}</p><p class="small">第${s.special.planned.night}夜に放送します。</p></div>`:''}<hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">次の夜には、今日の出来事から別のお便りが届くかもしれません。</div><div class="actions"><button class="btn" onclick="nextNight()">次の夜へ進む →</button></div></section>`;
}
function chapter2Intro(){
 const n=s.night,theme=CH2_NIGHTS[n],first=n===15;
 const scenes=['スタジオに、新しい便箋が積まれている。','街の灯りのいくつかが、まだ眠っていない。','日付が変わり、机の上にもまた一日の記録が届いた。','窓の向こうで、遅い帰り道の足音が遠ざかる。','ページをめくる音が、静かな室内に残る。'];
 const beginning=first?'第1章の放送から一夜が過ぎた。\n\n何かを決めた人にも、決められなかった人にも、朝が来た。\n\n今夜からまた、新しい便箋が机に積まれていく。':scenes[(n-16)%scenes.length];
 const text=beginning+'\n\n'+theme[1]+'\n\n今夜も、誰かの暮らしから届いた手紙を開く。';
 const note=first?'<div class="notice">第2章「選んだ道の、その先」。人々の生活は、番組で紹介されなかった時間にも続いています。</div>':'';
 return `<section class="panel"><div class="overline">CHAPTER TWO / NIGHT ${n} · 01:46</div><h2>${esc(theme[0])}</h2><p>${fmt(text)}</p>${note}<div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function chapter2After(){
 const n=s.night,scenes=[
 '今日も、決めた道を歩いている人と、まだ立ち止まっている人がいた。',
 '同じ街の、違う窓に明かりがともっている。',
 '便箋に書かれなかった出来事も、明日につながっていく。',
 '誰かの返事を待っているあいだにも、生活は続く。',
 '大きな決断のあとに来るのは、たいてい何でもない一日だ。'
 ];
 const endings=[
 'マイクを切る。明日の朝にどんな答えが見つかるかは、まだわからない。',
 'まだ開いていない封筒を、そっと束の端へ寄せる。',
 '時計の音が戻ってくる。誰かの一日も、また新しく始まる。',
 '放送卓の明かりを落とす。話の続きを急がなくても、夜は明ける。',
 '机の上には、言葉にならなかった時間のぶんだけ余白が残る。'
 ];
 const scene=scenes[simHash(`ch2:after:${n}`)%scenes.length];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · CHAPTER TWO</div><h2>今夜の放送が終わった</h2><p>${fmt(scene+'\n\n'+endings[(n-15)%endings.length])}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">今夜紹介しなかったお便り：${Math.max(0,nightLetters(n).length-s.chosen.length)}通</div><div class="actions"><button class="btn" onclick="nextNight()">${n===28?'第2章の放送を振り返る →':'次の夜へ進む →'}</button></div></section>`;
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
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
 nightLetters(29);save();render();
}


// --- v4.8 「聴くだけの夜」: 本編と別の世界を読む。将来の出来事・非公開感情は選択に使わない。 ---
let readerRestoring=activeProfile==='reader';
function readerEntry(){
 if(!['intro','after','complete','chapter2_complete','chapter3_complete','chapter4_complete'].includes(s.phase))return '';
 return `<div class="reader-subtle-entry"><button type="button" class="reader-entry-button" onclick="openReaderSetup()">${uiIcon('moon')}<span class="reader-entry-copy">今夜は聴くだけにする <small>別のDJの放送を、物語として読む</small></span></button></div>`;
}
function openReaderSetup(){
 if(activeProfile!=='main'||!['intro','prepare','after','complete','chapter2_complete','chapter3_complete','chapter4_complete'].includes(s.phase))return;
 readerSetupOpen=true;render();
}
function closeReaderSetup(){readerSetupOpen=false;render()}
function readerSetupScreen(){
 let exists=false,night=1,invalidSave=false;
 try{
  const raw=localStorage.getItem(READER_SAVE);
  if(raw){const data=migrateState(readerDecodeSaved(raw));exists=validateReaderState(data);invalidSave=!exists;if(exists)night=data.night}
 }catch(e){invalidSave=true}
 return `<section class="panel reader-setup"><div class="overline">A LITTLE DETOUR / 聴くだけの夜</div><h2>今夜は、誰かの放送を聴く</h2><p>別のパーソナリティがおたよりを選び、言葉を返します。あなたの本編には影響しません。</p><p class="small">選択によって、その世界のリスナーも少しずつ変わります。先の展開を読む場合があります。</p>${invalidSave?'<p class="notice">保存済みの読書記録に不整合があります。データは消していません。新しい記録で上書きする前に、読書用バックアップからの復元をお試しください。</p>':''}
 ${exists?`<div class="reader-setup-choice"><button class="btn" onclick="switchToReader()">続きから読む（第${night}夜付近） →</button></div>`:''}
 <div class="reader-setup-choice"><h3>新しい読書用データを作る</h3><p class="small">${exists?'既存の読書用データは上書きされます。先に専用バックアップを保存してください。':'本編は変更しません。'}</p>
 ${s.phase==='prepare'?'<p class="small">本編から分岐する場合は、今夜の放送を終えてから選んでください。</p>':''}<div class="actions"><button class="btn secondary" onclick="createReader('fresh')">第1夜から読む</button><button class="btn secondary" ${s.phase==='prepare'?'disabled':''} onclick="createReader('branch')">本編のこの時点から分岐する</button></div></div>
 <div class="reader-setup-choice"><h3>読書用バックアップを読み込む</h3><label class="btn secondary" style="cursor:pointer">読書用JSONを選ぶ<input class="screen-reader" type="file" accept=".json,application/json" onchange="importReaderSave(this)"></label></div>
 <div class="actions"><button class="btn secondary" onclick="closeReaderSetup()">本編に戻る</button></div></section>`;
}
function makeReaderState(base){
 const copy=JSON.parse(JSON.stringify(base));
 copy.guidance||={welcomeSeen:true,seen:{}};copy.guidance.welcomeSeen=true;
 if(!copy.simState)copy.simState=createSimulationState();
 copy.broadcastModePref='letters';copy.nightBroadcastMode=null;copy.tab='studio';
 copy.reader={schema:1,pages:[],viewIndex:-1,scrollY:0,dj:{tags:[],lastPlanNight:-999}};
 return copy;
}
function createReader(kind){
 if(activeProfile!=='main'||!readerSetupOpen||!['fresh','branch'].includes(kind))return;
 if(kind==='branch'&&!['intro','after','complete','chapter2_complete','chapter3_complete','chapter4_complete'].includes(s.phase))return;
 const old=localStorage.getItem(READER_SAVE);
 if(old&&!confirm('保存済みの「聴くだけの夜」を上書きします。続けますか？'))return;
 if(!save()){alert('本編の保存に失敗しました。バックアップを取ってからお試しください。');return}
 const source=kind==='fresh'?defaultState():s;
 const newState=makeReaderState(source);
 try{readerSaveRaw(JSON.stringify(newState));localStorage.removeItem(READER_POSITION_KEY)}catch(e){alert('読書用の保存領域を確保できませんでした。データは変更していません。');return}
 switchToReader();
}
function switchToReader(){
 if(activeProfile!=='main')return;
 if(!save()){alert('本編の保存に失敗したため、切り替えません。');return}
 let data;
 try{data=migrateState(readerDecodeSaved(localStorage.getItem(READER_SAVE)||''))}catch(e){}
 if(!validateReaderState(data)){alert('読書用データを読み込めません。バックアップから復元してください。');return}
 try{localStorage.setItem(ACTIVE_PROFILE_KEY,'reader')}catch(e){alert('保存できないため切り替えられません。');return}
 activeProfile='reader';s=data;readerApplyPosition();readerSetupOpen=false;lastViewKey=null;readerRestoring=true;render();
}
function switchToMain(){
 if(activeProfile!=='reader')return;
 s.reader.scrollY=window.scrollY;
 if(!readerSavePosition()){alert('読書位置の保存に失敗しました。バックアップを書き出してから切り替えてください。');return}
 let data;
 try{data=migrateState(JSON.parse(localStorage.getItem(SAVE)||'null'))}catch(e){}
 if(!data)data=defaultState();
 try{localStorage.setItem(ACTIVE_PROFILE_KEY,'main')}catch(e){alert('切り替え情報を保存できません。');return}
 activeProfile='main';s=data;applyMainViewState(s);lastViewKey=null;readerSetupOpen=false;render();
}
function downloadReaderSave(){
 if(activeProfile!=='reader')return;
 let blob=new Blob([JSON.stringify({kind:'radio_2am_reader_v1',state:s},null,2)],{type:'application/json'});
 let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='radio_2am_reader_save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function importReaderSave(input){
 const file=input.files?.[0];if(!file)return;
 const reader=new FileReader();reader.onload=()=>{
  try{
   const parsed=JSON.parse(reader.result);
   if(parsed?.kind!=='radio_2am_reader_v1')throw Error('読書用バックアップではありません');
   const data=migrateState(parsed.state);if(!validateReaderState(data))throw Error('読書記録が不足・破損しています');
   if(!confirm('既存の読書用データを上書きしますか？ 本編は変更しません。'))return;
   readerSaveRaw(JSON.stringify(data));localStorage.removeItem(READER_POSITION_KEY);
   if(activeProfile==='reader'){s=data;readerRestoring=true;render()}else{render()}
  }catch(e){console.warn(e);alert('読書用バックアップを読み込めませんでした。')}
 };reader.readAsText(file);
}
function readerTextFromPanel(html){
 const box=document.createElement('div');box.innerHTML=html;
 const root=box.querySelector('section.panel')||box;
 const heading=root.querySelector('h2')?.textContent?.trim()||'今夜の放送';
 const paragraphs=Array.from(root.querySelectorAll(':scope > p')).slice(0,2).map(x=>{const copy=x.cloneNode(true);copy.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));return copy.textContent.trim()});
 return {title:heading,text:paragraphs.join('\n\n')};
}
// 読書版の語りは、操作説明を地の文に混ぜない。手紙や返答の本文は改変しない。
function readerEditorialScene(input,kind,night){
 let text=String(input||'');
 const cuts=[
  '企画しないまま、いつもの放送を続けても大丈夫です。募集は今夜、本番は翌夜です。',
  '第2章も一区切りを迎えた。でも、ラジオはまだ続いている。',
  '第4章も一区切りを迎えた。でも、ラジオはまだ続いている。',
  '読む手紙は、まだ決まっていない。',
  'リスナーたちは、それぞれの一日を過ごします。変化の一部は、次の放送で届くかもしれません。'
 ];
 for(const phrase of cuts)text=text.split(phrase).join('');
 // 特別放送の制作メモは地の文ではなく、任意で開く注記へ。
 // 昔の読書セーブ内に保存された本文にも、表示時だけ適用する。
 if(kind==='outro'){
  text=text.replace(/(?:\n\s*)?きっかけ：第\d+夜に紹介した「[^」\n]*」/g,'');
  text=text.replace('聴いた人の記憶や、明日届くかもしれない感想は、放送後の世界に残ります。','');
 }
 // プレイヤーでなく、別のDJの番組を聴いていることに合わせる。
 text=text.replace('今夜、あなたの言葉を聴いた人がいる。','今夜、この放送に耳を傾けた人がいる。');
 text=text.replace(/\n{3,}/g,'\n\n').trim();
 if(kind==='outro'&&night>=29){
  // 通常放送で毎夜同じ説明を繰り返すより、その夜の風景だけを残す。
  text=text.replace('声が届いた人も、届かなかった人もいる。\n\n放送の外では、今日もそれぞれの暮らしが続いている。','').trim();
 }
 return text;
}
// 通常放送の見出しは、その夜の実際のテーマを使う。既存の章タイトルは変えない。
function readerEditorialTitle(title,night){
 if(night>=29&&!chapter3IsNight(night)&&title==='今日も、午前2時'){
  const theme=regularTheme(night)?.[0];
  return theme||title;
 }
 return title;
}
function autoDJNoise(value){return (automaticStyleHash(`${s.night}:${value}`)%10000)/10000}
function autoDJLetterMood(l){return stationAutoMood({subject:l.subject,body:l.body})}
function autoDJPickLetters(ids){
 const pool=ids.map(id=>letter(id)).filter(Boolean),picked=[];
 // 節目の放送は紹介内容からも記念日を実感できるよう、投稿が届いていれば必ず一通採用する。
 // 専用投稿がゼロなら通常便りを選び、存在しない手紙は生成しない。
 const milestone=milestoneAt(s.night);
 if(milestone){
  const celebrations=pool.filter(l=>l.programSpecial&&l.themeId===milestone);
  if(celebrations.length){
   celebrations.sort((a,b)=>autoDJNoise(`milestone:${b.id}`)-autoDJNoise(`milestone:${a.id}`));
   // 長期節目の放送では、記念投稿が十分に届いたら2通を紹介する。
   // 50夜の既存の選出を保持し、残り1枠はいつもの暮らしの声にも開いておく。
   const minimum=milestone==='anniversary'?1:Math.min(2,celebrations.length);
   picked.push(...celebrations.slice(0,minimum).map(l=>l.id));
  }
 }
 const prior=s.played||[];
 // v4.9.12: 読書用DJが特定の常連ばかり紹介し続けないよう、
 // 直近の登場数と通算の登場数から控えめな補正を加える。
 // 章の専用便箋・記念放送の優先、本文の雰囲気、既読の抑制は従来どおり。
 const recentWindow=prior.filter(p=>p.night>=s.night-27&&p.night<s.night);
 const recentTally=Object.create(null),overallTally=Object.create(null);
 for(const p of recentWindow)if(p.who)recentTally[p.who]=(recentTally[p.who]||0)+1;
 for(const p of prior)if(p.who)overallTally[p.who]=(overallTally[p.who]||0)+1;
 const typicalRecent=recentWindow.length/12,typicalOverall=prior.length/12;
 while(picked.length<Math.min(3,pool.length)){
  const ranked=pool.filter(l=>!picked.includes(l.id)).map(l=>{
   const recent=prior.filter(p=>p.who===l.who);
   const last=recent.at(-1);
   const timeGap=last?s.night-last.night:20;
   const continuity=last&&timeGap<=42?1.65:0;
   const gapBonus=Math.min(1.45,timeGap/15);
   const repeatInNight=picked.some(id=>letter(id)?.who===l.who)?-5:0;
   const mood=autoDJLetterMood(l);
   const selectedMoods=picked.map(id=>autoDJLetterMood(letter(id)));
   let sameTone=selectedMoods.some(x=>(x.heavy>=2)===(mood.heavy>=2)&&(x.playful>=1.5)===(mood.playful>=1.5));
   const varied=selectedMoods.length&&!sameTone?1.1:0;
   const topicMatch=selectedMoods.some(x=>x.reflective>=1.5&&mood.reflective>=1.5)?0.35:0;
   const special=l.special?1.0:0;
   const newStory=l.kind==='laterlife4914'?1.25:0;
   const connection=['crossTalk4830','crossAfter4831'].includes(l.kind)?2.4:0;
   // 同じ題材でも本文が変われば別の近況。まったく同じ手紙の短期再紹介だけ抑える。
   const identical=prior.slice().reverse().find(p=>p.who===l.who&&p.subject===l.subject&&p.body===l.body);
   const exactGap=identical?s.night-identical.night:Infinity;
   const seenExact=exactGap<=10?-5.5:exactGap<=30?-3.5:exactGap<=80?-1.5:prior.some(p=>p.id===l.id)?-.9:0;
   // 均等割り当てではなく順位に軽く影響させるだけ。候補にない人は選ばない。
   const recentBalance=Math.max(-1.4,Math.min(2.0,(typicalRecent-(recentTally[l.who]||0))*.045));
   const longBalance=Math.max(-.5,Math.min(.8,(typicalOverall-(overallTally[l.who]||0))*.007));
   const score=2.0+continuity+gapBonus+varied+topicMatch+special+newStory+connection+repeatInNight+seenExact+recentBalance+longBalance+autoDJNoise(`letter:${l.id}`)*1.65;
   return {id:l.id,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  if(!ranked.length)break;
  picked.push(ranked[0].id);
 }
 // v4.8.46: 一夜の三通の配置を調整する。採用する手紙や物語の発生条件は変えず、
 // 深刻な近況から軽い冗談へ（またはその逆へ）直結する場合だけ順番を見直す。
 return autoDJOrderNightLetters(picked);
}
// 物語の最初の章や特別放送には固有の演出があるため、通常放送のみに限定。
// 書き手の選択は変えず、実際に届いた題名・本文の雰囲気だけを使う。
function autoDJOrderNightLetters(ids){
 if(activeProfile!=='reader'||s.night<65||ids.length!==3||specialActive(s.night)||milestoneAt(s.night))return ids;
 const letters=ids.map(id=>letter(id));
 if(letters.some(l=>!l||l.programSpecial))return ids;
 const moods=letters.map(l=>autoDJLetterMood(l));
 const heavy=m=>m.heavy>=2.2;
 const playful=m=>m.playful>=1.55&&m.heavy<1.2;
 const contrast=(a,b)=>(heavy(a)&&playful(b))||(playful(a)&&heavy(b));
 const before=Number(contrast(moods[0],moods[1]))+Number(contrast(moods[1],moods[2]));
 if(!before)return ids;
 // 最初の選出順をできるだけ尊重。3通なので全6通りを比較できる。
 // 直接的な温度差の解消が最優先で、同点なら移動の少ない配置にする。
 const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 const ranked=orders.map(order=>({order,
  transitions:Number(contrast(moods[order[0]],moods[order[1]]))+Number(contrast(moods[order[1]],moods[order[2]])),
  moves:order.filter((index,pos)=>index!==pos).length,
  // 深刻な話が最後になる並び替えは、同じ効果なら避ける。
  endingHeavy:Number(heavy(moods[order[2]])&&!heavy(moods[2]))
 })).sort((a,b)=>a.transitions-b.transitions||a.endingHeavy-b.endingHeavy||a.moves-b.moves||a.order.join('').localeCompare(b.order.join('')));
 if(ranked[0].transitions>=before)return ids;
 return ranked[0].order.map(i=>ids[i]);
}
function autoDJOptionTag(title,response){
 const words=String(title||'')+' '+String(response||'');
 if(/冗談|笑い話|茶化し|ふざけ/.test(words))return 'humor';
 if(/おめでとう|祝福|嬉しいですね|うれしいですね/.test(words))return 'celebrate';
 if(/無理に|急がなく|安心|寄り添|受け止め|休んで|休む|気持ちを聞/.test(words))return 'empathy';
 if(/振り返|思い返|考えてみ|気づ|気付|整理/.test(words))return 'reflection';
 if(/問い|聞いて|どうして|どんな|なぜ|教えて/.test(words))return 'curiosity';
 if(/自分で|選んで|始めて|一歩|試して/.test(words))return 'agency';
 return 'space';
}
// v4.8.3: 自動DJと「相手」との距離感。舞台裏の人格値は参照せず、
// この放送で実際に紹介した手紙と口にした返答だけを記憶する。
// 人物ごとの傾向は小さな加点にとどめ、今夜の文脈を最優先する。
const AUTO_DJ_LISTENER_TONES={
 cat:['reflection','agency'],driver:['curiosity','humor'],clock:['reflection','space'],
 bread:['celebrate','curiosity'],moon:['curiosity','humor'],fish:['empathy','agency'],
 sugar:['humor','agency'],anon:['space','empathy'],terminal:['reflection','space'],
 umbrella:['agency','curiosity'],triangle:['curiosity','reflection'],fridge:['empathy','agency']
};
function autoDJTone(tag){
 const t=String(tag||'');
 if(['past','followup','reflection','reflective'].includes(t))return 'reflection';
 if(['question','curiosity'].includes(t))return 'curiosity';
 if(['celebration','celebrate'].includes(t))return 'celebrate';
 if(['comfort','caution','empathy'].includes(t))return 'empathy';
 if(t==='humor'||t==='agency'||t==='space')return t;
 return 'space';
}
function autoDJContactHistory(l){
 const all=(s.played||[]).filter(p=>p.who===l.who);
 const saved=s.reader?.dj?.replyTones?.[l.who]||[];
 const recent=all.slice(-8).map(p=>{
  const exact=saved.findLast(x=>x.night===p.night&&(x.id?x.id===p.id:(x.subject===p.subject&&x.response===p.response)));
  return {night:p.night,subject:p.subject,tone:exact?.tone||autoDJTone(autoDJOptionTag('',p.response))};
 });
 return {count:all.length,recent,lastNight:all.length?all[all.length-1].night:null};
}
function autoDJRelationshipScore(l,title,response,tag){
 const tone=autoDJTone(tag),h=autoDJContactHistory(l);
 const last=h.recent.slice(-3),same=last.filter(x=>x.tone===tone).length;
 const voice=AUTO_DJ_LISTENER_TONES[l.who]||[];
 const mood=autoDJLetterMood(l);
 // 相手の「キャラクターらしさ」よりも、今夜の実際の話題を優先する。
 const suitable=tone==='humor'?(mood.playful>=1.0&&mood.heavy<1.5):
  tone==='celebrate'?(mood.bright>=.65):true;
 let value=voice.includes(tone)&&suitable?(h.count>=4?.75:.38):0;
 // 初めてのお便りには、必要以上に親しげな前提を置かない。
 if(h.count===0){
  if(['space','curiosity','empathy'].includes(tone))value+=.3;
  if(/(?:前にも|この前(?:の放送)?|前にお便りを|いつもお便りを|以前の放送で)/.test(String(response||''))
    &&!/(?:前|以前|あれから|また|続き|先日|この前)/.test(String(l.body||'')))value-=3.0;
 }else{
  const callback=/(?:前|以前|あれから|また|続き|その後|この前|先日|覚えて)/.test(String(l.subject||'')+' '+String(l.body||''));
  // 交流を重ねた相手でも「親密さ」を強制せず、過去の続きに目を向けやすくする。
  const familiarity=Math.min(1,h.count/7);
  if(['reflection','curiosity'].includes(tone))value+=.4*familiarity+(callback?.52:0);
  if(h.lastNight!==null&&s.night-h.lastNight>=20&&['space','curiosity'].includes(tone))value+=.25;
  // 同じリスナーにだけ毎回同じ返し方をしない。深刻な相談では文脈側の加点が勝つ。
  value-=same===3?1.65:same===2?1.05:same===1?.25:0;
 }
 return value;
}
function autoDJRememberReply(l,title,response,tag){
 const dj=s.reader?.dj;if(!dj)return;
 dj.replyTones||={};dj.replyTones[l.who]||=[];
 const list=dj.replyTones[l.who];
 list.push({night:s.night,id:l.id,tone:autoDJTone(tag)});
 if(list.length>12)list.splice(0,list.length-12);
}
// v4.8.4: 読書モードの返答は、今夜の手紙に書かれた行動を優先する。
// 件名・本文のうち実際に届いた文章だけで判定する。人物の職業や未公開の内部状態から
// 「作った」「書き直した」などの出来事を推測してはいけない。
// これはLLMによる意味解析ではなく、事実を断定する言い回しを慎重に扱う限定的な規則。
function autoDJFactualFit(l,response){
 const source=String(l.subject||'')+'\n'+String(l.body||'');
 const text=String(response||'');
 let penalty=0;
 const has=(re)=>re.test(source);
 // v4.8.37: 企画名だけで絵を描いた・家族に言葉を伝えた等と決めつけない。
 if(/絵を描く時間が.{0,35}戻って|描けたものだけではなく/.test(text)&&
    !has(/(?:絵|描[いかきくけこ]|スケッチ|画材|鉛筆で絵)/))penalty+=24;
 if(/家族に伝える言葉ほど/.test(text)&&
    !has(/(?:家族|親|父|母|妹|弟|兄|姉|妻|夫|息子|娘|祖父|祖母)/))penalty+=24;
 // 食べたり買ったりしただけのパンを、作り手の試作・焼成の話に変えない。
 const baking=/(?:焼い|焼く|焼け|焼き上|作っ|作った|作り|試作|仕込|配合|発酵|オーブン|生地|材料|新作のパン|パン作り|パン.{0,25}試す|新しいパンを試す)/;
 if(/(?:パンができるまで|パンを作る|パンを焼|そのパンは.{0,15}(?:味|形)|パンの(?:味|形)|焼き直|試作品|新作の(?:味|形))/.test(text)&&!has(baking))penalty+=12;
 // 売り場の札や値札を書いた話に、焼いたパンの感想を持ち込まない。
 if(/(?:値札|売り場の札|札を書|札の言葉|札を直)/.test(source)&&
    /(?:そのパンは.{0,18}(?:味|形)|どんな(?:味|形)|作るまで|試作|焼き上がり)/.test(text)&&!has(baking))penalty+=9;
 // 絵を描くことと本を読むことは別の行動。題材に「先生」がいても本の話とは限らない。
 const books=/(?:本を|本の|本屋|絵本|読書|図書|文庫|読み終|読みかけ|読み返|読んだ|読んで|ページ|本棚|しおり)/;
 if(/(?:本の話|本を(?:読|開)|読書|本のページ|本から始まった|本の中)/.test(text)&&!has(books))penalty+=12;
 // v4.8.11: 本・図書室が本文にないのに、読書を前提として語る返答は不可。
 // 「本当」は本の話ではない。特別放送の企画名だけで題材を決めつけない。
 if(/(?:その本|面白い本|本や図書室|本(?:を|の|から|について|で|に|と)|読書|図書(?:室|館)|文庫|本棚|本屋|本のページ|本の中)/.test(text)&&!has(books))penalty+=24;
 // v4.8.46: 昨日話したと書いた手紙を、今日会話したと受け取らない。
 // 本文が今日の会話にも明示的に触れているときは除外しない。
 if(/(?:昨日|一昨日|先日|この前|先週).{0,50}(?:話し|会話し|言葉を交わ)/.test(source)
   && !/(?:今日|今朝|今夜).{0,32}(?:話し|会話し|言葉を交わ)/.test(source)
   && /(?:今日は|今日も|今夜は).{0,28}(?:話し|会話|言葉を交わ)/.test(text))penalty+=24;
 // 返信を考えたり連絡を受けただけでは、文章を書き直したことにはならない。
 const edits=/(?:書き直|書き換|書き足|下書き|推敲|消し|消さ|削っ|残した(?:言葉|文|一文)|書きかけ|書き残|書いた(?:言葉|文)|文面を直|文章を直|書いては|何度も書)/;
 if(/(?:書き直|書き換|書き足|消さなかった|残した(?:言葉|文|一文)|書き残|下書き|文章を直|言葉を選び直|書きかけ|文面を直)/.test(text)&&!has(edits))penalty+=12;
 // 描いていない絵を完成させた扱いにしない。
 if(/(?:描いた(?:絵|もの)|描き終|描き直|絵が完成)/.test(text)&&
    !has(/(?:描い|描き|描く|書いた絵|絵を描|絵が完成)/))penalty+=9;
 // 「下書きをした」と「書き直した」、「読んだ」と「返事を書いた」は異なる。
 if(/(?:書き直しても|書き換えても)/.test(text)&&!has(/(?:書き直|書き換|推敲|何度も書|半分くらい消|書き足|文章を直)/))penalty+=12;
 if(/(?:消さなかった|残した(?:言葉|文|一文))/.test(text)&&!has(/(?:消さず|消さな|残し|残した|残った|そこだけは|消えなかった)/))penalty+=10;
 // 何かを確認しただけで、仕事のやり方を「変えてみた」ことにはしない。
 if(/(?:仕事の進め方を変え|やり方を変えて|働き方を変えて|試せたことがあった)/.test(text)&&
    !has(/(?:変え|変わ|違うやり方|試し|試せ|新しい方法|工夫|改善|やり方を見直)/))penalty+=11;
 // 休んだと断定したり、達成したと祝ったりするには、本文に根拠が必要。
 if(/(?:休んでいるあいだ|休めたあと|休んだことで)/.test(text)&&!has(/(?:休ん|休め|眠っ|寝た|休息|仮眠|ひと息|一息)/))penalty+=10;
 if(/(?:いちばん「やった」|達成した瞬間|その成功を)/.test(text)&&
    !has(/(?:できた|やれた|達成|成功|完成|売れ|終わっ|間に合|嬉し|うれし)/))penalty+=9;
 if(/(?:昔のことを思い出した日|そのころのこと|思い出を無理に整理)/.test(text)&&
    !has(/(?:昔|以前|懐かし|思い出|思い返|振り返|あのころ|そのころ)/))penalty+=8;
 if(/(?:休んだ日を|休みの日を|休むことで)/.test(text)&&
    !has(/(?:休ん|休め|休み|眠っ|寝た|休息|仮眠|ひと息|一息)/))penalty+=10;
 // 今夜の手紙にない具体的な出来事を「前に話した」かのように扱うのを抑える。
 // 過去の放送への明示的な参照は別途関係性スコアで評価する。
 return penalty;
}
// 事実に合う候補がない場合だけ使う、読書モード限定の控えめな返答。
// 返答候補や本編のシナリオ本文を変更しない。
function autoDJNeutralReply(l){
 const source=String(l.subject||'')+'\n'+String(l.body||'');
 if(/(?:議長も議事録係|満場一致のはず)/.test(source))return ['ひとり会議の報告を楽しむ','議長も議事録係も同じ人だと、議事録を閉じるタイミングが難しそうですね。','humor'];
 if(/(?:売り場の札|値札|札を書)/.test(source))return ['伝える言葉を受け止める','売り場に置く言葉のことも、聞かせてくれてありがとうございます。','empathy'];
 if(/(?:妹|家族)/.test(source)&&/(?:返事|連絡|返信)/.test(source))return ['返信する時間を受け止める','返事をするまでにも、人それぞれの時間がありますね。','space'];
 if(/(?:絵を描|絵を描く|描いた|描く時間)/.test(source))return ['絵の時間を受け止める','描く時間のことを聞かせてくれて、ありがとうございます。','empathy'];
 if(/(?:パンを買|パンを選)/.test(source))return ['選んだ時間を受け止める','どのパンにしようか選ぶのも、小さな楽しみですよね。','empathy'];
 const subject=String(l.subject||'').trim();
 const title=subject&&subject.length<=28?`「${subject}」のお便り`:'今夜のお便り';
 return ['今夜の言葉を受け止める',`${title}、聞かせてくれてありがとうございます。続きがあれば、また聞かせてください。`,'empathy'];
}
// v4.8.5: 手紙を「解釈しすぎない」ための読書用チェック。
// 選択済み／公開済みのおたよりだけから判断し、リスナーの非公開値を参照しない。
const AUTO_DJ_CONCRETE_TOPICS=[
 ['猫主任',/(?:猫主任|主任の猫|猫の主任|例の猫|主任)/,/(?:猫主任|主任の猫|主任|その猫)/],
 ['プリン',/プリン/,/プリン/],['パン',/(?:パン|くるみと蜂蜜|小麦|生地|焼き上が)/,/(?:パン|くるみ|蜂蜜|生地|焼き上が)/],
 ['時計',/(?:時計|針|ねじ|修理)/,/(?:時計|針|ねじ|修理)/],
 ['絵',/(?:絵を|絵の|描[いかきくけこ]|スケッチ|鉛筆|絵の具)/,/(?:絵を|絵の|描[いかきくけこ]|スケッチ|鉛筆|絵の具)/],
 ['本',/(?:本を|本の|読書|図書|文庫|読んだ|ページ|本棚)/,/(?:本を|本の|読書|図書|文庫|読んだ|ページ|本棚)/],
 ['駅',/(?:駅|電車|終点|切符|時刻表|ホーム)/,/(?:駅|電車|終点|切符|時刻表|ホーム)/],
 ['コーヒー',/(?:コーヒー|砂糖|マグカップ)/,/(?:コーヒー|砂糖|マグカップ)/],
 ['冷蔵庫',/(?:冷蔵庫|野菜室|食材)/,/(?:冷蔵庫|野菜室|食材)/],
 ['花',/(?:花|鉢植え|花屋|水やり)/,/(?:花|鉢植え|花屋|水やり)/],
 ['家族',/(?:妹|弟|父|母|家族|奥様|妻|息子|娘|兄|姉)/,/(?:妹|弟|父|母|家族|奥様|妻|息子|娘|兄|姉)/],
 ['友人',/(?:友人|友達|同僚|仲間|相手|関係|連絡)/,/(?:友人|友達|同僚|仲間|相手|関係|連絡)/],
 ['手紙',/(?:手紙|お便り|返信|返事|メッセージ|書い|下書き|言葉)/,/(?:手紙|お便り|返信|返事|メッセージ|書き直|書き足)/]
];
function autoDJNoAnswerRequested(l){
 // 「返事がまだない」「返事を待つ」は依頼ではない。断りの言葉に限る。
 return /(?:返事|返信|お返事|答え|質問への答え).{0,9}(?:いりません|いらない|不要です|求めていません|なくても(?:大丈夫|いい))/.test(String(l.body||''));
}
function autoDJAsksQuestion(text){
 return /[？?]|(?:どんな|何を|何が|何か|いつ|誰が|どこ|なぜ|どう|いかが).{0,34}(?:ですか|ますか|ましたか|でしょうか|いいですか)|(?:教えてください|聞かせてください|問いかけ)/.test(String(text||''));
}
function autoDJSpecificityFit(l,response){
 const source=String(l.subject||'')+'\n'+String(l.body||'');
 const text=String(response||'');
 let score=0;
 for(const [name,fromLetter,inReply] of AUTO_DJ_CONCRETE_TOPICS){
  // 「本」は「本当」などと誤認しない、主題を言及した返答だけ適度に優先。
  if(fromLetter.test(source)&&inReply.test(text))score+=name==='手紙'?.22:1.05;
 }
 // 今夜、人間関係について書かれていないのに関係論を語る汎用文を抑える。
 if(/(?:誰かとの関係|人との距離|会えなかったこと|相手への気持ち)/.test(text)&&
    !/(?:友達|友人|家族|妹|弟|母|父|妻|夫|恋人|同僚|相手|誰か|会う|会えな|関係|連絡|返信|言い争)/.test(source))score-=9;
 // 「するつもり」を既に成し遂げたかのように言わない（前の絵の経験は尊重）。
 if(/(?:これから|今度|明日|いつか|もう一度|また).{0,28}(?:描こ|描く|描きた|描いてみ|描けたら)/.test(source)&&
    !/(?:実際に描い|描いてみた|描き終え|絵を描きました|描いた絵|描き上げ)/.test(source)&&
    /(?:その絵を描いた時間|その絵を描き始めた|描いたものが|描き終えた)/.test(text))score-=12;
 // 予定している絵と、すでに描き終えた絵を混同しない。
 if(/(?:これから|今度|明日|いつか|もう一度|また).{0,38}(?:描こ|描く|描きた|描いてみ|描けたら)/.test(source)&&
    !/(?:この絵を描いた|その絵を描き終えた|完成した絵|描き上げた|絵を描きました)/.test(source)&&
    /(?:その絵は.{0,15}描いた|その絵を描いた|その絵は.{0,15}描いたもの|その絵を描き始めた)/.test(text))score-=15;
 // 完了していない決断を「決めた後」と扱わない。具体的な相談には残せる。
 if(/(?:決めたあと|昨日の選択|選んだあと|選んできたこと)/.test(text)&&
    !/(?:決めた|決めて|選んだ|選んで|決断|選択|決まり|決め直|あのときの言葉)/.test(source))score-=10;
 // 休息や食事を実際に話していないのに「休めた時間」を事実として持ち込まない。
 if(/(?:今日食べたものや休めた時間|休めた時間もあなたの暮らし)/.test(text)&&
    !/(?:食べ|食事|ご飯|夕飯|朝食|昼食|休め|休ん|仮眠|寝た|眠っ)/.test(source))score-=9;
 // 返信を望まない声は、まず受け取る。返答そのものを無言にするわけではない。
 if(autoDJNoAnswerRequested(l)){
  if(autoDJAsksQuestion(text))score-=15;
  if(/(?:ありがとう|受け取り|聴いて|聞いて|大切に|置いて|そのまま)/.test(text))score+=1.7;
 }
 return Math.max(-18,Math.min(4.0,score));
}
function autoDJRepeatSaturation(response,l){
 // 既存の第1〜28夜の分岐と返答選択はそのまま維持する。
 if(s.night<29){
  const historical=(s.played||[]).filter(p=>p.response===String(response||''));
  const recent=historical.filter(p=>s.night-p.night<=35);
  const personal=historical.filter(p=>p.who===l.who);
  return Math.min(3.1,Math.max(0,historical.length-6)*.16+Math.max(0,recent.length-2)*.38+
   Math.max(0,personal.length-2)*.24);
 }
 // v4.8.37: 長期プレイで同じ返答が埋め尽くさないよう、数百夜の履歴も見る。
 // 返答自体は書き換えず、事実確認済みの既存候補間だけで優先順位を変える。
 const text=String(response||'');
 let total=0,recent=0,personal=0,lastNight=-1;
 for(const p of s.played||[]){
  if(p.response!==text)continue;
  total++;
  if(s.night-p.night<=90)recent++;
  if(p.who===l.who)personal++;
  lastNight=Math.max(lastNight,p.night);
 }
 if(!total)return 0;
 const gap=lastNight<0?999:s.night-lastNight;
 return Math.min(9.5,
  Math.max(0,total-1)*.42+Math.max(0,recent-1)*.58+
  Math.max(0,personal-1)*.45+(gap<=10?2.1:gap<=30?1.2:gap<=70?.55:0));
}
// v4.8.11: 「今夜、何が心に残りましたか」のような質問の役割を見る。
// 話題が違っても実質的に同じ問いが並ぶときだけ、多様性を小さく優先する。
// 返答の事実整合性・返信不要の尊重は従来の足切り処理を先に通す。
function autoDJQuestionRole(response){
 const t=String(response||'');
 // 一般の質問判定で漏れやすい「何でしたか」「どの場面だったのでしょう」も拾う。
 const question=autoDJAsksQuestion(t)||/(?:何|どの|どんな|いちばん|一番).{0,36}(?:でしたか|でしょう|ですか|ますか)|(?:でしょうか|ませんか)/.test(t);
 if(!question)return '';
 if(/(?:どんな話|どんな言葉|どんな場面|何が|何を|いちばん|一番).{0,24}(?:印象|心に残|残っ|覚え|思い出)|(?:印象|心に残|覚え).{0,25}(?:何|どんな)/.test(t))return 'recollection';
 if(/(?:どんな|何を|なぜ|どうして|どこ|いつ|誰が|どちら|どう).{0,40}(?:でしょう|ですか|ますか|ましたか)/.test(t))return 'question';
 return 'question';
}
function autoDJNightVarietyScore(response){
 if(activeProfile!=='reader')return 0;
 const prior=(s.played||[]).filter(p=>p.night===s.night).slice(-2);
 if(!prior.length)return 0;
 if(prior.some(p=>p.response===String(response||'')))return -12;
 const role=autoDJQuestionRole(response);
 if(!role)return 0;
 const previous=prior.map(p=>autoDJQuestionRole(p.response));
 // 内容のある具体的な質問までまとめて禁止しない。
 if(role==='recollection'&&previous.includes('recollection'))return -4.1;
 if(previous.filter(Boolean).length>=2)return -2.2;
 if(previous.some(Boolean))return -.9;
 return 0;
}
function autoDJRankChoices(l,choices){
 // v4.8.37: 新作108通の3候補すべてを題材に即した原稿へ改稿。
 // どの候補も選ばれうるようにし、事実整合性・返信不要判定を先に通す。
 const ranked=choices.map((o,i)=>({i,score:autoDJReplyScore(l,o[0],o[1],o[2],i)+
  (o[3]==='grounded'?1.65:0)+(l.kind==='everyday47'&&i<3?(i<2?1.65:1.45):0),penalty:autoDJFactualFit(l,o[1])}));
 const safe=ranked.filter(x=>x.penalty===0&&(!autoDJNoAnswerRequested(l)||!autoDJAsksQuestion(choices[x.i][1])));
 if(safe.length)return safe.sort((a,b)=>b.score-a.score||a.i-b.i);
 return [{i:-1,score:0,penalty:0}];
}
function autoDJSpecialCoherence(l,parts,indices){
 const chosen=parts.map((p,i)=>p.options[indices[i]]);
 const texts=chosen.map(o=>String(o[1]||''));
 let score=0;
 const together=texts.join('\n\n');
 // 特別返答は各文を単独で採点せず、三文を通して矛盾・話題ずれを確認する。
 // 汎用的な美辞麗句だけの組み合わせより、根拠ある具体性を一つ以上含むものを優先。
 score+=Math.min(2,Math.max(0,autoDJSpecificityFit(l,together))*.5);
 if(texts.filter(t=>/[？?]|教えてください|どんな.*でしょう/.test(t)).length>=2)score-=2.6;
 if(texts.filter(t=>/(?:今すぐ|急いで|まずは)/.test(t)).length>=2)score-=.8;
 for(let i=1;i<texts.length;i++){
  if(texts[i]===texts[i-1])score-=4;
  if(/(?:決めなくても|無理に決め)/.test(texts[i-1])&&/(?:決めるべき|すぐ決めて)/.test(texts[i]))score-=8;
 }
 return score;
}
function autoDJSelectSpecialParts(l,parts){
 // 3段階 × 各4択なら64通り。全組合せを見て、前後が自然な原稿を選ぶ。
 // 選択番号は原作の分岐ロジックに渡すため、選択肢そのものは書き換えない。
 let best=null;
 const walk=(indices,score)=>{
  if(indices.length===parts.length){
   const total=score+autoDJSpecialCoherence(l,parts,indices);
   if(!best||total>best.score)best={indices:indices.slice(),score:total};
   return;
  }
  const k=indices.length;
  // 原文にない行動を断定する候補は、得点が高くても選ばない。
  // ただしすべてが検証に引っかかる場合は既存の選択方式を保ち、放送停止を防ぐ。
  const safe=parts[k].options.map((o,j)=>j).filter(j=>autoDJFactualFit(l,parts[k].options[j][1])===0);
  for(const j of (safe.length?safe:parts[k].options.map((o,j)=>j))){
   const o=parts[k].options[j],text=String(o[1]||'');
   const tag=autoDJOptionTag(o[0],text);
   const value=autoDJReplyScore(l,o[0],text,tag,k*17+j);
   walk([...indices,j],score+value-(autoDJNoAnswerRequested(l)&&autoDJAsksQuestion(text)?40:0)-(k>0&&j===indices[k-1]?.25:0));
  }
 };
 walk([],0);
 return best?.indices||parts.map(()=>0);
}
// v4.8.45: 話の「時点」と「感情」を手紙に書かれた事実に合わせる。
// 読書モードの自動DJに限り、断定的な汎用返答の採点を下げる。
// 特別放送の企画名だけから「喜んでいる」「いま雨が降っている」とは推測しない。
function autoDJConversationalFit(l,response){
 if(activeProfile!=='reader')return 0;
 const source=String(l.subject||'')+'\n'+String(l.body||'');
 const body=String(l.body||''),text=String(response||'');
 let score=0;
 const realJoy=/(?:うれし|嬉し|喜び|喜ん|楽しかっ|楽しい|幸せ|ほっとし|やった|おめでとう|達成(?:できた|した)|成功(?:した|できた))/.test(body);
 // 「明日の予定」「小さな迷い」は、それだけでは喜びの報告ではない。
 if(/(?:その嬉しさ|その喜び|その成功|お祝いしましょう|よく頑張りました)/.test(text)&&!realJoy)score-=30;
 // 雨の記憶・「雨の日は」という一般論を、今夜の天候と断定しない。
 const currentRain=/(?:今夜|いま|今|今日|現在|さっき).{0,17}(?:雨(?:が|は|の音)|降っ|降り)|(?:雨(?:が|は)).{0,12}(?:降ってい|降り続|降り出)/.test(body);
 if(/(?:今夜の雨|いま降っている雨|今日の雨は)/.test(text)&&!currentRain)score-=30;
 // 昨日の会話は、今日実際に起きた会話ではない。空欄質問より文脈に即した返答へ。
 if(/(?:昨日|先日|この前).{0,65}(?:話し|話しまし|会話し|声をかけ)/.test(body)
    && !/(?:今日は|今日、|今夜は|今夜、).{0,28}(?:話し|会話し|話しまし)/.test(body)
    && /(?:今日はどんな話が印象に残りましたか|今日の出来事で、いちばん心に残ったのは何でしたか)/.test(text))score-=7;
 // 語りの流れを変えてしまう「全部もう解決した」型の受け取りを避ける。
 if(/(?:まだ|迷っ|わからな|決めていない|決まっていない)/.test(body)
    && /(?:もう迷いはない|これで解決しました|きっと正解だった)/.test(text))score-=12;
 return score;
}
// 三段階の返答は全文一致を使って履歴照合できないため、段落単位で再登場を数える。
// 他の候補が存在する時にだけ順位を変え、手動放送の返答候補には影響させない。
function autoDJSpecialPartRepeatPenalty(l,response){
 if(activeProfile!=='reader'||s.night<29)return 0;
 const text=String(response||'').trim();
 if(!text)return 0;
 let total=0,recent=0,lastNight=-999,personal=0;
 for(const p of s.played||[]){
  if(typeof p.response!=='string'||!p.response.includes('\n\n')||!p.response.includes(text))continue;
  if(!p.response.split(/\n\s*\n/).some(part=>part.trim()===text))continue;
  total++;
  if(s.night-p.night<=60)recent++;
  if(p.who===l.who&&s.night-p.night<=120)personal++;
  lastNight=p.night;
 }
 return total?Math.min(6.5,total*.23+recent*.52+personal*.43+(s.night-lastNight<=14?1.6:0)):0;
}
// 主題のある一文に具体的に返す。本文と完全に照合できた場面だけで候補を増やす。
// 初期章の固定分岐、特別返答の選択肢、手動放送の選択肢は変更しない。
const AUTO_DJ_MOMENT_REPLY_4845=[
 [/重力が違うと、汁物は難しそう/, [['月面の食堂を思う','月の食堂では、まずお椀をどう置くかから会議になりそうですね。','humor'],['汁物の行方を考える','重力から献立を考えるなんて、地上の料理番組ではなかなか聴けない話です。','curiosity']]],
 [/仕事を離れても鼻だけは残業/, [['鼻の残業をねぎらう','仕事を終えても鼻だけは残業中。パン屋さんならではの勤務表ですね。','humor'],['帰り道の匂いを思う','焼き上がりの匂いを帰り道でも見つける、その鼻はなかなか休めませんね。','reflection']]],
 [/明日は自分が食べたいものを先に決めてみます/, [['自分の献立を尊重する','明日の一皿を自分で選ぶ。小さく見えても、あなたが決めることですね。','agency'],['先に決める楽しみ','自分の食べたいものを先に考える明日、どんな献立になるでしょう。','curiosity']]],
 [/花の名前より、人の顔を覚えるほうが難しい/, [['花屋の覚え方を楽しむ','花の名前は覚えられても人の顔は難しい、というのが花屋さんらしい悩みですね。','empathy'],['会話の景色を思う','花の色とお客さんの顔が並ぶ、店先の賑やかさが少し見えました。','reflection']]],
 [/明日は、自分の皿に何をのせるか先に考えてみます/, [['料理人の明日の皿を思う','誰かの献立ではなく、自分の皿の話を聴けるのがいいですね。','empathy'],['残業より難しい一皿','自分の夕飯を決めることが、残業より難しい課題になりませんように。','humor']]],
 [/カップの中には時計がないのに不思議/, [['カップの時計を探す','カップに時計はないのに、飲む時間で味が変わる。ちょっと不思議な話ですね。','reflection'],['時間の入らないカップ','もしカップに時計がついたら、砂糖を入れる順番まで管理されそうですね。','humor']]],
 [/雨の音がして、窓を開けるか迷いました/, [['開けなかった窓のそばで','窓を開けずに雨の音を聴いている時間も、その夜の過ごし方なんですね。','space'],['窓の向こうの雨を思う','窓を開けるか迷った、そのひとときまで伝えてくれてありがとうございます。','empathy']]],
 [/木曜日でない日にも、時計を見る癖は残っています/, [['木曜日以外の時間を聴く','木曜日ではない日にも時刻表を見てしまう。その習慣も今の暮らしの一部ですね。','reflection'],['残った習慣を尊重する','急に変えなくてもいいと思える習慣の話として、静かに受け取りました。','space']]],
 [/主任には言葉がなくても、報告した気分になります/, [['主任への無言の報告','猫主任への無言の業務報告、どうやらきちんと届いている気がしますね。','humor'],['無言の休憩を思う','話さずに同じ場所にいたことも、ちゃんと今夜の報告になりましたね。','reflection']]],
 [/食べ終えた皿に残る色が、思いがけずきれい/, [['皿に残った色の話','食べ終えたお皿の色に目がとまるところが、あなたらしい発見ですね。','reflection'],['食卓の色を想像する','味ではなく色が心に残ったという話、なんだか絵を見ているようです。','curiosity']]],
 [/長く生きても、人と話すのは毎回少し違/, [['いつもの挨拶の違い','長く交わしてきた挨拶でも、毎回少し違って聞こえるんですね。','reflection'],['短い会話を受け取る','ほんの短い挨拶も、その日の大切な出来事なんだと思いました。','empathy']]]
];
function autoDJMomentChoices(l){
 if(activeProfile!=='reader'||s.night<29||l.special)return [];
 const match=AUTO_DJ_MOMENT_REPLY_4845.find(([test])=>test.test(String(l.body||'')));
 return match?match[1].map(row=>[...row,'grounded']):[];
}
function autoDJReplyScore(l,title,response,tag,offset=0){
 const mood=autoDJLetterMood(l),text=String(response||''),past=s.reader?.dj?.tags||[];
 const last=past.slice(-5).filter(x=>x===tag).length;
 let score=3;
 if(['empathy','space','caution'].includes(tag))score+=mood.heavy>1.4?2.4:0.5;
 if(['reflection','past','followup','question','curiosity'].includes(tag))score+=mood.reflective>1.0?1.8:.75;
 if(['agency'].includes(tag))score+=mood.heavy<2.2?1.0:.2;
 if(['celebrate'].includes(tag))score+=mood.bright>1.2?2.8:-2.0;
 if(tag==='humor')score+=mood.heavy>1.7?-7.0:(mood.playful>1.0?2.2:0.1);
 if(mood.heavy>=2.3&&/(?:笑ってしまい|冗談|笑い飛ば)/.test(text))score-=4;
 if(mood.bright>=1.5&&/(?:おめでとう|良かった|よかった|嬉しい)/.test(text))score+=1.1;
 if(mood.heavy>2&&/(?:焦ら|急が|無理|少しずつ|聞かせて|休)/.test(text))score+=.7;
 if(/(?:どうして|なぜ)[、？?]/.test(text)&&mood.heavy>2.3)score-=.8;
 // 具体的な事実を言い切る返答は、手紙に根拠がある場合だけ優先する。
 const evidence=String(l.subject||'')+'\n'+String(l.body||'');
 if(/(?:猫主任|猫)/.test(evidence)&&/(?:その人と|相手と).{0,20}(?:言葉を交わ|話した)/.test(text)&&!/(?:友達|友人|家族|兄|姉|店員).{0,16}(?:話|会話|言葉)/.test(evidence))score-=6;
 if(/(?:昨日|先週|このあいだ|前の日)/.test(evidence)&&!/(?:今日は|今日、|今朝)/.test(evidence)&&/(?:今日はいつもどおり|今日は.{0,20}言葉を交わした)/.test(text))score-=4;

 // v4.8.37: 数百夜の読書で同じ返答が頻発しないよう、文面の近接再利用を控える。
 // 内容に合わない言葉を増やすのではなく、事実整合性で合格した選択肢だけを並べ替える。
 const exact=s.played.slice().reverse().find(p=>p.response===text);
 if(exact){
  const gap=s.night-exact.night;
  score-=gap<=3?7:gap<=7?5.5:gap<=14?4.5:gap<=30?3.4:gap<=65?2.2:gap<=110?1.2:0;
  if(exact.who===l.who&&gap<=35)score-=1.5;
 }
 return score-autoDJFactualFit(l,text)+autoDJSpecificityFit(l,text)+autoDJGenericContextScore(l,text)+autoDJConversationalFit(l,text)-autoDJSpecialPartRepeatPenalty(l,text)-autoDJRepeatSaturation(text,l)+autoDJRelationshipScore(l,title,text,tag)+autoDJNightVarietyScore(text)-Math.min(1.8,last*.5)+autoDJNoise(`${l.id}:reply:${offset}:${tag}:${title}`)*1.4;
}
// v4.8.11: 後半の読書モードに、本人の実際の話題だけから選べる返答を追加。
// 通常プレイの選択肢数は増やさず、別DJの声の細かな違いを作る。
// 一段落目の定型挨拶は判定に使わない（例：猫主任の名前だけで猫の話と決めない）。
const AUTO_DJ_LATE_PERSONAL_486={
 cat:[[/絵|描|スケッチ|鉛筆|画用紙/,[['机の時間を大切に','その紙に向かうかどうかを、自分で決められる時間があるのはいいですね。','space'],['絵の続きを楽しみに','まだ形になっていない話も、こうして聞かせてくれてうれしいです。','empathy']]]],
 driver:[[/猫主任|駐車場の猫|例の猫/,[['主任の採点を待つ','主任からの評価は厳しそうですが、こちらでは今夜の報告を歓迎しています。','humor'],['仕事の合間を受け取る','配送の合間に出会った小さな話を聞けて、こちらも少し楽しくなりました。','empathy']]]],
 fish:[[/日記|ノート|書き|文章|言葉/,[['言葉になる前を大切に','ノートの上だけに置いておきたい言葉も、あるのかもしれませんね。','space'],['自分の言葉を受け取る','今夜のあなたが選んだ言葉として、大切に聞きたいです。','empathy']]]],
 clock:[[/時計|ねじ|針/,[['止まる針の話を聴く','時計の話を聞くと、針の音だけではない時間まで感じられます。','reflection'],['いまの時間を聞く','時計にまつわる話の中にも、いまのあなたの暮らしが見えてくるんですね。','reflection']]],[/図書室|子ども|しおり/,[['図書室の景色を思う','図書室で交わされる小さな言葉も、誰かには一日の出来事ですね。','reflection'],['本棚の向こうを想像する','本だけではなく、そこへ来た人の話も聞けるのがいいですね。','empathy']]]],
 terminal:[[/駅|切符|時刻表|ホーム/,[['駅の外に目を向ける','ホームで過ごす時間の外にも、ちゃんと一日が続いているんですよね。','reflection'],['行き先を急かさない','どこへ向かうか決めない日にも、駅はそこにあってくれますね。','space']]]],
 bread:[[/パン|小麦|生地|売り場|店長/,[['厨房の話を楽しむ','厨房の話を聞くと、目に見えない段取りまで想像してしまいます。','curiosity'],['パン屋の報告書に笑う','深夜にこの話を聞いた責任は、明日の朝ごはんで取ることになりそうです。','humor']]]],
 moon:[[/月|宇宙|議事録|会議/,[['月面の公式見解を想像','月面の委員会が聞いたら、きっと議論が長引くでしょうね。','humor'],['空想の続きを待つ','この世界の決まりごとを、もう少し聞きたくなってしまいます。','curiosity']]],[/プリン|冷蔵庫/,[['冷蔵庫の警備を心配する','今夜の報告で、冷蔵庫の警備体制が少し気になってきました。','humor'],['身近な空想を歓迎する','冷蔵庫ひとつでこんな物語になるのが、あなたのお便りの面白さですね。','empathy']]]],
 sugar:[[/コーヒー|砂糖|カップ/,[['一杯の違いを楽しむ','同じカップでも、話すことが違えば少し違う夜になりますね。','reflection'],['コーヒーの採点は保留','甘さの採点はご本人にお任せして、私は今夜のお便りを楽しみます。','humor']]]],
 anon:[[/廊下|隣|挨拶|扉|部屋|メモ/,[['小さな報告を歓迎する','こんなささやかな声が届くのも、この時間のよさだと思います。','empathy'],['届いた言葉を大切に','書いてみようと思ったこと自体を、まず受け取りたいです。','space']]]],
 umbrella:[[/花|鉢|店先|花束/,[['花屋の時間を受け取る','花のことを話す言葉にも、忙しい日の呼吸が少し残るのでしょうね。','empathy'],['花の色を思い浮かべる','店先の色を想像しながら、今夜のお便りを聞いています。','reflection']]]],
 triangle:[[/ノート|地図|線|定規|図/,[['ノートの余白を楽しむ','ノートの端から話が広がっていくのが、なんだかいいですね。','empathy'],['答えを増やす','答えがまだ一つにならない時間も、立派な観察期間かもしれません。','reflection']]]],
 fridge:[[/料理|夕食|ご飯|食材|厨房|皿/,[['自分の食卓を尊重する','誰かのための献立とは別に、自分の食卓の話ができるのもいいですね。','empathy'],['料理人の休憩を考える','仕事のレシピにない時間の使い方も、あっていいと思います。','space']]]]
};
function autoDJLatePersonalChoices(l){
 if(s.night<90||!l.regular||['culture','variety','radio-memory','long-echo','daily-thread','relation-thread','surprise46','broadcast','special_echo'].includes(l.kind))return [];
 const paragraphs=String(l.body||'').split(/\n\s*\n/);
 const evidence=(paragraphs.length>1?paragraphs.slice(1).join('\n'):paragraphs.join('\n'))+'\n'+String(l.subject||'');
 const groups=AUTO_DJ_LATE_PERSONAL_486[l.who]||[];
 const match=groups.find(([pattern])=>pattern.test(evidence));
 return match?match[1].map(x=>x.slice()):[];
}
// v4.8.11: 「誰かから教わったこと」は企画テーマだけで「本」の返答を選ばない。
// 本文に現れた題材だけを用い、同じ企画でも人によって違う返答を選べるようにする。
// 読書用の自動DJだけに適用。通常の手動返答と既存の放送履歴は変更しない。
const AUTO_DJ_TAUGHT_DETAILS=[
 [/(?:花の水|花は毎日|水を替|水やり)/,[
  ['花の手入れを思う','花の水を替える、その小さな仕事にも、誰かから受け取った知恵が残っているんですね。','reflection'],
  ['忘れそうな日を受け止める','忙しいほど忘れそうになるというところも、暮らしの正直な話ですね。','empathy']]],
 [/(?:三角定規|角度|違う角度|同じ線)/,[
  ['角度の違いを楽しむ','同じ線も見る角度で違ってくるという話、ラジオにも似合いますね。','curiosity'],
  ['教わった発見を喜ぶ','教わった使い方が、そのままあなたの好きな見方にもなっているんですね。','empathy']]],
 [/(?:猫主任|昼寝の場所|車の陰|猫から学)/,[
  ['主任の休息指導に乗る','猫主任の授業は、どうやら休憩場所の選び方から始まるようですね。','humor'],
  ['休む場所を思う','風を避けられる場所を探すことも、立派な暮らしの知恵ですね。','reflection']]],
 [/(?:生地を休|パンのほうが休|生地も休)/,[
  ['生地の休憩を思う','生地にも休む時間が必要だという教え、忙しい人間にも届いてほしいですね。','empathy'],
  ['パンのほうが上手に休む','パンに休憩の予定表を作ってもらうのも、悪くないかもしれません。','humor']]],
 [/(?:火を止め|休ませる鍋|料理は火)/,[
  ['火を止めた後を思う','火を止めたあとにも料理が変わるという話、時間の使い方を考えさせられますね。','reflection'],
  ['休むことを急かさない','料理と人間を比べてみたくなる気持ち、今夜はそのまま聞いていたいです。','empathy']]],
 [/(?:ねじを外|小さなねじ|話す速度|教えることも練習)/,[
  ['教える速さを受け止める','ねじを外す手つきだけでなく、伝える速さも考えた一日だったんですね。','empathy'],
  ['教える側の発見を喜ぶ','教えるつもりが自分も練習になる、その気づきがいいですね。','reflection']]],
 [/(?:ノートの端|ノートの余白|空白を残|あとから思いついた)/,[
  ['余白の役目に目を向ける','あとから書き足せる余白、ノートにも暮らしにも残しておきたいですね。','reflection'],
  ['自分の言葉を歓迎する','教わった余白に、自分の言葉を書いているという話がうれしいです。','empathy']]],
 [/(?:鉛筆|消す前|絵の先生)/,[
  ['消す前の時間を思う','消す前に一度眺める。そのひと呼吸が、いまも残っているんですね。','reflection'],
  ['昔の教えを受け取る','絵の先生の言葉が、仕事の文章を見直す時間にもつながっているんですね。','empathy']]],
 [/(?:駅員|終電|普通の案内)/,[
  ['駅員の言葉を思う','何でもない終電の案内が、長く記憶に残ることもあるんですね。','reflection'],
  ['小さな記憶を喜ぶ','教訓というほどではない言葉を、今夜聞かせてくれたことがうれしいです。','empathy']]],
 [/(?:月は毎日|月の読み方|先生はそんな使い方|違って見える)/,[
  ['月の観察を楽しむ','教わった月の見方を、あなた流に楽しんでいるんですね。','curiosity'],
  ['先生の想像を超える','先生も、月の形をそんなふうに楽しんでもらえるとは思わなかったかもしれませんね。','humor']]],
 [/(?:お湯の温度|コーヒーの淹れ|ひと手間だけ)/,[
  ['温度のひと手間を思う','コーヒーを淹れる前のひと手間が、いまも習慣に残っているんですね。','reflection'],
  ['砂糖の話を楽しむ','お湯の温度は教わっても、砂糖の量はご自身の流儀なんですね。','humor']]],
 [/(?:相手が黙|静かな時間を|話を終わらせなく|以前ラジオで)/,[
  ['静かな時間を受け取る','相手が黙っている時間にも、急がないでいられるようになったんですね。','empathy'],
  ['昔の放送の余韻を思う','誰の言葉だったか忘れても、残っているものがあるんですね。','reflection']]]
];
function autoDJTaughtChoices(l){
 if(!l.programSpecial||l.themeId!=='story_taught'||l.special)return null;
 const evidence=String(l.subject||'')+'\n'+String(l.body||'');
 const match=AUTO_DJ_TAUGHT_DETAILS.find(([re])=>re.test(evidence));
 const detailed=match?match[1].map(row=>[...row,'grounded']):[];
 const general=[
  ['教わったことを受け止める','誰かから受け取った小さな知恵が、今の暮らしの中にも残っているんですね。','empathy'],
  ['今の自分の使い方を思う','教わったことを、そのままではなく自分なりに使っているのが面白いですね。','reflection'],
  ['日常の続きを願う','そんな小さな発見を、またいつか聞かせてもらえたらうれしいです。','space'],
  ['気づきを大切にする','教わったときとは別の場面で、ふと思い出すこともあるのでしょうね。','reflection']
 ];
 return [...detailed,...general];
}
// v4.8.11: 何度も同じ汎用返答になりやすい「他のリスナーの放送を聴いた」便り。
// 本文に実在する名前・件名・日常の行動だけを使って、DJ専用の返答候補を補う。
// ラジオ局がまだ紹介していない手紙を知っているかのように語らないため、
// 「昨日、...のお便りを放送で聴きました」という明示的な記述がある時のみ使用する。
function autoDJHeardLetterChoices(l){
 if(l.special)return [];
 const body=String(l.body||'');
 const found=body.match(/昨日、([^\n「」]{1,28})さんの「([^「」\n]{1,48})」というお便りを放送で聴きました/);
 if(!found)return [];
 const sender=found[1].trim(),subject=found[2].trim();
 if(!sender||!subject)return [];
 const options=[
  ['昨日の言葉を一緒に受け取る',`${sender}さんの「${subject}」のお便りが、あなたの夜にも届いていたんですね。`,'empathy','grounded'],
  ['声が巡ることを思う',`「${subject}」というお便りを聴いた人から、こうしてまた別の声が届く。それもラジオの面白さですね。`,'reflection','grounded'],
  ['一通がつながる時間を思う',`「${subject}」という一通が、別の一通につながったんですね。こうして聴けるのがうれしいです。`,'empathy','grounded'],
  ['ひとつの題名の余韻を受け止める',`昨日の「${subject}」の話を、今夜あなたの言葉でも聞くことができました。`,'reflection','grounded'],
  ['誰かの夜の続きを大切に',`${sender}さんの話を聴いたあとの、あなた自身の夜について教えてくれてありがとうございます。`,'empathy','grounded'],
  ['声が向こう岸へ届くのを思う',`「${subject}」が放送のあとにも誰かの心に残る。そんなことがあるのが、深夜ラジオの面白いところですね。`,'curiosity','grounded'],
  ['聴き手からの手紙を歓迎する',`「${subject}」を聴いていた時間まで、今夜のお便りから少し見えた気がします。`,'reflection','grounded'],
  ['ふたつの声を受け止める',`${sender}さんの声に続いて、今夜はあなたの声も届きました。どちらも大切な一通です。`,'empathy','grounded']
 ];
 if(/(?:返事はいりません|返事は不要|返信はいりません|お返事は不要)/.test(body)){
  options.push(['返事のいらない言葉を受け取る','返事はいらない、と書いてくれた言葉を、今夜はそのまま受け取ります。ありがとうございます。','space','grounded']);
 }
 if(/降りる駅まで/.test(body)){
  options.push(['帰り道の余韻を受け取る','降りる駅まで、ひとつのお便りが心に残っていたんですね。','reflection','grounded']);
 }
 if(/(?:お茶を淹れ|茶を淹れ)/.test(body)){
  options.push(['お茶の時間に寄り添う','お茶を淹れた時間にも、昨日聴いた声が残っていたんですね。','reflection','grounded']);
 }
 if(/コーヒーを淹れ/.test(body)){
  options.push(['コーヒーの時間に寄り添う','コーヒーを淹れた時間にも、昨日聴いた声が残っていたんですね。','reflection','grounded']);
 }
 if(/(?:本を閉じたあと|本を閉じてから)/.test(body)){
  options.push(['本を閉じたあとの声を思う','本を閉じたあとにも、ラジオで聴いた声を思い返していたんですね。','reflection','grounded']);
 }
 if(/(?:荷物を積んだまま|配送の途中で|運転中も)/.test(body)){
  options.push(['仕事のあいだの余韻を思う','仕事のあいだにも、別の誰かの夜のことを考えた時間があったんですね。','reflection','grounded']);
 }
 return options;
}
// v4.8.11: 何気ない会話や一日の小さな行動に、手紙で確認できた事実で返す。
// 発言しなかった・会釈しただけ・話して笑った、をひとまとめにしない。
// 企画放送・特別返答は対象外。本編の返答候補を変更せず、読書DJだけに渡す。
function autoDJEverydayChoices(l){
 if(!l.regular||l.special||l.programSpecial)return [];
 const body=String(l.body||'');
 const rows=[];
 const add=(title,text,tag)=>rows.push([title,text,tag,'grounded']);
 const line=body.match(/(?:昨日|その日|今日)、([^。\n]{1,35}?)と話しました/);
 const silent=!line&&/(?:会釈(?:だけ|を交わ)|挨拶(?:だけ|を交わ)|声はかけ(?:ません|なかった)|話(?:は|を)?(?:しません|さなかった)|それ以上は話(?:さず|しません)|すれ違いました)/.test(body);
 // 話さなかった日を「会話できた日」に書き換えない。
 if(silent){
  if(/会釈/.test(body)&&!/会釈(?:しな|できな)/.test(body)){
   add('会釈の距離を受け取る','会釈だけで終わったことも、今夜のお便りにはちゃんと残っていますね。','space');
   add('短い合図を大切に','言葉を交わさない日にも、相手に気づいた小さな瞬間はありますね。','reflection');
  }else if(/挨拶/.test(body)){
   add('短い挨拶の余韻','挨拶を交わした、その短い時間のことを聞かせてくれてありがとうございます。','empathy');
  }else if(/見かけ|すれ違/.test(body)){
   add('声をかけなかった道','声をかけなかったことも含めて、その日の景色だったんですね。','space');
  }
 }
 if(line){
  const person=line[1].trim();
  // 受け取った本文の呼び名だけを使い、相手の気持ちは推測しない。
  if(/(?:返事を考えているあいだ|言葉が途中|言い残|言えなかった|別の言い方|気まず)/.test(body)){
   add('言葉にならなかった部分','話し終えたあとに残る言葉もありますね。今夜は、その続きまで聞かせてもらえた気がします。','empathy');
   add('返事を急がせない','その場で言えたことと、あとから考えたこと。どちらもその日の会話なんですね。','reflection');
  }else if(/(?:笑って思い出|少し笑|笑ってしま|口元がゆる)/.test(body)){
   add('帰り道の笑いを受け取る','話したあとで思い出して笑えるような時間があったんですね。','empathy');
   if(l.who==='moon'&&/委員会|議事録|交流実験/.test(body))add('月面の記録に乗る','その報告が月面の議事録に載ったら、ずいぶんにぎやかになりそうですね。','humor');
  }else if(l.who==='moon'&&/(?:なぞなぞ|委員会|交流実験)/.test(body)){
   add('地球での報告を楽しむ','地球での何でもない会話まで月面の報告になるところが、なんだか楽しいです。','humor');
  }else if(/(?:特別な話じゃ|特別な話では|いつもどおり|短いやり取り|もう一度考え)/.test(body)){
   add('何でもない話を聴く','大きな出来事ではなかった、と書いてくれたところまで含めて受け取りたいです。','space');
   add('会話のあとに残ったもの','話の内容だけでなく、話し終えたあとの時間も心に残ることがありますね。','reflection');
  }
  if(/帰りの車で一人になってから/.test(body)){
   add('帰りの車に残った会話','一人になった車の中でも、さっきの会話が少し続いていたんですね。','reflection');
  }
  if(/(?:話し終えてから|話し終わってから).{0,25}(?:顔が少し違|見え方が変)/.test(body)){
   add('話したあとの見え方','話し終えたあと、同じ人が少し違って見えたという話が心に残ります。','reflection');
  }
  if(/自分の言葉を聞いてもらえた気が/.test(body)){
   add('聞いてもらえた感覚を尊重','聞いてもらえた気がした、という手応えをそのまま大切にしたいです。','empathy');
  }
  if(/(?:同じ質問に答える人がいる|同じ質問でも)/.test(body)){
   add('同じ質問を楽しむ','同じ質問に違う答えを持つ人がいる、という発見が面白いですね。','curiosity');
  }
  if(/面と向かうと案外言えない/.test(body)){
   add('面と向かう難しさを受け止める','頭の中では言えることも、顔を合わせると違ってくるんですね。','empathy');
  }
 }
 if(/(?:友人|友達|家族|妹|兄|姉|同僚|仲間|お客さん)/.test(body)){
  if(/(?:看板の話|看板を|看板の絵)/.test(body))add('看板の話題を楽しむ','看板の話だけで一緒に歩く時間が少し変わるのも、面白いですね。','curiosity');
  if(/(?:一緒に|二人で).{0,16}(?:歩|帰)/.test(body))add('並んで歩いた時間','一緒に歩いた道のことまで、お便りから少し見えてきます。','reflection');
 }
 // 行動を明示している生成日常便りにのみ、確定した具体的な事実への反応を足す。
 if(['daily','new-life'].includes(l.kind)){
  if(/(?:日記|メモ|ノート).{0,18}一行書/.test(body)){
   add('一行の時間を受け取る','一行だけ書いてみたという話を、今夜はそのまま大切に聴きたいです。','empathy');
  }else if(/(?:日記|メモ|ノート).{0,18}書き足/.test(body)){
   add('書き足した時間を受け取る','あとから書き足した言葉がある、という今日の報告もいいですね。','reflection');
  }
  if(l.who==='fridge'&&/(?:家の冷蔵庫|冷蔵庫にあるもの).{0,22}(?:料理|作った)/.test(body)){
   add('家の食卓の話を聴く','仕事の料理とは違う、家の冷蔵庫から始まる一皿だったんですね。','reflection');
  }
  if(/(?:昔の時計店|商店街|散歩道).{0,35}(?:歩い|眺め)/.test(body)){
   add('歩いた道を受け取る','歩いて見た道の景色まで、今夜のお便りから少し伝わってきます。','space');
  }
 }
 return rows;
}
// 手紙に根拠のないテーマへの質問を、単なるバリエーション目的で増やさない。
// 機能の対象は「聴くだけの夜」専用。元の返答候補と手動放送は変更しない。
function autoDJGenericContextScore(l,response){
 const src=String(l.subject||'')+'\n'+String(l.body||'');
 const text=String(response||'');
 let score=0;
 // 本人が明確に返答を求めていない場合は、すでにある質問回避規則を優先する。
 // 長期的な頻出文は、具体的な題材を拾える候補がある時だけ小さく不利にする。
 if(/^(?:昨日の放送の、どんな言葉が|会ったことのない人の言葉が|同じ放送が、別々の場所に|何かを始めなくても、聴いていた時間は|何かを変えなくても、聴いてくれていた時間が)/.test(text)&&
    /昨日、[^\n「」]{1,28}さんの「[^「」\n]{1,48}」というお便りを放送で聴きました/.test(src))score-=.8;
 return score;
}
function autoDJReply(l){
 if(l.special){
  const parts=partsForLetter(l),indices=autoDJSelectSpecialParts(l,parts);
  s.replyParts=indices;s.replyStep=2;
  const body=parts.map((p,i)=>p.options[indices[i]][1]).join('\n\n');
  for(let k=0;k<parts.length;k++)s.reader.dj.tags.push(autoDJOptionTag(parts[k].options[indices[k]][0],parts[k].options[indices[k]][1]));
  autoDJRememberReply(l,'特別返答',body,autoDJOptionTag('',body));
  return {tag:'special',response:body};
 }
 const choices=l.chapter4?(l.choices||[]):(l.programSpecial&&(WHIMSICAL_SPECIAL_CHOICES[l.themeId]||MILESTONE_SPECIAL_CHOICES[l.themeId]))?(l.choices||[]):
   autoDJTaughtChoices(l)||[...(l.choices||[]),...autoDJMomentChoices(l),...autoDJLatePersonalChoices(l),...autoDJHeardLetterChoices(l),...autoDJEverydayChoices(l)];
 const ranked=autoDJRankChoices(l,choices);
 let c=ranked[0]?.i===-1?autoDJNeutralReply(l):choices[ranked[0]?.i??0];
 // 同じ夜の別の手紙に全文一致の返答を繰り返さない。
 // 根拠のある別候補がない場合だけ、事実を付け足さない控えめな返答にする。
 const already=(text)=>(s.played||[]).some(p=>p.night===s.night&&p.response===text);
 if(c&&already(c[1])){
  const alt=ranked.find(row=>row.i>=0&&!already(choices[row.i][1]));
  c=alt?choices[alt.i]:autoDJNeutralReply(l);
 }
 if(!c)throw Error('返答候補がありません: '+l.id);
 s.reader.dj.tags.push(c[2]);autoDJRememberReply(l,c[0],c[1],c[2]);return {tag:c[2],response:c[1]};
}
function autoDJMaybePlan(){
 milestoneEnsure(s.night);
 if(s.night<29||!s.special||['announced','ready'].includes(s.special.planned?.status)||specialActive(s.night))return;
 const options=specialAvailable(s.night);if(!options.length)return;
 if(s.night-s.reader.dj.lastPlanNight<17)return;
 const story=options.find(id=>id.startsWith('story_'));
 // v4.8.37: 物語から生まれた企画を基本にしつつ、ときどき空想の投稿企画も開く。
 // 50夜記念を優先し、すでに開催済みの新企画を短期間で繰り返さない。
 const whimsical=['midnight_lab','unnamed_moments','objects_reply'].filter(id=>options.includes(id));
 const heldWhimsical=(s.special.history||[]).filter(h=>whimsical.includes(h.themeId)).length;
 const whimsySlot=s.night>=70&&whimsical.length>0&&heldWhimsical<3&&
     (s.special.history||[]).length>=3&&(s.special.history||[]).length%3===1;
 if(story||whimsySlot||s.night%13===4){
  const chosen=whimsySlot?whimsical[heldWhimsical]:story||options[automaticStyleHash(`special:${s.night}`)%options.length];
  specialPlan(chosen);s.reader.dj.lastPlanNight=s.night;
 }
}
// v4.8.14: 読書モード専用の「DJのひとこと」。
// 本編のオープニング・幕間・締めの選択肢を変更せず、一夜に多くても一度だけ声を添える。
// 既に紹介した手紙だけを参照し、生活や交流の新たな事実を作らない。
const READER_DJ_VOICE={
 opening:[
  {text:'手紙を三通、机の端に並べました。今夜も、一通ずつ。',tone:'gentle'},
  {text:'原稿の隅をそろえていたら、もうこんな時間です。小さな準備ほど、時間を忘れますね。',tone:'light'},
  {text:'マイクの前に座ると、封筒を開ける音まで大事にしたくなります。',tone:'gentle'},
  {text:'今夜はいつもより少しゆっくり読んでみます。時計の針には内緒で。',tone:'light'},
  {text:'言葉を急いで選ぶより、まず手紙を開いてみることにします。',tone:'gentle'},
  {text:'まだ起きている誰かに届くように、声の高さを少しだけ整えました。',tone:'gentle'},
  // v4.8.20: 少し迷ったり、楽しんだりするDJの小さな仕草。新しい人生の事実は作らない。
  {text:'最初の封筒に手を伸ばして、一度戻しました。急がなくてもいい夜ですね。',tone:'gentle',facet:'hesitant'},
  {text:'原稿の順番を考えていたら、どれも最初に読みたくなりました。困りましたね。',tone:'light',facet:'wry'},
  {text:'あいさつを噛まないことより、ちゃんと聴くことを今夜の目標にします。',tone:'light',facet:'wry'},
  {text:'机の上に小さな空白を残しておきます。まだ知らない話が届く場所です。',tone:'gentle',facet:'curious'},
  {text:'机の上には三つの違う一日があります。さて、最初の一通です。',tone:'gentle'},
  {text:'ペンを持ったまま挨拶しそうになりました。いったん置いて、始めましょう。',tone:'light'},
  {text:'いつも通りの午前二時ですが、同じ手紙が届く夜はありません。',tone:'gentle'},
  {text:'返事を考える前に、最後の行まできちんと読みたいと思います。',tone:'gentle'}
 ],
 bridge:[
  {text:'最後の一行を、もう一度だけ目で追いました。',tone:'gentle'},
  {text:'いまの言葉は、少し机の上に残しておきましょう。',tone:'gentle'},
  {text:'封筒を伏せて、ペンを持ち直します。',tone:'gentle'},
  {text:'返事を終えたあとにも、考えたくなることがありますね。',tone:'gentle'},
  {text:'手紙を一通読み終えるたび、今夜が少しずつ違う形になります。',tone:'gentle'},
  {text:'うまく言葉にできないところは、いまは静かなままにしておきます。',tone:'gentle'},
  {text:'誰かの小さな出来事が、こちらの一日にも少し残ることがあります。',tone:'gentle'},
  {text:'思わず相づちを打ちました。マイクの向こうには見えないんですけれど。',tone:'light',facet:'wry'},
  {text:'何か言おうとして、ペン先だけが動きました。こういう間も放送なのでしょうか。',tone:'gentle',facet:'hesitant'},
  {text:'ひとつ前の言葉をまだ考えています。次の手紙も、ちゃんと読みます。',tone:'gentle',facet:'hesitant'},
  {text:'ここで一度、深呼吸……と口に出しかけて、やめました。静かに次の一通です。',tone:'light',facet:'wry'},
  {text:'会わなかった日の話も、あとから静かに残ることがあるんですね。',tone:'gentle',facet:'observant',pattern:/会わなかった|会えなかった/},
  {text:'「一行だけ」という言葉に、つい目が止まりました。',tone:'gentle',facet:'observant',pattern:/一行だけ|一行書い|一行にした/},
  {text:'描く前の時間にも、その人にしかわからない長さがあるのでしょうね。',tone:'gentle',facet:'curious',pattern:/まだ描け|描こうと|描き始める前|これから絵/},
  {text:'パンの話を聞くと、スタジオにトースターが欲しくなります。',tone:'playful',facet:'wry',pattern:/パン/},
  {text:'猫主任の査定基準は、今夜も非公開のままのようです。',tone:'playful',pattern:/猫主任|主任.{0,9}猫|猫.{0,9}主任/},
  {text:'プリンのお話、真夜中に聴くには少しお腹のすく話題ですね。',tone:'playful',pattern:/プリン/},
  {text:'パンの話のあとは、深夜の空腹が少し困ります。',tone:'playful',pattern:/パン/},
  {text:'時計の話を聞くと、ついスタジオの時計まで見てしまいます。',tone:'light',pattern:/時計/},
  {text:'月の秘密は、考え始めると話が尽きませんね。',tone:'playful',pattern:/月.{0,12}(?:秘密|裏側)|秘密.{0,12}月/}
 ],
 ending:[
  {text:'三通の手紙が並ぶと、同じ夜にもいろいろな速さがあるとわかります。',tone:'gentle'},
  {text:'うまく返せたかどうかは、マイクを切ってからも考えることにします。',tone:'gentle'},
  {text:'ひとつの答えにまとめられない夜があっても、いいですね。',tone:'gentle'},
  {text:'今日も、聞いたことの続きを自分の中に少し残して帰ります。',tone:'gentle'},
  {text:'三通とも、違う場所で過ごされた一日でした。今夜はそこが好きです。',tone:'gentle'},
  {text:'誰かの話を聴いたあと、すぐ次のことを考えられない夜もあります。',tone:'gentle'},
  {text:'手紙を閉じる音が、今日は少しゆっくり聞こえた気がします。',tone:'gentle'},
  {text:'放送を終えるときは、いつもほんの少しだけ名残惜しいものです。',tone:'gentle'},
  {text:'今日もわからないことは残りました。無理に答えにしないまま、おやすみなさい。',tone:'gentle'},
  {text:'ささやかなことほど、誰かに話してみると形が見えてきますね。',tone:'gentle'},
  {text:'三通とも聴き終えました。最初に言おうとした挨拶は、もう少し違う言葉だった気がします。',tone:'gentle',facet:'hesitant'},
  {text:'答えが見つかる前に、「へえ」と声に出していた気がします。',tone:'light',facet:'curious'},
  {text:'うまく言えたかは怪しいところですが、今夜ちゃんと聴けたことは覚えておきます。',tone:'gentle',facet:'hesitant'},
  {text:'今夜も、知らなかった一日が三つ増えました。おやすみなさい。',tone:'gentle',facet:'curious'},
  {text:'マイクを切ると、つい次の手紙のことを考えます。これは職業病かもしれません。',tone:'light',facet:'wry'},
  {text:'猫主任の夜勤が終わるのは、いったい何時なのでしょう。',tone:'playful',pattern:/猫主任|主任.{0,9}猫|猫.{0,9}主任/},
  {text:'今夜のプリンのお話、いろいろな展開があるものですね。',tone:'playful',pattern:/プリン/},
  {text:'パンの話を聞いた夜に、お腹が空かない方法があれば知りたいですね。',tone:'light',pattern:/パン/},
  {text:'時計の話が届く夜は、時間を忘れるわけにもいきませんね。',tone:'light',pattern:/時計/}
 ]
};
// v4.8.14: 「DJのひとこと」が5夜周期で機械的に現れることを避ける。
// 物語用の乱数とセーブ本文を触らず、今夜の紹介済み手紙と演出履歴だけで決める。
function readerDJVoiceValue(page){
 const v=page?.djVoice;
 return v?.opening||v?.ending||(Array.isArray(v?.interludes)?v.interludes.find(Boolean):'')||'';
}
// v4.8.14: あいさつの定型文は「今夜のおたよりの主題」とは別に扱う。
// たとえば配達員の猫主任、月の裏側のプリン、古時計の時計の音。
// ここにしかない題材を根拠に、DJが唐突な冗談を差し込まない。
function readerDJVoiceTopicText(item){
 const subject=String(item?.subject||'');
 let body=String(item?.body||'');
 body=body.replace(/^こんばんは。猫主任からの評価は、今日も保留です。[\t ]*(?:\n+|$)/,'');
 body=body.replace(/^こんばんは。冷蔵庫のプリンは、まだ無事です。[\t ]*(?:\n+|$)/,'');
 body=body.replace(/^こんばんは。今夜は時計の音がよく聞こえます。[\t ]*(?:\n+|$)/,'');
 // ラジオで聴いた別の送り主の名前だけを、パンや時計の話題と誤認しない。
 const distinctNames=/眠れないパン屋さん|古時計さん|月の裏側さん/g;
 return subject.replace(distinctNames,'')+'\n'+body.replace(distinctNames,'');
}
// v4.9.15: 読書モードの放送文だけに小さな言い換えを用意する。
// 元の選択肢の意味・感情を維持し、通常モードの文面や選出には触れない。
// 未紹介の出来事・未来の出来事を勝手に示唆しない独立した短文のみ。
const READER_RADIO_PHRASING_4915={
 opening:[
  [
   'こんばんは。今夜も、眠れない人のそばにこの声が届けばうれしいです。',
   '午前二時。まだ灯りを消せない人にも、静かに寄り添えたらと思います。',
   'こんばんは。眠れない夜なら、少しのあいだ一緒に過ごしましょう。',
   '今夜の声が、どこかで起きている誰かの小さなおともになりますように。'
  ],[
   '今日という一日を過ごした皆さん、お疲れさまでした。ここでは急がずに。',
   'こんばんは。お疲れの夜にも、ひと息つける時間をお届けします。',
   'ここまで一日を過ごしてきた皆さんへ。肩の力を少し抜いて、お便りを。',
   'こんな時間まで頑張った方も、休みながら聴く方も。今夜はゆっくりどうぞ。'
  ],[
   '午前二時になりました。皆さんのいる場所では、どんな夜が続いているでしょう。',
   'まだ起きている皆さん、こんばんは。今夜の気分はどんな色でしょうか。',
   '時計は午前二時を指しています。さて、どんな声が届いているでしょう。',
   'ここから始まる一時間。今夜はどんな話と出会えるでしょうね。'
  ],[
   '午前二時です。眠れないことを急いで片づけずに、手紙を開いていきましょう。',
   '夜がまだ続く方へ。ここでは、眠くなるまで慌てずにお付き合いください。',
   '午前二時。寝つけない夜にも、誰かの手紙を聴いて過ごす時間があります。',
   '無理に夜を終わらせなくてもいい時間です。一通目から始めますね。'
  ],[
   'こんばんは。帰り道の方にも、部屋で休んでいる方にも、午前二時の声を。',
   '外を移動している人も、家で灯りをつけている人も。どうぞご一緒に。',
   '帰り道でも、いつもの部屋でも。今夜の放送をそっと始めましょう。',
   '今夜も、いろいろな場所で聴いている皆さんへ。まずは最初のお便りです。'
  ],[
   '窓の外には静かな道。それでも、今夜もどこかで誰かが起きています。',
   '明かりのついた窓が、街にはまだあります。ここにも一通目の手紙が届きました。',
   '街が寝静まったように見えても、夜の話はまだ終わりません。',
   '遠くの街灯を見ながら、今夜はどんな声に会えるだろうと考えています。'
  ]
 ],
 bridge:[
  [
   '一通目をそっと重ねて、別の封筒に手を伸ばします。',
   'ひとつの話を大切にしまって、次の便箋を開きましょう。',
   '今の手紙を閉じます。続いては、また別の人の今日です。',
   '机に新しい封筒を置きました。もう一通、読んでいきます。'
  ],[
   'ここで少しだけ、静かな時間を置きましょう。……次のお便りです。',
   '今の言葉を急いで流さずに。しばらくして、次の封筒を開きます。',
   '少しの沈黙を挟みます。……さて、続きを聴いていきましょう。',
   '言葉が途切れたまま、時計が少し進みます。次の手紙へ。'
  ],[
   '聴いている皆さんは、今どんな場所にいるでしょう。もう一通、読んでみます。',
   'ラジオの向こうの景色を想像しながら、次の封筒を開きます。',
   'それぞれ違う夜を過ごしている皆さんへ。次のお便りです。',
   'この声がどこへ届くのか、想像することがあります。続けましょう。'
  ],[
   '机の上では、次の封筒が出番を待っています。順番に開けましょう。',
   '封筒はまだあります。急かされてはいませんが、そろそろ次の一通を。',
   '机の端で控えていたお便りにも、そろそろマイクの前へ来てもらいます。',
   '手紙の順番を間違えないように。次の封筒に移りましょう。'
  ]
 ],
 closing:[
  [
   'ここまでのお付き合い、ありがとうございました。明日の午前二時も、ここで。',
   '今夜の放送はここまで。また次の午前二時に、お会いしましょう。',
   '聴いてくださった皆さん、ありがとうございます。次の夜も同じ周波数で。',
   '今夜もお便りを届けられました。また明日の午前二時、ここからお送りします。'
  ],[
   '眠りにつく人にも、まだ起きている人にも、穏やかな時間がありますように。',
   'これから眠る方も、もう少し起きている方も。どうぞ静かな夜を。',
   '夜の続きが、皆さんにとって少しでも落ち着いたものになりますように。',
   'どうか、それぞれの場所で無理のない夜を。今夜はここまでです。'
  ],[
   '決めきれないことも、この夜の中に置いておきましょう。また聞かせてください。',
   '答えを急がずに閉じておく手紙があってもいいですね。また次の夜に。',
   '今夜すぐ答えの出ない話にも、続きの時間があります。では、おやすみなさい。',
   '何もひとつにまとめなくていい夜でした。お話の続きは、またいつか。'
  ],[
   '帰り道をゆく皆さん、どうぞお気をつけて。今夜もありがとうございました。',
   '夜道を歩く方は、足元に気をつけて。それぞれの場所へ、どうぞご無事に。',
   '街の明かりが、まだ誰かの帰りを照らしています。今夜はこのへんで。',
   'これから帰る方も、家で休む方も。どうかよい夜の続きを。'
  ],[
   'そろそろ終了です。机のコーヒーまで夜更かしさせてしまいました。',
   '今夜はここまで。冷めたコーヒーには、少し申し訳ない気もします。',
   '番組は終わりです。コーヒーカップにも、そろそろ仕事を終えてもらいましょう。',
   '締めのご挨拶です。机の上のコーヒーも、お疲れさまでした。'
  ],[
   '今夜の手紙はここまでです。まだ届いていない声にも、また会えるでしょうか。',
   '今日の便箋を閉じます。また新しい手紙が届く夜を楽しみにしています。',
   '次の夜には、どんな声が届くでしょう。今夜もありがとうございました。',
   'ここに届いた言葉も、これから届く言葉も。次の放送でお待ちしています。'
  ]
 ]
};
// 既に保存した原稿は書き換えない。過去の読書記録に現れた表現も
// 重複回避の参考にし、読書本文だけに変化を加える。世界の乱数は消費しない。
function readerRadioPhrase4915(kind,index,slot=0){
 const standard=kind==='opening'?opening[index]:kind==='closing'?STATION_CLOSINGS[index]?.[1]:STATION_INTERLUDES[index]?.[1];
 if(typeof standard!=='string'||!standard)return '';
 const options=[standard,...(READER_RADIO_PHRASING_4915[kind]?.[index]||[])];
 const recent=(s.reader?.pages||[]).slice(-75);
 const used=recent.map(p=>kind==='opening'?[p.radioOpening||p.opening]:kind==='closing'?[p.radioClosing||p.closing]:(p.radioBridges||p.interludes?.map(i=>STATION_INTERLUDES[i]?.[1]||'')||[])).flat();
 const ranked=options.map((line,i)=>{
  const latest=recent.findLastIndex(p=>kind==='opening'?(p.radioOpening||p.opening)===line:kind==='closing'?(p.radioClosing||p.closing)===line:(p.radioBridges||p.interludes?.map(j=>STATION_INTERLUDES[j]?.[1]||'')||[]).includes(line));
  const gap=latest<0?999:recent.length-latest;
  const occurrences=used.filter(x=>x===line).length;
  const noise=(automaticStyleHash(`radio-phrase4915:${s.night}:${kind}:${slot}:${index}:${i}`)%10000)/10000;
  return {i,score:noise*1.1-occurrences*.85-Math.max(0,22-gap)*.35};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 return options[ranked[0].i];
}

// v4.9.16 『おたより中心』用の、演出の意味を変えない言い換え。
// リスナー・返答・楽曲・元の演出履歴は維持し、画面と放送日誌だけ実際の言い方を記録。
// 今夜以前に記録済みの言い回しだけを参照するため、同じ夜の再描画や再開で変わらない。
// 保存済みの途中放送は lettersPhrase4916 がないため、従来の言い方を保持する。
function lettersBroadcastPhrase4916(kind,index,slot=0){
 const standard=kind==='opening'?opening[index]:kind==='closing'?STATION_CLOSINGS[index]?.[1]:STATION_INTERLUDES[index]?.[1];
 if(typeof standard!=='string'||!standard)return '';
 if(!isLettersMode()||s.lettersPhrase4916!==s.night)return standard;
 const options=[standard,...(READER_RADIO_PHRASING_4915[kind]?.[index]||[])];
 const type=kind==='opening'?'オープニング':kind==='closing'?'エンディング':'つなぎの一言';
 const previous=(s.logs||[]).filter(x=>x.night<s.night&&x.night>=s.night-80&&x.type===type);
 const ranked=options.map((line,i)=>{
  const prior=previous.filter(x=>x.message===line);
  const last=prior.length?prior[prior.length-1].night:-9999;
  let score=(automaticStyleHash(`letters-voice4916:${s.night}:${kind}:${slot}:${index}:${i}`)%10000)/10000*1.35;
  score-=prior.length*.95+Math.max(0,15-(s.night-last))*.18;
  // 同じ夜の2つの幕間が同文にならないよう、2通目との違いだけ確認。
  if(kind==='bridge'&&slot===2&&s.broadcastStyle?.interludes?.[1]>=0){
   const earlier=lettersBroadcastPhrase4916('bridge',s.broadcastStyle.interludes[1],1);
   if(earlier===line)score-=6;
  }
  return {i,score};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 return options[ranked[0].i];
}

function readerDJChooseVoice(){
 const night=s.night,all=(s.played||[]).filter(p=>p.night===night);
 const blank={opening:'',interludes:['',''],ending:''};
 if(all.length!==3)return blank;
 const previous=(s.reader?.pages||[]);
 // ひとことを喋った翌夜は、あえて何も追加しない。
 if(readerDJVoiceValue(previous.at(-1)))return blank;
 // 話す夜・話す場所は固定周期にしない。長い無言が続いた場合だけ少し選びやすくする。
 const key=all.map(p=>p.id).join('|');
 const schedule=automaticStyleHash(`voice-cadence-v4813:${night}:${key}`)/4294967296;
 const twoSilent=previous.length>=2&&!readerDJVoiceValue(previous.at(-2));
 if(schedule>=(twoSilent?.72:.57))return blank;
 const mood=all.map(p=>stationAutoMood({subject:p.subject,body:p.body},p.response||''));
 const serious=mood.some(m=>m.heavy>=2.0);
 const slotHash=automaticStyleHash(`voice-position-v4813:${night}:${key}`);
 let slot=['opening','bridge','ending'][slotHash%3];
 let index=(slotHash>>>4)%2;
 // 無言の幕間には割り込まない。もう一方の幕間が使えるならそちらを選ぶ。
 if(slot==='bridge'&&s.broadcastStyle.interludes[index+1]===-1){
  if(s.broadcastStyle.interludes[2-index]!==-1)index=1-index;
  else slot='ending';
 }
 const anchor=slot==='bridge'?all[index]:null;
 const context=slot==='bridge'?readerDJVoiceTopicText(anchor):all.map(readerDJVoiceTopicText).join('\n');
 const earlier=previous.slice(-85).map(p=>p.djVoice).filter(Boolean).flatMap(x=>[x.opening,x.ending,...(Array.isArray(x.interludes)?x.interludes:[])]).filter(Boolean);
 const options=READER_DJ_VOICE[slot].filter(x=>(!x.pattern||x.pattern.test(context))&&(!serious||x.tone==='gentle')&&(!(slot==='bridge'&&x.tone==='playful'&&mood[index]?.heavy>=1.0))&&(!(slot==='ending'&&x.tone==='playful'&&mood[2]?.heavy>=1.0)));
 if(!options.length)return blank;
 // 話題が一致する候補も、同文が最近使われた場合は新鮮な候補を優先。
 const fresh=options.filter(x=>!earlier.includes(x.text));
 const pool=fresh.length?fresh:options;
 const ranked=pool.map((x,i)=>{
  const used=earlier.filter(t=>t===x.text).length;
  let score=(automaticStyleHash(`reader-dj:${night}:${slot}:${x.text}`)%10000)/10000*1.8;
  if(x.pattern)score+=2.1;
  if(x.tone==='playful'&&!serious)score+=.8;
  if(serious&&x.tone==='gentle')score+=.6;
  // v4.8.20: 少しだけ人柄が覗く言葉を候補にするが、連続して同じ調子にはしない。
  // 追加の「人柄」を押しつけないため、既存の穏やかな表現も対等に選ばれる。
  if(x.facet){
   score+=.38;
   const recentVoices=previous.slice(-12).map(p=>readerDJVoiceValue(p)).filter(Boolean);
   const recentSameFacet=recentVoices.filter(t=>READER_DJ_VOICE.opening.concat(READER_DJ_VOICE.bridge,READER_DJ_VOICE.ending).some(v=>v.text===t&&v.facet===x.facet)).length;
   score-=recentSameFacet*.32;
  }
  // 候補を使い切った後も、つい数夜前の同じ一文を再使用しない。
  const lastIndex=previous.findLastIndex(p=>readerDJVoiceValue(p)===x.text);
  const gap=lastIndex<0?999:night-previous[lastIndex].night;
  score-=used*8+Math.max(0,75-gap)*.65;
  return {i,score};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 const text=pool[ranked[0].i].text;
 if(slot==='opening')blank.opening=text;
 else if(slot==='ending')blank.ending=text;
 else blank.interludes[index]=text;
 return blank;
}
function readerProduceNight(){
 if(activeProfile!=='reader'||readerBatch)return;
 const r=s.reader;
 if(r.viewIndex<r.pages.length-1){readerGotoPage(r.viewIndex+1);return}
 if(s.finale?.status==='completed')return;
 if(['final_intro','final_broadcast'].includes(s.phase)){finaleReaderProduce();return;}
 const backup=JSON.stringify(s);
 readerBatch=true;
 try{
  // 第14夜・28夜・第3章の終わりは、既存の章移行処理を使用。
  if(s.phase==='after')nextNight();
  if(s.phase==='complete')beginRegular();
  if(s.phase==='chapter2_complete')beginAfterChapter2();
  if(s.phase==='chapter3_complete')beginAfterChapter3();
  if(s.phase==='chapter4_complete')beginAfterChapter4();
  // 予告放送を読了した次の操作では、通常夜ではなく最後の原稿を一度だけ生成。
  if(s.phase==='final_intro'){readerBatch=false;finaleReaderProduce();return;}
  if(s.phase!=='intro'&&s.phase!=='prepare')throw Error('読書用の夜の開始位置が不正です: '+s.phase);
  if(s.phase==='intro'&&s.finale?.status!=='planned')autoDJMaybePlan();
  const introduction=readerTextFromPanel(s.phase==='intro'?intro():'<section class="panel"><h2>今夜の放送</h2></section>');
  if(s.phase==='intro')startNight();
  const ids=nightLetters(s.night),selected=autoDJPickLetters(ids);
  if(!selected.length)throw Error('紹介できるおたよりがありません');
  s.chosen=selected;s.broadcastModePref='letters';s.opening=null;
  beginBroadcast();
  const specialIntroText=specialActive(s.night)?SPECIAL_THEMES[s.special.planned.themeId].opening:'';
  while(s.cursor<s.chosen.length){
   const l=letter(s.chosen[s.cursor]);
   if(!l)throw Error('おたよりがありません');
   s.current=l.id;s.phase='reply';
   const picked=autoDJReply(l);applyReply(l,picked.tag,picked.response);
   ensureAutomaticBroadcastSelections();
  }
  ensureAutomaticBroadcastSelections();
  if(s.song===null||s.broadcastStyle.closing===null)throw Error('最後の演出が決定しませんでした');
  readerChooseClosing();
  finishBroadcast();
  if(s.phase!=='after')throw Error('放送が終了できませんでした');
  const outro=readerTextFromPanel(after());
  if(s.night===92&&chapter4IsNight(92))outro.text+='\n\n'+CH4_READER_CODA;
  const night=s.night;
  const source=s.special?.planned?.night===night?s.special.planned.storySource:null;
  const specialOrigin=source&&Number.isInteger(source.originNight)?{night:source.originNight,subject:String(source.sourceSubject||'')}:null;
  const djVoice=readerDJChooseVoice();
  const djSmallStory=djSmallStory4832(night,'reader');
  const page={night,djVoice,title:readerEditorialTitle(introduction.title,night),intro:readerEditorialScene(introduction.text,'intro',night),outro:readerEditorialScene(outro.text,'outro',night),specialOrigin,specialIntro:specialIntroText,
   opening:opening[s.opening]||'',song:songs[s.song]?.slice(0,2)||[],closing:STATION_CLOSINGS[s.broadcastStyle.closing]?.[1]||'',
   interludes:s.chosen.slice(1).map((id,i)=>s.broadcastStyle.interludes[i+1]??-1),letterIds:s.chosen.slice()};
  page.radioOpening=readerRadioPhrase4915('opening',s.opening);
  page.radioClosing=readerRadioPhrase4915('closing',s.broadcastStyle.closing);
  page.radioBridges=page.interludes.map((index,slot)=>index>=0?readerRadioPhrase4915('bridge',index,slot):'');
  if(s.finale?.status==='announced'&&s.night===s.finale.announcedNight)page.finaleAnnouncement=FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1];
  if(djSmallStory)page.djSmallStory=djSmallStory; // ほかの夜には追加情報を一切保存しない。
  r.pages.push(page);r.viewIndex=r.pages.length-1;r.scrollY=0;
  if(r.dj.tags.length>40)r.dj.tags.splice(0,r.dj.tags.length-40);
  readerBatch=false;
  if(!save())throw Error('保存容量を超えたか、保存できませんでした。読書用データをバックアップしてください');
  readerSavePosition();render();window.scrollTo(0,0);
 }catch(e){
  readerBatch=false;s=JSON.parse(backup);console.error('reader night failed',e);
  alert('この夜の生成を完了できませんでした。状態は変更していません。\n'+e.message);
  render();
 }
}
// 保存済みの読書原稿は改変せず、旧版の本文からも出典を復元できる。
function readerOriginFromPage(page){
 const direct=page?.specialOrigin;
 if(direct&&Number.isInteger(direct.night)&&typeof direct.subject==='string')return direct;
 const legacy=String(page?.outro||'').match(/きっかけ：第(\d+)夜に紹介した「([^」\n]*)」/);
 return legacy?{night:Number(legacy[1]),subject:legacy[2]}:null;
}
function readerOriginFootnote(page){
 const origin=readerOriginFromPage(page);
 if(!origin)return '';
 return `<details class="reader-origin-note"><summary>この特別放送のきっかけ</summary><p>第${origin.night}夜に紹介した「${esc(origin.subject)}」から生まれた企画です。</p></details>`;
}
// 朗読用だけの終幕選択。直前の終わり方との重なりを減らし、
// 最後の手紙が重い日は軽い冗談の締めを弱く避ける（強制はしない）。
function readerChooseClosing(){
 const recent=(s.reader?.pages||[]).slice(-5).map(p=>p.closing);
 const letters=(s.chosen||[]).map(id=>letter(id)).filter(Boolean);
 // v4.8.46: ひとりでも迷いや痛みを綴った夜には、急に冗談で終えない。
 const heavy=letters.some(l=>autoDJLetterMood(l).heavy>=2.2);
 const ranked=STATION_CLOSINGS.map((entry,i)=>{
  const used=recent.filter(t=>t===entry[1]).length;
  let score=autoDJNoise(`reader-closing:${i}`)*1.3-used*2.15;
  if(heavy&&i===4)score-=9;
  if(heavy&&[1,2].includes(i))score+=.55;
  // 特別な夜だけは余韻を少し長めにする。
  if(specialActive(s.night)&&[1,2,5].includes(i))score+=.3;
  return {i,score};
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 s.broadcastStyle.closing=ranked[0].i;
}
function readerGotoPage(index){
 if(activeProfile!=='reader'||!Number.isInteger(index)||index<0||index>=s.reader.pages.length)return;
 s.reader.viewIndex=index;s.reader.scrollY=0;if(!readerSavePosition()){alert('表示位置の保存に失敗しました。')}render();window.scrollTo(0,0);
}
// 閲覧補助だけの操作。物語の生成・選択・保存形式には介入しない。
function readerGotoLatest(){
 if(activeProfile!=='reader'||!s.reader?.pages?.length)return;
 readerGotoPage(s.reader.pages.length-1);
}
function readerNightSelect(value){
 const index=Number(value);
 if(Number.isInteger(index))readerGotoPage(index);
}
function readerJumpToNightNumber(){
 if(activeProfile!=='reader')return;
 const box=document.getElementById('reader-night-number');
 const night=Number(box?.value);
 if(!Number.isInteger(night)||night<1){if(box)box.setCustomValidity('正しい夜番号を入力してください');box?.reportValidity();return}
 const index=s.reader.pages.findIndex(p=>p.night===night);
 if(index<0){if(box)box.setCustomValidity('保存されていない夜です');box?.reportValidity();return}
 readerGotoPage(index);
}
function readerNightNavigation(r,index){
 const current=r.pages[index];
 if(!current)return '';
 const latest=index===r.pages.length-1;
 // v4.8.37: 1,000夜以上でも全夜分のoptionを再生成しない。離れた夜は番号で直接指定。
 const first=Math.max(0,index-18),end=Math.min(r.pages.length,index+19);
 const options=r.pages.slice(first,end).map((p,k)=>{const i=first+k;return `<option value="${i}" ${i===index?'selected':''}>第${p.night}夜${i===r.pages.length-1?' · 最新':''}</option>`}).join('');
 const latestButton=latest?'':`<button type="button" class="reader-nav-latest" onclick="readerGotoLatest()" title="最新の記録を表示">最新の夜へ</button>`;
 return `<nav class="reader-night-nav" aria-label="読書の記録を移動"><div class="reader-night-meta"><span class="reader-night-eyebrow">NIGHT ARCHIVE / 読書の記録</span><strong>第${current.night}夜 <small>${index+1} / ${r.pages.length}</small></strong></div><div class="reader-night-controls"><button type="button" class="reader-nav-button" ${index===0?'disabled':''} onclick="readerGotoPage(${index-1})" aria-label="前の夜を読む">← 前の夜</button><label class="reader-night-picker-label"><span class="screen-reader">近くの夜を選ぶ</span><select class="reader-night-picker" aria-label="近くの夜を選ぶ" onchange="readerNightSelect(this.value)">${options}</select></label><button type="button" class="reader-nav-button" ${latest?'disabled':''} onclick="readerGotoPage(${index+1})" aria-label="次の記録を読む">次の夜 →</button></div><div class="reader-night-jump"><label for="reader-night-number">夜番号で移動</label><input id="reader-night-number" type="number" inputmode="numeric" min="1" max="${r.pages[r.pages.length-1].night}" placeholder="第○夜" aria-label="読みたい夜番号" oninput="this.setCustomValidity('')" onkeydown="if(event.key==='Enter'){event.preventDefault();readerJumpToNightNumber()}"><button type="button" class="reader-nav-button" onclick="readerJumpToNightNumber()">移動</button>${latestButton}</div></nav>`;
}
function readerJumpToSection(id){
 const target=document.getElementById(id);
 if(!target)return;
 // 異なる夜でも同じ目次リンクを繰り返し使えるよう、直接スクロールする。
 target.scrollIntoView({block:'start',behavior:'auto'});
 try{window.location.hash=id}catch(e){}
}
function readerNightContents(entries){
 const items=entries.map((entry,i)=>`<a href="#reader-letter-${i+1}" onclick="readerJumpToSection('reader-letter-${i+1}');return false"><span>LETTER ${i+1}</span><strong>${esc(NAMES[entry.who]||entry.who)}</strong><small>${esc(entry.subject||'おたより')}</small></a>`).join('');
 return `<details class="reader-contents"><summary><span class="reader-contents-title">${uiIcon('list')}今夜の目次</span><span class="reader-contents-summary-detail">おたより${entries.length}通・選曲・終幕</span></summary><nav class="reader-contents-links" aria-label="今夜の放送内を移動"><a href="#reader-introduction" onclick="readerJumpToSection('reader-introduction');return false"><span>OPENING</span><strong>放送のはじまり</strong></a>${items}<a href="#reader-ending" onclick="readerJumpToSection('reader-ending');return false"><span>FINAL SONG</span><strong>選曲と終幕</strong></a></nav></details>`;
}
function readerShell(content){
 return `<div class="reader-layout"><header class="reader-header"><div><div class="brand reader-brand">SOMEWHERE ON AIR</div><div class="reader-mode-label">${uiIcon('moon')}<span>ANOTHER FREQUENCY / 読書モード</span></div><h1>聴くだけの夜</h1><div class="small">誰かが選んだ言葉の、その先を読む</div></div><button class="btn secondary" type="button" onclick="switchToMain()">${uiIcon('radio')}<span>本編に戻る</span></button></header><main id="main" class="reader-main">${content}</main><footer class="reader-footer">本編の選択と記憶は変更されません · v4.9.16</footer></div>`;
}
function readerView(){
 const r=s.reader;
 if(!r)return '<section class="panel">読書データの形式が違います。本編に戻り、バックアップを確認してください。</section>';
 if(r.pages.length===0)return `<section class="reader-paper"><div class="overline">BEFORE THE FIRST PAGE</div><h2>もうひとつの午前二時</h2><p>この世界では、別のパーソナリティがマイクの前に座ります。返す言葉の先に、どんな日々が続くのでしょう。</p><p>物語が進んでも、あなた自身の放送は変わりません。</p><div class="reader-actions"><button class="btn" onclick="readerProduceNight()">最初の放送を読む →</button></div></section>${readerReaderTools()}`;
 const p=r.pages[Math.max(0,Math.min(r.viewIndex,r.pages.length-1))];
 if(p.isFinale)return finaleReaderCompletedPage(p);
 const entries=p.letterIds.map(id=>s.played.find(x=>x.night===p.night&&x.id===id)).filter(Boolean);
 const djVoice=p.djVoice||{};
 const displayIntro=readerEditorialScene(p.intro,'intro',p.night),displayOutro=readerEditorialScene(p.outro,'outro',p.night),displayTitle=readerEditorialTitle(p.title,p.night);
 let content=`<div class="reader-page-head" id="reader-introduction"><div class="overline">第${p.night}夜 / THE NIGHT'S VOICES</div><h2>${esc(displayTitle||'今夜の放送')}</h2><p>${fmt(displayIntro||'午前二時。マイクの灯りがともる。')}</p><p class="reader-mic">${fmt(p.radioOpening||p.opening)}</p>${djVoice.opening?`<p class="reader-dj-voice">${fmt(djVoice.opening)}</p>`:''}${p.specialIntro?`<p class="reader-special-line">${fmt(p.specialIntro)}</p>`:''}</div>`;
 entries.forEach((entry,i)=>{
  const bridge=i===0?'':p.interludes[i-1]===-1?'少しのあいだ、言葉のない時間が流れた。':p.radioBridges?.[i-1]||STATION_INTERLUDES[p.interludes[i-1]]?.[1]||'次の手紙を開く。';
  content+=`${i?`<p class="reader-transition">${esc(bridge)}</p>${djVoice.interludes?.[i-1]?`<p class="reader-dj-voice reader-dj-between">${fmt(djVoice.interludes[i-1])}</p>`:''}`:''}<article class="reader-letter" id="reader-letter-${i+1}"><div class="overline">LETTER ${i+1} / ${entries.length}</div><h3>${esc(NAMES[entry.who]||entry.who)}　「${esc(entry.subject)}」</h3><div class="reader-letter-body">${fmt(entry.body||'')}</div><div class="reader-response-label">パーソナリティからの返答</div><div class="reader-response">${fmt(entry.response||'')}</div></article>`;
 });
 content+=`<section class="reader-ending" id="reader-ending"><div class="overline">02:53 / A FINAL SONG</div><p>♪ ${esc(p.song?.[0]||'')}</p><p class="small">${esc(p.song?.[1]||'')}</p>${djVoice.ending?`<p class="reader-dj-voice reader-dj-final">${fmt(djVoice.ending)}</p>`:''}<p>${fmt(p.radioClosing||p.closing||'')}</p>${p.finaleAnnouncement?`<div class="finale-callout"><div class="overline">02:59 / 閉局のお知らせ</div><p>${fmt(p.finaleAnnouncement)}</p></div>`:''}<div class="overline">03:00 / OFF AIR</div><p>${fmt(displayOutro||'今夜も放送が終わった。')}</p>${p.djSmallStory&&typeof p.djSmallStory.text==='string'?`<aside class="reader-dj-small-story" aria-label="放送後のひとこま"><div class="overline">03:07 / AFTER THE LIGHTS</div><h3>${esc(p.djSmallStory.title||'スタジオの小さな時間')}</h3><p>${fmt(p.djSmallStory.text)}</p></aside>`:''}${readerOriginFootnote(p)}<a class="reader-back-to-top" href="#reader-page-top" onclick="readerJumpToSection('reader-page-top');return false">↑ 今夜の最初に戻る</a></section>`;
 const i=r.viewIndex;
 return `<div id="reader-page-top" class="reader-page-top"></div>${readerNightNavigation(r,i)}<section class="reader-paper">${readerNightContents(entries)}${content}<div class="reader-actions"><button class="btn secondary" ${i<=0?'disabled':''} onclick="readerGotoPage(${i-1})">← 前の夜</button><button class="btn" onclick="readerProduceNight()">${i<r.pages.length-1?'次の記録を読む':s.finale?.status==='announced'?'最終放送を読む →':'次の夜へ →'}</button></div><p class="reader-page-count">${i+1} / ${r.pages.length} 夜分の記録</p></section>${i===r.pages.length-1?finalePlanExplanation():''}${readerReaderTools()}`;
}
function readerReaderTools(){
 return `<section class="reader-tools"><h3>読書の記録</h3><p>この世界は本編とは独立しています。読書用バックアップは、こちらで保存してください。</p>${(localStorage.getItem(READER_SAVE)||'').startsWith('R20-LZW1:')?'<p class="small">保存容量を節約する形式で保管しています。書き出すバックアップは従来どおりのJSONです。</p>':''}${readerSaveWarning?'<p class="notice">保存に失敗しました。容量を確認し、バックアップを保存してください。</p>':''}<div class="actions"><button class="btn secondary" onclick="downloadReaderSave()">読書用バックアップを保存</button><label class="btn secondary" style="cursor:pointer">読書用を復元<input class="screen-reader" type="file" accept=".json,application/json" onchange="importReaderSave(this)"></label></div><button class="reader-return" onclick="switchToMain()">自分の放送に戻る</button></section>`;
}
window.addEventListener('pagehide',()=>{if(activeProfile==='reader'&&s?.reader){s.reader.scrollY=window.scrollY;readerSavePosition()}});

// v4.8.37: 本編の閲覧専用タブ間は、ヘッダー・スタジオ・サイドバーを維持する。
// 本編進行・読書モード・ガイド表示の更新は必ず従来の全体描画へフォールバックする。
let lastViewKey=null;
let lastMainRenderedTab=null;
let lastMainRenderedReaderSetup=false;
let lastMainRenderedRevision=-1;
function updateMainNavActive(tab){
  for(const menu of document.querySelectorAll('.bottomnav, .sidebar .panel')){
    const buttons=menu.querySelectorAll('.bottomnav button, .navbtn');
    if(buttons.length!==UI_NAV.length)continue;
    buttons.forEach((button,i)=>{
      const active=UI_NAV[i][0]===tab;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
  }
}

window.addEventListener('keydown',event=>{if(event.key==='Escape'&&guideOpen){event.preventDefault();closeGuide()}});
function render(){
  if(readerBatch)return;
  if(activeProfile==='reader'){
    const app=document.getElementById('app');
    app.innerHTML=readerShell(readerView());
    const guidePortal=document.getElementById('guide-portal');if(guidePortal)guidePortal.innerHTML='';
    document.body.classList.remove('guide-open');
    if(readerRestoring){readerRestoring=false;window.scrollTo(0,s.reader?.scrollY||0)}
    lastMainRenderedTab=null;
    return;
  }
  ensureAutomaticBroadcastSelections();
  if(!['studio','letters','journal','listeners','settings'].includes(s.tab))s.tab='studio';
  const content=readerSetupOpen?readerSetupScreen():s.tab==='letters'?lettersTab():s.tab==='journal'?journal():s.tab==='listeners'?listeners():s.tab==='settings'?settings():
    s.phase==='final_intro'?finaleIntroduction():s.phase==='final_broadcast'?finaleBroadcast():s.phase==='final_complete'?finaleView==='review'?finaleArchiveHtml():finaleView==='keepsakes'?finaleKeepsakes():finaleCompletedView():s.phase==='intro'?intro():s.phase==='prepare'?prepare():s.phase==='broadcast'?broadcast():s.phase==='reply'?reply():s.phase==='after'?after():s.phase==='chapter2_complete'?chapter2Complete():s.phase==='chapter3_complete'?chapter3Complete():s.phase==='chapter4_complete'?chapter4Complete():complete();
  let decorated=s.tab==='studio'&&s.phase==='intro'?climateIntroText(s.night)+content:content;
  if(s.tab==='studio'&&s.phase==='prepare')decorated=hideableHint('choose','気になる手紙を選んでみましょう。紹介しなかった人も、その後の生活を続けます。')+decorated;
  if(s.tab==='studio'&&s.phase==='reply')decorated=hideableHint('reply','どれが正しいかより、自分ならこの人に何を伝えたいかで選んでみてください。')+decorated;
  if(s.tab==='studio'&&s.phase==='after'){
    const reflection=stationStylePanel()+studioAfterQuiet()+reflectionPanel()+djSmallStoryPanel4832(s.night)+finaleAnnouncementAfter()+finalePlanExplanation();
    // 次夜へ進むボタンより前に余韻を置く。各章の結末文には干渉しない。
    const anchor='<div class="actions"><button class="btn" onclick="nextNight()">';
    if(decorated.includes(anchor))decorated=decorated.replace(anchor,reflection+anchor);
    else decorated+=reflection;
  }

  const key=`${s.tab}:${s.tab==='studio'?s.phase:''}:${s.phase==='broadcast'?s.cursor:''}:${s.phase==='reply'?s.replyStep:''}:${s.tab==='studio'&&s.phase==='prepare'?prepareStepUI:''}`;
  const y=window.scrollY;
  const changed=lastViewKey!==null&&lastViewKey!==key;
  const specialStepChanged=changed&&s.tab==='studio'&&s.phase==='reply'&&lastViewKey.startsWith('studio:reply:');
  const oldSource=document.getElementById('special-reply-letter');
  const oldSourceOpen=oldSource?oldSource.open:null;
  // 閲覧タブ間の切替／日誌のページ送りでは本文だけを差し替える。
  // 通常放送への切替、読書導入、ガイドの開閉には手を加えない。
  const main=document.getElementById('main');
  const partial=activeProfile==='main' && lastMainRenderedTab!==null
    && lastMainRenderedTab!=='studio' && s.tab!=='studio'
    && !lastMainRenderedReaderSetup && !readerSetupOpen
    && !guideOpen && !!s.guidance.welcomeSeen && !document.querySelector('#guide-portal .guide-overlay') && !!main
    && lastMainRenderedRevision===mainDataRevision;
  if(partial){
    main.innerHTML=decorated;
    updateMainNavActive(s.tab);
  }else{
    document.getElementById('app').innerHTML=shell(decorated);
    const portal=document.getElementById('guide-portal');
    if(portal)portal.innerHTML=guideDialog();
    document.body.classList.toggle('guide-open',!s.guidance.welcomeSeen||guideOpen);
  }
  lastMainRenderedTab=s.tab;
  lastMainRenderedReaderSetup=readerSetupOpen;
  lastMainRenderedRevision=mainDataRevision;
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

// v4.9.0 — 最終放送。既存の通常放送と人物シミュレーションから独立した完結章。
function createFinaleState(){return {schemaVersion:1,status:'none',announcedNight:null,finalNight:null,announcementChoice:null,snapshot:null,replies:[],openingChoice:null,closingChoice:null,stage:0,finalizedAt:null};}
function migrateFinaleState(data){
 const base=createFinaleState(),f=data.finale;
 if(!f||typeof f!=='object'){data.finale=base;return;}
 data.finale={...base,...f};const v=data.finale;
 if(!['none','planned','announced','on_air','completed'].includes(v.status))data.finale=base;
 if(!Array.isArray(v.replies))v.replies=[];
 if(!Number.isInteger(v.stage)||v.stage<0)v.stage=0;
 if(v.status!=='none'&&(!Number.isInteger(v.announcedNight)||!Number.isInteger(v.finalNight)||v.finalNight!==v.announcedNight+1))data.finale=base;
 if(['on_air','completed'].includes(v.status)&&(!v.snapshot||!Array.isArray(v.snapshot.letters)||!Array.isArray(v.snapshot.fragments)))data.finale=base;
 if(v.status==='completed')data.phase='final_complete';
}
const FINALE_ANNOUNCEMENTS=[
 'ひとつ、お知らせがあります。このラジオ局は、明日の放送を最後に、幕を下ろします。あと一夜、いつものように声を届けられたらと思います。',
 'この周波数でお会いできるのも、明日の夜が最後です。今夜はいつもどおりお便りを読みました。明日も、届いた言葉を大切に紹介します。',
 '明日の午前二時が、この番組の最終放送になります。さようならを急がずに、今夜はまず、ここに届いた声をお届けしました。'
];
// v4.9.5 — 最終放送の「間」を文章ごとに保存。既に完結した放送には後付けしない。
// 朗読の解釈やDJの気持ちを決めつけず、机上の動きと次の便箋でつなぐ。
const FINALE_NIGHT_FLOW={
 afterOpening:'オープニングの言葉が電波に乗る。机の上から、最初の便箋を手に取る。',
 afterLetters:[
  '便箋をそっと重ね、次の封筒を開く。放送室の時計は、いつもの速さで進んでいる。',
  '次の便箋を開くまでに、少しだけ静かな時間が流れる。別れを惜しむ声のあとにも、誰かの明日の暮らしがある。',
  '三通目の返事を送り届けた。今夜、まだ紹介したい短い声が、机の端に残っている。'
 ],
 afterFragments:'今夜の短い声も読み終えた。あとは最後の一曲と、この周波数を閉じる言葉を届けるだけだ。'
};
const FINALE_OPENINGS=[
 '午前二時になりました。『午前二時の周波数』、最後の一時間です。届いた便箋を、一通ずつ開いていきます。',
 'こんばんは。今日もこの周波数を見つけてくれて、ありがとうございます。今夜は最後の放送ですが、いつもと同じように、まずお便りを読みます。',
 '午前二時です。いつもより少しだけ静かな放送室から、お届けします。最後まで、ここに届いた声と一緒に過ごします。'
];
const FINALE_ENDINGS=[
 ['感謝を伝える','この番組にお便りをくださったみなさん、聴いてくださったみなさん、ありがとうございました。『午前二時の周波数』は、今夜で終了します。どうか、それぞれの明日を。'],
 ['静かに結ぶ','これが、この周波数からお届けする最後の言葉です。ここで交わした声を、放送日誌に残します。『午前二時の周波数』、これにて終了です。おやすみなさい。'],
 ['少しだけユーモアを','最後の一曲を流しても、時計はいつものように三時を指すのでしょう。忘れ物は、たぶんありません。『午前二時の周波数』、今夜で閉局します。どうぞ、よい朝を。']
];
const FINALE_VOICES={
 cat:{motif:'仕事帰りに、手帳のすみに引く線',thanks:'前に読んでもらった手紙を思い出して、帰り道に少しだけ立ち止まりました。あの夜に言えたことは、今も私の一日の一部分です。',lonely:'番組が終わると聞いて、机の上のペンをしばらく眺めていました。仕事と絵のことは、まだ簡単に一つの答えにはなりません。',everyday:'明日も、いつもの道を歩きます。描きたい線が見つかったら、紙を広げてみようと思います。',fragment:'明日の手帳にも、余白が少しあります。ラジオに送らない話も、そこへ書いてみます。'},
 fish:{motif:'言葉を選ぶために開くノート',thanks:'ここへ手紙を書くときは、書き直すことが多かったです。放送でその言葉を読んでもらえたこと、覚えています。',lonely:'終わりのお知らせを聞いて、すぐにはうまく言葉が決まりませんでした。寂しい、だけでは少し足りない気がします。',everyday:'明日も、自分の気持ちに名前を付けるのに時間がかかると思います。でも、急いで結論を出す必要はないですね。',fragment:'最後の返事も、少し書き直しました。今度はこれで送ります。おやすみなさい。'},
 clock:{motif:'古い時計の針が進む音',thanks:'以前こちらへ送った話を、声にしていただきました。今でも、時計の音を聞くときにあの時間を思い出します。',lonely:'この時間の声がなくなると思うと、家の時計がいつもより大きく聞こえそうです。けれど、針は静かに進むのでしょう。',everyday:'明日も朝になれば湯を沸かし、窓を開けます。思い出は思い出として、今日の暮らしは今日の暮らしとして。',fragment:'明日の朝も、時計はきっと動いています。長いこと、ありがとうございました。'},
 bread:{motif:'明日のパン生地と小さな失敗',thanks:'仕込みの合間に書いた手紙を読んでもらえて、なんだかお店の外にも湯気が届いた気がしました。',lonely:'番組が終わるのは寂しいです。寂しいので今夜はパンを一個多く焼こうとして、分量を間違えかけました。危ない危ない。',everyday:'明日のパンも焼きます。うまく膨らまなかったら、また材料と相談です。次のお便りを送れないのは少し残念ですけど。',fragment:'明日のパンは、たぶんちゃんと焼けます。たぶん、です。ありがとうございました！'},
 moon:{motif:'月の裏側に置いた、まだない地図',thanks:'このラジオ局では、妙な空想にも宛先がありました。たとえば月の裏側の地図だって、声にすると少し本当らしくなりました。',lonely:'明日から周波数を合わせても放送がないんですね。では月の裏側には「放送室の跡地」という地名を付けてもいいでしょうか。',everyday:'もちろん、地図に載らないこともこれから考え続けます。身近な人に話したら、いつもの顔をされるでしょうけれど。',fragment:'月の裏側での受信実験は、失敗ということにしておきます。また新しい仮説を考えますね。'},
 driver:{motif:'休憩所の温かい缶コーヒー',thanks:'休憩中に送った話を放送で聞いたとき、自分の毎日にも誰かの耳があるんだな、と思いました。',lonely:'明日からこの番組がないと思うと、休憩の時間が少し長く感じそうです。何を聴くかは、まだ決めていません。',everyday:'走る前には車を点検して、休むときはちゃんと休みます。猫主任は、相変わらずこちらの予定を知りません。',fragment:'次の休憩でもコーヒーは飲みます。猫主任にも閉局のお知らせをしておきたいところです。'},
 sugar:{motif:'カップの底に残る、少し甘い一口',thanks:'何でもないカップの話を電波に乗せてもらえたこと、今でも少し可笑しく、嬉しく思っています。',lonely:'最後の放送と聞いて、砂糖をひと匙だけ足しました。いつもと同じカップなのに、ちょっと甘すぎました。',everyday:'明日もカップを洗って、また何か飲むのでしょう。取っ手の角度までは、まだ結論が出ていません。',fragment:'今日の飲み物は、いつもよりひと匙甘くなりました。理由は内緒にしておきます。'},
 anon:{motif:'名前を書かないまま置いた便箋',thanks:'名前を決めないまま、何度か手紙を送ることができました。読んでくれて、ありがとうございました。',lonely:'番組が終わると聞いて、ペンを持ったまま考えました。最後だから名前を変えるべきか、と。でも、やっぱりこのままにします。',everyday:'明日、何か変わるわけではないかもしれません。書かない日のことも、私の毎日の中にあります。',fragment:'最後まで、名前はまだありません。けれど、ちゃんとここから聴いていました。'},
 terminal:{motif:'窓の外を流れていく駅の灯り',thanks:'駅についての手紙を紹介してもらった夜がありました。あの夜、声にしてもらった言葉は、今も自分のものです。',lonely:'番組の終わりを知って、いつもの駅が少し遠く感じました。もちろん、駅の場所が変わったわけではありません。',everyday:'明日も電車は走り、人は乗ったり降りたりするのでしょう。約束の意味を、急いで決めるつもりはありません。',fragment:'次の電車も、時間になれば来ます。放送室にも、よい朝がありますように。'},
 umbrella:{motif:'花屋の店先の、形の違う葉',thanks:'花の話を読んでもらえたとき、店先の小さなことも誰かの夜に混ざるんだ、と少し不思議に思いました。',lonely:'番組が終わるのは寂しいですね。花を一輪飾ろうかと思いましたが、どの花がいいのか、まだ迷っています。',everyday:'明日、店をどうするかは明日考えます。花のことも、自分の休み方のことも、ひとつずつ。',fragment:'花の名前を言わないまま、今日は一輪だけ眺めていました。おやすみなさい。'},
 triangle:{motif:'定規で引いた線の先の小さな謎',thanks:'変な疑問を送ったときにも、ちゃんと紹介してもらえたことを覚えています。正解を急がずに済む夜でした。',lonely:'最終放送について、なぜ終わりを「最終」と呼ぶのか考えました。最後だからですね。これは珍しく、すぐ結論が出ました。',everyday:'明日も気になるものを見つけると思います。進む道はまだ全部決めていませんが、観察なら続けられます。',fragment:'閉局後の放送回数を数えようと思いました。ゼロですね。たまには簡単な問題もあります。'},
 fridge:{motif:'台所の小さな明かりと残りもの',thanks:'夜の台所の話を、誰かに聞いてもらえたのが嬉しかったです。料理はいつも、誰かに出すものばかりでもないですから。',lonely:'番組が終わると聞いて、冷蔵庫を開けたまま少し考えていました。すぐに閉めました。電気代がもったいないので。',everyday:'明日は自分のために何か作れるかもしれません。作らない日もあるでしょう。どちらでも、朝は来るんですよね。',fragment:'明日のおかずはまだ未定です。番組には、たくさんのごちそうをありがとうございました。'}
};
// v4.9.5 — 最後の便箋：12人の語彙と三つの別れ方を個別に描く。
// 過去については実際の s.played にある件名だけを参照する。
const FINALE_LETTER_TITLES={
 cat:['帰り道に残った一本の線','ペンを置いてから','まだ描いていない一枚へ'],
 fish:['書き直したあとで','寂しい、の次の言葉','明日のノートの一行'],
 clock:['時計を巻く前に','いつもの家の音','明日の窓辺で'],
 bread:['仕込み台からの最後の便箋','閉店後に一つだけ','明日の生地のこと'],
 moon:['周波数の地図に記すこと','月面にない放送局','まだ地図にない明日'],
 driver:['休憩所で最後の一通','次の休憩時間に','猫主任への業務連絡'],
 sugar:['カップに残ったもの','砂糖ひと匙ぶんの寂しさ','明日の飲み物は未定'],
 anon:['差出人の欄はそのまま','便箋をしまう前に','名乗らない明日へ'],
 terminal:['一枚の切符とラジオ','駅の灯りが遠く見えた夜','次の電車の時間'],
 umbrella:['閉店後の花瓶から','まだ決めていない一輪','明日の店先に'],
 triangle:['最後の観測記録','解けない問題が一つ','余白に引く補助線'],
 fridge:['片付けのあとの台所','冷蔵庫の灯りを消す前に','明日の献立は白紙']
};
// 同じ別れの役割でも、短い後半を各人の言葉で結ぶ。解決や進路は確定しない。
const FINALE_LETTER_CODAS={
 cat:['何かを決める前に、線を一本だけ引いてみることがあります。その小ささを、今は笑わずにいたいです。','何も描けなかった日の帰り道にも、目に留まる色があります。たぶん、これからもそうです。','明日の仕事がどうなるとしても、帰る道に見つけた色は手帳の余白に残せます。'],
 fish:['うまく言えないまま送った言葉も、消さなくてよかったのかもしれません。','まだ書けていない一行があるので、便箋の端を少し空けておきます。','ノートを開く時間は、これからも必要だと思います。書き直すことも、きっとあります。'],
 clock:['長く使った時計ほど、耳を近づけないと聞こえない音があります。あの時間も、そんな音のひとつでした。','声が消えても、湯を沸かす音は残ります。明朝は窓を開けようと思います。','窓を開けると、昨日と似た風が入るかもしれません。似ているだけで、同じ朝ではありません。'],
 bread:['明日は失敗しない、と言いたいところですが、それは材料に聞かないとわかりません。','余った生地をどうするかより、今夜のこの気持ちをどうするかのほうが難しいですね。','売り場の札はまた書き直せます。番組あての封筒だけは、これが最後です。'],
 moon:['机の上の地図には、まだ名前を付けていない場所がいくつもあります。困ったことに、全部面白そうです。','まだ何も建てない場所も、地図には必要ですね。明日、委員会を一人で開きます。','宇宙の大きさに比べれば小さなことですが、今夜は小さなことのほうを覚えておきます。'],
 driver:['このあとも、休むときは休みます。夜道の仕事は、急がないほうがいい場面があるので。','休憩所で聞こえる音が一つ減ると思うと、少し変な感じです。車の点検はいつもどおりします。','猫主任はこの件を知りません。今度見かけたら、いちおう報告しておきます。'],
 sugar:['甘さを量る匙には目盛りがありますが、こういう気持ちにはありませんね。','一匙を増やすか、いつもの味に戻すか。そんなことを考えられる朝が、また来ます。','カップは洗えば空になります。その空っぽが、案外嫌いではありません。'],
 anon:['最後だからといって、急に立派な名前を書くこともできませんでした。いつもの私のまま送ります。','宛先がなくなると思うと、書かないままにした言葉にも気づきます。今日はそれを少し眺めています。','名前の欄は空白ですが、便箋を書いた時間まで空白だったわけではありません。'],
 terminal:['時刻表には載っていない時間も、ちゃんと過ぎていきます。この番組の一時間もそうでした。','切符をしまう引き出しに、何かを増やす必要はないのでしょう。それでも、しばらく開けていました。','次にどこへ行くかは、まだ決めていません。決めないままホームに立つこともあります。'],
 umbrella:['花束に合う色を選ぶのは得意な日もありますが、今夜の気持ちに合う花はまだ選べません。','明日の店先を飾る花を、さっきから考えています。たぶんいつもと大きくは変わりません。','休む日も働く日も、花には水をやります。そういう小さな手入れは残ります。'],
 triangle:['最後の一通が特別かどうかを測る定規は、まだ発明されていないようです。','終わりが一つあると、その前には何があったのか考えたくなります。少し厄介な性分ですね。','ノートには、まだ書いていない疑問がたくさんあります。次のページも空けてあります。'],
 fridge:['料理は誰かに出すものだと思っていた夜もありました。今夜の一通は、自分のために書いています。','冷蔵庫は閉めれば灯りが消えます。いまは、その当たり前が少し気になります。','明日は何か作るかもしれないし、作らないかもしれません。どちらの日にも、お腹はすきます。']
};
const FINALE_RECALL_TONES={
 cat:t=>`放送で「${t}」と紹介されたとき、自分が書いた題なのに、少し離れた場所から聞いている気がしました。`,
 fish:t=>`「${t}」と書いた便箋も、ここで声になりました。書き直したところまで聞こえたわけではないのに、不思議です。`,
 clock:t=>`「${t}」という題の便箋も、お読みいただきました。紙に書いた言葉が、声になって戻ってくる夜がありました。`,
 bread:t=>`「${t}」を読んでもらったことも覚えています。いつもの店の外まで、声が届くようでした。`,
 moon:t=>`「${t}」という題名まで放送に乗ったので、これは地球上の正式な記録ということにしておきます。`,
 driver:t=>`「${t}」を読んでもらった夜もありました。休憩中に聞いて、少しだけ車から降りるのが遅くなりました。`,
 sugar:t=>`「${t}」という題名も、この番組ではちゃんと声にしてもらえました。小さな話でも、耳で聞くと少し違います。`,
 anon:t=>`「${t}」という題で送ったこともありました。名前を書かなくても、手紙は届くのですね。`,
 terminal:t=>`「${t}」という題名で、手紙を読んでもらった夜がありました。その夜があったことだけは、覚えています。`,
 umbrella:t=>`「${t}」という便箋も、この番組では読んでもらえました。店先の小さなことが、遠くまで届く夜でした。`,
 triangle:t=>`放送で読まれた「${t}」の題名は、私のノートにも残っています。観測結果が一つ増えました。`,
 fridge:t=>`「${t}」という手紙も読んでもらいました。台所の話がラジオに載るのは、今でも少し不思議です。`
};
const FINALE_REPLY_VOICES={
 cat:['仕事のことも、描くことも、ここで急いで答えを出さなくていいと思います。手帳の余白を、大切にしてください。','何かを決めなかった夜の話も、この周波数で聞けました。最後の便箋をありがとうございます。','帰り道に見つけた色を、誰かに説明しなくてもかまいません。今日の声を、ここに残します。'],
 fish:['書き直した言葉も、迷ったあとの一行も、あなたの手紙でした。最後まで読ませてくれてありがとうございます。','今夜も、言葉を急がずに選んでくれたことが伝わりました。空けておく一行があってもいいですね。','寂しいという言葉の続きを、無理にまとめなくて大丈夫です。これが最後の返事になります。'],
 clock:['時計の音や、お茶を淹れる朝の話が、放送室にも届きました。長い間ありがとうございました。','変わらない暮らしのようで、同じ朝は一つもないのかもしれませんね。最後の手紙を読みました。','思い出に結論を付ける必要はないと思います。これからも、どうか穏やかな朝がありますように。'],
 bread:['明日のパンがうまく膨らんでも、少し失敗しても、どちらもあなたの店の一日ですね。お便りをありがとう。','最後の夜にも、ちょっと笑わせてもらいました。こちらの机にも仕込みの熱が伝わるようです。','材料と相談する時間も大切にしてください。うまくいかない日のパンの話も、好きでした。'],
 moon:['月の裏側の地図に何を書くかは、お任せします。地球の放送室からは、これが最後の報告です。','地図にない場所の話を、たくさん聞かせてくれてありがとう。何も決まっていない場所も、きっと面白いですね。','月の議事録には残さなくても、今夜の声はこの放送日誌に残します。よい観測を。'],
 driver:['休憩中に聞いてくれた声を、こちらからも覚えておきたいです。どうかこれからも、安全な道を。','猫主任への報告は、どうぞ無理のない範囲で。最後にも、いつもの調子を聞けてうれしいです。','長い夜の仕事の合間に届く一通がありました。今夜も、休む時間を大切にしてください。'],
 sugar:['何でもないカップの話を、最後まで聞かせてくれてありがとう。甘さの正解は決めなくてもよさそうです。','今夜の一匙の話、覚えておきます。こちらの机には、飲み終えたカップが一つ残ります。','いつもの味と違う一口も、一日の一部ですね。最後の手紙を大切に読ませてもらいました。'],
 anon:['名前が書かれていなくても、ここまで届いた便箋はどれもあなたのものでした。ありがとうございました。','最後も、この差出人のままでいいと思います。言葉が届いたことを、ここに記録します。','名前を決めない自由も、大事な選択ですね。長くこの周波数を見つけてくれてありがとう。'],
 terminal:['時刻表に載らない時間も、今夜こうして一緒に過ごしました。お便りをありがとうございます。','次にどの電車に乗るのかを、こちらで決めることはできません。どうか、よい旅路を。','約束の意味も、行き先も、急がずに。最後の便箋を、放送室から送り出します。'],
 umbrella:['どの花を選ぶのか、今夜は決めなくていいと思います。あなたの店先の話を聞けてよかったです。','花を飾る日にも、飾らない日にも、あなたの時間があります。最後の声をありがとうございます。','仕事の続け方にも、休み方にも、一つの正解を押しつけずにいたいです。どうか、よい明日を。'],
 triangle:['最終放送の答えは出ましたが、まだ気になる問題は残りそうですね。観測報告をありがとうございました。','最後の疑問にも、すぐ答えを出さずにいられるのが、この番組らしかったと思います。','補助線は途中で止めてもかまいません。続きのノートは、あなたの手元にあります。'],
 fridge:['自分のために作る料理も、何も作らない夜も、大事な暮らしですね。最後の手紙をありがとうございます。','冷蔵庫の灯りは消えても、明日の献立は決めなくていい。そんな夜があってもいいですね。','長い仕事のあとに届く、あなたの台所の言葉がありました。どうか、今夜はゆっくり休んでください。']
};
// v4.9.5 — 最終放送は「感謝・寂しさ・明日の話」で返し方を変える。
// 共通の正解を作らず、人物の個性と言及済みの出来事だけを扱う。
const FINALE_ROLE_REPLIES={
 cat:[
  'あの夜に残った一本の線が、今日のあなたの手元にもあるのですね。ここで話してくれて、ありがとうございます。',
  '今夜、何かを決める必要はありません。絵も仕事も、あなたが歩く明日の中にあります。最後のお便りを受け取りました。',
  '明日見つける色は、まだ誰にもわかりませんね。紙を広げたくなる日が来たら、その時間を大切にしてください。'
 ],
 fish:[
  '言葉を書いては直して、ここへ届けてくれたことを覚えておきたいです。今夜も、ちゃんと届いています。',
  '「寂しい」のあとに続く言葉は、今夜決めなくていいと思います。言葉にならない部分も、ここで受け取りました。',
  '明日のノートも、書き直してかまいません。今夜の一行を、最後の放送日誌に残します。'
 ],
 clock:[
  '紙の言葉が声になった夜を、こうして振り返ってくださってありがとうございます。あの時間も、この放送の一部でした。',
  'いつもの時計の音が違って聞こえる夜もあるでしょう。この周波数からの声は最後ですが、お便りはここに残します。',
  '明朝、窓を開けた先にはまた違う風があるのでしょうね。今日の手紙も、大切に読ませていただきました。'
 ],
 bread:[
  '仕込みの合間に届いた声が、今夜も放送室を温めてくれました。最後まで書いてくださってありがとうございます。',
  '分量を間違えかけたところで、少し笑ってしまいました。寂しい気持ちも一緒に届いています。',
  '明日の生地がどうなるかは、明日のお楽しみですね。失敗を笑える朝もありますように。'
 ],
 moon:[
  'この放送室からは見えない場所まで、言葉で連れていってもらいました。地図の続きをありがとうございます。',
  '月の裏側に跡地ができるとは、思ってもみませんでした。番組は今夜で終わりますが、空想の地図はどうぞそのままに。',
  '新しい仮説が増える明日にも、きっと面白いことがありますね。この周波数からの最後の観測報告です。'
 ],
 driver:[
  '休憩中にこの番組を見つけてくれた夜が、確かにありました。声を届けてくださってありがとうございます。',
  'いつもの休憩時間から、声が一つなくなるのですね。寂しさを急いで埋めなくてもいいと思います。',
  '明日もどうぞ、点検と休憩を忘れずに。猫主任への報告は、会えたときにでも。'
 ],
 sugar:[
  'カップのような何げない話にも、こんなに長い時間が入っていたのですね。今夜も一通、ありがとうございます。',
  '一匙増やした甘さで、今夜の気持ちが全部わかるわけではないですね。その一口の話を、ここで聞けてよかったです。',
  '明日の飲み物の味は、まだ決まっていませんね。空になったカップにも、次の朝があります。'
 ],
 anon:[
  '差出人の欄が空白でも、ここへ届く言葉はあなたのものでした。最後まで送ってくれてありがとうございます。',
  '名前を書こうか迷った時間も、この一通の一部だったのですね。最後も、いつもの差出人で受け取りました。',
  '明日も名前を決めなくてかまいません。書く日も書かない日も、あなたの時間です。'
 ],
 terminal:[
  '駅の灯りについて書かれた時間が、この放送室にも残っています。今日も一通ありがとうございます。',
  '駅はいつもの場所でも、番組のない夜は少し違って見えるのかもしれませんね。今夜の言葉を残します。',
  '明日の電車は走り続けますね。約束や行き先の答えを、この番組が決めることはありません。'
 ],
 umbrella:[
  '店先の小さなことを聞かせてもらえて、こちらにも一輪の花が届いたようでした。最後のお便りをありがとうございます。',
  '今夜の気持ちに合う花は、すぐに決まらなくてもいいですね。迷っていることも、そのまま聞かせてもらいました。',
  '明日の店先がどんな一日になるかは、まだ決まっていません。働く日にも休む日にも、よい時間がありますように。'
 ],
 triangle:[
  '答えを急がない疑問が、放送の楽しみになった夜もありました。最後の観測報告までありがとうございます。',
  '「最終」という言葉の答えが、こんなに早く出る夜もあるんですね。少し笑いました。終わりが近いことも伝わっています。',
  '次のノートにも疑問が増えるのでしょうね。補助線の続きを、誰かに急かされずに引いてください。'
 ],
 fridge:[
  '夜の台所から届く言葉には、いつもその人の一日がありました。最後まで聞かせてくれてありがとうございます。',
  '冷蔵庫の扉を閉めたあとの静けさまで、今夜の手紙から伝わりました。閉局のお知らせを受け取ってくださってありがとう。',
  '明日、何を作るかは決まっていなくてもいいですね。あなたの食卓にも、また朝が来ます。'
 ]
};
function finaleRoleOf(x,i){return x?.role||['thanks','lonely','everyday'][i]||'thanks';}
function finaleReplyOptions(who,role){
 const base=finaleResponses(who),index={thanks:0,lonely:1,everyday:2}[role];
 if(index===undefined || !FINALE_ROLE_REPLIES[who])return base;
 // 言及のない寂しさを勝手に読み取らない第三候補
 const neutral=who==='fish'?'この便箋に書かれた言葉を、そのまま最後の放送日誌に残します。続きの一行は、あなたの手元にあります。':base[2];
 return [FINALE_ROLE_REPLIES[who][index],base[0],neutral];
}
function finaleCanPlan(){
 if(s.night<100||s.phase!=='after'||s.finale?.status!=='none')return false;
 const a=s.night+1,b=a+1,p=s.special?.planned;
 if(milestoneAt(a)||milestoneAt(b)||milestoneUpcoming(a)||milestoneUpcoming(b))return false;
 if(p&&['announced','gathering','ready'].includes(p.status)&&[a,b].includes(p.night))return false;
 return true;
}
function finalePlanExplanation(){
 if(s.night<100)return '';
 if(s.finale.status==='planned')return `<div class="finale-callout"><strong>最後の放送の準備が整っています。</strong><p>第${s.finale.announcedNight}夜の放送で終了を予告します。予告前なら準備を取りやめられます。</p>${['after','intro'].includes(s.phase)?'<button class="btn secondary" onclick="finaleCancelPlan()">終了の準備を取りやめる</button>':''}</div>`;
 if(s.finale.status==='announced')return `<div class="finale-callout"><strong>閉局のお知らせを届けました。</strong><p>次の第${s.finale.finalNight}夜が、この番組の最終放送です。開始前にバックアップを保存しておくと安心です。</p></div>`;
 if(s.finale.status!=='none')return '';
 if(s.phase!=='after')return '';
 return finaleCanPlan()?`<div class="finale-callout"><div class="overline">THE LAST BROADCAST / 選べる幕引き</div><h3>いつか、マイクを置く夜。</h3><p>第100夜を越えたこの番組には、自分で決められる終わりがあります。まだ何百夜でも続けられます。</p><button class="btn secondary" onclick="finalePlan()">最終放送を準備する</button></div>`:`<p class="finale-deferred">今は別の放送が予定されています。そちらを終えてから、最終放送を準備できます。</p>`;
}
function finaleCommit(action){const previous=JSON.stringify(s);try{action();if(!save())throw Error('保存できませんでした。空き容量を確認してください。');render();return true}catch(e){s=JSON.parse(previous);alert('記録を保存できなかったため、変更を取り消しました。\n'+e.message);render();return false}}
function finalePlan(){
 if(!finaleCanPlan())return;
 if(!confirm('最終放送を準備しますか？\n次の通常放送で閉局を予告し、その翌夜に最終放送を行います。終了後、この記録では放送を続けられません。\n先にバックアップを保存しておくことをおすすめします。'))return;
 finaleCommit(()=>{s.finale={...createFinaleState(),status:'planned',announcedNight:s.night+1,finalNight:s.night+2,announcementChoice:activeProfile==='reader'?1:null};});
}
function finaleCancelPlan(){if(s.finale?.status!=='planned'||!(s.phase==='intro'&&s.night===s.finale.announcedNight||s.phase==='after'&&s.night+1===s.finale.announcedNight))return;if(!confirm('番組終了の準備を取りやめますか？'))return;finaleCommit(()=>{s.finale=createFinaleState()})}
function finaleChooseAnnouncement(i){if(s.finale?.status!=='planned'||s.night!==s.finale.announcedNight||s.phase!=='intro'||!FINALE_ANNOUNCEMENTS[i])return;finaleCommit(()=>{s.finale.announcementChoice=i})}
function finaleAnnounceIntro(){
 if(s.finale?.status!=='planned'||s.night!==s.finale.announcedNight)return '';
 return `<div class="finale-callout"><div class="overline">ENDING NOTICE / 今夜の放送の最後に</div><h3>閉局のお知らせ</h3><p>今夜の3通を読み終えたあと、番組が明日で終了することを伝えます。どんな言葉で知らせますか？</p>${activeProfile==='reader'?`<p>${fmt(FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1])}</p>`:`<div class="finale-options">${FINALE_ANNOUNCEMENTS.map((v,i)=>`<button class="choice ${s.finale.announcementChoice===i?'selected':''}" onclick="finaleChooseAnnouncement(${i})">${fmt(v)}</button>`).join('')}</div>`}<button class="btn secondary" onclick="finaleCancelPlan()">準備を取りやめる</button></div>`;
}
function finaleAnnouncementPreview(){return s.finale?.status==='planned'&&s.night===s.finale.announcedNight?`<div class="finale-callout"><div class="overline">02:59 / 閉局のお知らせ</div><p>${fmt(FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1])}</p></div>`:''}
function finaleAnnouncementAfter(){return s.finale?.status==='announced'&&s.night===s.finale.announcedNight?`<aside class="finale-callout"><div class="overline">02:59 / お知らせ</div><h3>明日、この番組は終わります。</h3><p>${fmt(FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1])}</p></aside>`:''}
function finaleRankedListeners(){
 const counted=new Map();for(const x of s.played){if(!FINALE_VOICES[x.who]||x.night>=s.night)continue;const a=counted.get(x.who)||{who:x.who,count:0,last:0,featured:0};a.count++;a.last=Math.max(a.last,x.night);if(!/^(reg|everyday)/.test(x.id))a.featured++;counted.set(x.who,a)}
 return [...counted.values()].sort((a,b)=>(b.count*10+Math.min(b.featured,12)*2+b.last/(s.night||1)*3)-(a.count*10+Math.min(a.featured,12)*2+a.last/(s.night||1)*3)||a.who.localeCompare(b.who));
}
function finaleMakeSnapshot(){
 const ranked=finaleRankedListeners(),top=ranked.slice(0,3),others=ranked.filter(x=>!top.some(y=>y.who===x.who)).slice(0,4);
 const roles=['thanks','lonely','everyday'];
 const letters=top.map((item,i)=>{
  const who=item.who,v=FINALE_VOICES[who],past=s.played.filter(x=>x.who===who&&x.night<s.night),last=past[past.length-1];
  const intro=[
   'こんばんは。番組の最後の夜に、もう一通だけ送ります。',
   '閉局を前に、今夜はこの便箋を送ります。',
   'これが、この番組あてに書く最後の便箋です。'
  ][i];
  // 事実として参照できるのは過去に放送した件名のみ。未紹介の出来事は回想しない。
  const recalled=past.length>=2&&last?.subject&&typeof FINALE_RECALL_TONES[who]==='function'
   ?FINALE_RECALL_TONES[who](last.subject)
   :past.length===1?'最初に送った手紙を読んでもらえたことも、覚えています。':'';
  const body=[intro,v[roles[i]],recalled,FINALE_LETTER_CODAS[who][i]].filter(Boolean).join('\n\n');
  return {id:`finale_${s.night}_${who}_${i+1}`,who,role:roles[i],subject:FINALE_LETTER_TITLES[who][i],body,order:i+1};
 });
 const fragments=others.map((x,i)=>({who:x.who,text:FINALE_VOICES[x.who].fragment,order:i+1}));
 return {night:s.night,announcedNight:s.finale.announcedNight,announcement:FINALE_ANNOUNCEMENTS[s.finale.announcementChoice??1],letters,fragments,stats:null,flow:JSON.parse(JSON.stringify(FINALE_NIGHT_FLOW))};
}
function finaleResponses(who){return FINALE_REPLY_VOICES[who]||[
 '最後のお便りをありがとうございます。あなたの言葉を、この夜の放送日誌に残します。',
 'ここで言葉を交わせた夜があったことを、大切に思います。どうか、よい明日を。',
 '最後まで読ませていただきました。この周波数からの返事は、これで最後です。'
];}
function finaleStart(){if(s.phase!=='final_intro'||s.finale?.status!=='announced')return;finaleCommit(()=>{s.finale.snapshot=finaleMakeSnapshot();s.finale.status='on_air';s.finale.stage=0;s.finale.replies=[];s.phase='final_broadcast';s.tab='studio';})}
function finaleChooseOpening(i){if(s.phase!=='final_broadcast'||s.finale.stage!==0||!FINALE_OPENINGS[i])return;finaleCommit(()=>{s.finale.openingChoice=i;s.finale.stage=1})}
function finaleRespond(i){const f=s.finale,letters=f?.snapshot?.letters||[],index=f.stage-1;if(s.phase!=='final_broadcast'||index<0||index>=letters.length||!finaleReplyOptions(letters[index].who,finaleRoleOf(letters[index],index))[i])return;finaleCommit(()=>{f.replies[index]=finaleReplyOptions(letters[index].who,finaleRoleOf(letters[index],index))[i];f.stage++})}
function finaleNextStage(){const f=s.finale;if(s.phase!=='final_broadcast'||f.stage!==(f.snapshot.letters.length+1))return;finaleCommit(()=>{f.stage++})}
function finaleChooseClosing(i){if(s.phase!=='final_broadcast'||s.finale.stage!==s.finale.snapshot.letters.length+2||!FINALE_ENDINGS[i])return;finaleCommit(()=>{s.finale.closingChoice=i})}
function finaleStats(letters){
 const all=[...s.played,...letters];return {totalLetters:all.length,listenerCount:new Set(all.filter(x=>FINALE_VOICES[x.who]).map(x=>x.who)).size,specialCount:(s.special?.history||[]).filter(x=>Number.isInteger(x.night)&&x.night<s.night).length,finalNight:s.night};
}
function finaleComplete(){const f=s.finale;if(s.phase!=='final_broadcast'||f.stage!==f.snapshot.letters.length+2||f.closingChoice===null||f.replies.length!==f.snapshot.letters.length)return;
 finaleCommit(()=>{
  f.snapshot.opening=FINALE_OPENINGS[f.openingChoice??0];f.snapshot.closing=FINALE_ENDINGS[f.closingChoice][1];f.snapshot.song=['夜が明けるまえの手紙','一通ずつ、灯りを消す'];
  f.snapshot.stats=finaleStats(f.snapshot.letters);
  for(const [i,x] of f.snapshot.letters.entries())if(!s.played.some(p=>p.id===x.id)){s.played.push({...x,response:f.replies[i],night:s.night});log('最終放送',`${NAMES[x.who]}「${x.subject}」を紹介した。`)}
  log('閉局','『午前二時の周波数』は、この夜の放送をもって終了した。');
  f.status='completed';f.stage=f.snapshot.letters.length+3;f.finalizedAt=new Date().toISOString();s.phase='final_complete';s.tab='studio';
 });
}
function finaleIntroduction(){return `<section class="panel finale-panel"><div class="overline">01:55 / THE LAST NIGHT · 第${s.night}夜</div><h2>いつか、マイクを置く夜。</h2><p>昨日、番組の終了を知らせた。机には、この周波数を知っている人たちから届いた便箋がある。</p><p>今夜、午前3時を迎えれば、『午前二時の周波数』は本当に閉局する。誰かが放送を引き継ぐことはない。</p><p>けれど、便箋を書いてくれた人たちの明日は、番組の外でも続いていく。</p><div class="notice">開始前にバックアップを保存することをおすすめします。最終回の途中でも進行は自動保存されます。</div><div class="actions"><button class="btn secondary" onclick="${activeProfile==='reader'?'downloadReaderSave()':'downloadSave()'}">バックアップを保存</button><button class="btn" onclick="finaleStart()">最後の放送を始める →</button></div></section>`}
function finaleFlowLine(text,label='放送卓の風景'){
 return text?`<div class="finale-breath"><div class="overline">${esc(label)}</div><p>${fmt(text)}</p></div>`:'';
}
function finaleHeardReply(i){const v=s.finale?.replies?.[i];return v?`<div class="finale-onair-reply"><div class="overline">先ほど、マイクから返した言葉</div><p>${fmt(v)}</p></div>`:'';}
function finaleBroadcast(){const f=s.finale,snap=f.snapshot,letters=snap.letters,stage=f.stage,flow=snap.flow;
 if(stage===0)return `<section class="panel finale-panel"><div class="overline">02:00 / FINAL BROADCAST</div><h2>最後のオープニング</h2><p>赤いON AIRランプが点く。これが最後の点灯になる。</p><div class="finale-options">${FINALE_OPENINGS.map((t,i)=>`<button class="choice" onclick="finaleChooseOpening(${i})">${fmt(t)}</button>`).join('')}</div></section>`;
 if(stage<=letters.length){const i=stage-1,x=letters[i];const leading=flow?(i===0?finaleFlowLine(FINALE_OPENINGS[f.openingChoice??0],'今夜のオープニング')+finaleFlowLine(flow.afterOpening):finaleHeardReply(i-1)+finaleFlowLine(flow.afterLetters?.[i-1])):'';return `<section class="panel finale-panel"><div class="overline">${['02:08','02:23','02:39'][i]||'02:39'} / LAST LETTER ${i+1} / ${letters.length}</div><h2>最後のお便り</h2>${leading}<article class="letter"><div class="letter-title">${esc(NAMES[x.who])}</div><div class="small">${esc(x.subject)}</div><hr class="divider"><div class="letter-text">${fmt(x.body)}</div></article><h3>この声に、最後の言葉を返す</h3><div class="finale-options">${finaleReplyOptions(x.who,finaleRoleOf(x,i)).map((v,j)=>`<button class="choice" onclick="finaleRespond(${j})">${fmt(v)}</button>`).join('')}</div></section>`;}
 if(stage===letters.length+1)return `<section class="panel finale-panel"><div class="overline">02:50 / SMALL VOICES</div><h2>最後に届いた、短い声</h2>${flow?finaleHeardReply(letters.length-1)+finaleFlowLine(flow.afterLetters?.[letters.length-1]):'<p>三通の便箋を読み終えて、まだ机に残っている小さなメッセージを見つけた。</p>'}${snap.fragments.length?snap.fragments.map(x=>`<blockquote class="finale-fragment"><p>${fmt(x.text)}</p><cite>—— ${esc(NAMES[x.who])}</cite></blockquote>`).join(''):'<p>今夜の放送を聴いている誰かが、街のどこかにいる。その名前までは、ここからわからない。</p>'}<div class="actions"><button class="btn" onclick="finaleNextStage()">最後の一曲へ →</button></div></section>`;
 return `<section class="panel finale-panel"><div class="overline">02:55 / LAST SONG</div><h2>最後の一曲と、挨拶</h2>${flow?finaleFlowLine(flow.afterFragments):''}<p>♪ 夜が明けるまえの手紙</p><p class="small">架空の曲のタイトルです。音声は再生されません。</p><p>時計の針が、三時に近づいている。閉局を告げる言葉を選んでください。</p><div class="finale-options">${FINALE_ENDINGS.map(([name,t],i)=>`<button class="choice ${f.closingChoice===i?'selected':''}" onclick="finaleChooseClosing(${i})"><strong>${esc(name)}</strong><br>${fmt(t)}</button>`).join('')}</div><div class="actions"><button class="btn" ${f.closingChoice===null?'disabled':''} onclick="finaleComplete()">03:00 — ON AIRの灯りを消す</button></div></section>`;
}
function finaleEndingText(){return `『午前二時の周波数』は、今夜の放送をもって終了しました。\n\nあなたが紹介した声は、ここに残っています。\nあの人たちの暮らしは、番組の外で明日へ続いていきます。`}
function finaleCompletedView(){const f=s.finale;return `<section class="panel finale-panel finale-finished"><div class="overline">03:00 / OFF AIR — FOREVER</div><h2>午前二時の周波数、閉局。</h2><p>${fmt(finaleEndingText())}</p><div class="finale-record"><strong>第${f.finalNight}夜</strong><span>最後の3時、マイクの灯りは消えました。</span></div><div class="actions"><button class="btn secondary" onclick="finaleReview()">最終放送をもう一度読む</button><button class="btn" onclick="finaleOpenKeepsakes()">終えた証を保存する</button><button class="btn secondary" onclick="finaleRestart()">はじめから</button></div></section>`}
let finaleView='complete';
function finaleReview(){if(s.finale?.status!=='completed')return;finaleView='review';s.tab='studio';render()}
function finaleOpenKeepsakes(){if(s.finale?.status!=='completed')return;finaleView='keepsakes';s.tab='studio';render()}
function finaleArchiveHtml(){const f=s.finale,snap=f.snapshot;return `<section class="panel finale-panel"><div class="overline">FINAL BROADCAST / 第${snap.night}夜</div><h2>最後の放送日誌</h2><p class="finale-script">${fmt(snap.opening||'')}</p>${snap.letters.map((x,i)=>`<article class="letter"><h3>${esc(NAMES[x.who])}「${esc(x.subject)}」</h3><div class="letter-text">${fmt(x.body)}</div><div class="quote">${fmt(f.replies[i]||'')}</div></article>${snap.flow?finaleFlowLine(snap.flow.afterLetters?.[i]):''}`).join('')}<h3>短い声の連なり</h3>${snap.fragments.map(x=>`<blockquote class="finale-fragment"><p>${fmt(x.text)}</p><cite>—— ${esc(NAMES[x.who])}</cite></blockquote>`).join('')}${snap.flow?finaleFlowLine(snap.flow.afterFragments):''}<p>♪ ${esc(snap.song?.[0]||'')}</p><p>${fmt(snap.closing||'')}</p><div class="overline">03:00 / OFF AIR</div><p>${fmt(finaleEndingText())}</p><div class="actions"><button class="btn secondary" onclick="finaleBackToComplete()">完結画面へ戻る</button></div></section>`}
function finaleBackToComplete(){finaleView='complete';s.tab='studio';render()}
function finaleKeepsakes(){return `<section class="panel finale-panel"><div class="overline">AFTER THE LAST BROADCAST / 記念品</div><h2>この夜を、手元に残す。</h2><p>番組は終わりましたが、最後の言葉は保存できます。画像はこの端末で作られ、外部へは送信されません。</p><div class="actions"><button class="btn" onclick="finaleExportPNG('certificate',0)">最終放送の記録証明書（PNG）</button></div><h3>最後のお便り</h3>${s.finale.snapshot.letters.map((x,i)=>`<p>第${i+1}通 · ${esc(NAMES[x.who])}「${esc(x.subject)}」</p><button class="btn secondary" onclick="finaleExportPNG('letter',${i})">${i+1}通目の便箋を保存（PNG）</button>`).join('')}<div id="finale-image-preview" class="finale-image-preview" aria-live="polite"></div><div class="actions"><button class="btn secondary" onclick="finaleBackToComplete()">完結画面へ戻る</button></div></section>`}
function finaleRestart(){if(s.finale?.status!=='completed')return;if(!confirm('このモードの完結した記録を最初からやり直しますか？\n復元する場合は、先にバックアップを保存してください。'))return;if(!confirm('最終確認：このモードの放送日誌と最終放送の記録が上書きされます。別モードの記録は消しません。よろしいですか？'))return;
 const prior=JSON.stringify(s),r=activeProfile==='reader';
 if(r){const fresh=makeReaderState(defaultState());s=fresh;try{readerSaveRaw(JSON.stringify(s));localStorage.removeItem(READER_POSITION_KEY)}catch(e){s=JSON.parse(prior);alert('保存に失敗しました。元の記録を維持します。');return}}
 else{s=defaultState();s.guidance.welcomeSeen=true;if(!save()){s=JSON.parse(prior);alert('保存に失敗しました。元の記録を維持します。');return}}
 finaleView='complete';lastViewKey=null;render();
}
function finaleReaderCompletedPage(page){
 const snap=s.finale?.snapshot;if(!snap)return '<p>最終回の原稿を読み込めません。</p>';
 const f=s.finale,r=s.reader,i=r.viewIndex;
 const html=`<section class="reader-paper finale-reader"><div class="reader-page-head"><div class="overline">FINAL BROADCAST / 第${snap.night}夜</div><h2>いつか、マイクを置く夜。</h2><p>閉局を知らせた翌夜。放送室には最後の便箋が並んでいた。</p><p class="reader-mic">${fmt(snap.opening)}</p><p class="reader-dj-voice">毎晩ここへ来ると、まだ知らない誰かの話が待っていた。今夜は、その最後を読む。</p></div>${snap.letters.map((x,j)=>`<article class="reader-letter"><div class="overline">LAST LETTER ${j+1} / ${snap.letters.length}</div><h3>${esc(NAMES[x.who])}「${esc(x.subject)}」</h3><div class="reader-letter-body">${fmt(x.body)}</div><div class="reader-response-label">パーソナリティからの返答</div><div class="reader-response">${fmt(f.replies[j])}</div></article>${snap.flow?finaleFlowLine(snap.flow.afterLetters?.[j]):''}`).join('')}<section class="reader-ending"><h3>まだ机にある、小さな声</h3>${snap.fragments.map(x=>`<blockquote class="finale-fragment"><p>${fmt(x.text)}</p><cite>—— ${esc(NAMES[x.who])}</cite></blockquote>`).join('')}${snap.flow?finaleFlowLine(snap.flow.afterFragments):''}<p>♪ ${esc(snap.song?.[0]||'')}</p><p class="reader-dj-voice">誰かの明日について、こちらが結末を書くことはできない。それでいいんだと思う。</p><p>${fmt(snap.closing)}</p><div class="overline">03:00 / OFF AIR — FOREVER</div><p>${fmt(finaleEndingText())}</p></section><div class="reader-actions"><button class="btn secondary" onclick="readerGotoPage(${Math.max(0,i-1)})">← 前の夜</button><button class="btn" onclick="finaleReaderKeepsake()">終えた証を保存する</button><button class="btn secondary" onclick="finaleRestart()">はじめから</button></div><div id="finale-reader-extra"></div></section>`;
 return `<div id="reader-page-top"></div>${readerNightNavigation(r,i)}${html}${readerReaderTools()}`;
}
function finaleReaderKeepsake(){const el=document.getElementById('finale-reader-extra');if(el){el.innerHTML=`<section class="reader-paper"><h3>終えた証を保存する</h3><div class="actions"><button class="btn" onclick="finaleExportPNG('certificate',0)">記録証明書</button>${s.finale.snapshot.letters.map((x,i)=>`<button class="btn secondary" onclick="finaleExportPNG('letter',${i})">${i+1}通目の便箋</button>`).join('')}</div><div id="finale-image-preview"></div></section>`;el.scrollIntoView({block:'nearest'});}}
function finaleReaderProduce(){if(activeProfile!=='reader'||readerBatch||!['final_intro','final_broadcast'].includes(s.phase))return;
 const backup=JSON.stringify(s),r=s.reader;readerBatch=true;
 try{
  if(s.phase==='final_intro'){s.finale.snapshot=finaleMakeSnapshot();s.finale.status='on_air';s.phase='final_broadcast';s.finale.stage=0;}
  const f=s.finale;f.openingChoice=1;const snap=f.snapshot;snap.opening=FINALE_OPENINGS[1];f.replies=snap.letters.map((x,i)=>finaleReplyOptions(x.who,finaleRoleOf(x,i))[0]);f.closingChoice=0;snap.closing=FINALE_ENDINGS[0][1];snap.song=['夜が明けるまえの手紙','一通ずつ、灯りを消す'];snap.stats=finaleStats(snap.letters);
  for(const [i,x] of snap.letters.entries())if(!s.played.some(p=>p.id===x.id)){s.played.push({...x,response:f.replies[i],night:s.night});log('最終放送',`${NAMES[x.who]}「${x.subject}」を紹介した。`)}
  log('閉局','『午前二時の周波数』は、この夜の放送をもって終了した。');
  f.status='completed';f.stage=snap.letters.length+3;f.finalizedAt=new Date().toISOString();s.phase='final_complete';
  if(!r.pages.some(p=>p.isFinale))r.pages.push({night:s.night,isFinale:true,letterIds:snap.letters.map(x=>x.id),interludes:[],song:snap.song});
  r.viewIndex=r.pages.length-1;r.scrollY=0;readerBatch=false;
  if(!save())throw Error('保存容量が不足しています。読書記録をバックアップしてください');
  readerSavePosition();render();window.scrollTo(0,0);
 }catch(e){readerBatch=false;s=JSON.parse(backup);console.error('finale reader save failed',e);alert('最終放送を保存できませんでした。前の状態に戻しました。\n'+e.message);render();}
}
function finaleImageLayouts(kind,index){
 const snap=s.finale?.snapshot;if(!snap)return [];
 if(kind==='certificate')return [{kind:'certificate',title:'FINAL BROADCAST',body:[],data:snap.stats}];
 if(kind!=='letter'||!snap.letters[index])return [];
 const x=snap.letters[index],width=1200,height=1600,margin=115,fontSize=33,lineHeight=56;
 const measure=document.createElement('canvas').getContext('2d');measure.font=`${fontSize}px "Yu Mincho","Noto Serif CJK JP",serif`;
 const lines=[];for(const para of x.body.split('\n')){
  if(para===''){lines.push('');continue;}
  let part='';for(const ch of para){if(measure.measureText(part+ch).width>width-2*margin&&part){lines.push(part);part=ch;}else part+=ch;}if(part)lines.push(part);
 }
 const perPage=12; // 署名と本文が重ならないよう、1ページの最大行数を制限
 const pages=[];for(let k=0;k<lines.length;k+=perPage)pages.push({kind:'letter',index,part:pages.length,total:0,lines:lines.slice(k,k+perPage),entry:x});
 if(!pages.length)pages.push({kind:'letter',index,part:0,total:1,lines:[],entry:x});
 pages.forEach(x=>x.total=pages.length);return pages;
}
function finaleDrawPage(layout){
  const w=1200,h=1600,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');
  const C={navy:'#19283c',ink:'#2c3f53',paper:'#ede2d0',muted:'#6c655c',accent:'#978268',line:'#bca98b',dust:'#998369'};
  g.fillStyle=C.navy;g.fillRect(0,0,w,h);
  // Shared papers, same station palette as A. Texture deliberately subtle.
  g.fillStyle=C.paper;g.fillRect(65,65,1070,1470);
  let seed=1719;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<5600;i++){
    const x=67+r()*1066,y=67+r()*1466;
    g.fillStyle=r()>.5?'rgba(134,106,74,0.020)':'rgba(255,255,255,0.075)';
    g.fillRect(x,y,1+r()*2.1,1+r()*2.1);
  }
  g.strokeStyle=C.line;g.lineWidth=2;g.strokeRect(88,88,1024,1424);
  g.strokeStyle='rgba(185,166,137,.35)';g.lineWidth=1;g.strokeRect(99,99,1002,1402);
  function text(t,x,y,size,color=C.ink,face='serif',align='left'){
    g.save();g.fillStyle=color;g.textAlign=align;g.textBaseline='alphabetic';g.font=`${size}px ${face}`;g.fillText(t,x,y);g.restore();
  }
  function stroke(x1,y1,x2,y2,color=C.line,lw=2){g.save();g.strokeStyle=color;g.lineWidth=lw;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.restore()}
  text('SOMEWHERE ON AIR',120,156,25,C.muted,'sans-serif');
  text(`第${s.finale.snapshot.night}夜 · LAST NIGHT`,1075,156,24,C.muted,'sans-serif','right');
  stroke(120,184,1080,184,'rgba(167,146,112,.53)',1.5);
  if(layout.kind==='certificate'){
    text('FINAL BROADCAST',120,260,28,C.accent,'sans-serif');
    text('午前二時の周波数',120,344,60,C.ink,'serif');
    text('最終放送 記録証明書',120,401,35,C.ink,'serif');
    stroke(120,474,1080,474);
    text('閉局した夜',120,555,27,C.muted,'sans-serif');
    text(`第${layout.data.finalNight}夜`,120,671,94,C.ink,'serif');
    text('03:00 / OFF AIR',123,715,25,C.muted,'sans-serif');
    stroke(120,785,1080,785,C.line);
    const stats=[['紹介したお便り',`${layout.data.totalLetters}通`],['放送で出会ったリスナー',`${layout.data.listenerCount}人`],['特別・記念放送',`${layout.data.specialCount}回`]];
    let y=867;for(const [k,v] of stats){text(k,120,y,28,C.muted,'sans-serif');text(v,1080,y+5,43,C.ink,'serif','right');stroke(120,y+35,1080,y+35,'rgba(167,146,112,.40)',1);y+=116;}
    text('最後に声を届けてくれた人',120,1268,27,C.muted,'sans-serif');
    let names=s.finale.snapshot.letters.map(x=>NAMES[x.who]).join('・')||'—';
    let font=33;g.font=`${font}px serif`;while(font>22&&g.measureText(names).width>945){font--;g.font=`${font}px serif`}
    text(names,120,1315,font,C.ink,'serif');
    text('番組は終わっても、それぞれの明日は続いていきます。',120,1400,25,C.muted,'serif');
  } else {
    const ent=layout.entry;
    text('最後のお便り',120,248,27,C.accent,'serif');
    let font=47;g.font=`${font}px serif`;while(font>24&&g.measureText(ent.subject).width>950){font--;g.font=`${font}px serif`};
    text(ent.subject,120,317,font,C.ink,'serif');
    text(`ラジオネーム：${NAMES[ent.who]}`,120,385,30,C.muted,'sans-serif');
    text(`LAST LETTER 0${layout.index+1}`,120,442,23,C.muted,'sans-serif');
    text(`PAGE ${layout.part+1}/${layout.total}`,1080,442,23,C.muted,'sans-serif','right');
    stroke(120,473,1080,473,C.line);
    g.fillStyle=C.ink;g.font='33px "Yu Mincho","Noto Serif CJK JP",serif';
    let y=545;for(const line of layout.lines){g.fillText(line,120,y);y+=56;}
    // Keep the signature clear of long text and continuation pages.
    if(layout.part===layout.total-1){
       const signatureY=Math.max(1200,Math.min(1350,y+95));
       stroke(788,signatureY-74,1078,signatureY-74,'rgba(167,146,112,.45)',1);
       text(`—— ${NAMES[ent.who]}`,1060,signatureY,29,C.ink,'serif','right');
    }
  }
  stroke(120,1440,1080,1440,'rgba(167,146,112,.35)',1);
  text('03:00 / OFF AIR',120,1480,23,C.muted,'sans-serif');
  text('SOMEWHERE ON AIR',1080,1480,21,C.muted,'sans-serif','right');
  return c;
}
function finaleExportPNG(kind,index){
 if(s.finale?.status!=='completed')return;
 try{const layouts=finaleImageLayouts(kind,index);if(!layouts.length)return;const el=document.getElementById('finale-image-preview');if(el)el.replaceChildren();
  // Android は複数ファイル自動保存を制限しやすいため、ページごとに保存ボタンを提示。
  layouts.forEach((layout,i)=>{
   const canvas=finaleDrawPage(layout),url=canvas.toDataURL('image/png');
   if(el){const wrap=document.createElement('div');const img=document.createElement('img');img.src=url;img.alt=kind==='certificate'?'最終放送記録証明書':`${NAMES[layout.entry.who]}からの最後の便箋 ${i+1}ページ目`;img.className='finale-preview-img';wrap.append(img);const button=document.createElement('button');button.className='btn secondary';button.type='button';button.textContent=layouts.length>1?`この画像の${i+1}ページ目を保存`:'この画像を保存';button.onclick=()=>finaleDownloadData(url,kind,index,i);wrap.append(button);el.append(wrap);}
   else if(layouts.length===1)finaleDownloadData(url,kind,index,i);
  });
  if(el)el.scrollIntoView({block:'nearest',behavior:'smooth'});
 }catch(e){console.error(e);alert('画像の生成に失敗しました。\n'+e.message)}
}
function finaleDownloadData(url,kind,index,part){const a=document.createElement('a');a.href=url;a.download=kind==='certificate'?`radio_2am_final_certificate_n${s.finale.finalNight}.png`:`radio_2am_last_letter_${index+1}_n${s.finale.finalNight}_p${part+1}.png`;document.body.append(a);a.click();a.remove();}
if(s.finale?.status==='completed')finaleView='complete';
if(!['final_intro','final_broadcast','final_complete'].includes(s.phase))nightLetters(s.night);render();


// 第3章（新リスナーの初登場と50夜記念を経た、51夜目からの14夜）
function chapter3Intro(){
 const n=s.night,idx=chapter3Offset(n),theme=CH3_DAYS[idx];
 const scenes=[
  '昨夜の放送から、街ではまた一日が過ぎた。',
  '机の上の紙が、一枚ずつ新しい順に並べられる。',
  '窓の向こうはまだ暗い。誰かはもう朝の準備を始めている。',
  '誰かが送った封筒が、今夜もこの机に届いている。',
  'スタジオの静けさの中で、次の便箋を手に取る。',
  'いつもと同じ時間でも、届く言葉は少しずつ違う。'
 ];
 const first=idx===0;
 const initial=first?'新しい声が三つ、ラジオに加わった。\n\n知らない人だった誰かが、今日も自分の仕事や学校へ向かっている。':scenes[(idx-1)%scenes.length];
 const text=initial+'\n\n'+theme[1]+(first?'\n\n第3章「変わらないもの、変わっていくもの」。今夜も、まだ知らないことが多い。':'');
 const note=first?'<div class="notice">新旧のリスナーたちが、それぞれの暮らしから手紙を送ります。読まれなかった便りの向こうでも、人生は続きます。</div>':'';
 return `<section class="panel chapter3-panel"><div class="overline">CHAPTER THREE / NIGHT ${n} · 01:47</div><h2>${esc(theme[0])}</h2><p>${fmt(text)}</p>${note}<div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function chapter3After(){
 const n=s.night,idx=chapter3Offset(n),scenes=[
  '誰かの暮らしが変わったことは、いつも大きなニュースになるわけではない。',
  '読まれなかったお便りの送り主にも、今夜の食事と明日の予定がある。',
  '同じ街の灯りが、一つずつ消えていった。',
  '前の手紙と違うことを書いた人も、書かなかった人もいる。',
  '雨の匂いが残る通りにも、普段どおりの朝が来る。',
  '机の上には、言いかけたままの文章が残っている。',
  '今夜の返事が届くころには、誰かはもう別のことを考えているかもしれない。',
  '窓の外を、遅い車の明かりが一つ通り過ぎた。',
  '誰かの小さな選択を、この局がすべて知ることはない。',
  '手紙をしまう音が、曲の終わったスタジオに響いた。',
  '今夜は、答えを急がずに置いておける話もあった。',
  '離れた街のいくつかの窓では、まだ灯りがともっている。',
  '読んだ便箋と、読まなかった便箋が、別々の束になった。',
  '窓の向こうには、この局の知らない明日がある。'
 ];
 const endings=[
  'マイクの灯りを消す。次の夜にも、また新しい便箋が届くだろう。',
  'スタジオを片づける間にも、誰かの一日は先へ進んでいる。',
  '少し冷めた飲み物を置いて、次の放送の準備を始める。',
  '時計は午前三時を指している。まだ話していないことは、たくさんある。',
  '手紙をそろえて、机の上に少しの空きを作った。',
  '放送は終わった。それぞれの朝は、ここからも続く。',
  '最後の原稿を閉じる。今夜の先のことは、まだ誰にもわからない。'
 ];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · CHAPTER THREE</div><h2>今夜の放送が終わった</h2><p>${fmt(scenes[idx]+'\n\n'+endings[idx%endings.length])}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">紹介しなかったお便り：${Math.max(0,nightLetters(n).length-s.chosen.length)}通</div><div class="actions"><button class="btn" onclick="nextNight()">${idx===CH3_DAYS.length-1?'第3章を振り返る →':'次の夜へ進む →'}</button></div></section>`;
}
function chapter3Complete(){
 const c=s.chapter3;
 const last=c.startNight+CH3_DAYS.length-1;
 const items=Object.keys(CH3_BEATS).map(id=>{
  const heard=s.played.filter(x=>x.night>=c.startNight&&x.night<=last&&x.who===id);
  if(!heard.length)return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">この章ではお便りを放送しなかった。本人の暮らしについて、番組はまだ知らないことが多い。</div></div>`;
  const l=heard.at(-1);
  return `<div class="listener"><b>${esc(NAMES[id])}</b><div class="small">第${l.night}夜に紹介した「${esc(l.subject)}」が、今は最後に聴いた声。</div></div>`;
 }).join('');
 const prose='十四夜が過ぎた。\n\n新しい名前も、昔から届いている名前も、便箋の数だけ異なる暮らしを持っている。\n\n返事を送った手紙も、紹介しなかった手紙もある。\n\nそれでも、番組の外には今夜とは違う明日がある。';
 return `<section class="panel end chapter3-panel"><div class="overline">CHAPTER THREE / FOURTEEN NIGHTS</div><h2>それぞれの窓</h2><p>${fmt(prose)}</p><hr class="divider"><h3>放送で知ったこと</h3><p class="muted">実際に紹介したお便りだけを振り返ります。本人だけが知っている決断は表示しません。</p>${items}<div class="notice">第3章完了。3つの章を経た性格・記憶・人間関係・人生の目標は、これからの通常放送にも引き継がれます。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を読む</button><button class="btn" onclick="beginAfterChapter3()">通常放送を続ける →</button><button class="btn secondary" onclick="setTab('settings')">バックアップを保存</button></div></section>`;
}
function beginAfterChapter3(){
 if(s.phase!=='chapter3_complete'||chapter3Offset(s.night)!==CH3_DAYS.length-1)return;
 s.night++;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
 nightLetters(s.night);save();render();
}



// v4.9.8 第4章表示。DJが知らない私生活を既知のものとして語らない。
function chapter4Intro(){
 const n=s.night,d=CH4_DAYS[n-79];
 const opening=CH4_INTRO_SCENES[n];
 const text=opening+'\n\n'+d[1];
 const notice=n===79?'<div class="notice">第4章「声の届かない朝にも」。章のお便りも、いつものお便りも紹介候補です。</div>':'';
 return `<section class="panel chapter4-panel"><div class="overline">CHAPTER FOUR / NIGHT ${n} · 01:48</div><h2>${esc(d[0])}</h2><p>${fmt(text)}</p>${notice}${specialPlanningPanel()}<div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function chapter4After(){
 const n=s.night,d=CH4_DAYS[n-79],scene=CH4_AFTER_SCENES[n];
 const heard=(s.played||[]).filter(p=>p.night===n&&typeof p.id==='string'&&p.id.startsWith('chapter4_'));
 const details=heard.map(p=>{const m=/^chapter4_(\d+)_([a-z]+)$/.exec(p.id);return m?CH4_HEARD_DETAILS[`${m[1]}:${m[2]}`]:null}).filter(Boolean);
 // 第4章の手紙を選ばなかった夜にも、通常のお便りの余韻を損なわない。
 const middle=details.length?details.slice(0,2).join('\n\n'):scene[1];
 const text=scene[0]+'\n\n'+middle+'\n\n'+scene[2];
 return `<section class="panel end chapter4-panel"><div class="overline">03:00 / OFF AIR · CHAPTER FOUR</div><h2>${esc(d[0])}</h2><p>${fmt(text)}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">紹介しなかったお便り：${Math.max(0,nightLetters(n).length-s.chosen.length)}通</div><div class="actions"><button class="btn" onclick="nextNight()">${n===92?'第4章を振り返る →':'次の夜へ進む →'}</button></div></section>`;
}
function chapter4Complete(){
 const seen=(s.played||[]).filter(p=>p.night>=79&&p.night<=92&&p.id?.startsWith('chapter4_'));
 const shown=new Set(seen.map(p=>p.who));
 const entries=CH4_PEOPLE.map(who=>{const mails=seen.filter(p=>p.who===who);const latest=mails.at(-1);return `<div class="listener"><b>${esc(NAMES[who])}</b><div class="small">${latest?`第${latest.night}夜の「${esc(latest.subject)}」がこの章で紹介した便り。`:'この章ではお便りを紹介しなかった。局の知らない一日も続いている。'}</div></div>`}).join('');
 const text='午前三時。放送卓には、今夜の原稿が重ねられている。\n\n読まれた手紙と、読まれなかった手紙。そこに書かれなかった出来事も、きっとたくさんある。\n\n窓の向こうでは、誰かが朝の支度を始めている。\n\nこの局の知らない時間にも、それぞれの暮らしは続いていく。\n\n机の上には、次の放送のための白い紙が一枚残されていた。';
 return `<section class="panel end chapter4-panel"><div class="overline">CHAPTER FOUR / FOURTEEN NIGHTS</div><h2>声の届かない朝にも</h2><p>${fmt(text)}</p><hr class="divider"><h3>この章で紹介した声</h3><p class="muted">実際に放送で紹介した手紙だけを振り返ります。</p>${entries}<div class="notice">第4章が終わっても番組は続きます。第93夜から、また新しい放送へ。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を読む</button><button class="btn" onclick="beginAfterChapter4()">次の夜へ進む →</button><button class="btn secondary" onclick="setTab('settings')">バックアップを保存</button></div></section>`;
}
function beginAfterChapter4(){
 if(s.phase!=='chapter4_complete'||s.night!==92)return;
 s.night=93;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
 nightLetters(s.night);save();render();
}
