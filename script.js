'use strict';
const SAVE='radio_2am_prototype_v1';
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
function letter(id){
 let l=letterDB[id]||s.regular?.letterArchive?.[id];
 if(!l)return null;
 // 原文はそのままに、本文に依存する既存の追伸・条件付きの話題も適用する。
 let result;
 if(l.regular){
   result={...l,id};
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
function studioScene(){
 const phase=studioDisplayPhase(),on=['opening','speaking','bridging','silent','music'].includes(phase);
 const time=phase==='finished'?'03:00':phase==='preparing'?(s.phase==='prepare'?'01:59':'01:48'):phase==='opening'?'02:00':phase==='music'?'02:53':phase==='bridging'?'02:34':phase==='silent'?'02:35':s.phase==='reply'?'02:23':'02:18';
 const visuals=normalizeStudioVisuals(s.studioVisuals),climate=climateForNight(s.night),sp=specialActive(s.night);
 const meter=visuals.enabled?`<div class="studio-level" aria-hidden="true">${Array.from({length:7},(_,i)=>`<span class="studio-level-bar" style="--bar:${i};--bar-height:${[10,17,25,20,29,15,12][i]}px"></span>`).join('')}</div>`:'';
 return `<div class="studio ${sp?'studio-special':''} weather-${climate.weather} season-${climate.season} studio-phase-${phase} ${!visuals.enabled?'studio-minimal':''} studio-motion-${visuals.motion}" role="group" aria-label="スタジオ・${time}・${on?'放送中':'放送外'}"><div class="studio-caption">${sp?'SPECIAL PROGRAM · '+esc(SPECIAL_THEMES[sp.themeId].short):'SOMEWHERE ON AIR · STUDIO'}</div><div class="climate-studio-label">${esc(climateCaption(s.night))}</div><div class="moon"></div><div class="lamp"></div><div class="mic"></div><div class="desk"></div><div class="studio-clock" aria-label="スタジオ時刻">${time}</div><div class="onair" aria-label="${on?'ON AIR':'OFF AIR'}"><span class="onair-light" aria-hidden="true"></span>${on?'ON AIR':'OFF AIR'}</div>${meter}</div>`;
}
function studioPrelude(){
 if(!s.studioVisuals?.enabled)return '';
 return `<div class="studio-prelude"><div class="overline">01:59 / BEFORE ON AIR</div><p>${esc(studioWeatherText(s.night))} 机の上には、今夜届いた手紙が並んでいる。</p><p class="small">マイクはまだオフ。放送する手紙と、今夜の挨拶を選びましょう。</p></div>`;
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
function setTab(tab){s.tab=tab;save();render()}
function selectLetter(id){let i=s.chosen.indexOf(id);if(i>=0)s.chosen.splice(i,1);else if(s.chosen.length<3)s.chosen.push(id);save();render()}
function startNight(){s.phase='prepare';s.tab='studio';nightLetters(s.night);for(const id of s.letterSets[s.night]||[])letter(id);save();render()}
function beginBroadcast(){if(!s.chosen.length||s.opening===null||s.opening<0||s.opening>=opening.length)return;s.guidance.seen.choose=true;recordOpening();s.phase='broadcast';s.cursor=0;save();render()}
function chooseReply(i){let l=letter(s.current);let c=l.choices[i];applyReply(l,c[2],c[1])}
function finishBroadcast(){
 if(s.phase!=='broadcast'||s.song===null||s.song<0||s.song>=songs.length||!Number.isInteger(s.broadcastStyle.closing)||s.broadcastStyle.closing<0||s.broadcastStyle.closing>=STATION_CLOSINGS.length)return;
 s.phase='after';
 log('曲',`「${songs[s.song][0]}」を流した。`);
 log('エンディング',STATION_CLOSINGS[s.broadcastStyle.closing][1]);
 s.broadcastStyle.history.push(nightStyleRecord());
 if(s.broadcastStyle.history.length>120)s.broadcastStyle.history.splice(0,s.broadcastStyle.history.length-120);
 applySongMood();radioCultureAfterBroadcast(s.night);radioMemoryAfterBroadcast39(s.night);const omitted=nightLetters(s.night).filter(id=>!s.chosen.includes(id));log('未紹介',omitted.length?omitted.map(id=>NAMES[letter(id).who]).join('、')+'のお便りは放送で紹介されなかった。':'今夜届いたお便りはすべて紹介した。');updatePendingLetters();if(s.night<=14)advanceWorld();if(s.night>=29)specialBeginAnnouncement(s.night);simulateDailyLives(s.night);newListenerAfterDaily(s.night);dailyThreadsAfterWorld41(s.night);simulateSocialWorld(s.night);quietAfterDaily(s.night);if(s.night<=14){lifeAfterDaily(s.night);simulateMicroWorld(s.night)}else {regularAfterWorld(s.night);chapter2AfterWorld(s.night);chapter3AfterWorld(s.night);specialProcessNight(s.night);storyProgramsAfterWorld(s.night)}save();render()}
function nextNight(){
  if(s.phase==='after')s.guidance.seen.after=true;
  if(chapter3Offset(s.night)===CH3_DAYS.length-1&&s.chapter3?.finished){s.phase='chapter3_complete';save();render();return}
  if(s.night===28&&s.chapter2?.legacyThrough<28){s.phase='chapter2_complete';save();render();return}
  if(s.night===14){s.phase='complete';save();render();return}
  s.night++;
  s.phase='intro';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;
  s.replyParts=[null,null,null];s.replyStep=0;s.song=null;s.tab='studio';s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};
  nightLetters(s.night);save();render();
}
function beginRegular(){
  if(s.night!==14||s.phase!=='complete')return;
  s.regular ||= createRegularState();s.regular.started=true;s.chapter2 ||= createChapter2State();s.chapter2.started=true;
  s.night=15;s.phase='intro';s.tab='studio';s.opening=null;s.chosen=[];s.cursor=0;
  s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};
  nightLetters(s.night);save();render();
}
function resetGame(){if(!confirm('進行状況を最初からやり直しますか？ 現在のセーブは消えます。'))return;s=defaultState();s.simState=createSimulationState();s.newListeners=createNewListenerState();s.chapter3=createChapter3State();s.quiet=createQuietState();s.radioCulture=createRadioCultureState();s.radioMemory=createRadioMemoryState39();save();render()}
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

// v3.2: ゲームの楽しみ方を伝える案内。攻略数値を公開せず、実際の放送で知った内容のみ扱う。
let guideOpen=false;

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
function chooseOpening(i){if(!Number.isInteger(i)||i<0||i>=opening.length||s.phase!=='prepare')return;s.opening=i;save();render()}
function chooseSong(i){if(!Number.isInteger(i)||i<0||i>=songs.length||s.phase!=='broadcast')return;s.song=i;save();render()}
function chooseClosing(i){if(!Number.isInteger(i)||i<0||i>=STATION_CLOSINGS.length||s.phase!=='broadcast')return;s.broadcastStyle.closing=i;save();render()}
function closeInterlude(i){
 if(s.phase!=='broadcast'||s.cursor<=0||s.cursor>=s.chosen.length||s.broadcastStyle.completed[s.cursor])return;
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
  ['style','放送のスタイルは？','オープニング、手紙の合間の言葉、最後の架空の一曲、締めの言葉を選べます。毎晩違う雰囲気でも大丈夫。どれも攻略上の正解ではなく、自分らしいラジオ局を作るための選択です。'],
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

const dayTitles=['','はじめましての夜','誰かが聴いている','言えなかった言葉',
  '終点のひとつ前','いつもの道の途中','言いそびれた返事','ひとり分の余白','返事をしない自由','描かれなかった余白','窓の明かり','木曜日の駅','自分の声','返ってこない約束','それぞれの朝'];
function shell(content){let done=s.phase==='complete',done2=s.phase==='chapter2_complete',done3=s.phase==='chapter3_complete',sp=specialActive(s.night);return `<header class="header"><div class="header-identity"><div class="brand">SOMEWHERE ON AIR</div><h1>午前二時の周波数</h1><div class="small">${done?'第1章 14夜 終了':done2?'第2章 14夜 終了':done3?'第3章 14夜 終了':`第${s.night}夜　${regularDayTitle(s.night)}`}</div><div class="climate-meta">${esc(climateCaption(s.night))}</div></div><div class="header-tools" aria-label="放送の補助操作と状態"><button class="guide-launch" type="button" onclick="openGuide()" aria-label="あそび方・手引きを開く">？ あそび方</button><div class="chip" role="status" aria-label="放送状態">${s.phase==='broadcast'||s.phase==='reply'?'● ON AIR':'◌ OFF AIR'}</div></div></header>${studioScene()}<div class="layout"><main id="main">${content}</main><aside class="sidebar"><div class="panel"><div class="overline">BROADCAST DESK</div>${navButtons()}</div><div class="panel"><div class="overline">${sp?'特別放送':s.night>=15&&s.night<=28?'第2章':chapter3IsNight(s.night)?'第3章':s.night>=29?'通常放送':'今夜の放送'}</div><div class="status"><span>紹介枠</span><span>${s.chosen.length} / 3</span></div><div class="progress"><div style="width:${s.chosen.length/3*100}%"></div></div><div class="status"><span>放送済み</span><span>${s.played.filter(x=>x.night===s.night).length}通</span></div><div class="status"><span>保存</span><span>自動保存</span></div></div></aside></div><nav class="bottomnav" aria-label="メニュー"><button class="${s.tab==='studio'?'active':''}" onclick="setTab('studio')"><span>◉</span>放送</button><button class="${s.tab==='letters'?'active':''}" onclick="setTab('letters')"><span>✉</span>お便り</button><button class="${s.tab==='journal'?'active':''}" onclick="setTab('journal')"><span>▤</span>記録</button><button class="${s.tab==='listeners'?'active':''}" onclick="setTab('listeners')"><span>♧</span>リスナー</button><button class="${s.tab==='settings'?'active':''}" onclick="setTab('settings')"><span>⚙</span>設定</button></nav><div class="footer">『午前二時の周波数』 · SOMEWHERE ON AIR · v4.1</div>`}
function navButtons(){return [['studio','◉ 放送'],['letters','✉ お便り'],['journal','▤ 放送日誌'],['listeners','♧ リスナー'],['settings','⚙ 設定・セーブ']].map(([id,t])=>`<button class="navbtn ${s.tab===id?'active':''}" onclick="setTab('${id}')">${t}</button>`).join('')}
function intro(){
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
function prepare(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">BEFORE BROADCAST / 01:59</div><h2>今夜のお便り</h2>${studioPrelude()}${s.night>=15?`<div class="notice">${s.night<=28?'第2章：'+esc(CH2_NIGHTS[s.night][0]):chapter3IsNight(s.night)?'第3章：'+esc(CH3_DAYS[chapter3Offset(s.night)][0]):specialActive(s.night)?'特別放送：'+esc(SPECIAL_THEMES[s.special.planned.themeId].title):'今夜のテーマ：'+esc(regularTheme(s.night)[0])+' · '+esc(regularTheme(s.night)[1])}</div>`:""}<p class="muted">最大3通を紹介できます。読まなかったお便りの送り主も、明日を生きていきます。まずお便りを選びましょう。</p>${ids.map(id=>{let l=letter(id),selected=s.chosen.includes(id);return `<div class="letter"><div class="letter-top"><span class="letter-title">${esc(NAMES[l.who])}</span><span class="tag">${l.special?'特別返答':''}</span></div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div><div class="actions"><button class="btn ${selected?'secondary':'ghost'}" onclick="selectLetter('${id}')" ${!selected&&s.chosen.length>=3?'disabled':''}>${selected?'✓ 紹介する予定':'＋ このお便りを紹介'}</button></div></div>`}).join('')}<div class="notice">紹介予定：${s.chosen.length} / 3通　${s.chosen.map(id=>NAMES[letter(id).who]).join('・')||'まだ選んでいません'}</div>${specialActive(s.night)?`<div class="notice">${esc(SPECIAL_THEMES[s.special.planned.themeId].opening)}<br><span class="small">この言葉は特別放送の冒頭で紹介します。</span></div>`:''}<h3>オープニングの言葉</h3><p class="muted station-tiny-hint">今夜、どんな声で番組を始めますか？　放送の正解や評価はありません。</p><div class="station-choice-grid">${opening.map((o,i)=>`<button type="button" class="choice station-compact-choice ${s.opening===i?'selected':''}" aria-pressed="${s.opening===i}" onclick="chooseOpening(${i})"><strong>${['あたたかく','ねぎらい','問いかけ','静かな夜','帰り道に','街の声'][i]}</strong><span>${esc(o)}</span></button>`).join('')}</div>${s.night>3?`<p class="station-habit">${fmt(stationHabitText())}</p>`:''}<div class="actions"><button class="btn" ${s.chosen.length===0||s.opening===null?'disabled':''} onclick="beginBroadcast()">午前2時、放送を始める →</button></div></section>`}
function broadcast(){
 if(s.cursor>=s.chosen.length){
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
function lettersTab(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">POST OFFICE</div><h2>届いたお便り</h2><p class="muted">第${s.night}夜のお便り一覧。内容を読み返せます。</p>${ids.map(id=>{let l=letter(id),played=s.played.some(x=>x.id===id),sel=s.chosen.includes(id);return `<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)} · ${played?'放送済み':sel?'紹介予定':'未紹介'}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div>`}).join('')}</section>`}
function journal(){
  if(s.guidance.bookmarksOnly)return bookmarkArchive();
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
  return `<section class="panel"><div class="overline">BROADCAST JOURNAL</div><h2>放送日誌</h2><p class="muted">放送で伝えた言葉を記録しています。生活の秘密や内部数値は表示されません。</p>${s.broadcastStyle.history.length?`<div class="station-history-hint"><div class="overline">YOUR RADIO VOICE</div><p>${fmt(stationHabitText())}</p></div>`:''}<div class="actions journal-bookmark-actions"><button class="btn secondary" onclick="toggleBookmarksView()">◇ 心に残ったお便り（${s.bookmarks.length}）</button></div><div class="actions journal-page-actions"><button class="btn secondary" ${s.journalPage>=maxPage?'disabled':''} onclick="s.journalPage++;save();render()">← 前の10夜</button><button class="btn secondary" ${s.journalPage===0?'disabled':''} onclick="s.journalPage--;save();render()">新しい10夜 →</button></div><p class="small journal-page-caption">第${oldest}〜${latest}夜を表示（全${n}夜）</p>${content}<h3>あなたが届けた言葉</h3>${replies.length?replies.map(x=>`<div class="letter"><div class="small">第${x.night}夜 · ${esc(NAMES[x.who])}</div><b>${esc(x.subject)}</b><div class="quote">${fmt(x.response)}</div>${bookmarkButton(x)}</div>`).join(''):'<p class="muted">この期間には返答の記録がありません。</p>'}</section>`;
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
function settings(){return `<section class="panel"><div class="overline">SETTINGS</div><h2>設定・セーブデータ</h2><button class="btn secondary settings-guide-btn" type="button" onclick="openGuide()">？ ラジオ局の手引きを読む</button><p class="settings-save-note">進行状況は、この端末のブラウザ内に自動保存されます。別の端末に引き継ぐ場合は、バックアップを書き出してください。</p><div class="actions settings-backup-actions"><button class="btn" onclick="downloadSave()">バックアップを保存</button><label class="btn secondary" style="cursor:pointer">バックアップを読み込む<input class="screen-reader" type="file" accept=".json,application/json" onchange="importSave(this)"></label></div><hr class="divider"><h3>スタジオ演出</h3><p class="small">放送前後の静けさと、マイク横の小さなメーターです。効果音や音声はありません。</p><label class="studio-setting"><input type="checkbox" ${s.studioVisuals?.enabled!==false?'checked':''} onchange="setStudioVisuals('enabled',this.checked)"> スタジオ演出を表示する</label><div class="studio-setting-modes settings-motion-modes"><span class="small">アニメーション：</span>${[['normal','通常'],['reduced','控えめ'],['off','動きなし']].map(([id,name])=>`<label><input type="radio" name="studio-motion" value="${id}" ${s.studioVisuals?.motion===id?'checked':''} ${s.studioVisuals?.enabled===false?'disabled':''} onchange="setStudioVisuals('motion',this.value)"> ${name}</label>`).join('')}</div><p class="small settings-motion-note">動きを止めても、時計とON AIRの表示は残ります。端末で動きを減らす設定を使用している場合は、その設定が優先されます。</p><hr class="divider"><h3>最初から遊ぶ</h3><p class="small">現在のセーブデータを消して、第1夜からやり直します。必要なら先にバックアップしてください。</p><button class="btn secondary" onclick="resetGame()">進行状況をリセット</button><hr class="divider"><p class="small">バージョン 4.1</p></section>`}
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
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};
 nightLetters(29);save();render();
}

let lastViewKey=null;
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&guideOpen){event.preventDefault();closeGuide()}});
function render(){
  if(!['studio','letters','journal','listeners','settings'].includes(s.tab))s.tab='studio';
  const content=s.tab==='letters'?lettersTab():s.tab==='journal'?journal():s.tab==='listeners'?listeners():s.tab==='settings'?settings():
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

  const key=`${s.tab}:${s.tab==='studio'?s.phase:''}:${s.phase==='broadcast'?s.cursor:''}:${s.phase==='reply'?s.replyStep:''}`;
  const y=window.scrollY;
  const changed=lastViewKey!==null&&lastViewKey!==key;
  const specialStepChanged=changed&&s.tab==='studio'&&s.phase==='reply'&&lastViewKey.startsWith('studio:reply:');
  const oldSource=document.getElementById('special-reply-letter');
  const oldSourceOpen=oldSource?oldSource.open:null;
  document.getElementById('app').innerHTML=shell(decorated);
  const portal=document.getElementById('guide-portal');
  if(portal)portal.innerHTML=guideDialog();
  document.body.classList.toggle('guide-open',!s.guidance.welcomeSeen||guideOpen);
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
 s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.song=null;s.broadcastStyle.closing=null;s.broadcastStyle.interludes={};s.broadcastStyle.completed={};
 nightLetters(s.night);save();render();
}
