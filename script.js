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
if(!s.regular)s.regular=createRegularState();
if(!s.quiet)s.quiet=createQuietState();
if(!s.radioCulture)s.radioCulture=createRadioCultureState();
if(!s.radioMemory)s.radioMemory=createRadioMemoryState39();
if(!s.dailyThreads)s.dailyThreads=createDailyThreadsState41();
if(!s.relationThreads)s.relationThreads=createRelationThreadsState42();
if(!s.longEcho43)s.longEcho43=createLongEchoState43();
if(!s.surprise46)s.surprise46=createSurpriseState46();
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
  migrateQuiet(data);
  migrateRadioCulture(data);
  migrateRadioMemory39(data);
  migrateDailyThreads41(data);
  migrateRelationThreads42(data);
  migrateLongEcho43(data);
  migrateSurprise46(data);
  migrateChapter2(data);
  migrateChapter3(data);
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
 if(!r.pages.every(p=>p&&Number.isInteger(p.night)&&p.night>=1&&Array.isArray(p.letterIds)&&p.letterIds.length>0&&p.letterIds.every(id=>typeof id==='string')&&Array.isArray(p.interludes)&&Array.isArray(p.song)))return false;
 const byNight=new Map();for(const x of data.played){if(!x||!Number.isInteger(x.night)||typeof x.id!=='string')continue;if(!byNight.has(x.night))byNight.set(x.night,new Set());byNight.get(x.night).add(x.id)}
 if(r.pages.some(p=>p.letterIds.some(id=>!byNight.get(p.night)?.has(id))))return false;
 if(!r.dj||typeof r.dj!=='object')r.dj={tags:[],lastPlanNight:-999};
 if(!Array.isArray(r.dj.tags))r.dj.tags=[];
 if(!Number.isInteger(r.viewIndex)||r.viewIndex<0||r.viewIndex>=r.pages.length)r.viewIndex=r.pages.length-1;
 if(!Number.isFinite(r.scrollY)||r.scrollY<0)r.scrollY=0;
 return true;
}
// v4.8.29: タブと日誌ページは表示だけの状態。重い本編セーブに触れない。
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
   // v4.8.29: 旧版で受信済み・未紹介の日常便りも、新しい第3返答を表示する。
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
 if(!result.special && isGenericReplySet(result) && l.replyVersion!==REPLY_CONTENT_VERSION){
   const choices=replyTopicChoices(result);
   if(!Array.isArray(choices)||choices.length<3)throw new Error('通常返答の生成に失敗しました: '+id);
   result.choices=choices;
   if(s.regular?.letterArchive?.[id]===l){
     l.choices=choices.map(x=>[...x]);
     l.replyVersion=REPLY_CONTENT_VERSION;
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
  const picked=[...new Set([...order,...aftermath,...echoes,...carried,...(climateMail?[climateMail]:[])])].filter(id=>{
    const l=letterDB[id]||s.regular?.letterArchive?.[id];
    // 自律投稿だけを控える。物語の手書きイベントには介入しない。
    return l&&(!l.regular||l.chapter2||l.chapter3||!quietScheduledFor(l.who,n));
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
  if(s.phase==='after'||['complete','chapter2_complete','chapter3_complete'].includes(s.phase))return 'finished';
  if(s.phase==='intro'||s.phase==='prepare')return 'preparing';
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
function startNight(){prepareStepUI='letters';prepareStepNight=s.night;s.phase='prepare';s.tab='studio';nightLetters(s.night);for(const id of s.letterSets[s.night]||[])letter(id);save();render()}
function beginBroadcast(){
 if(s.phase!=='prepare'||!s.chosen.length)return;
 if(s.broadcastModePref==='letters')s.opening=automaticStylePick('opening',opening.length);
 if(!Number.isInteger(s.opening)||s.opening<0||s.opening>=opening.length)return;
 s.nightBroadcastMode=s.broadcastModePref;
 s.guidance.seen.choose=true;recordOpening();s.phase='broadcast';s.cursor=0;save();render();
}
function chooseReply(i){let l=letter(s.current);let c=l.choices[i];applyReply(l,c[2],c[1])}
function finishBroadcast(){
 if(s.phase!=='broadcast'||s.song===null||s.song<0||s.song>=songs.length||!Number.isInteger(s.broadcastStyle.closing)||s.broadcastStyle.closing<0||s.broadcastStyle.closing>=STATION_CLOSINGS.length)return;
 s.phase='after';
 log('曲',`「${songs[s.song][0]}」を流した。`);
 log('エンディング',STATION_CLOSINGS[s.broadcastStyle.closing][1]);
 s.broadcastStyle.history.push(nightStyleRecord());
 if(s.broadcastStyle.history.length>120)s.broadcastStyle.history.splice(0,s.broadcastStyle.history.length-120);
 applySongMood();radioCultureAfterBroadcast(s.night);radioMemoryAfterBroadcast39(s.night);longEchoAfterBroadcast43(s.night);const omitted=nightLetters(s.night).filter(id=>!s.chosen.includes(id));log('未紹介',omitted.length?omitted.map(id=>NAMES[letter(id).who]).join('、')+'のお便りは放送で紹介されなかった。':'今夜届いたお便りはすべて紹介した。');updatePendingLetters();if(s.night<=14)advanceWorld();if(s.night>=29)specialBeginAnnouncement(s.night);simulateDailyLives(s.night);newListenerAfterDaily(s.night);dailyThreadsAfterWorld41(s.night);relationThreadsAfterWorld42(s.night);surpriseAfterWorld46(s.night);simulateSocialWorld(s.night);quietAfterDaily(s.night);if(s.night<=14){lifeAfterDaily(s.night);simulateMicroWorld(s.night)}else {regularAfterWorld(s.night);chapter2AfterWorld(s.night);chapter3AfterWorld(s.night);specialProcessNight(s.night);storyProgramsAfterWorld(s.night)}save();render()}
function nextNight(){
  if(s.phase==='after')s.guidance.seen.after=true;
  if(chapter3Offset(s.night)===CH3_DAYS.length-1&&s.chapter3?.finished){s.phase='chapter3_complete';save();render();return}
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
  if(i>=0)log('つなぎの一言',STATION_INTERLUDES[i][1]);dirty=true;
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
 return `<section class="night-style-note"><div class="overline">TONIGHT'S VOICE / 今夜の放送の言葉</div><p>始まりの一言：${esc(now.opening)}</p>${now.interludes.length?`<p class="small">お便りの間に添えた言葉：${now.interludes.length}回</p>`:'<p class="small">手紙の合間には、言葉を足さない夜でした。</p>'}<p>最後の一曲：「${esc(now.song)}」</p><p>締めの言葉：${esc(now.closing)}</p><p class="small">言葉に点数や正解はありません。放送日誌にも記録されます。</p></section>`;
}
const GUIDE_SECTIONS=[
  ['enjoy','どんなゲーム？','真夜中に届くお便りを選び、言葉を返していく、小さなラジオ局の物語です。点数や正解はありません。気になる人の声を覚えたり、少しずつ変わる近況を楽しんでみてください。'],
  ['letters','お便りはどう選ぶ？','すべての手紙を読む必要はありません。今日いちばん気になった声、続きを聞いてみたい人、思わず笑った話を選んでみましょう。紹介しなかった人も、放送の外で生活を続けています。'],
  ['replies','返答の選び方','どれが正解かを探すよりも、あなたなら何を伝えたいかで選んで大丈夫。特別返答は、元の手紙を見ながら言葉を組み立てられます。'],
  ['lives','リスナーたちの暮らし','リスナーたちは仕事や学校へ行き、誰かと会い、迷いながら自分で行動します。忙しかったり、一人で考えたかったりして、しばらくお便りが届かないこともあります。あなたの言葉がきっかけになることはあっても、彼らの人生すべてを決めるわけではありません。'],
  ['history','変化を見つけるには？','放送日誌やリスナーの記録を読み返してみてください。以前は仕事のことばかり話していた人が、いつの間にか好きなことの話をしているかもしれません。気に入った放送には、しおりを付けておけます。'],
  ['style','放送のスタイルは？','「いつもの放送」は挨拶や幕間・曲・締めを自分で選び、「おたより中心」はそれらの選択をおまかせにできます。手紙と返答はどちらも自分で選びます。どれも攻略上の正解ではなく、自分らしいラジオ局を作るための選択です。'],
  ['listening','聴くだけの夜って？','ときには、ラジオ局の向こう側で放送を聴いてみませんか。「聴くだけの夜」では、別のDJがお便りも返答も演出も選びます。あなたは一人のリスナーとして、その夜の放送を小説のように読み進められます。放送画面の「☾ 今夜は聴くだけにする」から始められ、第1夜から読むことも、本編の途中から別の物語として分岐することもできます。読書用の進行と記憶は本編とは別に保存されるので、自分の放送は変わりません。'],
  ['community','番組で生まれるつながり','放送で読まれた話を、その夜実際に聴いていた人が覚えることがあります。何日か後に別の人から似た話題の手紙が届いても、必ず誰かが反応するわけではありません。リスナーたちは放送を聴いていない夜の話までは知りません。']
];
function openGuide(){guideOpen=true;render();document.getElementById('guide-dialog')?.focus()}
function closeGuide(){guideOpen=false;render()}
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
 return `<div class="guide-overlay"><section class="guide-dialog" id="guide-dialog" role="dialog" aria-modal="true" aria-label="${welcome?'はじめに':'ラジオ局の手引き'}" tabindex="-1"><div class="overline">✦ SOMEWHERE ON AIR · ${welcome?'BEFORE THE FIRST NIGHT':'LITTLE HANDBOOK'}</div><h2>${welcome?'このラジオ局で過ごす時間':'ラジオ局の小さな手引き'}</h2>${welcome?`<p>ここには、決まった正解も、目指すべき結末もありません。</p><p>夜ごとに届くお便りを読んで、気になる声を紹介してください。返す言葉は、あなたが伝えたいものを。</p><p>次の夜にはまた別のお便りが届きます。同じ人の、少し違う一日かもしれません。</p><div class="guide-whisper">好きなリスナーを見つける。小さな変化に気づく。何も起こらない夜を楽しむ。</div>`:`<p class="muted">必要になったときだけ、気になる項目を開いてください。攻略の正解ではなく、楽しみ方のヒントを集めました。</p>${GUIDE_SECTIONS.map(([id,title,desc],i)=>`<details class="guide-topic" ${i===0?'open':''}><summary>${esc(title)}</summary><p>${esc(desc)}</p></details>`).join('')}<label class="guide-toggle"><input type="checkbox" ${s.guidance.suppressHints?'checked':''} onchange="toggleHints()"> 操作中の小さなヒントを表示しない</label>`}<div class="actions"><button type="button" class="btn" onclick="${welcome?'closeWelcome()':'closeGuide()'}">${welcome?'今夜の放送を始める →':'放送に戻る'}</button></div></section></div>`;
}
// 公開されたお便りを参照するだけの余韻。内部の感情値や未紹介の出来事は参照しない。
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
function shell(content){let done=s.phase==='complete',done2=s.phase==='chapter2_complete',done3=s.phase==='chapter3_complete',sp=specialActive(s.night);return `<header class="header"><div class="header-identity"><div class="brand">SOMEWHERE ON AIR</div><h1>午前二時の周波数</h1><div class="small">${done?'第1章 14夜 終了':done2?'第2章 14夜 終了':done3?'第3章 14夜 終了':`第${s.night}夜　${regularDayTitle(s.night)}`}</div><div class="climate-meta">${esc(climateCaption(s.night))}</div></div><div class="header-tools" aria-label="放送の補助操作と状態"><button class="guide-launch" type="button" onclick="openGuide()" aria-label="あそび方・手引きを開く">${uiIcon('help')}<span>あそび方</span></button><div class="chip" role="status" aria-label="放送状態">${s.phase==='broadcast'||s.phase==='reply'?'● ON AIR':'◌ OFF AIR'}</div></div></header>${studioScene(s.tab!=='studio'||readerSetupOpen)}<div class="layout"><main id="main">${content}</main><aside class="sidebar"><div class="panel"><div class="overline">BROADCAST DESK</div>${navButtons()}${readerEntry()}</div><div class="panel"><div class="overline">${sp?'特別放送':s.night>=15&&s.night<=28?'第2章':chapter3IsNight(s.night)?'第3章':s.night>=29?'通常放送':'今夜の放送'}</div><div class="status"><span>放送スタイル</span><span>${s.phase==='intro'||s.phase==='prepare'?(s.broadcastModePref==='letters'?'おたより中心':'いつもの放送'):(isLettersMode()?'おたより中心':'いつもの放送')}</span></div><div class="status"><span>紹介枠</span><span>${s.chosen.length} / 3</span></div><div class="progress"><div style="width:${s.chosen.length/3*100}%"></div></div><div class="status"><span>放送済み</span><span>${s.played.filter(x=>x.night===s.night).length}通</span></div><div class="status"><span>保存</span><span>自動保存</span></div></div></aside></div><nav class="bottomnav" aria-label="メニュー">${UI_NAV.map(([id,icon,label])=>`<button type="button" class="${s.tab===id?'active':''}" ${s.tab===id?'aria-current="page"':''} onclick="setTab('${id}')">${uiIcon(icon)}<span class="nav-label">${label}</span></button>`).join('')}</nav><div class="footer">『午前二時の周波数』 · SOMEWHERE ON AIR · v4.8.29</div>`}
function navButtons(){return UI_NAV.map(([id,icon,label])=>`<button type="button" class="navbtn ${s.tab===id?'active':''}" ${s.tab===id?'aria-current="page"':''} onclick="setTab('${id}')">${uiIcon(icon)}<span>${id==='journal'?'放送日誌':id==='settings'?'設定・セーブ':label}</span></button>`).join('')}

function intro(){
  milestoneEnsure(s.night);
  if(s.night>=15&&s.night<=28)return chapter2Intro();
  if(chapter3IsNight(s.night))return chapter3Intro();
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
 const theme=s.night>=15?`<div class="notice">${s.night<=28?'第2章：'+esc(CH2_NIGHTS[s.night][0]):chapter3IsNight(s.night)?'第3章：'+esc(CH3_DAYS[chapter3Offset(s.night)][0]):specialActive(s.night)?'特別放送：'+esc(SPECIAL_THEMES[s.special.planned.themeId].title):'今夜のテーマ：'+esc(regularTheme(s.night)[0])+' · '+esc(regularTheme(s.night)[1])}</div>`:'';
 if(!styleStep){
  return `<section class="panel prepare-panel prepare-letters"><div class="overline">BEFORE BROADCAST / 01:59</div><h2>今夜のお便り</h2>${steps}${studioPrelude()}${theme}${specialSelectionNote}<p class="muted">最大3通を紹介できます。読まなかったお便りの送り主も、明日を生きていきます。まずお便りを選びましょう。</p><div class="prepare-selection-bar" role="status" aria-live="polite"><div class="prepare-selection-count"><strong>紹介予定 ${s.chosen.length} / 3通</strong><span>${esc(selectedNames)}</span></div><button type="button" class="btn" ${s.chosen.length===0?'disabled':''} onclick="prepareUIStage('style')">放送準備へ →</button></div>${ids.map(id=>{let l=letter(id),selected=s.chosen.includes(id);return `<div class="letter"><div class="letter-top"><span class="letter-title">${esc(NAMES[l.who])}</span><span class="tag">${l.programSpecial?'企画への投稿':l.kind==='everyday47'?'日常のおたより':l.special?'特別返答':''}</span></div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div><div class="actions"><button class="btn ${selected?'secondary':'ghost'}" onclick="selectLetter('${id}')" ${!selected&&s.chosen.length>=3?'disabled':''}>${selected?'✓ 紹介する予定':'＋ このお便りを紹介'}</button></div></div>`}).join('')}<div class="prepare-later"><button type="button" class="btn secondary" ${s.chosen.length===0?'disabled':''} onclick="prepareUIStage('style')">${s.chosen.length}通を選んで、放送準備へ →</button></div><button class="reader-inline-entry" type="button" onclick="openReaderSetup()">${uiIcon('moon')}<span class="reader-entry-copy">今夜は聴くだけにする <small>本編とは別の物語として読みます</small></span></button></section>`;
 }
 return `<section class="panel prepare-panel prepare-style"><div class="overline">BEFORE BROADCAST / 01:59</div><h2>放送の準備</h2>${steps}<div class="prepare-summary"><div><strong>今夜紹介するお便り ${s.chosen.length}通</strong><span>${esc(selectedNames)}</span></div><button type="button" class="btn secondary" onclick="prepareUIStage('letters')">← 選び直す</button></div>${broadcastModePicker()}${specialActive(s.night)?`<div class="notice">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}<span class="small">この言葉は特別放送の冒頭で紹介します。</span></div>`:''}${s.broadcastModePref==='letters'?`<div class="broadcast-auto-explain"><strong>オープニングはおまかせ</strong><p>今夜の挨拶は放送開始時に自動で決まります。文章は放送中に表示されます。</p></div>`:`<h3>オープニングの言葉</h3><p class="muted station-tiny-hint">今夜、どんな声で番組を始めますか？　放送の正解や評価はありません。</p><div class="station-choice-grid">${opening.map((o,i)=>`<button type="button" class="choice station-compact-choice ${s.opening===i?'selected':''}" aria-pressed="${s.opening===i}" onclick="chooseOpening(${i})"><strong>${['あたたかく','ねぎらい','問いかけ','静かな夜','帰り道に','街の声'][i]}</strong><span>${esc(o)}</span></button>`).join('')}</div>${s.night>3?`<p class="station-habit">${fmt(stationHabitText())}</p>`:''}`}<div class="actions prepare-start-actions"><button class="btn" ${s.chosen.length===0||(s.broadcastModePref==='manual'&&s.opening===null)?'disabled':''} onclick="beginBroadcast()">午前2時、放送を始める →</button></div></section>`;
}
function broadcast(){
 if(s.cursor>=s.chosen.length){
  if(isLettersMode())return `<section class="panel station-ending"><div class="overline">02:53 / ENDING · おたより中心</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p><div class="station-script-preview"><div class="overline">自動で選んだ曲</div><p>♪ ${esc(songs[s.song]?.[0]||'')}</p><p class="small">${esc(songs[s.song]?.[1]||'')}（実際の音声は再生されません）</p></div><h3>エンディングの言葉</h3><div class="station-script-preview"><p>${esc(STATION_CLOSINGS[s.broadcastStyle.closing]?.[1]||'')}</p></div><p class="muted station-tiny-hint">演出の選択は自動ですが、最後の言葉はそのまま読めます。</p><div class="actions"><button type="button" class="btn" onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`;
  return `<section class="panel station-ending"><div class="overline">02:53 / ENDING</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p><p class="muted station-tiny-hint">曲は文字で描く架空の楽曲です。実際の音声は再生されません。</p><div class="station-choice-grid">${songs.map((a,i)=>`<button type="button" class="choice station-compact-choice ${s.song===i?'selected':''}" aria-pressed="${s.song===i}" onclick="chooseSong(${i})"><strong>♪ ${esc(a[0])}</strong><span>${esc(a[1])}</span></button>`).join('')}</div><h3>エンディングの言葉</h3><p class="muted station-tiny-hint">誰かの人生を締めくくるのではなく、今夜の放送をそっと閉じる言葉を選びましょう。</p><div class="station-choice-grid">${STATION_CLOSINGS.map((c,i)=>`<button type="button" class="choice station-compact-choice ${s.broadcastStyle.closing===i?'selected':''}" aria-pressed="${s.broadcastStyle.closing===i}" onclick="chooseClosing(${i})"><strong>${esc(c[0])}</strong><span>${esc(c[1])}</span></button>`).join('')}</div>${s.song!==null&&s.broadcastStyle.closing!==null?`<div class="station-script-preview"><div class="overline">放送原稿 / PREVIEW</div><p>♪ ${esc(songs[s.song][0])}</p><p>${esc(STATION_CLOSINGS[s.broadcastStyle.closing][1])}</p></div>`:''}<div class="actions"><button type="button" class="btn" ${s.song===null||s.broadcastStyle.closing===null?'disabled':''} onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`;
 }
 if(s.cursor>0&&!s.broadcastStyle.completed[s.cursor])return interludeScreen();
 let id=s.chosen[s.cursor],l=letter(id);
 return `<section class="panel"><div class="overline">${['02:08','02:23','02:39'][s.cursor]} / ON AIR · LETTER ${s.cursor+1} / ${s.chosen.length}</div><h2>お便りを紹介する</h2>${s.cursor===0?`<div class="station-onair-voice"><div class="overline">02:00 / あなたのオープニング</div><p>${esc(opening[s.opening]||opening[0])}</p></div>`:Number.isInteger(s.broadcastStyle.interludes[s.cursor])&&s.broadcastStyle.interludes[s.cursor]>=0?`<div class="station-onair-voice"><div class="overline">BETWEEN LETTERS / つなぎの一言</div><p>${esc(STATION_INTERLUDES[s.broadcastStyle.interludes[s.cursor]][1])}</p></div>`:studioSilentBridge()}${s.cursor===0&&specialActive(s.night)?`<div class="special-opening">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}</div>`:''}<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div><div class="actions"><button class="btn" onclick="s.current='${id}';s.phase='reply';save();render()">このお便りに返答する →</button></div></section>`;
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
function lettersTab(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">POST OFFICE</div><h2>届いたお便り</h2><p class="muted">第${s.night}夜のお便り一覧。内容を読み返せます。</p>${ids.map(id=>{let l=letter(id),played=s.played.some(x=>x.id===id),sel=s.chosen.includes(id);return `<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}${l.programSpecial?' · 企画への投稿':l.kind==='everyday47'?' · 日常のおたより':''} · ${played?'放送済み':sel?'紹介予定':'未紹介'}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div>`}).join('')}</section>`}
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
    const memories=Array.isArray(s.listeners[id]?.memories)?s.listeners[id].memories:[];
    // 公開済み返答から蓄積した従来の人物記録も残す。未紹介の人には絶対表示しない。
    const unique=[...new Set(memories.filter(m=>typeof m==='string'&&m.trim()))].slice(-5);
    return `<article class="listener archive-known"><div class="archive-person-heading"><b>${esc(NAMES[id])}</b><span class="small">はじめて紹介した夜：第${first.night}夜</span></div><p class="archive-person-intro">放送で紹介した「${esc(first.subject)}」から、少しずつこの人のことがわかってきました。</p>${unique.length?`<div class="small archive-notes-label">これまでにわかったこと</div><div class="archive-notes">${unique.map(m=>`<div class="small">・${esc(m)}</div>`).join('')}</div>`:''}<div class="small archive-notes-label">放送で聴いた声</div>${source}</article>`;
  }).join('');
  const unknown=undiscovered.length?`<div class="archive-undiscovered"><h3>まだ出会っていない声</h3><p class="small">お便りを放送で紹介すると、その人の記録が開きます。まだ紹介していない人の名前や暮らしは、ここでは明かされません。</p><div class="archive-unknown-grid">${undiscovered.map(()=>`<div class="listener archive-unknown"><span class="archive-unknown-mark" aria-hidden="true">✧</span><span>まだよく知らないリスナー</span></div>`).join('')}</div></div>`:'';
  return `<section class="panel"><div class="overline">LISTENER ARCHIVE</div><h2>リスナーの記録</h2><p class="muted">放送で紹介したお便りからわかったことを記録します。お便りを紹介していない人の暮らしも、番組の外で続いています。</p>${published}${unknown}</section>`;
}
function settings(){return `<section class="panel"><div class="overline">SETTINGS</div><h2>設定・セーブデータ</h2><button class="btn secondary settings-guide-btn" type="button" onclick="openGuide()">${uiIcon('help')}<span>ラジオ局の手引きを読む</span></button><p class="settings-save-note">進行状況は、この端末のブラウザ内に自動保存されます。別の端末に引き継ぐ場合は、バックアップを書き出してください。「聴くだけの夜」の保存と復元は読書画面から別に行います。</p><div class="actions settings-backup-actions"><button class="btn" onclick="downloadSave()">バックアップを保存</button><label class="btn secondary" style="cursor:pointer">バックアップを読み込む<input class="screen-reader" type="file" accept=".json,application/json" onchange="importSave(this)"></label></div><hr class="divider"><h3>スタジオ演出</h3><p class="small">放送前後の静けさと、マイク横の小さなメーターです。効果音や音声はありません。</p><label class="studio-setting"><input type="checkbox" ${s.studioVisuals?.enabled!==false?'checked':''} onchange="setStudioVisuals('enabled',this.checked)"> スタジオ演出を表示する</label><div class="studio-setting-modes settings-motion-modes"><span class="small">アニメーション：</span>${[['normal','通常'],['reduced','控えめ'],['off','動きなし']].map(([id,name])=>`<label><input type="radio" name="studio-motion" value="${id}" ${s.studioVisuals?.motion===id?'checked':''} ${s.studioVisuals?.enabled===false?'disabled':''} onchange="setStudioVisuals('motion',this.value)"> ${name}</label>`).join('')}</div><p class="small settings-motion-note">動きを止めても、時計とON AIRの表示は残ります。端末で動きを減らす設定を使用している場合は、その設定が優先されます。</p><hr class="divider"><h3>最初から遊ぶ</h3><p class="small">現在のセーブデータを消して、第1夜からやり直します。必要なら先にバックアップしてください。</p><button class="btn secondary" onclick="resetGame()">進行状況をリセット</button><hr class="divider"><p class="small">バージョン 4.8.29</p></section>`}
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
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
 nightLetters(29);save();render();
}


// --- v4.8 「聴くだけの夜」: 本編と別の世界を読む。将来の出来事・非公開感情は選択に使わない。 ---
let readerRestoring=activeProfile==='reader';
function readerEntry(){
 if(!['intro','after','complete','chapter2_complete','chapter3_complete'].includes(s.phase))return '';
 return `<div class="reader-subtle-entry"><button type="button" class="reader-entry-button" onclick="openReaderSetup()">${uiIcon('moon')}<span class="reader-entry-copy">今夜は聴くだけにする <small>別のDJの放送を、物語として読む</small></span></button></div>`;
}
function openReaderSetup(){
 if(activeProfile!=='main'||!['intro','prepare','after','complete','chapter2_complete','chapter3_complete'].includes(s.phase))return;
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
 if(kind==='branch'&&!['intro','after','complete','chapter2_complete','chapter3_complete'].includes(s.phase))return;
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
   // 同じ題材でも本文が変われば別の近況。まったく同じ手紙の短期再紹介だけ抑える。
   const identical=prior.slice().reverse().find(p=>p.who===l.who&&p.subject===l.subject&&p.body===l.body);
   const exactGap=identical?s.night-identical.night:Infinity;
   const seenExact=exactGap<=10?-5.5:exactGap<=30?-3.5:exactGap<=80?-1.5:prior.some(p=>p.id===l.id)?-.9:0;
   const score=2.0+continuity+gapBonus+varied+topicMatch+special+repeatInNight+seenExact+autoDJNoise(`letter:${l.id}`)*1.65;
   return {id:l.id,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  if(!ranked.length)break;
  picked.push(ranked[0].id);
 }
 return picked;
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
 // v4.8.29: 長期プレイで同じ返答が埋め尽くさないよう、数百夜の履歴も見る。
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
 // v4.8.29: 新作108通の3候補すべてを題材に即した原稿へ改稿。
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
  for(let j=0;j<parts[k].options.length;j++){
   const o=parts[k].options[j],text=String(o[1]||'');
   const tag=autoDJOptionTag(o[0],text);
   const value=autoDJReplyScore(l,o[0],text,tag,k*17+j);
   walk([...indices,j],score+value-(autoDJNoAnswerRequested(l)&&autoDJAsksQuestion(text)?40:0)-(k>0&&j===indices[k-1]?.25:0));
  }
 };
 walk([],0);
 return best?.indices||parts.map(()=>0);
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

 // DJ が以前に口にした文面の使い回しを控える。適切な候補が一つしかなければ選べる。
 const exact=s.played.slice().reverse().find(p=>p.response===text);
 if(exact){
  const gap=s.night-exact.night;
  score-=gap<=3?3.5:gap<=7?2.5:gap<=14?1.65:gap<=30?.65:0;
  if(exact.who===l.who&&gap<=18)score-=1.25;
 }
 return score-autoDJFactualFit(l,text)+autoDJSpecificityFit(l,text)+autoDJGenericContextScore(l,text)-autoDJRepeatSaturation(text,l)+autoDJRelationshipScore(l,title,text,tag)+autoDJNightVarietyScore(text)-Math.min(1.8,last*.5)+autoDJNoise(`${l.id}:reply:${offset}:${tag}:${title}`)*1.4;
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
 const choices=(l.programSpecial&&(WHIMSICAL_SPECIAL_CHOICES[l.themeId]||MILESTONE_SPECIAL_CHOICES[l.themeId]))?(l.choices||[]):
   autoDJTaughtChoices(l)||[...(l.choices||[]),...autoDJLatePersonalChoices(l),...autoDJHeardLetterChoices(l),...autoDJEverydayChoices(l)];
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
 // v4.8.29: 物語から生まれた企画を基本にしつつ、ときどき空想の投稿企画も開く。
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
  {text:'プリンの隠し場所については、番組では捜索を請け負っておりません。',tone:'playful',pattern:/プリン/},
  {text:'パンの話のあとは、深夜の空腹が少し困ります。',tone:'playful',pattern:/パン/},
  {text:'時計の話を聞くと、ついスタジオの時計まで見てしまいます。',tone:'light',pattern:/時計/},
  {text:'月の秘密については、まだ番組にも正式な報告が来ていません。',tone:'playful',pattern:/月.{0,12}(?:秘密|裏側)|秘密.{0,12}月/}
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
  {text:'プリンの無事については、明日の報告を気長に待つことにしましょう。',tone:'playful',pattern:/プリン/},
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
 const backup=JSON.stringify(s);
 readerBatch=true;
 try{
  // 第14夜・28夜・第3章の終わりは、既存の章移行処理を使用。
  if(s.phase==='after')nextNight();
  if(s.phase==='complete')beginRegular();
  if(s.phase==='chapter2_complete')beginAfterChapter2();
  if(s.phase==='chapter3_complete')beginAfterChapter3();
  if(s.phase!=='intro'&&s.phase!=='prepare')throw Error('読書用の夜の開始位置が不正です: '+s.phase);
  if(s.phase==='intro')autoDJMaybePlan();
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
  const night=s.night;
  const source=s.special?.planned?.night===night?s.special.planned.storySource:null;
  const specialOrigin=source&&Number.isInteger(source.originNight)?{night:source.originNight,subject:String(source.sourceSubject||'')}:null;
  const djVoice=readerDJChooseVoice();
  const page={night,djVoice,title:readerEditorialTitle(introduction.title,night),intro:readerEditorialScene(introduction.text,'intro',night),outro:readerEditorialScene(outro.text,'outro',night),specialOrigin,specialIntro:specialIntroText,
   opening:opening[s.opening]||'',song:songs[s.song]?.slice(0,2)||[],closing:STATION_CLOSINGS[s.broadcastStyle.closing]?.[1]||'',
   interludes:s.chosen.slice(1).map((id,i)=>s.broadcastStyle.interludes[i+1]??-1),letterIds:s.chosen.slice()};
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
 const heavy=letters.some(l=>autoDJLetterMood(l).heavy>=2.4);
 const ranked=STATION_CLOSINGS.map((entry,i)=>{
  const used=recent.filter(t=>t===entry[1]).length;
  let score=autoDJNoise(`reader-closing:${i}`)*1.3-used*2.15;
  if(heavy&&i===4)score-=1.6;
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
 // v4.8.29: 1,000夜以上でも全夜分のoptionを再生成しない。離れた夜は番号で直接指定。
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
 return `<div class="reader-layout"><header class="reader-header"><div><div class="brand reader-brand">SOMEWHERE ON AIR</div><div class="reader-mode-label">${uiIcon('moon')}<span>ANOTHER FREQUENCY / 読書モード</span></div><h1>聴くだけの夜</h1><div class="small">誰かが選んだ言葉の、その先を読む</div></div><button class="btn secondary" type="button" onclick="switchToMain()">${uiIcon('radio')}<span>本編に戻る</span></button></header><main id="main" class="reader-main">${content}</main><footer class="reader-footer">本編の選択と記憶は変更されません · v4.8.29</footer></div>`;
}
function readerView(){
 const r=s.reader;
 if(!r)return '<section class="panel">読書データの形式が違います。本編に戻り、バックアップを確認してください。</section>';
 if(r.pages.length===0)return `<section class="reader-paper"><div class="overline">BEFORE THE FIRST PAGE</div><h2>もうひとつの午前二時</h2><p>この世界では、別のパーソナリティがマイクの前に座ります。返す言葉の先に、どんな日々が続くのでしょう。</p><p>物語が進んでも、あなた自身の放送は変わりません。</p><div class="reader-actions"><button class="btn" onclick="readerProduceNight()">最初の放送を読む →</button></div></section>${readerReaderTools()}`;
 const p=r.pages[Math.max(0,Math.min(r.viewIndex,r.pages.length-1))],entries=p.letterIds.map(id=>s.played.find(x=>x.night===p.night&&x.id===id)).filter(Boolean);
 const djVoice=p.djVoice||{};
 const displayIntro=readerEditorialScene(p.intro,'intro',p.night),displayOutro=readerEditorialScene(p.outro,'outro',p.night),displayTitle=readerEditorialTitle(p.title,p.night);
 let content=`<div class="reader-page-head" id="reader-introduction"><div class="overline">第${p.night}夜 / THE NIGHT'S VOICES</div><h2>${esc(displayTitle||'今夜の放送')}</h2><p>${fmt(displayIntro||'午前二時。マイクの灯りがともる。')}</p><p class="reader-mic">${fmt(p.opening)}</p>${djVoice.opening?`<p class="reader-dj-voice">${fmt(djVoice.opening)}</p>`:''}${p.specialIntro?`<p class="reader-special-line">${fmt(p.specialIntro)}</p>`:''}</div>`;
 entries.forEach((entry,i)=>{
  const bridge=i===0?'':p.interludes[i-1]===-1?'少しのあいだ、言葉のない時間が流れた。':STATION_INTERLUDES[p.interludes[i-1]]?.[1]||'次の手紙を開く。';
  content+=`${i?`<p class="reader-transition">${esc(bridge)}</p>${djVoice.interludes?.[i-1]?`<p class="reader-dj-voice reader-dj-between">${fmt(djVoice.interludes[i-1])}</p>`:''}`:''}<article class="reader-letter" id="reader-letter-${i+1}"><div class="overline">LETTER ${i+1} / ${entries.length}</div><h3>${esc(NAMES[entry.who]||entry.who)}　「${esc(entry.subject)}」</h3><div class="reader-letter-body">${fmt(entry.body||'')}</div><div class="reader-response-label">パーソナリティからの返答</div><div class="reader-response">${fmt(entry.response||'')}</div></article>`;
 });
 content+=`<section class="reader-ending" id="reader-ending"><div class="overline">02:53 / A FINAL SONG</div><p>♪ ${esc(p.song?.[0]||'')}</p><p class="small">${esc(p.song?.[1]||'')}</p>${djVoice.ending?`<p class="reader-dj-voice reader-dj-final">${fmt(djVoice.ending)}</p>`:''}<p>${fmt(p.closing||'')}</p><div class="overline">03:00 / OFF AIR</div><p>${fmt(displayOutro||'今夜も放送が終わった。')}</p>${readerOriginFootnote(p)}<a class="reader-back-to-top" href="#reader-page-top" onclick="readerJumpToSection('reader-page-top');return false">↑ 今夜の最初に戻る</a></section>`;
 const i=r.viewIndex;
 return `<div id="reader-page-top" class="reader-page-top"></div>${readerNightNavigation(r,i)}<section class="reader-paper">${readerNightContents(entries)}${content}<div class="reader-actions"><button class="btn secondary" ${i<=0?'disabled':''} onclick="readerGotoPage(${i-1})">← 前の夜</button><button class="btn" onclick="readerProduceNight()">${i<r.pages.length-1?'次の記録を読む':'次の夜へ →'}</button></div><p class="reader-page-count">${i+1} / ${r.pages.length} 夜分の記録</p></section>${readerReaderTools()}`;
}
function readerReaderTools(){
 return `<section class="reader-tools"><h3>読書の記録</h3><p>この世界は本編とは独立しています。読書用バックアップは、こちらで保存してください。</p>${(localStorage.getItem(READER_SAVE)||'').startsWith('R20-LZW1:')?'<p class="small">保存容量を節約する形式で保管しています。書き出すバックアップは従来どおりのJSONです。</p>':''}${readerSaveWarning?'<p class="notice">保存に失敗しました。容量を確認し、バックアップを保存してください。</p>':''}<div class="actions"><button class="btn secondary" onclick="downloadReaderSave()">読書用バックアップを保存</button><label class="btn secondary" style="cursor:pointer">読書用を復元<input class="screen-reader" type="file" accept=".json,application/json" onchange="importReaderSave(this)"></label></div><button class="reader-return" onclick="switchToMain()">自分の放送に戻る</button></section>`;
}
window.addEventListener('pagehide',()=>{if(activeProfile==='reader'&&s?.reader){s.reader.scrollY=window.scrollY;readerSavePosition()}});

// v4.8.29: 本編の閲覧専用タブ間は、ヘッダー・スタジオ・サイドバーを維持する。
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
    s.phase==='intro'?intro():s.phase==='prepare'?prepare():s.phase==='broadcast'?broadcast():s.phase==='reply'?reply():s.phase==='after'?after():s.phase==='chapter2_complete'?chapter2Complete():s.phase==='chapter3_complete'?chapter3Complete():complete();
  let decorated=s.tab==='studio'&&s.phase==='intro'?climateIntroText(s.night)+content:content;
  if(s.tab==='studio'&&s.phase==='prepare')decorated=hideableHint('choose','気になる手紙を選んでみましょう。紹介しなかった人も、その後の生活を続けます。')+decorated;
  if(s.tab==='studio'&&s.phase==='reply')decorated=hideableHint('reply','どれが正しいかより、自分ならこの人に何を伝えたいかで選んでみてください。')+decorated;
  if(s.tab==='studio'&&s.phase==='after'){
    const reflection=stationStylePanel()+studioAfterQuiet()+reflectionPanel();
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
    && !guideOpen && !!s.guidance.welcomeSeen && !!main
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

nightLetters(s.night);render();


// 第3章（新リスナーの初登場と50夜記念を経た、51夜目からの14夜）
function chapter3Intro(){
 const n=s.night,idx=chapter3Offset(n),theme=CH3_DAYS[idx];
 const initial=idx===0?'新しい声が三つ、ラジオに加わった。\n\n知らない人だった誰かが、今日も自分の仕事や学校へ向かっている。\n\n':'昨夜の放送のあとにも、街では別々の一日が過ぎた。\n\n';
 return `<section class="panel chapter3-panel"><div class="overline">CHAPTER THREE / NIGHT ${n} · 01:47</div><h2>${esc(theme[0])}</h2><p>${fmt(initial+theme[1]+'\n\n第3章「変わらないもの、変わっていくもの」。今夜も、まだ知らないことが多い。')}</p><div class="notice">新旧のリスナーたちが、生活の中でそれぞれ選んだことを手紙にします。読まれなかった便りの向こうでも、人生は続きます。</div><div class="actions"><button class="btn" onclick="startNight()">今夜のお便りを確認する →</button></div></section>`;
}
function chapter3After(){
 const n=s.night,idx=chapter3Offset(n),scenes=[
  '誰かの暮らしが変わったことは、いつも大きなニュースになるわけではない。',
  '読まれなかったお便りの送り主にも、今夜の食事と明日の予定がある。',
  '同じ街の灯りが、一つずつ消えていった。',
  '前の手紙と違うことを書いた人も、書かなかった人もいる。'
 ];
 return `<section class="panel end"><div class="overline">03:00 / OFF AIR · CHAPTER THREE</div><h2>今夜の放送が終わった</h2><p>${fmt(scenes[idx%scenes.length]+'\n\nマイクの灯りを消す。届いた声をすべて知った気にはなれない。\n\nそれでも、明日も午前2時がやって来る。')}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">紹介しなかったお便り：${Math.max(0,nightLetters(n).length-s.chosen.length)}通</div><div class="actions"><button class="btn" onclick="nextNight()">${idx===CH3_DAYS.length-1?'第3章を振り返る →':'次の夜へ進む →'}</button></div></section>`;
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
 const prose='十四夜が過ぎた。\n\n新しい人の名前を覚えるようになり、前から知っている人の意外な一面も聴いた。\n\n返事を送った手紙も、紹介しなかった手紙もある。\n\nそれでも、番組の外には今夜とは違う明日がある。';
 return `<section class="panel end chapter3-panel"><div class="overline">CHAPTER THREE / FOURTEEN NIGHTS</div><h2>それぞれの窓</h2><p>${fmt(prose)}</p><hr class="divider"><h3>放送で知ったこと</h3><p class="muted">実際に紹介したお便りだけを振り返ります。本人だけが知っている決断は表示しません。</p>${items}<div class="notice">第3章完了。3つの章を経た性格・記憶・人間関係・人生の目標は、これからの通常放送にも引き継がれます。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を読む</button><button class="btn" onclick="beginAfterChapter3()">通常放送を続ける →</button><button class="btn secondary" onclick="setTab('settings')">バックアップを保存</button></div></section>`;
}
function beginAfterChapter3(){
 if(s.phase!=='chapter3_complete'||chapter3Offset(s.night)!==CH3_DAYS.length-1)return;
 s.night++;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};s.nightBroadcastMode=null;
 nightLetters(s.night);save();render();
}
