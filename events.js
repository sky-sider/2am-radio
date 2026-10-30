function log(type,message){s.logs.push({night:s.night,type,message})}
function event(message){s.events.push({night:s.night,message})}
function affect(id,changes){const o=s.listeners[id];if(!o)return;for(const [k,v] of Object.entries(changes))if(typeof o[k]==='number')o[k]=clamp(o[k]+v)}
function remember(id,mem){let a=s.listeners[id]?.memories;if(a&&!a.includes(mem))a.push(mem)}
function applyReply(l,choice,assembled){let id=l.who;if(!s.listeners[id])s.listeners[id]={trust:25,reflection:40,agency:40,stress:35,memories:[],known:false};s.listeners[id].known=true;affect(id,{trust:1});if(l.id==='cat1'){s.flags.catRead=true;s.flags.catReply=choice;remember('cat','退職についてラジオに相談した');const e={empathy:{trust:2,reflection:1},reflection:{reflection:3,agency:1},caution:{stress:-5,reflection:1},agency:{agency:3,trust:1}};affect('cat',e[choice]||{})}if(l.id==='clock1'){s.flags.clockRead=true;s.flags.clockPast=choice==='past';remember('clock','止まった時計の話をした');if(choice==='past')affect('clock',{trust:3,reflection:2})}if(l.id==='moon1'&&choice==='question')s.flags.moonQuestion=true;if(l.id==='driver2')s.flags.driverRead=true;if(l.id==='fish3'){s.flags.fishRead=true;s.flags.fishParts=[...s.replyParts];remember('fish','笑ってしまう癖について初めて相談した');const impacts={};s.replyParts.forEach((ix,k)=>{let e=fishParts[k].options[ix][2];for(let [a,v] of Object.entries(e))impacts[a]=(impacts[a]||0)+v});affect('fish',{trust:impacts.trust||0,reflection:(impacts.reflection||0)*2,agency:(impacts.agency||0)*2,stress:-(impacts.comfort||0)*2});s.flags.fishImpact=impacts}if(l.id==='clock2'){s.flags.clockWifeKnown=true;remember('clock','妻が買った時計について話した')}if(l.id==='clock3'&&s.flags.clockWifeKnown)remember('clock','散歩で見つけた花について話した');if(l.id==='bread1')remember('bread','くるみと蜂蜜のパンが売り切れた');if(l.id==='driver2')remember('driver','配送先の猫を「主任」と呼んでいる');if(l.id==='fish3')s.flags.fishRead=true;if(l.id==='cat2'||l.id==='cat2unread')remember('cat','上司に仕事の相談をした');if(l.id==='driver3'||l.id==='driver3first')remember('driver','猫主任が車の前で寝ていた');if(l.id==='bread3')remember('bread','新しいパンの試作に失敗した');if(l.id==='clock2generic')remember('clock','朝の散歩で時計の音を聞いた');if(l.id==='moon2'||l.id==='moon3')remember('moon','秘密の隠し場所について考えた');if(choice==='empathy')affect(id,{trust:2});if(choice==='agency')affect(id,{agency:2});if(choice==='reflection')affect(id,{reflection:2});if(choice==='humor')affect(id,{trust:1,stress:-2});if(choice==='curiosity'||choice==='followup'||choice==='past')affect(id,{trust:1,reflection:1});extendedApplyReply(l,choice,assembled);regularReplyRecorded(l,choice);chapter3ReplyRecorded(l,choice);socialVisibleClue(l);simReplyImpact(id,choice,assembled,l.id,l);s.guidance.seen.reply=true;s.played.push({id:l.id,who:id,subject:l.subject,body:l.body,response:assembled,night:s.night});log('放送',`${NAMES[id]}「${l.subject}」に返答した。`);s.cursor++;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.phase='broadcast';save();render()}
function advanceWorld(){const n=s.night;if(n===1){event('夜明けの猫は上司に仕事について相談した。');privateRemember('cat','上司に相談した');if(s.flags.catReply==='caution')event('夜明けの猫は退職の結論を急がないことにした。');else if(s.flags.catReply==='agency')event('夜明けの猫は自分の希望を少し言葉にできた。');else event('夜明けの猫は上司の言葉を聞いて、また迷い始めた。');event('古時計は翌朝、近所を散歩した。');event('眠れないパン屋は次のパンを試作し始めた。');event('午前3時の配達員は仕事の休憩中に番組を聴いた。');affect('cat',{stress:-2,reflection:2});affect('clock',{reflection:1});affect('driver',{trust:1});}else if(n===2){event('透明な金魚は友人との会話で傷ついたが、その場では笑ってしまった。');privateRemember('fish','友人の言葉に傷つき、笑ってごまかした');event('夜明けの猫は上司との話を思い返した。');affect('cat',{reflection:2});event('古時計は朝の散歩で小さな花を見つけた。');event('午前3時の配達員は駐車場で猫主任に再会した。');event('眠れないパン屋は新しいパンの試作に失敗した。');if(s.flags.driverRead)affect('driver',{trust:1});}else if(n===3){event('透明な金魚は放送後、自分の気持ちを日記に書くか迷った。');if(s.flags.fishRead){let e=s.flags.fishImpact||{};let opts=[['日記に、嫌だった気持ちを一行書いた。',e.reflection||0],['友人に伝える言葉を小さく練習した。',e.agency||0],['今夜は何も決めず、ゆっくり休んだ。',e.comfort||0],['別の友人に相談しようと考えた。',e.relationship||0]];let weights=opts.map(x=>Math.max(1,x[1]+1));let t=weights.reduce((a,b)=>a+b,0)*rand();let ix=0;for(;ix<weights.length-1;ix++){t-=weights[ix];if(t<0)break}let m='透明な金魚は'+opts[ix][0];s.flags.fishAction=['journal','practice','rest','consult'][ix];event(m);privateRemember('fish',m)}else{event('透明な金魚は番組に送ったお便りが読まれなかった夜も、自分の気持ちについて考え続けた。');privateRemember('fish','番組への初投稿は紹介されなかった')}event('終点のひとつ前に関する古い封筒が、郵送物を整理していたスタッフから渡された。');s.flags.envelope=true;}else if(n>=4){advanceExtendedWorld(n)}save()}


// 個人の出来事・記憶は初期状態では放送局の知識ではない。
// 取材や紹介を通じて判明した分だけ remember() で番組アーカイブに移す。
function privateRemember(id,text){
  if(!s.privateMemories)s.privateMemories={};
  const arr=s.privateMemories[id] ||= [];
  if(!arr.includes(text))arr.push(text);
}

function extendedApplyReply(l, choice, assembled){
  const id=l.who;
  const firstTime=!s.flags[`read_${id}`];
  s.flags[`read_${id}`]=true;
  if(id==='terminal'){
    s.flags.terminalHeard=true;
    remember('terminal','毎週木曜日、終点のひとつ前の駅を訪れる');
    if(choice==='reflection')affect('terminal',{reflection:2});
    if(choice==='space'||choice==='empathy')affect('terminal',{trust:2});
  }
  if(['cat4','cat5'].includes(l.id)){
    if(choice==='art'){
      s.flags.catArtMentioned=true;
      remember('cat','学生時代は紙と鉛筆で長い時間を過ごしていた');
      affect('cat',{agency:2,reflection:2});
    }
    if(choice==='agency')affect('cat',{agency:2});
  }
  if(l.id==='driver5'&&choice==='honesty'){
    s.flags.driverHonesty=true;
    affect('driver',{trust:3,stress:-3});
  }
  if(l.id==='driver6'||l.id==='driver7'){
    remember('driver','家族からの短いメッセージへの返事を迷っている');
    if(choice==='agency')affect('driver',{agency:2});
  }
  if(['clock4','clock5'].includes(l.id)){
    remember('clock','地域の図書室で子どもと過ごす時間がある');
    affect('clock',{trust:1});
  }
  if(l.id==='clock6'){
    remember('clock','海辺の駅で撮った古い写真を見つけた');
    if(choice==='past')s.flags.clockStationAsked=true;
  }
  if(l.id==='clock7'){
    remember('clock','海辺の駅を訪ねる約束と使わなかった切符がある');
    if(choice==='past')s.flags.clockStationAsked=true;
  }
  if(l.id==='fish6'||l.id==='fish6hesitant'||l.id==='fish7'){
    remember('fish','自分の気持ちと、友人との距離を考えている');
    if(choice==='agency')affect('fish',{agency:2});
  }
  if(l.id==='cat7'){
    s.flags.catArtLetterRead=true;
    s.flags.catArtReplyParts=[...s.replyParts];
    remember('cat','古いスケッチブックを開き、友人の展示会への誘いに迷っている');
    const impact={};
    s.replyParts.forEach((index,step)=>{
      const effects=catParts[step].options[index][2];
      for(const [key,value] of Object.entries(effects))impact[key]=(impact[key]||0)+value;
    });
    s.flags.catArtImpact=impact;
    affect('cat',{agency:(impact.agency||0)*2,reflection:(impact.reflection||0)*2,trust:impact.trust||0,stress:-(impact.comfort||0)*2});
  }
  if(/^((cat|driver|fish|clock|terminal)(8|9|10|11|12|13|14)|bread(12|14)|anon12)/.test(l.id))applyLateReply(l,choice);
  if(l.id==='bread5'&&choice==='question')s.flags.breadNameQuestion=true;
  if(l.id==='moon7'&&choice==='question')s.flags.nextWeekQuestion=true;
  if(l.id==='anon6')remember('anon','番組を以前から静かに聴いていた');
  if(id==='bread'&&firstTime)remember('bread','パン屋で新作のパンを考えている');
}

// 重要イベントは台本、日常の選択は感情・記憶・性格を参照した自律処理。
function advanceExtendedWorld(n){
  if(n===4){
    event('終点のひとつ前は駅から帰り、明日の仕事の支度をした。');
    privateRemember('terminal','木曜日には駅で誰かを待つ習慣がある');
    event('夜明けの猫は仕事を終え、昔の箱を開けようか迷った。');
    affect('cat',{stress:1,reflection:2});
    event('古時計は図書室へ行き、子どもの質問を思い返した。');
    privateRemember('clock','図書室の読み聞かせが少し楽しみになりつつある');
    event('午前3時の配達員は遅い時間に配達を終えた。');
    affect('driver',{stress:3});
    event('透明な金魚は友人に返信する前に、一度文章を読み直した。');
    affect('fish',{reflection:1});
  } else if(n===5){
    event('午前3時の配達員は伝票の小さな間違いを直して帰宅した。');
    privateRemember('driver','気丈に振る舞ったが、仕事で疲れがたまっている');
    affect('driver',{stress:3,reflection:2});
    event('夜明けの猫は喫茶店で鉛筆を見つけ、学生時代を思い出した。');
    privateRemember('cat','机の奥にスケッチブックが残っている');
    affect('cat',{reflection:2});
    // 凛の行動はプレイヤーの返事と本人の性格の両方による。
    const f=s.listeners.fish;
    const confidence=Math.max(.12,Math.min(.70,(f.agency+f.reflection*.35-f.stress*.15)/125));
    s.flags.fishSpoke=rand()<confidence;
    if(s.flags.fishSpoke){
      event('透明な金魚は友人の誘いを一度断り、本屋へ寄った。');
      privateRemember('fish','友人に「今日は行けない」と伝えた');
      affect('fish',{agency:3,stress:2});
    } else {
      event('透明な金魚は断れずに返事をして、家で少し後悔した。');
      privateRemember('fish','友人の誘いを断れずに後悔した');
      affect('fish',{reflection:2,stress:2});
    }
    event('古時計は図書室で読む次の本を探した。');
  } else if(n===6){
    event('午前3時の配達員は疎遠だった家族からのメッセージを読んだ。');
    privateRemember('driver','妹との関係をどうするか考えている');
    affect('driver',{reflection:2,stress:2});
    event('夜明けの猫に、学生時代の友人から展示会への誘いが届いた。');
    privateRemember('cat','友人から展示会に一枚出さないかと誘われた');
    affect('cat',{reflection:3,stress:1});
    event('古時計は海辺の駅で撮った写真を眺めた。');
    privateRemember('clock','海辺の駅に果たせていない約束がある');
  } else if(n===7){
    const cat=s.listeners.cat;
    let chance=Math.max(.12,Math.min(.78,(cat.agency+cat.reflection*.38-cat.stress*.22)/125));
    if(s.flags.catArtLetterRead)chance+=.10;
    s.flags.catStartedSketch=rand()<Math.min(.83,chance);
    if(s.flags.catStartedSketch){
      event('夜明けの猫は机の奥から鉛筆を出し、短い線を一本描いた。');
      privateRemember('cat','久しぶりに絵を描き始めた');
    } else {
      event('夜明けの猫はスケッチブックを机に置いたまま眠った。');
      privateRemember('cat','まだ描けていないが、スケッチブックを手元に出した');
    }
    event('午前3時の配達員は家族への返事を考えたが、送るかはまだ決めなかった。');
    event('古時計は、机の上の古い切符を捨てずにおいた。');
  }else if(n>=8&&n<=14){advanceLateWorld(n)}
}

function createNightLetters(n){
  if(n===4)return ['terminal4','cat4',s.flags.fishRead?(s.flags.fishAction==='journal'?'fish4':'fish4follow'):'fish4first','clock4','driver4','bread4'];
  if(n===5)return ['driver5','clock5','cat5','bread5','moon5'];
  if(n===6)return [s.flags.fishSpoke?'fish6':'fish6hesitant','driver6','clock6','bread6','anon6'];
  if(n===7)return ['cat7','clock7','driver7','fish7','bread7','moon7'];
  if(n===8)return ['driver8',s.flags.catStartedSketch?'cat8draw':'cat8wait','clock8','fish8','bread8','moon8'];
  if(n===9)return [s.flags.catStartedSketch?'cat9drawing':'cat9still','fish9','driver9','clock9','bread9'];
  if(n===10)return ['cat10','driver10','fish10','clock10','moon10','bread10'];
  if(n===11)return [s.flags.terminalHeard?'terminal11':'terminal11first',s.flags.clockWifeKnown||s.flags.clockStationAsked||s.flags.read_clock?'clock11':'clock11first','cat11','driver11','fish11','moon11'];
  if(n===12)return [s.flags.fishRead||s.flags.read_fish?'fish12':'fish12first','driver12','cat12','clock12','bread12','anon12'];
  if(n===13)return ['terminal13','driver13','cat13','fish13','clock13','moon13'];
  if(n===14)return ['cat14','driver14','fish14','clock14','terminal14','bread14','moon14'];
  return [];
}

function updatePendingLetters(){
  if(s.night<4)return;
  const existing=(s.pending||[]).filter(x=>x&&typeof x.id==='string'&&x.until>=s.night&&!s.chosen.includes(x.id));
  const fresh=nightLetters(s.night)
    .filter(id=>!s.chosen.includes(id)&&(letter(id)?.carry)&&!(s.pending||[]).some(item=>item.id===id))
    .map(id=>({id,until:s.night+letter(id).carry}));
  const merged=new Map();
  for(const entry of [...existing,...fresh]){
    if(!merged.has(entry.id))merged.set(entry.id,entry);
  }
  // 溜まり続けて選べなくなるのを避け、最大2通まで持ち越す。
  s.pending=[...merged.values()].slice(0,2);
}

function recordOpening(){
  const tone=s.stationTone ||= {warmth:0,curiosity:0,quiet:0};
  const mood=OPENING_MOODS[s.opening];
  if(mood)tone[mood]=(tone[mood]||0)+1;
  log('オープニング',lettersBroadcastPhrase4916('opening',s.opening));
}

// 選曲は運命を直接変更せず、その晩に放送を受け取ったリスナーの気分だけに作用する。
function applySongMood(){
  const heard=new Set(s.played.filter(x=>x.night===s.night).map(x=>x.who));
  for(const id of heard){
    if(s.song===0)affect(id,{reflection:1});
    else if(s.song===1)affect(id,{stress:-2});
    else if(s.song===2)affect(id,{agency:1});
    else if(s.song===3)affect(id,{stress:-1});
    else if(s.song===4)affect(id,{agency:1});
    else if(s.song===5)affect(id,{reflection:1});
  }
}

// v1.3: 制作中の人生分岐用の非公開生活データ。数値はプレイヤーに開示しない。
function initializeStoryState(existing){
  const defaults={
    cat:{energy:46,financialPressure:66,artDays:0,jobSteps:0},
    driver:{fatigue:62,familyTension:68,draftSteps:0,messageImpulse:0,patience:0},
    fish:{friendTension:61,careerCuriosity:34,boundarySteps:0,speakingImpulse:0},
    clock:{socialContact:32,promiseClue:22,travelImpulse:0},
    terminal:{resolve:27,writingDays:0,contactImpulse:0}
  };
  const result={};
  for(const [id,base] of Object.entries(defaults))result[id]={...base,...(existing?.[id]||{})};
  return result;
}
function addStory(id,changes){
  const obj=s.storyState?.[id];if(!obj)return;
  for(const [key,delta] of Object.entries(changes))obj[key]=clamp((obj[key]||0)+delta);
}
function scorePick(choices){
  let total=choices.reduce((t,c)=>t+Math.max(.1,c[1]),0),r=rand()*total;
  for(const [key,w] of choices){r-=Math.max(.1,w);if(r<0)return key;}
  return choices[choices.length-1][0];
}
function applyLateReply(l,choice){
  const id=l.id;
  if(id==='driver8'){
    s.flags.driverFamilyDiscussed=true;
    remember('driver','妹から久しぶりに連絡があり、返事を考えている');
    s.replyParts.forEach((ix,j)=>{
      const effects=driverParts[j].options[ix][2];
      addStory('driver',{messageImpulse:(effects.agency||0)*3+(effects.relationship||0)*2,
        patience:(effects.comfort||0)*3, draftSteps:(effects.reflection||0)*2});
      affect('driver',{trust:(effects.trust||0),reflection:(effects.reflection||0)*2,agency:(effects.agency||0)*2,stress:-(effects.comfort||0)});
    });
  }
  if(id==='clock11'||id==='clock11first'){
    s.flags.clockPromiseLetterRead=true;
    remember('clock','妻と海辺の駅を再訪する約束があった');
    for(let j=0;j<3;j++){
      const effects=clockParts[j].options[s.replyParts[j]][2];
      addStory('clock',{travelImpulse:(effects.agency||0)*3+(effects.reflection||0),socialContact:(effects.trust||0)});
      affect('clock',{trust:effects.trust||0,reflection:(effects.reflection||0)*2,agency:(effects.agency||0)*2});
    }
  }
  if(id==='fish12'||id==='fish12first'){
    s.flags.fishFutureDiscussed=true;
    remember('fish','文章を書く仕事について関心がある');
    for(let j=0;j<3;j++){
      const effects=fishFutureParts[j].options[s.replyParts[j]][2];
      addStory('fish',{speakingImpulse:(effects.agency||0)*3+(effects.relationship||0),careerCuriosity:(effects.reflection||0)*2});
      affect('fish',{trust:effects.trust||0,reflection:(effects.reflection||0)*2,agency:(effects.agency||0)*2,stress:-(effects.comfort||0)});
    }
  }
  if(id==='terminal13'){
    s.flags.terminalPromiseDiscussed=true;
    remember('terminal','弟との約束を思い出し、毎週駅へ行っている');
    for(let j=0;j<3;j++){
      const effects=terminalParts[j].options[s.replyParts[j]][2];
      addStory('terminal',{contactImpulse:(effects.agency||0)*3+(effects.reflection||0),resolve:effects.comfort||0});
      affect('terminal',{trust:effects.trust||0,reflection:(effects.reflection||0)*2,agency:(effects.agency||0)*2});
    }
  }
  if(id.startsWith('cat8')||id.startsWith('cat9')||id==='cat10'||id==='cat11'||id==='cat12'||id==='cat13'){
    if(['agency','art'].includes(choice))addStory('cat',{artDays:2,jobSteps:1});
    if(choice==='reflection')addStory('cat',{jobSteps:1});
    if(id==='cat13')remember('cat','創作と働き方について自分で選ぼうとしている');
  }
  if(id==='clock8'||id==='clock10'||id==='clock13'){
    if(choice==='past'||choice==='agency')addStory('clock',{travelImpulse:3,promiseClue:3});
    if(id==='clock8')remember('clock','海辺の駅へ行く約束があった');
  }
  if(id.startsWith('terminal')){
    s.flags.terminalHeard=true;
    if(id==='terminal11'||id==='terminal11first')remember('terminal','終点のひとつ前の駅と、閉店する花屋について投稿した');
    if(choice==='agency'||choice==='reflection')addStory('terminal',{contactImpulse:2});
  }
  if(id==='fish9'||id==='fish10'||id==='fish11'||id==='fish13'){
    addStory('fish',{careerCuriosity:choice==='reflection'?3:1,speakingImpulse:choice==='agency'?2:0});
    if(id==='fish9'||id==='fish13')remember('fish','進路の希望について悩んでいる');
  }
  if(id==='driver9'||id==='driver10'||id==='driver11'||id==='driver12'||id==='driver13'){
    addStory('driver',{draftSteps:choice==='reflection'?2:1,messageImpulse:choice==='agency'?3:0});
    if(id==='driver12')remember('driver','妹へのメッセージの下書きを書いた');
  }
  if(id==='bread12'||id==='bread14')remember('bread','「夜更かしあんぱん」の試作を続けている');
  if(id==='anon12')remember('anon','帰宅後、灯りをつける前に番組を聴いている');
  if(id==='fish14')remember('fish','進路についての近況を投稿した');
  if(id==='cat14')remember('cat','働き方や絵について近況を投稿した');
  if(id==='driver14')remember('driver','妹との関係について近況を投稿した');
  if(id==='clock14')remember('clock','図書室や海辺の駅について近況を投稿した');
  if(id==='terminal14')remember('terminal','駅と昔の約束について近況を投稿した');
}

// v1.8 人生の分岐: 返答のスコアだけでなく生活の蓄積から道を選ぶ。
// 分岐はゴールではない。翌日の具体的な行動・健康・経済・人間関係に引き継ぐ。
const LIFE_BRANCH_KEYS={cat:'catPath',driver:'driverPath',fish:'fishPath',clock:'clockPath',terminal:'terminalPath'};
const LIFE_ROUTES={
 cat:{
  create:{label:'仕事を続けながら描く',goal:'忙しい日に絵を描く時間をどう残すか試す',step:'仕事の後、短い時間だけ鉛筆を持った',delta:{hope:2,joy:1,leisure:1,anxiety:1}},
  change:{label:'転職先を探す',goal:'求人を調べ、今の職場とも距離を整理する',step:'求人票を一枚読み、気になる点を手帳に書いた',delta:{hope:2,anxiety:2,leisure:-1}},
  leave:{label:'退職も含めて相談する',goal:'生活費を確かめてから、上司に働き方を相談する',step:'生活費を見直し、上司へ相談する文章を下書きした',delta:{hope:1,anxiety:3,finance:-1}},
  stay:{label:'今は仕事を続ける',goal:'続ける理由を自分の言葉で確かめる',step:'今日は帰宅後の予定を自分で決め、ゆっくり休んだ',delta:{anxiety:-1,health:1}}
 },
 driver:{
  talk:{label:'妹と直接話す',goal:'話してわかったことを受け止め、関係を急がない',step:'短い電話を終え、言えなかった言葉を考えた',delta:{hope:1,anxiety:2,loneliness:-1}},
  letter:{label:'妹へ文章を送る',goal:'返事を急かさず、自分の生活も整える',step:'妹への短い文章を送ってから、休憩所でひと息ついた',delta:{hope:2,anxiety:1,health:1}},
  pause:{label:'返事の前に休む',goal:'疲れを軽くしてから、返事について考える',step:'早めに仮眠を取り、家で食事を作った',delta:{health:3,anxiety:-2,hope:1}},
  avoid:{label:'当面は距離を置く',goal:'連絡を見ていない理由を自分でも考える',step:'配送の仕事に集中しながら、途中で休憩を取った',delta:{health:1,anxiety:1}}
 },
 fish:{
  speak:{label:'自分の希望を家族に話す',goal:'話したあとの相手の反応も受け止め、自分で調べ続ける',step:'家族に文章を書く仕事への関心を話した',delta:{hope:2,anxiety:2,loneliness:-1}},
  explore:{label:'説明会や情報を探す',goal:'興味を確かめるための情報を一つずつ集める',step:'仕事の説明会を調べ、ひとつ申し込んだ',delta:{hope:3,leisure:-1}},
  conform:{label:'友人と同じ進路を見てみる',goal:'同行しても、自分の気持ちは別に確かめる',step:'友人と説明会へ行く日程を確認した',delta:{hope:1,anxiety:-1}},
  wait:{label:'結論を保留する',goal:'いま答えを出せない気持ちをノートに書いてみる',step:'進路の希望欄を空白のまま、気になる仕事を書き出した',delta:{anxiety:1,hope:1}}
 },
 clock:{
  visit:{label:'海辺の駅へ行く準備',goal:'妻との約束を胸に、駅まで無理のない計画を立てる',step:'海辺の駅への交通手段を調べた',delta:{hope:2,anxiety:1,health:-1}},
  community:{label:'図書室で過ごす時間を広げる',goal:'今の交流を続け、自分の楽しさを受け入れる',step:'図書室で次に読む本を選んだ',delta:{joy:2,loneliness:-2,hope:1}},
  ordinary:{label:'今の暮らしを続ける',goal:'いつもの散歩と、新しい楽しみの両方を大切にする',step:'朝の散歩で花を眺め、お茶を丁寧に淹れた',delta:{joy:1,health:2}}
 },
 terminal:{
  contact:{label:'弟に手紙を書く',goal:'返事がなくても自分の暮らしを続ける',step:'弟への便箋を封筒に入れ、宛名を書いた',delta:{hope:2,anxiety:2}},
  stay:{label:'駅へ通うことを続ける',goal:'待つ時間のほかにも小さな楽しみを探す',step:'駅前の花屋があった場所へ寄った',delta:{hope:1,loneliness:1}},
  move:{label:'別の道を歩いてみる',goal:'駅に行かない木曜日を一度過ごしてみる',step:'駅ではない場所へ出かける予定を手帳に書いた',delta:{hope:2,anxiety:1,leisure:1}}
 }
};
function createLifePaths(){return {schema:1,resolvedNights:[],advancedNights:[],outcomes:{},history:[]}}
function migrateLifePaths(data){
 const src=data.lifePaths&&typeof data.lifePaths==='object'?data.lifePaths:createLifePaths();
 src.schema=1;
 src.resolvedNights=Array.isArray(src.resolvedNights)?[...new Set(src.resolvedNights.filter(x=>Number.isInteger(x)&&x>=1&&x<=14))]:[];
 src.advancedNights=Array.isArray(src.advancedNights)?[...new Set(src.advancedNights.filter(x=>Number.isInteger(x)&&x>=1&&x<=14))]:[];
 src.outcomes=src.outcomes&&typeof src.outcomes==='object'?src.outcomes:{};
 src.history=Array.isArray(src.history)?src.history.slice(-40):[];
 // 旧版で第13夜の決断が確定している場合、結末を絶対に引き直さない。
 const savedRoutes=['cat','driver','fish','clock','terminal'].filter(id=>
   LIFE_ROUTES[id][data.flags?.[LIFE_BRANCH_KEYS[id]]] && !src.outcomes[id]);
 for(const id of savedRoutes){
  const route=data.flags[LIFE_BRANCH_KEYS[id]];
  src.outcomes[id]={route,resolvedNight:13,legacy:true,reasonTags:[],nextGoal:LIFE_ROUTES[id][route].goal,
    followThrough:[],appliedNights:[]};
 }
 if(savedRoutes.length)src.resolvedNights=[...new Set([...src.resolvedNights,13])];
 // 分岐の保存記録があれば、片方のフラグが欠けても確定済みの道を復元する。
 for(const [id,outcome] of Object.entries(src.outcomes)){
  const flag=LIFE_BRANCH_KEYS[id];
  if(flag&&LIFE_ROUTES[id]?.[outcome.route]&&!LIFE_ROUTES[id][data.flags?.[flag]])data.flags[flag]=outcome.route;
 }
 data.lifePaths=src;return data;
}
function lifeCore(id){return s.simState?.people?.[id]||createSimulationState().people[id]}
function lifeRelationship(id,key){return lifeCore(id).relationships?.[key]||{trust:45,tension:35,closeness:45,contactCount:0}}
function lifeHabit(id,category){return Math.min(12,(lifeCore(id).rhythms?.[category]||0)*1.25)}
function lifeMemory(id,tag){return Math.min(10,(lifeCore(id).memories||[]).filter(m=>m.importance>=2&&m.tag===tag).length*2)}
function lifeContactImprint(id,relKey,night=13){
 const rel=lifeRelationship(id,relKey);
 const history=(rel.history||[]).filter(h=>Number.isInteger(h.night)&&h.night<night&&h.night>=night-9);
 let trace=0;
 for(const h of history.slice(-4)){
  trace+=({warm:3,ordinary:.5,guarded:-1.4,awkward:-3.2})[h.outcome]||0;
 }
 return Math.max(-11,Math.min(11,trace));
}
function lifeBranchWeights(id){
 const p=lifeCore(id),a=s.listeners[id],st=s.storyState[id],e=p.emotion,l=p.life,r=lifeRelationship;
 const creative=lifeHabit(id,'creative'),social=lifeHabit(id,'social'),reflect=lifeHabit(id,'reflection');
 const reasonTags=[];
 let choices=[];
 if(id==='cat'){
  const boss=r(id,'boss'),artFriend=r(id,'artFriend');
  choices=[
   ['create',12+st.artDays*1.1+a.agency*.22+creative*2.3+lifeMemory(id,'creative')+artFriend.trust*.12+e.hope*.10+l.leisure*.06],
   ['change',13+st.jobSteps*1.3+a.reflection*.16+reflect*.85+e.anxiety*.12+boss.tension*.10],
   ['leave',6+a.stress*.15+a.agency*.18+boss.tension*.19+(100-l.work)*.06-st.financialPressure*.18-p.traits.caution*.10],
   ['stay',11+st.financialPressure*.19+p.traits.caution*.15+boss.trust*.16+(65-l.finance)*.08+Math.max(0,48-a.agency)*.14]
  ];
  if(creative>=5)reasonTags.push('絵を描くことが習慣になり始めた');
  if(boss.tension>50)reasonTags.push('上司と話すことに緊張が残っている');
  if(st.financialPressure>65)reasonTags.push('生活費への心配がある');
  if(artFriend.trust>68)reasonTags.push('昔の友人とのつながりが支えになっている');
 }else if(id==='driver'){
  const sister=r(id,'sister');
  const sent=!!(s.flags.driverRepliedEarly||s.flags.driverSentBy12);
  choices=[
   ['talk',sent?10+a.agency*.19+social*1.3+sister.trust*.26+st.messageImpulse*.75-st.fatigue*.09-sister.tension*.09:0],
   ['letter',10+st.draftSteps*.95+a.reflection*.12+reflect*.9+st.messageImpulse*.5+p.traits.caution*.09],
   ['pause',13+st.fatigue*.23+(100-l.health)*.2+st.patience*.65+e.anxiety*.1],
   ['avoid',8+st.familyTension*.16+sister.tension*.25+e.anxiety*.15-social*.4]
  ];
  if(!sent)reasonTags.push('妹にはまだ返信を送っていない');
  if(st.fatigue>60)reasonTags.push('疲労がたまっている');
  if(sister.tension>55)reasonTags.push('妹との間には気まずさがある');
  if(sister.trust>55)reasonTags.push('妹との間に残る信頼がある');
 }else if(id==='fish'){
  const friend=r(id,'friend'),family=r(id,'family');
  choices=[
   ['speak',8+a.agency*.27+st.speakingImpulse*1.5+st.boundarySteps+social*1.2+family.trust*.17+(100-friend.tension)*.07],
   ['explore',12+st.careerCuriosity*.46+a.reflection*.12+creative*1.3+reflect*.9+e.hope*.08],
   ['conform',7+friend.closeness*.17+friend.trust*.13+p.traits.caution*.12+e.anxiety*.08],
   ['wait',9+Math.max(0,55-a.agency)*.24+e.anxiety*.15+family.tension*.1]
  ];
  if(friend.tension>55)reasonTags.push('友人に断ることへのためらいがある');
  if(creative>=4)reasonTags.push('自分で調べる時間が増えた');
  if(family.trust>70)reasonTags.push('家族に話を聞いてもらえる可能性を感じている');
 }else if(id==='clock'){
  const library=r(id,'library'),oldFriend=r(id,'oldFriend');
  choices=[
   ['visit',10+st.travelImpulse*1.2+st.promiseClue*.18+a.agency*.12+reflect+e.hope*.12+(100-l.health)*-.08],
   ['community',12+st.socialContact*.35+social*1.7+library.trust*.21+library.closeness*.09],
   ['ordinary',12+e.joy*.10+p.traits.caution*.09+(100-l.health)*.12+oldFriend.tension*.05]
  ];
  if(library.closeness>55)reasonTags.push('図書室に顔なじみが増えた');
  if(st.promiseClue>32)reasonTags.push('妻との古い約束が心に残っている');
  if(l.health<55)reasonTags.push('体調を考えて行動を選ぶ');
 }else if(id==='terminal'){
  const brother=r(id,'brother'),neighbor=r(id,'neighbor');
  choices=[
   ['contact',9+st.contactImpulse*1.55+a.agency*.22+reflect+brother.trust*.13-brother.tension*.08],
   ['stay',13+Math.max(0,55-a.agency)*.18+e.loneliness*.13+p.traits.caution*.16+brother.tension*.08],
   ['move',9+st.resolve*.3+a.reflection*.11+e.hope*.13+neighbor.closeness*.06]
  ];
  if(brother.tension>50)reasonTags.push('弟との間に言えないことがある');
  if(reflect>=5)reasonTags.push('一人で考える時間が習慣になった');
  if(neighbor.closeness>45)reasonTags.push('近所の人との挨拶が続いている');
 }
 // 小さな会話の蓄積が、時に本人の選択を後押しし、時に慎重にさせる。
 // 一度の会話だけで人生が反転しないよう影響は限定する。
 const feel=(rel)=>lifeContactImprint(id,rel,13);
 const contactEffects={
  cat:{create:feel('artFriend')*.9,change:-feel('boss')*.9,leave:-feel('boss')*.6,stay:feel('boss')*.9},
  driver:{talk:feel('sister')*1.2,letter:feel('sister')*.45,pause:-feel('sister')*.45,avoid:-feel('sister')*.65},
  fish:{speak:feel('family')*1.05,explore:-feel('friend')*.2,conform:feel('friend')*.65,wait:-feel('friend')*.45},
  clock:{community:feel('library')*1.1,visit:feel('oldFriend')*.3,ordinary:-feel('library')*.3},
  terminal:{contact:feel('brother')*.8,stay:-feel('neighbor')*.4,move:feel('neighbor')*.55}
 };
 choices=choices.map(([route,score])=>[route,score+(contactEffects[id]?.[route]||0)]);
 // 選べない選択肢は表示せず、本人の生活と論理的に矛盾する行動を防ぐ。
 if(id==='driver'&&!s.flags.driverRepliedEarly&&!s.flags.driverSentBy12){
  choices=choices.filter(([key])=>key!=='talk');
 }
 return {choices:choices.map(([route,w])=>[route,Math.max(.5,Math.round(w*100)/100)]),reasonTags};
}
function resolveLifeCrossroads(n){
 s.lifePaths ||= createLifePaths();
 if(s.lifePaths.resolvedNights.includes(n))return;
 for(const id of Object.keys(LIFE_BRANCH_KEYS)){
  const flag=LIFE_BRANCH_KEYS[id];
  // v1.7などで既に選択した道は、そのまま引き継ぐ。
  const result=lifeBranchWeights(id);
  const existing=s.flags[flag];
  const route=LIFE_ROUTES[id][existing]?existing:scorePick(result.choices);
  s.flags[flag]=route;
  const item={route,resolvedNight:n,legacy:false,reasonTags:result.reasonTags.slice(0,4),
   nextGoal:LIFE_ROUTES[id][route].goal,followThrough:[],appliedNights:[],weights:Object.fromEntries(result.choices)};
  s.lifePaths.outcomes[id]=item;
  s.lifePaths.history.push({night:n,id,route,type:'crossroads'});
  privateRemember(id,'これまでの生活と関係を振り返り、「'+LIFE_ROUTES[id][route].label+'」という方針を選んだ');
 }
 s.lifePaths.resolvedNights.push(n);
}
function lifeApplyDelta(p,delta){
 for(const [key,value] of Object.entries(delta)){
  if(Object.hasOwn(p.emotion,key))simAdjust(p.emotion,key,value);
  else if(Object.hasOwn(p.life,key))simAdjust(p.life,key,value);
 }
}
function lifeRealConversation(p,key,n,actionId,summary){
 if(!p.relationships[key])return;
 simMeet(p,key,n,actionId);
 const hist=p.relationships[key].history;
 const recent=hist.at(-1);
 if(recent)recent.summary=summary+'。'+recent.summary;
}
function lifeAfterDaily(n){
 const lp=s.lifePaths;
 if(!lp||lp.advancedNights.includes(n)||n<13)return;
 for(const [id,out] of Object.entries(lp.outcomes)){
  // 以前の版で済んだ夜には新しい行動を後付けしない。
  if(out.legacy||out.appliedNights?.includes(n)||!LIFE_ROUTES[id]?.[out.route])continue;
  const p=lifeCore(id),detail=LIFE_ROUTES[id][out.route];
  if(n===13){
   // 決断の瞬間そのものにも両立する感情を残す。
   lifeApplyDelta(p,{hope:1,anxiety:1});
   simMemory(p,{night:n,kind:'turning_point',tag:'choice',importance:5,
    summary:'いくつかの道を比べて「'+detail.label+'」を今の方針にした'});
   // 実際に連絡・会話したときのみ関係の履歴を進める。
   if(id==='driver'&&out.route==='talk')lifeRealConversation(p,'sister',n,'phone','妹と短い電話をした');
   if(id==='driver'&&out.route==='letter'){
    const r=p.relationships.sister;
    r.contactCount++;r.lastContactNight=n;
    r.history.push({night:n,actionId:'sent-message',summary:'妹に短いメッセージを送った'});
    r.history=r.history.slice(-12);
   }
   if(id==='fish'&&out.route==='speak')lifeRealConversation(p,'family',n,'career-talk','家族に進路への興味を話した');
   out.followThrough.push({night:n,action:'その道を選び、具体的な準備を始めた'});
  }
  if(n===14){
   // 分岐した後も続く暮らし：個別の生活変化・記憶・翌章への行動目標。
   lifeApplyDelta(p,detail.delta);
   simMemory(p,{night:n,kind:'turning_point',tag:'follow_through',importance:4,summary:detail.step});
   const daily=p.daily.find(d=>d.night===n);
   if(daily)daily.turningPoint=detail.step;
   out.followThrough.push({night:n,action:detail.step});
   out.continuation={goal:detail.goal,phase:'ongoing',nextCheckNight:15,
    possibleConsequences:lifePossibleConsequences(id,out.route)};
   s.lifePaths.history.push({night:n,id,type:'follow_through',route:out.route});
   // 今後の行動に残る習慣の種。次章に引き継ぐが、未実装の夜を勝手に進めない。
   p.signals[({cat:'creative',driver:'reconnect',fish:'boundaries',clock:'memories',terminal:'reconnect'})[id]]=3;
  }
  out.appliedNights.push(n);
 }
 lp.advancedNights.push(n);
}
function lifePossibleConsequences(id,route){
 const options={
  cat:{create:['時間配分を再調整する','展示会の誘いに返事をする'],change:['仕事の条件を比較する','転職活動で疲れた日は休む'],leave:['生活費をもう一度確かめる','上司と相談する'],stay:['休む時間を確保する','描きたい気持ちを確かめる']},
  driver:{talk:['会話を急いで解釈しない','家族以外の時間も楽しむ'],letter:['返事を待ちながら生活する','書いた言葉の意味を考える'],pause:['疲労を回復する','返事をする時期を自分で決める'],avoid:['仕事以外の時間を取る','連絡から距離を置く理由を考える']},
  fish:{speak:['相手の反応を待つ','関心のある仕事を調べる'],explore:['説明会へ行く','友人に自分の興味を話す'],conform:['同行して違いを確かめる','一人で選ぶ時間を持つ'],wait:['ノートに気持ちを書く','興味ある選択肢を増やす']},
  clock:{visit:['道中の体調を整える','思い出の駅を歩く'],community:['新しい本を探す','古い約束を時々思い出す'],ordinary:['散歩を続ける','新しい誘いを考える']},
  terminal:{contact:['書いた手紙をどうするか決める','返事を待たずに暮らす'],stay:['駅以外の過ごし方も探す','人との挨拶を続ける'],move:['駅以外で過ごす木曜日を迎える','古い切符を残す']}
 };
 return options[id]?.[route]||[];
}
function lifeDailyActionBias(id,action,night){
 if(night<14)return 0;
 const outcome=s.lifePaths?.outcomes?.[id];if(!outcome||outcome.legacy)return 0;
 const category=action[2],act=action[0],route=outcome.route;
 const boosts={
  cat:{create:{creative:16},change:{reflection:8,duty:6},leave:{reflection:10,rest:5},stay:{rest:10}},
  driver:{talk:{social:10,reflection:6},letter:{reflection:10,rest:5},pause:{rest:18},avoid:{duty:7,rest:5}},
  fish:{speak:{social:9,reflection:5},explore:{creative:12,reflection:6},conform:{social:7},wait:{reflection:12,rest:6}},
  clock:{visit:{reflection:11},community:{social:14},ordinary:{rest:10,creative:4}},
  terminal:{contact:{reflection:12},stay:{reflection:6,rest:7},move:{rest:8,duty:4}}
 };
 let boost=boosts[id]?.[route]?.[category]||0;
 if(id==='cat'&&route==='create'&&act==='draw')boost+=5;
 if(id==='fish'&&route==='explore'&&act==='career')boost+=5;
 if(id==='clock'&&route==='community'&&act==='library')boost+=5;
 return boost;
}

function advanceLateWorld(n){
  if(!s.storyState)s.storyState=initializeStoryState();
  const c=s.storyState.cat,d=s.storyState.driver,f=s.storyState.fish,k=s.storyState.clock,t=s.storyState.terminal;
  if(n===8){
    event('午前3時の配達員は休憩時間に、妹への返事をもう一度書き始めた。');
    privateRemember('driver','妹からの連絡を気にかけている');
    addStory('driver',{draftSteps:2,fatigue:2});
    if(s.flags.catStartedSketch){addStory('cat',{artDays:2,energy:-2});event('夜明けの猫は仕事帰りに、短い時間だけ机に向かった。')}
    else{addStory('cat',{artDays:1,energy:-1});event('夜明けの猫はスケッチブックをしまわずにおいた。')}
    event('透明な金魚はひとりで文房具店へ行き、黄色いノートを選んだ。');
    addStory('fish',{careerCuriosity:3,boundarySteps:1});
    event('古時計は海辺の駅までの切符を見つめ、引き出しに戻した。');
    addStory('clock',{promiseClue:4});
    privateRemember('terminal','木曜日以外も生活と仕事を続けている');
  }else if(n===9){
    const draws=rand()<Math.min(.78,.25+(s.listeners.cat.agency+c.artDays)/190);
    if(draws){event('夜明けの猫は展示会に誘ってくれた友人へ、久しぶりに連絡をした。');privateRemember('cat','昔の友人に展示会の話を尋ねた');addStory('cat',{artDays:2,jobSteps:1})}
    else{event('夜明けの猫は展示会の返信を下書きに残し、翌日に回した。');addStory('cat',{artDays:1})}
    event('透明な金魚は文章に関わる仕事について自分で調べ始めた。');
    addStory('fish',{careerCuriosity:5});
    if(d.draftSteps>5&&rand()<.58){s.flags.driverRepliedEarly=true;event('午前3時の配達員は妹に「元気だよ」と短く返信した。');privateRemember('driver','妹に短い返信を送った')}
    else event('午前3時の配達員は返信を急がず、配達の仕事を終えた。');
    addStory('driver',{fatigue:2,draftSteps:2});
    event('古時計は図書室で、子どもたちと時計の本を読んだ。');
    addStory('clock',{socialContact:4});
  }else if(n===10){
    event('夜明けの猫は上司への相談内容を紙に書き出してみた。');
    addStory('cat',{jobSteps:3,energy:1});
    const spoke=rand()<Math.min(.8,.20+f.boundarySteps*.025+s.listeners.fish.agency/200);
    s.flags.fishSecondBoundary=spoke;
    if(spoke){event('透明な金魚は友人に、今日は一人で帰りたいと伝えた。');privateRemember('fish','友人に自分の希望を小さく伝えた');addStory('fish',{boundarySteps:3,friendTension:-2})}
    else{event('透明な金魚は断る言葉を考えたが、今日は口にしなかった。');addStory('fish',{boundarySteps:1,friendTension:1})}
    event('古時計は海辺の駅で撮った写真を見つけた。');
    addStory('clock',{promiseClue:4,travelImpulse:1});
    event('午前3時の配達員は一日を終え、家族のことを思い出した。');
    addStory('driver',{draftSteps:1,fatigue:-2});
  }else if(n===11){
    s.flags.clockCheckedTimetable=rand()<Math.min(.82,.25+k.travelImpulse/120+s.listeners.clock.agency/200);
    if(s.flags.clockCheckedTimetable){event('古時計は海辺の駅までの時刻表を調べた。');privateRemember('clock','海辺の駅までの道順を調べた');addStory('clock',{travelImpulse:5})}
    else event('古時計は切符を引き出しに戻し、図書室で過ごした。');
    addStory('clock',{socialContact:4});
    event('終点のひとつ前は、閉まりかけた花屋の前を通った。');
    privateRemember('terminal','駅前の花屋が閉店した');
    addStory('terminal',{resolve:2});
    event('透明な金魚は兄が疲れている話を聞き、人にも自分にもいくつもの面があると考えた。');
    addStory('fish',{careerCuriosity:2});
    event('夜明けの猫は短い時間でも自分のために使うことを考え始めた。');
    addStory('cat',{energy:2,artDays:1});
  }else if(n===12){
    event('透明な金魚は進路についての言葉を、ノートに書き直した。');
    addStory('fish',{speakingImpulse:3,careerCuriosity:3});
    event('午前3時の配達員は妹に宛てた文章を短く書き直した。');
    addStory('driver',{draftSteps:3});
    if(!s.flags.driverRepliedEarly && rand()<Math.min(.78,.18+(s.listeners.driver.agency+d.messageImpulse+d.draftSteps)/175)){
      s.flags.driverSentBy12=true;
      event('午前3時の配達員は妹へ短いメッセージを送った。');
      privateRemember('driver','妹に短いメッセージを送った');
    }
    event('夜明けの猫は、今の働き方に必要なことを考え、休む時間を取った。');
    addStory('cat',{jobSteps:2,energy:3});
    event('古時計は図書室の壁時計を直し、子どもたちと話した。');
    addStory('clock',{socialContact:6});
  }else if(n===13){
    const cat=s.listeners.cat,driver=s.listeners.driver,fish=s.listeners.fish,clock=s.listeners.clock,terminal=s.listeners.terminal;
    // v1.8: 重要な分岐は5つの生活領域（性格・感情・生活・記憶／習慣・人間関係）を統合。
    // 結果の理由は本人の非公開メモに残し、放送局は投稿で語られたことしか知らない。
    resolveLifeCrossroads(n);
    event('夜明けの猫は、仕事と創作の今後について自分の考えを整理した。');
    event('午前3時の配達員は、妹との関係にどう向き合うかを選んだ。');
    event('透明な金魚は進路の希望欄を見つめ、次の行動を決めた。');
    event('古時計は古い切符の行き先について、今の自分の気持ちを確かめた。');
    event('終点のひとつ前は、木曜日以外の夜に弟との約束について考えた。');
    // 行動の確定を番組の知識にしない。翌夜のお便りで初めて知る。
    for(const id of ['cat','driver','fish','clock','terminal'])privateRemember(id,'第14夜へ向けて、自分で次の一歩を選んだ');
  }else if(n===14){
    event('第1章の放送が終わっても、街ではそれぞれの朝が始まる。');
  }
}


// v1.6: 放送以外の出来事が他者や後日の手紙へ届く、小さな因果のつながり。
// 番組に見えるのは「本人が自主的に投稿した便箋」だけ。世界記録は非公開。
const MICRO_LETTER_IDS = [
 'echo_driver_clock','echo_clock_driver','echo_fish_brother','echo_bread_moon','echo_moon_bread',
 'echo_cat_artlook','echo_cat_draw','echo_fish_diary','echo_fish_practice','echo_clock_library',
 'echo_driver_coworker','echo_bread_customer','echo_terminal_detour','echo_moon_family',
 'echo_rel_cat_boss','echo_rel_fish_friend','echo_rel_driver_coworker','echo_rel_clock_library',
 'echo_rel_bread_boss','echo_rel_terminal_neighbor','echo_rel_driver_sister'
];
function createMicroWorldState(){return {schema:1,processedNights:[],queued:{},emitted:[],history:[],links:{}}}
function migrateMicroWorld(data){
 const w=data.microWorld&&typeof data.microWorld==='object'?data.microWorld:createMicroWorldState();
 w.schema=1;
 w.processedNights=Array.isArray(w.processedNights)?[...new Set(w.processedNights.filter(n=>Number.isInteger(n)&&n>=1&&n<=14))]:[];
 w.queued=w.queued&&typeof w.queued==='object'?w.queued:{};
 for(const [n,ids] of Object.entries(w.queued))w.queued[n]=Array.isArray(ids)?ids.filter(id=>MICRO_LETTER_IDS.includes(id)).slice(0,1):[];
 w.emitted=Array.isArray(w.emitted)?[...new Set(w.emitted.filter(id=>MICRO_LETTER_IDS.includes(id)))]:[];
 w.history=Array.isArray(w.history)?w.history.slice(-50):[];
 w.links=w.links&&typeof w.links==='object'?w.links:{};
 data.microWorld=w;
 return data;
}
function microRecent(id,actionIds,night,span=0){
 const p=s.simState?.people?.[id];
 return p?.daily?.some(d=>d.night>=night-span&&d.night<=night&&actionIds.includes(d.actionId))||false;
}
function microRemember(id,night,summary,tag='social'){
 const p=s.simState?.people?.[id];
 if(p)simMemory(p,{night,kind:'life',tag,importance:3,summary});
}
function microLink(name,night,participants,description){
 const w=s.microWorld;
 if(w.links[name])return false;
 w.links[name]={night,participants};
 w.history.push({night,type:'intersection',participants,description});
 return true;
}
function microChanceMeeting(n){
 // 同じ日の生活が街角で実際に交差したときだけ、互いに名前を知らない相手との関係が生まれる。
 // ラジオネームや身元を知ったことにはしない。
 const link=s.microWorld?.links?.['old-clock-street'];
 if(!link||link.greeted)return;
 if(!microRecent('driver',['route'],n)||!microRecent('clock',['walk'],n))return;
 const driver=s.simState?.people?.driver,clock=s.simState?.people?.clock;
 if(!driver||!clock)return;
 function register(p,key,name){
  if(!p.relationships[key])p.relationships[key]={name,closeness:12,trust:35,tension:0,personKey:null,contactCount:0,lastContactNight:0,history:[]};
  const r=p.relationships[key];
  r.contactCount++;r.lastContactNight=n;
  r.history.push({night:n,summary:'街角で軽く会釈を交わした'});
  r.history=r.history.slice(-12);
 }
 register(driver,'oldShopStranger','時計屋の前で会った人');
 register(clock,'passingDriver','店の前を通った配達の人');
 link.greeted=true;link.greetedNight=n;
 microRemember('driver',n,'古い時計屋の前で、年配の人と会釈した','social');
 microRemember('clock',n,'元の店の前で、夜間配送の人と会釈した','social');
 s.microWorld.history.push({night:n,type:'meeting',participants:['driver','clock'],description:'互いの素性を知らず、街角で会釈を交わした'});
}
function simulateMicroWorld(n){
 if(!s.microWorld)s.microWorld=createMicroWorldState();
 const w=s.microWorld;
 if(w.processedNights.includes(n))return;
 // すでに第14夜へ達した場合、追加の手紙で無理に結末を説明しない。
 if(n>=14){w.processedNights.push(n);return;}
 const options=[];
 const offer=(id,weight,cause)=>{
  if(w.emitted.includes(id)||!MICRO_LETTER_IDS.includes(id))return;
  options.push({id,weight,cause});
 };
 // 二人が同じ街で暮らしている。ただし互いの名前を知ったり、親しくなったりはしない。
 if(n>=4&&n<=12&&microRecent('driver',['route'],n,1)&&microRecent('clock',['library','repair','walk'],n,1)){
  if(microLink('old-clock-street',n,['driver','clock'],'配送の道と元時計屋の生活圏が重なる')){
   microRemember('driver',n,'配送の道で古い時計屋の看板を見つけた','memories');
   microRemember('clock',n,'昔の店の近くで、夜間配送の車を見かけた','memories');
  }
  microChanceMeeting(n);
  offer('echo_driver_clock',110,'配送と昔の店の周辺が近づいた');
 }
 // 兄の話を通じて仕事の景色が重なる。ラジオ局は二人の本名や勤務先を公開しない。
 if(n>=4&&n<=12&&microRecent('cat',['work','askboss'],n,1)&&microRecent('fish',['brother'],n,1)){
  if(microLink('same-workplace',n,['cat','fish'],'兄の職場での話が間接的につながった')){
   microRemember('fish',n,'兄から職場で頼られている同僚の話を聞いた','social');
   microRemember('cat',n,'会社で同僚から仕事の相談をされた','duty');
  }
  offer('echo_fish_brother',105,'兄との連絡と仕事の出来事が重なった');
 }
 // 「月の秘密」を放送したことがきっかけで、パン屋が試作に遊び心を加えた。
 const moonBroadcast=s.played.some(x=>x.who==='moon'&&x.night<=n);
 if(n>=4&&n<=12&&moonBroadcast&&microRecent('bread',['bake'],n)){
  if(microLink('moon-bread',n,['moon','bread'],'放送された月の話題がパンの試作につながった')){
   microRemember('bread',n,'ラジオで聞いた月の秘密から丸いパンを考えた','creative');
  }
  offer('echo_bread_moon',102,'放送の空想をヒントにパンを試作した');
 }
 // 読まれなかった場合、別のリスナーに続報が伝わることはない。
 if(n>=5&&n<=13&&s.played.some(x=>x.id==='echo_bread_moon'&&x.night===n)){
  microRemember('moon',n,'放送で月の形をしたパンの投稿を聞いた','social');
  offer('echo_moon_bread',140,'紹介されたパンのお便りを聴いて空想が広がった');
 }
 if(n>=6&&n<=13&&s.played.some(x=>x.id==='echo_driver_clock'&&x.night===n)&&microRecent('clock',['walk','repair','library'],n,2)){
  microRemember('clock',n,'放送で古い時計屋の看板についての話を聴いた','memories');
  offer('echo_clock_driver',125,'配送先の時計屋の話と、自分の記憶が重なった');
 }
 // 一人ひとりの小さな習慣も、言葉にしたい日にだけ投稿候補になる。
 if(n>=3){
  if(microRecent('cat',['draw'],n))offer('echo_cat_draw',54,'久しぶりに鉛筆を持った');
  else if(microRecent('cat',['artlook'],n))offer('echo_cat_artlook',46,'古いスケッチブックを開いた');
  if(microRecent('fish',['practice'],n))offer('echo_fish_practice',50,'自分の希望をノートに書いた');
  else if(microRecent('fish',['diary'],n))offer('echo_fish_diary',43,'日記に自分の気持ちを書いた');
  if(microRecent('clock',['library'],n))offer('echo_clock_library',42,'図書室で子どもと交流した');
  if(microRecent('driver',['coworker'],n))offer('echo_driver_coworker',42,'同僚と休憩した');
  if(microRecent('bread',['customer'],n))offer('echo_bread_customer',42,'常連客と話した');
  if(microRecent('terminal',['walk'],n))offer('echo_terminal_detour',43,'普段と違う道を歩いた');
  if(microRecent('moon',['family'],n))offer('echo_moon_family',40,'家族とプリンの話をした');
 }
 // 実際に交わされた言葉と、そのときの気持ちだけが次の手紙のきっかけになる。
 // 「長年の仲だから必ず良くなる」という単純なルールは使わない。
 const contactOffer=(id,who,relKey,weight,needed=1)=>{
  const history=s.simState?.people?.[who]?.relationships?.[relKey]?.history||[];
  const occurred=history.some(h=>h.night===n&&h.outcome);
  if(occurred&&simContactCount(who,relKey)>=needed)
   offer(id,weight,`${NAMES[who]}が${relKey}と実際に会話をした`);
 };
 if(n>=4){
  contactOffer('echo_rel_cat_boss','cat','boss',66);
  contactOffer('echo_rel_fish_friend','fish','friend',74);
  contactOffer('echo_rel_driver_coworker','driver','coworker',67,2);
  contactOffer('echo_rel_clock_library','clock','library',66,2);
  contactOffer('echo_rel_bread_boss','bread','boss',62);
  contactOffer('echo_rel_terminal_neighbor','terminal','neighbor',60);
 }
 // 妹へ実際に送信した、という脚本フラグのある日だけ。
 const sisterHistory=s.simState?.people?.driver?.relationships?.sister?.history||[];
 if(n>=8&&(s.flags.driverRepliedEarly||s.flags.driverSentBy12)&&
    sisterHistory.some(h=>h.night===n&&/返信を送った|メッセージを送った/.test(h.summary)))
  offer('echo_rel_driver_sister',90,'妹へ返信を実際に送った');
 // いつも同じ人からだけ届かないよう、最後に紹介した相手は少し控えめ。
 const recentWho=new Set(s.played.filter(x=>x.night>=n-1).map(x=>x.who));
 for(const item of options){
  if(recentWho.has(letterDB[item.id].who))item.weight-=8;
  item.weight+=(simHash(`micro:${n}:${item.id}:${s.rng}`)%13);
 }
 options.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
 const chosen=options[0];
 if(chosen){
  w.queued[n+1]=[chosen.id];
  w.emitted.push(chosen.id);
  w.history.push({night:n,type:'letter',id:chosen.id,cause:chosen.cause,deliveryNight:n+1});
 }
 w.processedNights.push(n);
 w.history=w.history.slice(-50);
}

// v2.4 : 人と人の関係は放送の外で成長する。
// 世界の事実と、本人の受け止め方と、放送局が知っていることは分けて保存する。
const SOCIAL_PAIRS={
 cat_bread:{members:['cat','bread'],location:'bakery',place:'小さなパン屋',time:'evening',names:{cat:'帰り道のパン屋さん',bread:'夕方に来るお客さん'},
  needs:{cat:['bakery'],bread:['bake','store','boss','customer']}},
 driver_clock:{members:['driver','clock'],location:'clock_street',place:'昔の時計店があった通り',time:'evening',names:{driver:'古い時計店の近くで会う人',clock:'配送中に通りかかる運転手さん'},
  needs:{driver:['shoproute','route'],clock:['shopfront','shopvisit']}},
 fish_clock:{members:['fish','clock'],location:'library',place:'地域の図書室',time:'afternoon',names:{fish:'図書室の年配の方',clock:'図書室によく来る学生さん'},
  needs:{fish:['libraryvisit','librarystudy'],clock:['library']}},
 driver_terminal:{members:['driver','terminal'],location:'station_area',place:'駅前の通り',time:'evening',names:{driver:'駅前で見かける人',terminal:'駅前の配達の人'},
  needs:{driver:['stationdelivery','route'],terminal:['timetable','stationstop']}}
};

// v2.5: 三人が既存リスナーと自律的に接点を持つ場所。
Object.assign(SOCIAL_PAIRS,{
 umbrella_cat:{members:['umbrella','cat'],location:'flower_shop',place:'商店街の花屋',time:'evening',names:{umbrella:'帰り道に鉢を眺めるお客さん',cat:'商店街の花屋さん'},needs:{umbrella:['bouquet','window','flowercustomer'],cat:['flowerstop']}},
 umbrella_clock:{members:['umbrella','clock'],location:'flower_market',place:'朝の花市場',time:'morning',names:{umbrella:'朝の市場で会う年配の方',clock:'市場で花を選んでいた店の方'},needs:{umbrella:['market'],clock:['morningmarket']}},
 triangle_fish:{members:['triangle','fish'],location:'library',place:'地域の図書室',time:'afternoon',names:{triangle:'図書室で見かける大学生の方',fish:'図書室で本を探す高校生らしい子'},needs:{triangle:['librarystudy'],fish:['libraryvisit','librarystudy']}},
 fridge_driver:{members:['fridge','driver'],location:'night_shop',place:'深夜のコンビニ',time:'night',names:{fridge:'夜によく会う運転手さん',driver:'同じ棚で迷っていた人'},needs:{fridge:['konbini'],driver:['conveniencestop']}},
 fridge_bread:{members:['fridge','bread'],location:'ingredient_wholesale',place:'朝の食材の卸売店',time:'morning',names:{fridge:'朝の仕入れ先で会うパン屋さん',bread:'仕入れ先でよく見る料理人さん'},needs:{fridge:['supply'],bread:['ingredientmarket']}}
});

const SOCIAL_LEVELS=['stranger','noticed','greeted','acquaintance','familiar'];
function socialFreshPair(id){
 const c=SOCIAL_PAIRS[id];if(!c)return null;
 return {id,members:[...c.members],stage:'stranger',perspectives:Object.fromEntries(c.members.map(a=>[a,{familiarity:0,trust:32,tension:10,interest:22,recognized:false}])),
  totalContacts:0,lastContactNight:0,recentContacts:[],sharedEvents:[],lastOutcome:'',cooldownUntil:0};
}
function createSocialWorldState(){return {schema:1,pairs:Object.fromEntries(Object.keys(SOCIAL_PAIRS).map(id=>[id,socialFreshPair(id)])),processedNights:[],events:[],queued:{},publicClues:[],lastMailed:{},mailHistory:[]}}
function migrateSocialWorld(data){
 const w=data.socialWorld&&typeof data.socialWorld==='object'?data.socialWorld:createSocialWorldState();
 w.pairs=w.pairs&&typeof w.pairs==='object'?w.pairs:{};
 for(const key of Object.keys(SOCIAL_PAIRS)){
  const def=socialFreshPair(key),old=w.pairs[key];
  if(!old){w.pairs[key]=def;continue}
  w.pairs[key]={...def,...old, members:def.members,
   perspectives:Object.fromEntries(def.members.map(id=>[id,{...def.perspectives[id],...(old.perspectives?.[id]||{})}])),
   recentContacts:Array.isArray(old.recentContacts)?old.recentContacts.slice(-14):[],
   sharedEvents:Array.isArray(old.sharedEvents)?old.sharedEvents.slice(-20):[]};
 }
 // v2.3の実際の会釈は履歴として引き継ぐが、知らない相手を突然「知人」にしない。
 const oldGreeted=data.microWorld?.links?.['old-clock-street'];
 if(oldGreeted?.greeted && w.pairs.driver_clock.totalContacts===0){
  const pair=w.pairs.driver_clock,when=Number(oldGreeted.greetedNight)||0;
  pair.stage='greeted';pair.totalContacts=1;pair.lastContactNight=when;
  for(const id of pair.members){pair.perspectives[id].recognized=true;pair.perspectives[id].familiarity=12;}
  pair.recentContacts=[when];
 }
 w.processedNights=Array.isArray(w.processedNights)?[...new Set(w.processedNights)].slice(-135):[];
 w.events=Array.isArray(w.events)?w.events.slice(-120):[];
 w.queued=w.queued&&typeof w.queued==='object'?w.queued:{};
 w.publicClues=Array.isArray(w.publicClues)?w.publicClues.slice(-90):[];
 w.lastMailed=w.lastMailed&&typeof w.lastMailed==='object'?w.lastMailed:{};
 w.mailHistory=Array.isArray(w.mailHistory)?w.mailHistory.slice(-70):[];
 w.schema=1;data.socialWorld=w;return data;
}
function socialActionBias(id,action,n){
 if(n<29||!s.socialWorld)return 0;
 const act=action[0];let bias=0;
 for(const [key,c] of Object.entries(SOCIAL_PAIRS)){
  if(!c.needs[id]?.includes(act))continue;
  const pair=s.socialWorld.pairs?.[key];if(!pair||pair.totalContacts===0)continue;
  const me=pair.perspectives?.[id];if(!me)continue;
  const recent=pair.lastContactNight>=n-2;
  // 親しみが行動選択に影響する。ただし気まずさ、疲れ、仕事上の制約は尊重する。
  bias+=Math.max(-10,Math.min(12,(me.interest-22)*.13+(me.familiarity-20)*.07-me.tension*.13-(recent?3:0)));
 }
 return Math.max(-9,Math.min(12,bias));
}
function socialActorSchedule(id,n){
 const p=s.simState?.people?.[id];const today=p?.daily?.find(d=>d.night===n);
 if(!today)return [];
 const a=today.actionId,places=[];
 // すでに行ったと記録されている行動＋職業上の決まった勤務だけを使用する。
 if(id==='cat'&&a==='bakery')places.push({location:'bakery',time:'evening',why:a});
 if(id==='bread'&&['bake','store','boss','customer'].includes(a))places.push({location:'bakery',time:'evening',why:a});
 if(id==='driver'&&['shoproute','route'].includes(a))places.push({location:'clock_street',time:'evening',why:a});
 if(id==='clock'&&(['shopfront','shopvisit'].includes(a)||(a==='walk'&&simHash(`social:clock:walk:${n}`)%100<72)))places.push({location:'clock_street',time:'evening',why:a});
 if(id==='fish'&&['libraryvisit','librarystudy'].includes(a))places.push({location:'library',time:'afternoon',why:a});
 if(id==='clock'&&a==='library')places.push({location:'library',time:'afternoon',why:a});
 if(id==='terminal'&&['timetable','stationstop'].includes(a))places.push({location:'station_area',time:'evening',why:a});
 if(id==='driver'&&['stationdelivery','route'].includes(a))places.push({location:'station_area',time:'evening',why:a});
 if(id==='umbrella'&&['bouquet','window','flowercustomer'].includes(a)&&newListenerEligible(id,n))places.push({location:'flower_shop',time:'evening',why:a});
 if(id==='umbrella'&&a==='market'&&newListenerEligible(id,n))places.push({location:'flower_market',time:'morning',why:a});
 if(id==='cat'&&a==='flowerstop')places.push({location:'flower_shop',time:'evening',why:a});
 if(id==='clock'&&a==='morningmarket')places.push({location:'flower_market',time:'morning',why:a});
 if(id==='triangle'&&a==='librarystudy'&&newListenerEligible(id,n))places.push({location:'library',time:'afternoon',why:a});
 if(id==='fridge'&&a==='konbini'&&newListenerEligible(id,n))places.push({location:'night_shop',time:'night',why:a});
 if(id==='driver'&&a==='conveniencestop')places.push({location:'night_shop',time:'night',why:a});
 if(id==='fridge'&&a==='supply'&&newListenerEligible(id,n))places.push({location:'ingredient_wholesale',time:'morning',why:a});
 if(id==='bread'&&a==='ingredientmarket')places.push({location:'ingredient_wholesale',time:'morning',why:a});
 // 行動に記録された場所だけを使う。一般配送ルートは一日一地区に割り当てる。
 if(id==='driver'&&a==='route'&&places.length>1){
  const ix=simHash(`v24:driver:district:${n}`)%4===0?1:0;
  return [places[ix]];
 }
 if(id==='clock'&&places.length>1)return [places[0]];
 return places;
}
function socialWeightDecision(key,n,pair){
 const [a,b]=pair.members;const pa=s.simState.people[a],pb=s.simState.people[b];
 const ra=pair.perspectives[a],rb=pair.perspectives[b];
 const fatigue=Math.max(0,55-pa.life.health)+Math.max(0,55-pb.life.health);
 const score=(pa.traits.sociability+pb.traits.sociability)*.22+
   (ra.familiarity+rb.familiarity)*.20+(ra.interest+rb.interest)*.12-
   (ra.tension+rb.tension)*.22-fatigue*.18;
 const noise=simHash(`social:choice:${key}:${n}:${pair.totalContacts}`)%100;
 if(pair.totalContacts===0)return noise<35?'greet':'notice';
 if(pair.stage==='noticed')return noise<65?'greet':'notice';
 if(score+noise*.55>=90&&pair.totalContacts>=4&&pair.stage==='acquaintance')return 'invite';
 if(score+noise*.44+pair.totalContacts*2>=58)return 'talk';
 return noise<77?'greet':'notice';
}
function socialPairContact(key,n,plA,plB){
 const w=s.socialWorld,c=SOCIAL_PAIRS[key],pair=w.pairs[key];
 if(!pair||pair.lastContactNight===n||n<pair.cooldownUntil)return null;
 const [a,b]=c.members,people=s.simState.people;
 if(!people[a]||!people[b])return null;
 let action=socialWeightDecision(key,n,pair);
 // 誘いは互いに好意・時間的な余裕がある場合にのみ成立する。
 if(action==='invite'){
  const accepts=c.members.every(id=>{
   const op=pair.perspectives[id],p=people[id];
   return p.life.health>=35&&op.tension<56&&op.trust>32&&op.interest>30;
  });
  if(!accepts)action='talk';
 }
 const before=pair.stage;
 const outcomes=['warm','ordinary','guarded','awkward'];
 const moodAvg=c.members.reduce((t,id)=>t+people[id].emotion.anxiety,0)/2;
 const tensionAvg=c.members.reduce((t,id)=>t+pair.perspectives[id].tension,0)/2;
 const roll=simHash(`social:outcome:${key}:${n}:${pair.totalContacts}`)%100;
 const outcome=action==='notice'?'noticed':action==='greet'?'greeted':roll<Math.max(9,27-(moodAvg+tensionAvg)/9)?'awkward':roll<43?'guarded':roll<72?'ordinary':'warm';
 pair.lastContactNight=n;pair.totalContacts++;
 pair.recentContacts.push(n);pair.recentContacts=pair.recentContacts.slice(-14);
 pair.lastOutcome=outcome;
 if(action==='notice'&&pair.stage==='stranger')pair.stage='noticed';
 if(action==='greet'&&SOCIAL_LEVELS.indexOf(pair.stage)<2)pair.stage='greeted';
 if(action==='talk'&&SOCIAL_LEVELS.indexOf(pair.stage)<3)pair.stage='acquaintance';
 if(action==='invite'&&SOCIAL_LEVELS.indexOf(pair.stage)<4)pair.stage='familiar';
 if(outcome==='awkward')pair.cooldownUntil=n+2;
 const views={};
 for(const id of c.members){
  const p=people[id],rel=pair.perspectives[id];
  rel.recognized=true;
  let feel={noticed:0,greeted:1,warm:3,ordinary:1,guarded:0,awkward:-2}[outcome]||0;
  // 同じ会話でも本人の感受性や疲れで少し違った受け止め方をする。
  const variance=(simHash(`social:view:${key}:${n}:${id}`)%5)-2;
  feel+=variance;
  views[id]=feel>1?'warm':feel<0?'awkward':'ordinary';
  rel.familiarity=simNumber(rel.familiarity+(action==='notice'?2:action==='greet'?4:action==='talk'?8:11),0);
  rel.trust=simNumber(rel.trust+(feel>2?2:feel<0?-1:0),32);
  rel.tension=simNumber(rel.tension+(feel<0?2:feel>2?-1:0),10);
  rel.interest=simNumber(rel.interest+(feel>0?2:feel<0?-2:0),22);
  if(feel>1)simAdjust(p.emotion,'joy',1);
  if(feel<0)simAdjust(p.emotion,'anxiety',1);
  const text=action==='notice'?'同じ場所で見かけた':action==='greet'?'会釈した':action==='invite'?'少し一緒に過ごした':'短く話した';
  const view=feel>=2?'少しうれしかった':feel<=-1?'なんとなく気まずかった':'何でもない時間だった';
  simMemory(p,{night:n,kind:'relationship',tag:'social',importance:action==='invite'?4:action==='talk'?3:2,summary:`${c.names[id]}と${text}。${view}`});
  // 旧来の人間関係システムと共存させる。ラジオネームや本名は結びつけない。
  const target=c.members.find(x=>x!==id),relKey='social_'+target;
  const old=p.relationships[relKey]||{name:c.names[id],closeness:10,trust:30,tension:10,personKey:null,contactCount:0,lastContactNight:0,history:[]};
  old.name=c.names[id];old.closeness=rel.familiarity;old.trust=rel.trust;old.tension=rel.tension;
  old.lastContactNight=n;old.contactCount++;
  old.history.push({night:n,actionId:'social_'+action,outcome:(action==='notice'||action==='greet')?null:outcome,summary:text});old.history=old.history.slice(-12);
  p.relationships[relKey]=old;
 }
 const eid=`social_event_${n}_${key}`;
 const ev={id:eid,night:n,pair:key,members:[...c.members],location:c.location,place:c.place,time:c.time,action,outcome,stageBefore:before,stageAfter:pair.stage,views};
 w.events.push(ev);w.events=w.events.slice(-120);
 pair.sharedEvents.push(eid);pair.sharedEvents=pair.sharedEvents.slice(-20);
 w.historyChangedNight=n;
 return ev;
}
const SOCIAL_LETTER_TEXT={
 cat_bread:{cat:{subject:'帰り道に寄るお店',intro:'昨日、仕事帰りにパン屋へ寄りました。',noticed:'いつもの棚の近くで、店員さんを見かけました。',greeted:'何度か見かけた店員さんと、短く挨拶しました。',talk:'新しいパンについて、店員さんと少し話しました。',invite:'いつもより少し長く、店員さんと話しました。'},
 bread:{subject:'夕方のお客さん',intro:'昨日、店に夕方のお客さんが来ました。',noticed:'以前も見かけたような気がする方でした。',greeted:'いつものお客さんと、ちょっと挨拶しました。',talk:'パンの話をしていたら、少し時間が経っていました。',invite:'閉店前、いつもよりゆっくりお話ができました。'}},
 driver_clock:{driver:{subject:'あの時計屋の通り',intro:'昨日、配送の途中で古い時計店の通りを通りました。',noticed:'前にも見かけた人がいました。',greeted:'通りにいた人と会釈しました。',talk:'時計の話をしていたら、思いのほか話が長くなりました。',invite:'時計のことを、いつもより少し長く教わりました。'},
 clock:{subject:'昔の店の近くで',intro:'昨日、かつて店があった通りを歩きました。',noticed:'通りかかった配送車が、少し懐かしく見えました。',greeted:'見覚えのある運転手さんと会釈しました。',talk:'配送の方と、時計について少し話しました。',invite:'運転手さんと、また時計の話をする機会がありました。'}},
 fish_clock:{fish:{subject:'図書室で会った人',intro:'昨日、地域の図書室に行きました。',noticed:'よく見かける年配の方がいました。',greeted:'その方と、初めて少し挨拶を交わしました。',talk:'本について少しお話しました。',invite:'本について話す時間が、少し楽しみになっています。'},
 clock:{subject:'図書室の学生さん',intro:'昨日、図書室で本を整理しておりました。',noticed:'熱心に本を探している学生さんがいました。',greeted:'何度か見かけた学生さんと会釈しました。',talk:'学生さんと本について短く話しました。',invite:'学生さんと、いつもより長く本の話をしました。'}},
 driver_terminal:{driver:{subject:'駅前の小さな出来事',intro:'昨夜、配送で駅前を通りました。',noticed:'駅の前で誰かを見かけました。',greeted:'以前にも会ったような人と会釈しました。',talk:'駅前で少し道の話をしました。',invite:'道順について、思いがけず長話になりました。'},
 terminal:{subject:'駅前ですれ違った人',intro:'昨日、駅前の道を歩きました。',noticed:'配送車の明かりが通り過ぎました。',greeted:'見覚えのある運転手さんに会釈しました。',talk:'駅前で運転手さんと少し話しました。',invite:'駅前で、運転手さんと少し長く話しました。'}}
};

Object.assign(SOCIAL_LETTER_TEXT,{
 umbrella_cat:{umbrella:{subject:'夕方の鉢植え',intro:'昨日、花屋の前で立ち止まるお客さんがいました。',noticed:'窓辺の小さな鉢を、じっと見ていました。',greeted:'短く挨拶を交わしました。',talk:'花の育て方について少し話しました。',invite:'また花の話ができる時間がありました。'},cat:{subject:'帰り道の花屋',intro:'昨日、帰り道に花屋へ立ち寄りました。',noticed:'店の中で鉢を並べる人がいました。',greeted:'店の人と少し挨拶しました。',talk:'小さな鉢について店の人に聞きました。',invite:'また、花屋で少し長く話せました。'}},
 umbrella_clock:{umbrella:{subject:'朝の市場の話',intro:'昨日、朝の花市場で仕入れをしていました。',noticed:'花を眺めている年配の方を見かけました。',greeted:'その方と会釈しました。',talk:'花の手入れについて少し話しました。',invite:'市場で、また花の話を聞かせてもらいました。'},clock:{subject:'市場で見つけた花',intro:'昨日の朝、花市場に立ち寄りました。',noticed:'朝早くから働いている花屋の方を見かけました。',greeted:'その方と会釈しました。',talk:'花の名前を一つ教えてもらいました。',invite:'花屋の方と、少しゆっくり季節の話をしました。'}},
 triangle_fish:{triangle:{subject:'図書室での小さな会話',intro:'昨日、図書室で本を探していました。',noticed:'熱心にノートを読んでいる年上の人がいました。',greeted:'その人と軽く挨拶しました。',talk:'どの本が面白かったか、少し聞いてみました。',invite:'本を選ぶ時間が、少し長くなりました。'},fish:{subject:'図書室で見かけた人',intro:'昨日、地域の図書室へ行きました。',noticed:'知らない高校生くらいの人が熱心に本を見ていました。',greeted:'その人と短い挨拶を交わしました。',talk:'本の棚について少し話しました。',invite:'また本について話す時間がありました。'}},
 fridge_driver:{fridge:{subject:'夜中のおにぎり売り場',intro:'昨日、仕事帰りにコンビニへ寄りました。',noticed:'同じ棚で迷っている人がいました。',greeted:'棚の前で軽く会釈しました。',talk:'どのおにぎりが好きか、思わず話してしまいました。',invite:'また、その人と食べ物の話をしました。'},driver:{subject:'夜のコンビニ',intro:'昨夜、配送の休憩中にコンビニへ寄りました。',noticed:'同じおにぎり棚をじっと見ている人がいました。',greeted:'棚の前で会釈しました。',talk:'おにぎりについて、知らない人と意見が一致しました。',invite:'またその人と、夜食の話ができました。'}},
 fridge_bread:{fridge:{subject:'朝の仕入れ先で',intro:'昨日の早朝、食材の卸売店へ寄りました。',noticed:'パンの材料を選ぶ人を見かけました。',greeted:'その人と会釈しました。',talk:'粉の違いについて少し教えてもらいました。',invite:'また仕入れ先で、食材の話ができました。'},bread:{subject:'朝の卸売店',intro:'昨日、仕入れ先へ行きました。',noticed:'店でよく見る料理人らしい人がいました。',greeted:'その人と挨拶しました。',talk:'粉の違いについて少し話しました。',invite:'また、朝の仕入れ先で話ができました。'}}
});

const SOCIAL_OBSERVATIONS_461={
 cat:['話し終えてから、相手の表情をうまく描けるだろうかと考えました。','ほんの数分のことですが、帰り道の景色まで少し違って見えました。','何を言ったかより、そのときの空気を覚えている気がします。'],
 driver:['短い出来事でも、帰りの車で思い出すことがあります。','勤務の報告書には書きませんが、個人的には覚えておきたい話です。','猫主任に聞かせても、たぶん欠伸で返される話です。'],
 fish:['そのときの自分の返事を、あとで何度か考えました。','誰かとの短いやりとりでも、私には少し勇気のいる日があります。','あの場では気づかなかったことを、帰ってから思いつきました。'],
 clock:['帰ってお茶を淹れるころ、また思い出しました。','短い話も、時間がたつと違うところを覚えているものです。','あのひとときのことを、静かな夜に書いてみたくなりました。'],
 terminal:['そのあとの道は、いつもと同じでした。','風の音と一緒に覚えています。','何でもない時間ですが、書いておきます。'],
 bread:['店の仕事の合間に、またふと思い出しました。','パン以外の話にも、焼き上がるまでの時間があるのかもしれません。','店長に話すには少し小さすぎるので、ここへ送りました。'],
 moon:['地球側の小さな事件として、心の議事録に載せておきます。','この報告、月の審議会ではきっと意見が分かれます。','月へ提出するほどではありませんが、今夜の報告です。'],
 anon:['名前をつけないまま、あの時間だけ覚えています。','部屋に戻ってから、机の上のメモを一度見ました。','誰かの声があった、それだけの短い時間でした。'],
 sugar:['コーヒーを飲みながら、もう一度考えました。','小さな出来事にも、少し長い余韻があるものですね。','カップを置いたあとにも、あの時間が残っていました。'],
 umbrella:['花を並べるとき、ふとそのやりとりを思い出しました。','店に来る人の一日は、店にいる時間よりずっと長いんですよね。','水を替えながらも、少し気になっていました。'],
 triangle:['ノートに書くほどの事件ではありませんが、印をつけておきました。','帰ってから、あの話の別の答えを思いつきました。','予定していなかったことほど、案外覚えています。'],
 fridge:['片づけのあとに、また思い出しました。','仕事の段取りとは別のところに、あの時間が残っています。','帰ってから、自分の食事を考えるときにもふと思いました。']
};
function socialLetterFor(ev,who,day){
 const desc=SOCIAL_LETTER_TEXT[ev.pair]?.[who];if(!desc)return null;
 const relation=s.socialWorld.pairs[ev.pair];const my=relation.perspectives[who];
 const personal=ev.views?.[who]||ev.outcome;
 const close=personal==='warm'?'今日はちょっと、いい気分で帰りました。':personal==='awkward'?'悪いことがあったわけではないのですが、少し気まずさが残りました。':ev.outcome==='guarded'?'もう少し話してもよかった気がします。':'何でもないことなのに、帰り道で思い出しました。';
 // 本人の観測と主観のみ。相手のラジオネーム・本名・知らない気持ちは記さない。
 const opener=day>=ev.night+2?desc.intro.replace('昨夜','先日の夜').replace('昨日','先日'):desc.intro;
 const observations=SOCIAL_OBSERVATIONS_461[who]||SOCIAL_OBSERVATIONS_461.anon;
 const observation=observations[simHash(`social461:detail:${ev.id}:${who}`)%observations.length];
 return {who,subject:desc.subject,body:'こんばんは。\n\n'+opener+'\n\n'+(desc[ev.action]||desc.talk)+'\n\n'+close+'\n\n'+observation,
  regular:true,kind:'socialWorld',tag:`social-${ev.pair}-${ev.id}`,socialEventId:ev.id,socialPair:ev.pair,choices:REGULAR_CHOICES.map(x=>[...x])};
}
function socialQueueRecollection(ev){
 if(ev.action==='notice')return;
 const n=ev.night+1,w=s.socialWorld;
 if((w.queued[n]||[]).length>=1)return;
 const chance=ev.action==='greet'?47:ev.action==='talk'?78:85;
 if(simHash(`social:send:${ev.id}`)%100>=chance)return;
 let who=ev.members[simHash(`social:writer:${ev.id}`)%2];
 if(!newListenerIntroduced(who,ev.night))who=ev.members.find(id=>newListenerIntroduced(id,ev.night));
 if(!who)return;
 if(w.lastMailed[who]&&ev.night-w.lastMailed[who]<5)return;
 const id=`social_${n}_${ev.pair}_${who}`;
 const l=socialLetterFor(ev,who,n);if(!l)return;
 s.regular.letterArchive[id]=l;
 (w.queued[n] ||= []).push(id);
 w.lastMailed[who]=ev.night;
 w.mailHistory.push({night:n,who,pair:ev.pair,eventId:ev.id});
 w.mailHistory=w.mailHistory.slice(-70);
 // もう一方も書く場合があるが、同じ日に投稿を強制しない。
 const other=ev.members.find(x=>x!==who);
 if(newListenerIntroduced(other,ev.night)&&ev.action==='talk'&&simHash(`social:other:${ev.id}`)%100<23&&!w.queued[n+2]?.length&&ev.night-(w.lastMailed[other]||-99)>=5){
  const later=`social_${n+2}_${ev.pair}_${other}`;
  s.regular.letterArchive[later]=socialLetterFor(ev,other,n+2);
  (w.queued[n+2] ||= []).push(later);
  w.lastMailed[other]=ev.night;
  w.mailHistory.push({night:n+2,who:other,pair:ev.pair,eventId:ev.id});
 }
}
function simulateSocialWorld(n){
 if(n<29)return; // 第1・第2章の台本の時刻と結末を守る。
 if(!s.socialWorld)s.socialWorld=createSocialWorldState();
 const w=s.socialWorld;if(w.processedNights.includes(n))return;
 const schedules={};for(const id of Object.keys(SIM_PROFILES))schedules[id]=socialActorSchedule(id,n);
 const busy=new Set();
 for(const [key,c] of Object.entries(SOCIAL_PAIRS)){
  const [a,b]=c.members;
  const aa=schedules[a]?.find(x=>x.location===c.location&&x.time===c.time),
        bb=schedules[b]?.find(x=>x.location===c.location&&x.time===c.time);
  if(!aa||!bb||busy.has(a+':'+c.time)||busy.has(b+':'+c.time))continue;
  const possibility=s.simState?.people?.[a]?.emotion && s.simState?.people?.[b]?.emotion;
  if(!possibility)continue;
  const roll=simHash(`social:encounter:${n}:${key}`)%100;
  if(roll>=83)continue;
  const ev=socialPairContact(key,n,aa,bb);
  if(!ev)continue;
  busy.add(a+':'+c.time);busy.add(b+':'+c.time);
  socialQueueRecollection(ev);
 }
 w.processedNights.push(n);w.processedNights=w.processedNights.slice(-135);
 for(const day of Object.keys(w.queued))if(Number(day)<n-7)delete w.queued[day];
}
function socialVisibleClue(l){
 if(!l?.socialEventId||!s.socialWorld)return;
 if(s.socialWorld.publicClues.some(x=>x.eventId===l.socialEventId&&x.who===l.who))return;
 const summary=`${l.subject}について本人が話した`;
 s.socialWorld.publicClues.push({night:s.night,eventId:l.socialEventId,who:l.who,summary});
 s.socialWorld.publicClues=s.socialWorld.publicClues.slice(-90);
 remember(l.who,'第'+s.night+'夜に「'+l.subject+'」という近況を届けた');
}

// v1.9 継続放送: chapter 2 や特別放送とは独立した、繰り返し可能な夜。
// 内容は作者によるテンプレート。実際の生活記録から本文を作り、保存して固定する。

// v2.5: 登場のタイミングと自律生活を分離した新しい三人。
// 初めてのお便りは自分の暮らしから届く。未紹介でも生活と関係は進む。
const NEW_LISTENER_SETTINGS={
 umbrella:{earliest:30,defaultArrival:31,lifeTheme:'一人で店を続けることと休むこと'},
 triangle:{earliest:35,defaultArrival:37,lifeTheme:'決めないまま興味を増やすこと'},
 fridge:{earliest:41,defaultArrival:43,lifeTheme:'仕事と自分の食事の境目'}
};
function createNewListenerState(){return {schema:1,entries:Object.fromEntries(REGULAR_NEW.map(id=>[id,{arrivalNight:NEW_LISTENER_SETTINGS[id].defaultArrival,firstSentNight:0,milestones:[],lastArcMailNight:0}]))};}
function migrateNewListeners(data){
 const old=data.newListeners&&typeof data.newListeners==='object'?data.newListeners:{};
 const base=createNewListenerState();
 base.entries={...base.entries,...(old.entries||{})};
 for(const id of REGULAR_NEW){
  const def=NEW_LISTENER_SETTINGS[id],v=base.entries[id]||{};
  const known=(data.regular?.mailHistory||[]).find(x=>x.who===id);
  const sent=(data.played||[]).find(x=>x.who===id);
  // v2.4以前のセーブが第60夜でも、新しい初投稿が過去に出現したことにはしない。
  const fresh=!data.newListeners;
  let future=Math.max(def.earliest,data.night+(data.phase==='intro'&&!data.letterSets?.[data.night]?0:1));
  if(fresh&&data.night>def.defaultArrival)future+=simHash(`v25:join:${id}:${data.night}`)%3;
  base.entries[id]={arrivalNight:fresh?Math.max(def.defaultArrival,future):Math.max(def.earliest,Number(v.arrivalNight)||def.defaultArrival),
   firstSentNight:Math.max(0,Number(v.firstSentNight)||known?.night||sent?.night||0),
   milestones:Array.isArray(v.milestones)?v.milestones.slice(-9):[],lastArcMailNight:Math.max(0,Number(v.lastArcMailNight)||0)};
 }
 data.newListeners=base;return data;
}
function newListenerEligible(id,n){return !NEW_LISTENER_SETTINGS[id]||n>=(s.newListeners?.entries?.[id]?.arrivalNight??NEW_LISTENER_SETTINGS[id].defaultArrival)}
function newListenerIntroduced(id,n=s.night){return !NEW_LISTENER_SETTINGS[id]||Boolean(s.newListeners?.entries?.[id]?.firstSentNight && s.newListeners.entries[id].firstSentNight<=n)}
function newListenerFirstLetter(id,n){
 const [subject,body]=NEW_LISTENER_LETTERS[id].first;
 return {subject,body,kind:'new-intro',tag:`first-${id}`,who:id,regular:true,choices:REGULAR_CHOICES.map(x=>[...x])};
}
function newListenerArcNote(id,n){
 const meta=s.newListeners?.entries?.[id];if(!meta?.firstSentNight)return null;
 const item=(meta.milestones||[]).find(x=>x.night>meta.lastArcMailNight&&x.night<n&&x.summary!==meta.lastArcSummary45);
 if(!item)return null;
 const paragraphs={
  umbrella:'店を続けていると、花を手渡す時間は好きなのに、自分の休みをうまく作れないことがあります。今は'+letterPoliteProgress491(item.summary)+'。\n\n花屋を続けるかどうかではなく、続け方を少し考える夜です。',
  triangle:'将来の夢は相変わらず一つに決まっていません。最近は'+letterPoliteProgress491(item.summary)+'。\n\n友達の答えと、自分の答えが違ってもいいのか、考えています。',
  fridge:'料理の仕事をしていると、一日の終わりがわからなくなることがあります。最近は'+letterPoliteProgress491(item.summary)+'。\n\n仕事が好きだという気持ちは、そのまま持っていたいです。'
 };
 return {subject:{umbrella:'花屋を続ける時間',triangle:'まだ決めていない答え',fridge:'火を消したあとの時間'}[id],body:regularFirstSentence(id,n)+'\n\n'+paragraphs[id],kind:'new-arc',tag:`new-arc-${item.night}`,arcSummary45:item.summary};
}
function newListenerPersonalNote(id,n){
 const day=regularDayAction(id,n);if(!day)return null;
 const me=SIM_PROFILES[id],action=me.actions.find(a=>a[0]===day.actionId);
 const standard={umbrella:'花屋の小さな話',triangle:'ノートの端の話',fridge:'仕事が終わってから'}[id];
 const subject=n>=150?regularSubject44(id,n,[standard,...(NEW_LIFE_SUBJECTS_4914[id]||[])],`new-life-${id}`):standard;
 const tails={
  umbrella:['花のことを知っているつもりでも、毎日知らないことに出会います。','店の外にも暮らしがある、と最近少し思います。','誰かのための花を選びながら、自分の帰り道のことも考えています。'],
  triangle:['ひとつ決めるたびに、別のことも気になってしまうんです。','今はまだ答えを一つにしなくてもいい気がします。','先生に聞けば簡単なのかもしれないけれど、しばらく自分で考えたいです。'],
  fridge:['厨房とは別に、自分の夜がちゃんとあると思いたいです。','仕事に慣れていても、自分の暮らしはまだ練習中です。','家では誰にも採点されないから、少し気楽です。']
 };
 const tail=tails[id][simHash(`new:tail:${id}:${n}`)%3];
 return {subject,body:regularFirstSentence(id,n)+'\n\n'+letterPoliteActivity491(day.activity)+'。\n\n'+tail,kind:'new-life',tag:`new-life-${day.actionId}`};
}
function newListenerCompose(id,n){
 const arc=newListenerArcNote(id,n);
 const recent=(s.regular?.mailHistory||[]).filter(x=>x.who===id&&x.night>=n-7);
 const oldEcho=longEchoCompose43(id,n);
 // 新しい3人の進路便りで、はるか昔の暮らしの回想が期限切れにならないようにする。
 // 実際の行動・配達の条件を満たし、十分に時間がたった場合のみ優先。
 const age=oldEcho?n-(s.longEcho43?.sources?.[oldEcho.longEcho.sourceUid]?.sourceNight||n):0;
 if(arc&&!recent.some(x=>x.tag===arc.tag)&&!(oldEcho&&age>=85))return arc;
 const candidates=[newListenerPersonalNote(id,n),regularDayNote(id,n),regularContact(id,n),longLifeCompose4914(id,n),regularBroadcastEcho(id,n),regularThemeLetter(id,n),radioCultureCompose(id,n),radioVarietyCompose38(id,n),radioMemoryCompose39(id,n),oldEcho,everydayCompose4827(id,n)].filter(Boolean);
 const weighted=candidates.map(x=>({...x,weight:({contact:83,'new-life':76,daily:66,broadcast:55,theme:45,culture:115,variety:92,'radio-memory':128,'long-echo':164,'everyday47':120,'laterlife4914':178,'boundary4932':185})[x.kind]||45}));
 for(const item of weighted){
  if(recent.some(x=>x.tag===item.tag))item.weight-=60;
  if((s.regular?.voiceHistory45?.[id]||[]).some(h=>h.key===regularVoiceKey45(item)&&n-h.night<150))item.weight-=115;
  if(recent.some(x=>x.kind===item.kind))item.weight-=13;
  item.weight+=simHash(`new:pick:${id}:${n}:${item.tag}`)%15;
 }
 weighted.sort((a,b)=>b.weight-a.weight);
 const selected=weighted[0]||regularThemeLetter(id,n);
 if(selected.kind==='culture'){s.radioCulture.draftNight=n;s.radioCulture.draftUsed=true;}
 if(selected.kind==='radio-memory'){s.radioMemory.draftNight=n;s.radioMemory.draftUsed=true;}
 if(selected.kind==='long-echo')s.longEcho43.draftNight=n;
 return selected;
}
function newListenerOnLettersDelivered(n,ids){
 for(const id of REGULAR_NEW){
  const intro=`regular_${n}_${id}`;
  const entry=s.newListeners?.entries?.[id];if(!entry)continue;
  if(ids.includes(intro)){
   if(!entry.firstSentNight)entry.firstSentNight=n;
   const l=s.regular?.letterArchive?.[intro];
   if(l?.kind==='new-arc'){
    entry.lastArcMailNight=n;
    entry.lastArcSummary45=l.arcSummary45||entry.lastArcSummary45||'';
   }
  }
 }
}
function newListenerAfterDaily(n){
 if(n<29)return;
 for(const id of REGULAR_NEW){
  const entry=s.newListeners?.entries?.[id],p=s.simState?.people?.[id];if(!entry||!p||!newListenerEligible(id,n))continue;
  const last=entry.milestones.at(-1)?.night||entry.firstSentNight||entry.arrivalNight;
  if(n-last<11)continue;
  const activity=Object.entries(p.activityCounts||{});
  const count=keys=>keys.reduce((sum,k)=>sum+(p.activityCounts?.[k]||0),0);
  const describe={
   umbrella:count(['assistanttalk','plantrest','neighborchat'])>=3?'誰かに少し頼ることを試している':'店の休み方を考えている',
   triangle:count(['librarystudy','future','teacher'])>=4?'違う分野を調べる時間が増えている':'答えをすぐ決めずに考えている',
   fridge:count(['rest','leftovers','konbini'])>=4?'家で休む時間にも目を向けている':'働く時間と休む時間の境目を考えている'
  }[id];
  const milestone={night:n,summary:describe,goal:NEW_LISTENER_SETTINGS[id].lifeTheme};
  entry.milestones.push(milestone);entry.milestones=entry.milestones.slice(-9);
  simMemory(p,{night:n,kind:'life',tag:'long_goal',importance:4,summary:describe});
  privateRemember(id,describe); // 局には公開しない。
 }
}

// v4.9.1: 生活シミュレーション内部の行動記録（常体）を、便箋へ転記するときだけ丁寧体にする。
// 書き換えるのは表示用の本文だけ。行動記録・記憶・乱数・保存済みの放送は変更しない。
const LETTER_POLITE_ACTIVITY_491=Object.freeze({
  "仕事の段取りを一つ見直した": "仕事の段取りを一つ見直しました",
  "帰宅後、照明を落としてゆっくり休んだ": "帰宅後、照明を落としてゆっくり休みました",
  "机の奥のスケッチブックを開いて眺めた": "机の奥のスケッチブックを開いて眺めました",
  "帰り道に喫茶店へ寄った": "帰り道に喫茶店へ寄りました",
  "上司に仕事の進め方を一つ相談した": "上司に仕事の進め方を一つ相談しました",
  "昔の友人に送る文章を下書きした": "昔の友人に送る文章を下書きしました",
  "机に向かって短い線を何本か描いた": "机に向かって短い線を何本か描きました",
  "翌日の配送ルートを確認した": "翌日の配送ルートを確認しました",
  "休憩所で温かい缶コーヒーを飲んだ": "休憩所で温かい缶コーヒーを飲みました",
  "駐車場で猫主任の近くに座ってみた": "駐車場で猫主任の近くに座ってみました",
  "同僚に休憩中の出来事を話した": "同僚に休憩中の出来事を話しました",
  "いつもより長く仮眠を取った": "いつもより長く仮眠を取りました",
  "妹への短い返事を下書きした": "妹への短い返事を下書きしました",
  "妹と話したころの写真を見つめた": "妹と話したころの写真を見つめました",
  "講義のメモを整理した": "講義のメモを整理しました",
  "日記に今日の気持ちを一行書いた": "日記に今日の気持ちを一行書きました",
  "ひとりで本屋を歩いた": "ひとりで本屋を歩きました",
  "友人といつもの雑談をした": "友人といつもの雑談をしました",
  "兄から届いた短いメッセージを読んだ": "兄から届いた短いメッセージを読みました",
  "断りたいときの言葉をノートに書いた": "断りたいときの言葉をノートに書きました",
  "文章に関わる仕事について少し調べた": "文章に関わる仕事について少し調べました",
  "知らない花を見つけながら散歩した": "知らない花を見つけながら散歩しました",
  "手元の古い時計を一つ磨いた": "手元の古い時計を一つ磨きました",
  "図書室で子どもたちの話を聞いた": "図書室で子どもたちの話を聞きました",
  "好きなお茶を丁寧に淹れた": "好きなお茶を丁寧に淹れました",
  "散歩の帰りに近所の人と立ち話をした": "散歩の帰りに近所の人と立ち話をしました",
  "写真の入った箱を少し整理した": "写真の入った箱を少し整理しました",
  "海辺の駅までの道順を紙に書いてみた": "海辺の駅までの道順を紙に書いてみました",
  "仕事帰りに時刻表を開いた": "仕事帰りに時刻表を開きました",
  "休みの日の買い物リストを作った": "休みの日の買い物リストを作りました",
  "駅へ向かう道とは別の通りを歩いた": "駅へ向かう道とは別の通りを歩きました",
  "古い切符を取り出して戻した": "古い切符を取り出して戻しました",
  "誰かに宛てた便箋を一枚書きかけた": "誰かに宛てた便箋を一枚書きかけました",
  "近所の人に道を譲って会釈した": "近所の人に道を譲って会釈しました",
  "早く帰って窓の灯りを眺めた": "早く帰って窓の灯りを眺めました",
  "新しいパンの配合をノートに書いた": "新しいパンの配合をノートに書きました",
  "売り場の札を書き直した": "売り場の札を書き直しました",
  "店長に試作品の感想を聞いた": "店長に試作品の感想を聞きました",
  "常連さんの好みを聞いた": "常連さんの好みを聞きました",
  "閉店後に温かい飲み物を飲んだ": "閉店後に温かい飲み物を飲みました",
  "月の形を勝手に命名した": "月の形を勝手に命名しました",
  "冷蔵庫の奥を確認した": "冷蔵庫の奥を確認しました",
  "家族と変ななぞなぞを考えた": "家族と変ななぞなぞを考えました",
  "空想をノートに書き足した": "空想をノートに書き足しました",
  "コーヒーの味を少し変えた": "コーヒーの味を少し変えました",
  "夕方の雲を眺めた": "夕方の雲を眺めました",
  "友達と短いメッセージを交わした": "友達と短いメッセージを交わしました",
  "好きな本を数ページ読んだ": "好きな本を数ページ読みました",
  "帰り道に少し遠回りした": "帰り道に少し遠回りしました",
  "短いメモを机に残した": "短いメモを机に残しました",
  "隣人と短い挨拶をした": "隣人と短い挨拶をしました",
  "店で季節の花束を一つ組んだ": "店で季節の花束を一つ組みました",
  "店の窓辺に小さな鉢を飾り直した": "店の窓辺に小さな鉢を飾り直しました",
  "店でお客さんの好みを聞いた": "店でお客さんの好みを聞きました",
  "朝の市場で小さな花を仕入れた": "朝の市場で小さな花を仕入れました",
  "手伝いに来る知人と店の予定を話した": "手伝いに来る知人と店の予定を話しました",
  "店を閉めてから、枯れかけた鉢の手入れをした": "店を閉めてから、枯れかけた鉢の手入れをしました",
  "向かいの店の人と短く立ち話をした": "向かいの店の人と短く立ち話をしました",
  "放課後、図書室で資料を読んだ": "放課後、図書室で資料を読みました",
  "ノートに思いついた街の地図を描いた": "ノートに思いついた街の地図を描きました",
  "友達と進路とは関係ない話をした": "友達と進路とは関係ない話をしました",
  "なりたい職業を三つ書いて、一つ消した": "なりたい職業を三つ書いて、一つ消しました",
  "先生に気になる授業について質問した": "先生に気になる授業について質問しました",
  "帰宅途中、いつもと違う道を選んだ": "帰宅途中、いつもと違う道を選びました",
  "家で夕食の支度を手伝った": "家で夕食の支度を手伝いました",
  "閉店後に翌日の仕込みを少し済ませた": "閉店後に翌日の仕込みを少し済ませました",
  "仕事帰りのコンビニで、おにぎりを二つ買った": "仕事帰りのコンビニで、おにぎりを二つ買いました",
  "家の冷蔵庫にあるもので短い料理を作った": "家の冷蔵庫にあるもので短い料理を作りました",
  "早朝に食材の卸売店へ仕入れに出た": "早朝に食材の卸売店へ仕入れに出ました",
  "厨房で仲間に失敗談を一つ話した": "厨房で仲間に失敗談を一つ話しました",
  "家に帰って、何も作らず静かに座った": "家に帰って、何も作らず静かに座りました",
  "兄に短い近況を送った": "兄に短い近況を送りました",
  "仕事の帰りに花屋の小さな鉢を眺めた": "仕事の帰りに花屋の小さな鉢を眺めました",
  "朝の市場に寄り、季節の花を見た": "朝の市場に寄り、季節の花を見ました",
  "深夜のコンビニに寄って温かい飲み物を買った": "深夜のコンビニに寄って温かい飲み物を買いました",
  "朝の仕入れ先で小麦粉と果物を選んだ": "朝の仕入れ先で小麦粉と果物を選びました",
  "仕事帰りにパン屋へ寄り、夕食のパンを選んだ": "仕事帰りにパン屋へ寄り、夕食のパンを選びました",
  "地域の図書室へ行き、好きな本を探した": "地域の図書室へ行き、好きな本を探しました",
  "昔の時計店があった通りを歩いた": "昔の時計店があった通りを歩きました",
  "昔の時計店の窓を眺め、商店街をゆっくり歩いた": "昔の時計店の窓を眺め、商店街をゆっくり歩きました",
  "地域の図書室で、レポートの資料を調べた": "地域の図書室で、レポートの資料を調べました",
  "古い時計店のある通りへ荷物を届けた": "古い時計店のある通りへ荷物を届けました",
  "駅前の配送先へ荷物を届けた": "駅前の配送先へ荷物を届けました",
  "帰宅途中、駅前でしばらく時刻表を眺めた": "帰宅途中、駅前でしばらく時刻表を眺めました"
});
function letterPoliteActivity491(value){
 const raw=String(value??'').replace(/[。！!]+$/,'');
 if(!raw)return '';
 if(Object.prototype.hasOwnProperty.call(LETTER_POLITE_ACTIVITY_491,raw))return LETTER_POLITE_ACTIVITY_491[raw];
 // 将来の行動追加時にも、既に丁寧体の記述ならそのまま保持する。
 if(/(?:ます|ました|です|でした|ません)$/.test(raw))return raw;
 // 未登録の行動を誤った活用で置換しない。今後の追加時に検出できるようにする。
 console.warn('便箋用の丁寧体が未登録:',raw);
 return raw;
}
// 行動数に応じた内面的変化の要約は内部記録に常体で保存されている。
function letterPoliteProgress491(summary){return String(summary??'').replace(/ている$/,'ています')}

const REGULAR_MAIN=['cat','driver','fish','clock','terminal'];
const REGULAR_SUPPORT=['bread','moon','anon','sugar'];
const REGULAR_NEW=['umbrella','triangle','fridge'];

// v3.4: 投稿のない夜も、リスナー自身の暮らしは止まらない。
// 配達の抽選を止めるだけであり、生活・感情・他者との交流は通常どおり進行する。
const QUIET_LISTENERS_34=['cat','driver','fish','clock','terminal','bread','umbrella','triangle','fridge'];
const QUIET_RETURN_VOICES_34={
 cat:['お久しぶりです。少しの間、手紙を書くより、自分の毎日を静かに眺めていました。','久しぶりにメールを書きます。頭の中で文章を作っては、消す夜が続いていました。'],
 driver:['お久しぶりです。主任は相変わらず元気です。僕のほうは、手紙を書く前に眠ってしまう夜が続いていました。','ご無沙汰しています。仕事の合間に書こうと思って、毎回そのままになっていました。主任は無断欠勤を認めてくれています。'],
 fish:['お久しぶりです。書くことがなかったわけじゃないのに、送信するところで何度もやめていました。','しばらく聴く側にも、書く側にもなれない夜がありました。また少し、言葉にしたくなりました。'],
 clock:['ご無沙汰しております。書こうと思うことはあったのですが、日々の用事を先に済ませておりました。','しばらく筆を置いていました。変わったことばかりが日々ではないと、近頃よく感じます。'],
 terminal:['お久しぶりです。送らない夜が続きました。話さずに過ごした時間も、自分のものでした。','ご無沙汰しています。書きかけの文を何度か閉じて、今夜ようやく送ります。'],
 bread:['お久しぶりです。パンは相変わらず焼いていましたが、お便りを書く時間がなかなか取れませんでした。','少しご無沙汰しました。店長からは特に何も言われていません。ラジオネームでシフト管理はされませんからね。'],
 umbrella:['お久しぶりです。店先の花が何度か入れ替わる間、お便りは書かずにいました。','しばらくぶりに手紙を書きます。店のことを片づけているうちに、夜が過ぎていきました。'],
 triangle:['お久しぶりです。ノートにはいろいろ書いていたのですが、ラジオに送るのは久しぶりです。','しばらくご無沙汰しました。将来のことを考えると、なぜか目の前の宿題が増えるんですよね。'],
 fridge:['お久しぶりです。厨房は毎日動いていたのに、家へ戻ると何も書かずに寝ていました。','しばらくぶりです。誰かの食事を作ることは続いていて、自分の近況を書くのだけ後回しでした。']
};
function createQuietState(){return {schema:1,active:{},history:[],lastStartNight:0,lastReturnNight:{},processedNights:[],migrationNight:0}}
function migrateQuiet(data){
 const old=data.quiet&&typeof data.quiet==='object'?data.quiet:{};
 const q={...createQuietState(),...old};
 q.active=old.active&&typeof old.active==='object'?old.active:{};
 q.history=Array.isArray(old.history)?old.history.slice(-35):[];
 q.lastReturnNight=old.lastReturnNight&&typeof old.lastReturnNight==='object'?old.lastReturnNight:{};
 q.processedNights=Array.isArray(old.processedNights)?old.processedNights.slice(-75):[];
 q.lastStartNight=Number.isInteger(old.lastStartNight)?old.lastStartNight:0;
 q.migrationNight=Number.isInteger(old.migrationNight)?old.migrationNight:data.night;
 data.quiet=q;return data;
}
function quietScheduledFor(id,n){const a=s.quiet?.active?.[id];return Boolean(a&&n>=a.startNight&&n<=a.endNight)}
function quietWaitingToReturn(id,n){const a=s.quiet?.active?.[id];return Boolean(a&&n>a.endNight)}
// 初投稿前と重要な章の手書きストーリーは、物語上の整合性を優先して保護する。
function quietSafeWindow(n,duration){
 for(let k=n;k<n+duration+1;k++){
  if(k===49||k===50||k===51||chapter3IsNight(k))return false;
 }
 return true;
}
function quietReasonFromAction(id,act,p){
 const category=act?.category;
 const anxiety=p?.emotion?.anxiety||0;
 if(category==='duty')return 'busy';
 if(category==='rest'||((p?.life?.health||50)<40))return 'rest';
 if(category==='reflection'||(anxiety>=65&&category!=='social'))return 'think';
 if(category==='creative')return 'immersed';
 if(category==='social')return 'everyday';
 return 'everyday';
}
// ある日を終えた後、本人が自分の暮らしを優先する時間が自然に生まれる。
// 未来の予定を確定するが、プレイヤーがまだ知らない理由を番組画面に表示しない。
function quietAfterDaily(n){
 if(n<31)return;
 s.quiet ||= createQuietState();const q=s.quiet;
 if(q.processedNights.includes(n))return;
 q.processedNights.push(n);q.processedNights=q.processedNights.slice(-75);
 const start=n+1;
 if(Object.keys(q.active).length||n-q.lastStartNight<9||!quietSafeWindow(start,6))return;
 // はじめての投稿から時間が経ち、すでに聞き馴染みのある声だけを対象とする。
 const candidates=QUIET_LISTENERS_34.filter(id=>{
  if(!newListenerEligible(id,start)||!newListenerIntroduced(id,start))return false;
  if(!s.played?.some(x=>x.who===id&&x.night<start))return false;
  if(start-(q.lastReturnNight[id]||0)<20)return false;
  const p=s.simState?.people?.[id];const day=p?.daily?.find(x=>x.night===n);
  return Boolean(day&&day.actionId);
 }).map(id=>{
  const p=s.simState.people[id],day=p.daily.find(x=>x.night===n);
  const reason=quietReasonFromAction(id,day,p);
  const weight=({busy:27,rest:23,think:19,immersed:13,everyday:8})[reason]||8;
  return {id,day,reason,weight,roll:simHash(`quiet34:choose:${id}:${n}:${day.actionId}`)%100};
 }).filter(x=>x.roll<x.weight).sort((a,b)=>(a.roll-a.weight)-(b.roll-b.weight)||a.id.localeCompare(b.id));
 if(!candidates.length)return;
 const v=candidates[0];
 const days=3+simHash(`quiet34:length:${v.id}:${n}:${v.day.actionId}`)%4; // 3〜6夜
 if(!quietSafeWindow(start,days))return;
 q.active[v.id]={startNight:start,endNight:start+days-1,reason:v.reason,sourceNight:n,sourceAction:v.day.actionId,sourceActivity:v.day.activity,createdAt:n};
 q.lastStartNight=n;
 // UIに「休止」が表示されたり、本人の気持ちが強制変更されたりすることはない。
}
// 最新の「実配達」のみ参照する。事前に作った社会イベントの下書きは数えない。
function quietLastActualMail461(id,n){
 let latest=0;
 const fromRegular=s.regular?.lastMailed?.[id]||0;
 if(fromRegular<n)latest=fromRegular;
 for(let t=Math.max(1,n-12);t<n;t++){
  if((s.letterSets?.[t]||[]).some(uid=>letterSenderId(uid)===id))latest=t;
 }
 return latest;
}
// 数日だけの休止には「お久しぶり」の大げさな挨拶を使わない。
// 近況の再開自体は残し、長く付き合っている手触りを保つ。
const QUIET_SHORT_RETURN_461={
 cat:['少し手紙を休んでいました。今日は、また書いてみようと思います。','何日か書かないでいたら、話したいことが少しできました。'],
 driver:['数日ぶりの報告です。主任の巡回は、その間も通常営業でした。','この数日は帰ると眠ってしまいました。今日はひと言だけ書きます。'],
 fish:['少しのあいだ、言葉を探していました。今日は短く書いてみます。','何日か手紙を書かずにいました。また少し送ってみたくなりました。'],
 clock:['この数日は手紙を書かずにおりました。今夜は少しだけ。','数日ぶりに便りをしたためます。暮らしはいつもどおり続いております。'],
 terminal:['何日か書かずにいました。今日は少し書いてみます。','短い間、手紙は休んでいました。話すことがなくなったわけではありません。'],
 bread:['数日ぶりのお便りです。パンのほうは休まず焼いていました。','何日か手紙を書いていませんでした。店の仕事はいつもどおりです。'],
 umbrella:['少しお便りを休んでいました。店では花の水を替えていました。','何日か投稿を休んで、今日はまた書いてみました。'],
 triangle:['数日ぶりに手紙を書きます。ノートのほうは、その間も埋まっていました。','しばらく、といっても数日ですが、ラジオに送るのは休んでいました。'],
 fridge:['数日ぶりに手紙を書きます。厨房はこの間も動いていました。','ここ数日は帰るとすぐ休んでいました。また短く書きます。']
};
function quietReturnNote(id,n){
 const q=s.quiet?.active?.[id];if(!q||n<=q.endNight)return null;
 const voices=QUIET_RETURN_VOICES_34[id]||QUIET_RETURN_VOICES_34.cat;
 const gap=n-quietLastActualMail461(id,n);
 const short=gap<7;
 const openings=short?(QUIET_SHORT_RETURN_461[id]||QUIET_SHORT_RETURN_461.cat):voices;
 const start=openings[simHash(`quiet34:return:${id}:${q.startNight}`)%openings.length];
 const again=regularDayAction(id,n);
 const suffix={
  cat:'返事がほしいというより、また少し話したくなったので書きました。',
  driver:'では、主任の見回りが始まったので、この辺で。',
  fish:'何か決まったわけではありません。また考えたことを書いてみます。',
  clock:'次のお便りは、もう少し早く書けるとよいのですが。',
  terminal:'書けなかった時間も含めて、今の暮らしなのだと思います。',
  bread:'これからまた生地を仕込みます。お便りはその前に。',
  umbrella:'そろそろ花瓶の水を替えます。お便りはそのあとに。',
  triangle:'次はいつ書くかわかりませんが、また面白いことがあれば送ります。',
  fridge:'今日は自分のための夕飯も考えてみます。'
 }[id]||'また、気が向いた日に書きます。';
 // 本人が確かに経験した前日の行動だけを任意で振り返る。
 const fact=again?.activity?'\n\n昨日は、'+letterPoliteActivity491(again.activity)+'。':'';
 return {subject:short?'数日ぶりのお便り':'久しぶりのお便り',kind:'return',tag:`return-${q.startNight}`,
  body:start+fact+'\n\n'+suffix,absenceReturn:true,voiceVersion:34};
}
// 便箋が最終的に夜の投函箱へ届いた場合にだけ、実際の帰還として確定する。
function quietConfirmDelivered(n,ids){
 const q=s.quiet;if(!q)return;
 for(const uid of ids){
  const letter=s.regular?.letterArchive?.[uid]||letterDB[uid];if(!letter)continue;
  const id=letter.who,active=q.active[id];
  if(!active||n<=active.endNight)continue;
  q.history.push({who:id,...active,returnedNight:n,returnLetterId:uid,absenceReturn:Boolean(letter.absenceReturn)});
  q.history=q.history.slice(-35);q.lastReturnNight[id]=n;delete q.active[id];
 }
}

// =============================================================
// v3.7 番組の常連文化 — 公開された放送を、その夜聴いた人だけが記憶する。
// 番組外の交流、秘密、未紹介の手紙は参照しない。反応は最大2往復で終了する。
// =============================================================
function createRadioCultureState(){return {schema:1,processed:[],audience:{},heard:{},sent:[],lastMailNight:0,lastByListener:{},draftNight:0,draftUsed:false}}
function migrateRadioCulture(data){
 const old=data.radioCulture&&typeof data.radioCulture==='object'?data.radioCulture:{};
 const out=createRadioCultureState();
 out.processed=Array.isArray(old.processed)?old.processed.filter(Number.isInteger).slice(-100):[];
 out.audience=old.audience&&typeof old.audience==='object'?old.audience:{};
 out.heard=old.heard&&typeof old.heard==='object'?old.heard:{};
 out.sent=Array.isArray(old.sent)?old.sent.slice(-100):[];
 out.lastMailNight=Number.isInteger(old.lastMailNight)?old.lastMailNight:0;
 out.lastByListener=old.lastByListener&&typeof old.lastByListener==='object'?old.lastByListener:{};
 out.draftNight=Number.isInteger(old.draftNight)?old.draftNight:0;
 out.draftUsed=Boolean(old.draftUsed);
 data.radioCulture=out;return data;
}
// 話題は差出人本人の公開本文に確かに現れた場合だけ成立する。
// 自動抽出で「名前」「秘密」「実際の素性」を推測しない。
const RADIO_CULTURE_TOPICS={
 chief:{who:'driver',pattern:/主任/,name:'猫主任',subject:'主任の近況',intro:'猫の主任さんについてのお便り',responses:{
  bread:'うちの新作パンも、猫主任さんに検品してもらいたいところです。合格の基準が昼寝だったら困りますが。',
  moon:'猫主任さんの役職は、月の裏側からも正式に認定しておきます。本人に拒否権がありそうですが。',
  triangle:'猫が主任になる職場があるんですね。うちの進路希望欄にも書きたくなりました。',
  umbrella:'猫主任さんに店番を頼んだら、花の影で眠ってしまいそうですね。',
  fish:'主任さんの話を聞いて、名前を付けるだけで日常が少し面白く見える気がしました。',
  clock:'主任さんは、きっと時計よりも日なたの暖かさに忠実なのでしょうね。',
  fridge:'厨房にも主任さんが来てくれたら、休憩の時間だけはきちんと守れそうです。',
  cat:'猫主任さんには、ちょっと絵のモデルをお願いしてみたくなりました。',
  terminal:'駅の近くにもよく寝ている猫がいます。主任さんとは、仕事ぶりが似ているかもしれません。'
 },reply:'主任の話が思わぬところまで届いたようで、本人に報告しておきます。たぶん、あくびで返されます。'},
 bread:{who:'bread',pattern:/パン|生地|焼き上|試作/,name:'パン屋さんの新作',subject:'パンの話が残って',intro:'パンや試作についてのお便り',responses:{
  driver:'新しいパンの話を聞いて、夜の配送中に急にお腹が空いてきました。主任はその責任を取ってくれません。',
  triangle:'試作を繰り返すのって、実験みたいで面白いですね。食べられる宿題なら頑張れそうです。',
  moon:'パンの新作を聞いて、月の裏側にもパン屋が必要だと思いました。営業時間が難問ですが。',
  fridge:'厨房の仕事なので、試作の話が気になりました。作る側の迷いって、案外似ているものですね。',
  fish:'味を作り直す話を聞いて、私もノートの文章を少し書き直したくなりました。',
  umbrella:'新しいパンが店先に並ぶ話は、季節の花を並べる日の楽しみに少し似ています。',
  clock:'パンの話を聴いて、妻が焼き立てを好んでいたことを思い出しました。'
 },reply:'パンの話をそんなふうに覚えてもらえていたとは。次の仕込みも少し楽しくなりそうです。'},
 moon:{who:'moon',pattern:/月|プリン|監査/,name:'月の裏側の話',subject:'月の裏側から届いた話',intro:'月や少し不思議な空想のお便り',responses:{
  triangle:'月の裏側にも規則があるのかと思ったら、理科のノートの余白が足りなくなりました。',
  bread:'月にもパン屋があったら、きっと丸いパンばかり売れるんでしょうか。',
  driver:'月の監査が来たら、主任の労働態度は少し心配ですね。',
  fish:'真剣に考えすぎた日に、ああいう空想があると少し肩の力が抜けます。',
  umbrella:'月の裏側にはどんな花が咲くのか、つい考えました。',
  fridge:'月の会議にも夜食が必要なら、献立は考えられそうです。'
 },reply:'こちらの空想が少し広まったようですね。月の広報部には、まだ内緒にしておきます。'},
 flower:{who:'umbrella',pattern:/花|花束|鉢/,name:'花屋さんの店先',subject:'花屋さんの話を聴いて',intro:'花屋さんや店先の花のお便り',responses:{
  cat:'店先の花について聴いて、帰り道の色を少し意識してみたくなりました。',
  bread:'季節の花が並ぶように、うちの店にも季節のパンが並びます。ちょっと親近感がわきました。',
  fish:'花の名前を知らなくても、気に入った色を覚えておくのはいいですね。',
  clock:'店先の花を選ぶ話を聞いて、散歩の途中の小さな花を思い出しました。',
  triangle:'花屋さんの仕事にも、知らないことがたくさんありますね。将来の候補がまた増えそうです。',
  fridge:'花を選ぶ人の話は、料理の皿を整えるときのことを思い出させます。'
 },reply:'うちの店先の花をラジオ越しに気にしてくれる人がいるんですね。明日の水替えが少し楽しみです。'},
 clock:{who:'clock',pattern:/時計|針|ねじ/,name:'古い時計の話',subject:'時計の話の続き',intro:'古い時計や時間についてのお便り',responses:{
  driver:'夜の仕事中に時計を何度も見ますが、一つひとつに思い出があると思うと少し見方が変わります。',
  fish:'時計の話を聴いて、時間がたっても忘れたくないことがあるんだと思いました。',
  triangle:'時計を直す仕事の話を聞くと、分解して仕組みを見てみたくなります。先生に止められそうですが。',
  umbrella:'時間をかけて直した時計の話が、鉢を育て直すことに少し似ている気がしました。',
  cat:'昔の時計の話を聞いて、古いスケッチブックを捨てずにいた理由を考えました。'
 },reply:'時計の話を覚えてくださった方がいるのですね。今夜も一つ、ねじを巻いておきます。'},
 notebook:{who:'triangle',pattern:/ノート|進路|将来|学校|宿題/,name:'三角定規のノート',subject:'あのノートの話',intro:'ノートや将来のことを書いたお便り',responses:{
  fish:'考えが毎回変わるというお話を聞いて、私もノートの書き直しを悪いことだと思わなくなりました。',
  cat:'いろいろな道に興味があるという声を聞いて、大人になっても似たように迷うことがあると思いました。',
  bread:'パンの種類を選べないお客さんもいます。将来の話とは違うけれど、少し似ているかもしれません。',
  moon:'三角定規さんのノートなら、月の進路相談室でも人気が出そうです。',
  umbrella:'将来のことを考える話を聞いて、店を始める前の自分を少し思い出しました。',
  driver:'将来を決める話を聴いて、僕は昔どんな仕事を想像していたっけ、と考えました。'
 },reply:'ノートの話をそんなふうに聴いてくれた人がいるんですね。ページを一枚増やしたくなりました。'},
 cooking:{who:'fridge',pattern:/料理|厨房|夕飯|食事|ご飯|おにぎり/,name:'料理人の夕飯',subject:'夕飯のお便りのあとで',intro:'仕事と自分の夕飯についてのお便り',responses:{
  bread:'人の食べ物を作る仕事をしているのに、自分の食事は簡単に済ませがち。少しわかる気がします。',
  driver:'自分の夕飯まで手を回せない話に、夜勤明けの僕も深くうなずきました。',
  fish:'自分のために何か作る時間も大事なんだと、あのお便りを聴いて思いました。',
  umbrella:'人のために働く日の、自分の時間。花屋も少し似ているかもしれません。',
  triangle:'プロの料理人でも夕飯を簡単に済ませると聞いて、ちょっと親近感がわきました。'
 },reply:'自分の夕飯の話が、誰かの夜食のことまで考えるきっかけになるとは思いませんでした。'},
 station:{who:'terminal',pattern:/駅|電車|時刻表|切符/,name:'駅の話',subject:'駅の話を聴いて',intro:'駅や帰り道についてのお便り',responses:{
  driver:'駅の話を聞いて、毎晩通る道にも、人によって違う思い出があるのかもしれないと思いました。',
  clock:'駅のお便りを聴くと、時刻表には書かれない時間もあるのだと思います。',
  fish:'いつもの駅の話を聴いて、帰り道を少し違う気持ちで歩いてみたくなりました。',
  cat:'同じ駅でも、誰かには大事な場所なんですね。帰り道の景色を描いてみたくなりました。'
 },reply:'あの駅の話を覚えている人がいたのですね。私は今夜も、いつもの道を通りました。'}
};
const RADIO_CULTURE_LISTEN_RATE={cat:67,driver:76,fish:62,clock:70,terminal:52,bread:64,moon:73,sugar:51,anon:54,umbrella:59,triangle:57,fridge:67};
// v4.0: 文末の決まり文句を、手紙の「主題」だと誤認しない。
// 登場人物らしい締めの一行は残すが、ほかの人が反応する理由にはしない。
function radioCultureIdentify(x){
 const note=s.regular?.letterArchive?.[x.id]||letterDB[x.id];
 const all=String(x.body||'').split(/\n\s*\n/).filter(Boolean);
 let paragraphs=all.length>1?all.slice(1):all.slice();
 if(note?.voiceVersion===33){
   const styles=LETTER_VOICE_33[x.who]||LETTER_VOICE_33.anon;
   const endings=Object.values(styles).flat();
   paragraphs=paragraphs.filter(p=>!endings.includes(p)&&!/^(?:少し前に|そういえば、前に|前に「|以前「)/.test(p));
 }
 // 「パンとは関係ありません」「主任には報告します」のような結びを除く。
 paragraphs=paragraphs.filter(p=>!/^パンとは関係ありません/.test(p));
 const core=paragraphs.join('\n');
 const subject=String(x.subject||'');
 const text=subject+'\n'+core;
 const ids=Object.keys(RADIO_CULTURE_TOPICS).filter(id=>{
   const t=RADIO_CULTURE_TOPICS[id];
   if(t.who!==x.who||!t.pattern.test(text))return false;
   // 猫主任以外の話で、決まり文句の「主任」だけを拾わない。
   if(id==='chief'&&!/主任/.test(subject)&&!core.split(/[。！？!]/).slice(0,2).some(part=>!/主任(?:なら|だったら)/.test(part)&&(/^(?:\s*)(?:猫主任|主任)/.test(part)||/(?:猫主任|主任).{0,18}(?:寝|猫|あくび|検品|昼寝|監査|仕事|役職|肩書)/.test(part))))return false;
   if(id==='moon'&&!/月|プリン|監査/.test(subject)&&!/月|プリン|監査/.test(paragraphs[0]||''))return false;
   if(id==='bread'&&!/パン|試作|生地|焼き/.test(subject)&&!/(?:試作|新作|焼き上|生地|粉|パンを|パンの話)/.test(core.slice(0,160)))return false;
   return true;
 });
 return ids.length?ids[simHash('radio37:topic:'+x.id)%ids.length]:null;
}
function radioCultureAfterBroadcast(n){
 if(n<29)return;
 s.radioCulture ||= createRadioCultureState();const state=s.radioCulture;
 if(state.processed.includes(n))return;
 const transmitted=s.played.filter(x=>x.night===n);
 const audience=Object.keys(SIM_PROFILES).filter(id=>{
   if(!newListenerIntroduced(id,n))return false;
   return simHash(`radio37:tune:${n}:${id}:${s.rng}`)%100<(RADIO_CULTURE_LISTEN_RATE[id]||50);
 });
 state.audience[n]=audience;
 for(const heardId of audience){
  const memory=state.heard[heardId]||(state.heard[heardId]=[]);
  for(const x of transmitted){
   if(x.who===heardId)continue;
   const l=s.regular?.letterArchive?.[x.id]||letterDB[x.id];
   const meta=l?.culture;
   let topic=null,stage='root',threadId=x.id,originWho=x.who;
   if(meta&&meta.stage==='reaction'){
    // 返事を聞いた場合だけ、元の投稿者が一度だけ続報を送れる。
    if(meta.originWho!==heardId)continue;
    topic=meta.topic;stage='reaction';threadId=meta.threadId;originWho=meta.originWho;
   }else if(!meta&&l?.kind!=='long-echo'){topic=radioCultureIdentify(x)}
   if(!topic||!RADIO_CULTURE_TOPICS[topic])continue;
   if(memory.some(a=>a.sourceId===x.id))continue;
   memory.push({heardNight:n,sourceId:x.id,sourceNight:n,sourceWho:x.who,threadId,originWho,topic,stage,subject:x.subject});
  }
  state.heard[heardId]=memory.slice(-50);
 }
 state.processed.push(n);state.processed=state.processed.slice(-100);
 for(const old of Object.keys(state.audience))if(+old<n-65)delete state.audience[old];
}
function radioCultureConfirmDelivered(n,ids){
 const state=s.radioCulture;if(!state)return;
 for(const id of ids){
  const l=s.regular?.letterArchive?.[id];if(!l?.culture)continue;
  const meta=l.culture;
  if(state.sent.some(x=>x.letterId===id))continue;
  state.sent.push({letterId:id,night:n,who:l.who,threadId:meta.threadId,stage:meta.stage,topic:meta.topic});
  state.sent=state.sent.slice(-100);state.lastByListener[l.who]=n;
  state.lastMailNight=n;
 }
}
function radioCultureCompose(id,n){
 const state=s.radioCulture;
 if(!state||n<31||n-state.lastMailNight<5||n-(state.lastByListener[id]||0)<14||state.draftNight===n&&state.draftUsed)return null;
 const memories=(state.heard[id]||[]).filter(x=>{
  if(n-x.heardNight<2||n-x.heardNight>27)return false;
  if(x.sourceWho===id||!RADIO_CULTURE_TOPICS[x.topic])return false;
  if(x.stage==='root'){
   if(x.originWho===id)return false;
   if(!RADIO_CULTURE_TOPICS[x.topic].responses[id])return false;
   if(state.sent.some(y=>y.who===id&&y.threadId===x.threadId))return false;
  }else if(x.stage==='reaction'){
   if(x.originWho!==id)return false;
   if(state.sent.some(y=>y.who===id&&y.threadId===x.threadId&&y.stage==='callback'))return false;
  }else return false;
  return true;
 });
 if(!memories.length)return null;
 if(simHash(`radio37:letter:${id}:${n}`)%100>=74)return null;
 const ranked=memories.map(x=>({...x,rank:simHash(`radio37:pick:${id}:${n}:${x.sourceId}`)%100+(x.stage==='reaction'?60:0)}))
  .sort((a,b)=>b.rank-a.rank||a.sourceNight-b.sourceNight);
 const x=ranked[0],t=RADIO_CULTURE_TOPICS[x.topic];
 const stage=x.stage==='reaction'?'callback':'reaction';
 let body,subject;
 if(stage==='reaction'){
  subject=t.subject;
  body=regularFirstSentence(id,n)+'\n\n'+(n-x.heardNight<=7?'先日の放送で、':'以前の放送で、')+NAMES[x.sourceWho]+'さんの'+t.intro+'を聴きました。'
   +'\n\n'+t.responses[id]+'\n\n'+(RADIO_CULTURE_AFTERTHOUGHTS_45[id]||RADIO_CULTURE_AFTERTHOUGHTS_45.anon)[simHash(`v45:culture:after:${id}:${n}:${x.threadId}`)%2];
 }else{
  subject=n-x.heardNight<=7?'先日の放送のお返事に':'以前の放送のお返事に';
  body=regularFirstSentence(id,n)+'\n\n以前送った'+t.intro+'に、'+NAMES[x.sourceWho]+'さんからのお便りが届いているのを聴きました。'
   +'\n\n'+t.reply+'\n\nすぐに返事をするつもりはなかったのですが、書きたくなりました。';
 }
 return {subject,body,kind:'culture',tag:`culture-${stage}-${x.threadId}`,culture:{stage,threadId:x.threadId,originWho:x.originWho,sourceId:x.sourceId,sourceNight:x.sourceNight,topic:x.topic}};
}
// ============================================================
// v3.9 — 長く残る放送の記憶
// 第29夜以降、実際に読まれた便りを、実際に聴取した人だけが覚える。
// v3.7の短い反応とは別に、30夜以上経ってから本人の意思で振り返る。
// ============================================================
function createRadioMemoryState39(){
 return {schema:1,processed:[],heard:{},sent:[],lastByListener:{},lastMailNight:0,draftNight:0,draftUsed:false};
}
function migrateRadioMemory39(data){
 const v=data.radioMemory&&typeof data.radioMemory==='object'?data.radioMemory:{};
 data.radioMemory={schema:1,
  processed:Array.isArray(v.processed)?[...new Set(v.processed.filter(Number.isInteger))].slice(-175):[],
  heard:v.heard&&typeof v.heard==='object'?v.heard:{},
  sent:Array.isArray(v.sent)?v.sent.slice(-160):[],
  lastByListener:v.lastByListener&&typeof v.lastByListener==='object'?v.lastByListener:{},
  lastMailNight:Number.isInteger(v.lastMailNight)?v.lastMailNight:0,
  draftNight:Number.isInteger(v.draftNight)?v.draftNight:0,
  draftUsed:!!v.draftUsed
 };
 // 過去の夜をたどって未記録の「聴取」を補うことはしない。
 return data;
}
const RADIO_MEMORY_VOICES39={
 cat:'絵にするならどんな色なのか、と考えました。自分でも少し意外です。',
 driver:'主任に報告してもたぶん寝ていますが、妙に忘れられないんですよね。',
 fish:'日記の余白に、そういう言葉を残しておきたくなりました。',
 clock:'長い時間がたってから、ひょいと顔を出す言葉がありますね。',
 terminal:'同じ場所にいたわけではないのに、景色が少し重なる気がしました。',
 bread:'仕込みの手を止めたときに、ふと戻ってくる言葉があるんですね。',
 moon:'月の記録係に出すなら「いま思い出したこと」という欄に書きます。',
 sugar:'コーヒーが冷めるまでの時間に、少し考えたくなる話でした。',
 anon:'大きな感想はないのですが、なぜか今も覚えています。',
 umbrella:'花の顔ぶれは入れ替わっても、ふと残る話があるものですね。',
 triangle:'何十ページも前のノートを見返したみたいな気分です。',
 fridge:'仕事の段取りとは関係ないことなのに、ふと浮かぶんですよね。'
};
const RADIO_MEMORY_THEMES39={
 chief:'猫主任さんの話を思い出すと、肩書きが立派でも、いつも張り切っている必要はないのかもしれないと思います。',
 bread:'パンについてのあの言葉が、なぜか心に残っています。あの人にはあの人の、毎日の仕込みがあるのでしょうね。',
 moon:'月についての空想を聴いたとき、何の役にも立たないことを真剣に考える楽しさを思い出しました。',
 flower:'花屋さんから届いた、暮らしの一場面でした。花を扱う時間にも、花とは関係のない時間にも、その人らしい景色があるのだと思いました。',
 clock:'時計にまつわるあの話を思い出すと、大切にしてきた時間は針だけでは測れないのかもしれないと思います。',
 notebook:'ノートや将来についての話を思い出しました。考えを言葉にするだけでも、案外時間がかかるものですね。',
 cooking:'料理や夕飯についての言葉が残っています。いつも食べているものにも、あの人の仕事や暮らしが少し見える気がします。',
 station:'駅や帰り道について、あの人の見ていた景色を思い出しました。いつもの場所にも、別の誰かの景色があるんですね。',
 question:'あの少し変わった質問には、今も答えを出していません。すぐ答えなかった問いほど、あとになって戻ってくることがあります。',
 mishap:'あの小さな失敗談を思い出しました。笑って済ませた話が、ずっとあとに少しやさしい記憶になることもあるんですね。',
 food:'あの食べ物の話が残っています。なんでもない食べ物の話も、あとになってふと浮かぶことがありますね。',
 memory:'ずっと昔の出来事についての言葉でした。本人が覚えている小さなことにも、その人だけの時間の長さがありますね。',
 oddity:'あの不思議な空想を、忘れたつもりでいました。ところが妙なところで、また考えてしまいました。'
};
const RADIO_MEMORY_ACTIONS39={
 chief:{driver:['chief']}, bread:{bread:['bake','store']}, moon:{moon:['moon','sketch']},
 flower:{umbrella:['bouquet','window']},clock:{clock:['repair']},
 notebook:{triangle:['future','librarystudy','study']},cooking:{fridge:['leftovers','konbini','rest']},
 station:{terminal:['timetable','walk']}
};
function radioMemoryAfterBroadcast39(n){
 if(n<29)return;
 const state=s.radioMemory||(s.radioMemory=createRadioMemoryState39());
 if(state.processed.includes(n))return;
 const audience=s.radioCulture?.audience?.[n]||[]; // v3.7が確定させた実際の聴取者
 const played=s.played.filter(x=>x.night===n);
 for(const who of audience){
  if(!newListenerIntroduced(who,n))continue;
  const shelf=state.heard[who]||(state.heard[who]=[]);
  // 毎夜すべてを覚えるのではない。印象に残った一通だけ候補にする。
  if(simHash(`v39:notice:${n}:${who}`)%100>=39)continue;
  const possible=played.map(x=>{
   const note=s.regular?.letterArchive?.[x.id]||letterDB[x.id];
   if(['culture','radio-memory','long-echo'].includes(note?.kind))return null; // 回想の無限連鎖を防止
   const topic=note?.kind==='variety'&&RADIO_MEMORY_THEMES39[note.variety?.category]
    ?note.variety.category:radioCultureIdentify(x);
   if(!topic||!RADIO_MEMORY_THEMES39[topic])return null;
   return {sourceId:x.id,sourceNight:n,sourceWho:x.who,subject:String(x.subject||'').slice(0,70),topic,used:false};
  }).filter(Boolean);
  if(!possible.length)continue;
  const chosen=possible[simHash(`v39:select:${n}:${who}`)%possible.length];
  if(!shelf.some(x=>x.sourceId===chosen.sourceId))shelf.push(chosen);
  state.heard[who]=shelf.filter(x=>n-x.sourceNight<=145).slice(-55);
 }
 state.processed.push(n);state.processed=state.processed.slice(-175);
}
// v4.9.3: 以前放送で聴いた手紙への距離感は、リスナーごとに違う。
const RADIO_MEMORY_RECALL_493={
 cat:'あの夜の言葉を思い出すと、頭の中に少しだけ景色が戻ってきます。',
 clock:'ずいぶん前の放送ですが、あの声のことは覚えております。',
 bread:'あのとき聞いた話が、ふと頭に戻ってきたんです。',
 moon:'地球の放送記録を見返すなら、あの一通には印をつけたいところです。',
 driver:'あの夜の言葉は、今も残っています。仕事の連絡より長持ちです。',
 fish:'あのとき聴いた言葉を、今も自分なりに考えています。',
 sugar:'あのとき聴いた声が、あとになっても残ることがあるんですね。',
 anon:'あの夜の放送のことを、ひとりで思い出しました。',
 terminal:'あの夜、確かに聴いた声です。今も覚えています。',
 umbrella:'あの夜に聴いた言葉のことを、ふと思い返しました。',
 triangle:'あの夜の放送で気になった言葉を、まだ覚えています。',
 fridge:'仕事の記録とは違うのに、あの夜の声を覚えています。'
};
function radioMemoryCompose39(id,n){
 const state=s.radioMemory;
 if(!state||n<66||n-state.lastMailNight<13||n-(state.lastByListener[id]||0)<38)return null;
 if(state.draftNight===n&&state.draftUsed)return null;
 const memories=(state.heard[id]||[]).filter(x=>
  !x.used&&n-x.sourceNight>=34&&n-x.sourceNight<=125&&RADIO_MEMORY_THEMES39[x.topic]
 );
 if(!memories.length||simHash(`v39:mail:${id}:${n}`)%100>=73)return null;
 const ranked=memories.map(x=>({item:x,rank:(simHash(`v39:rank:${id}:${n}:${x.sourceId}`)%58)+Math.min(40,n-x.sourceNight)/2}));
 ranked.sort((a,b)=>b.rank-a.rank||a.item.sourceNight-b.item.sourceNight);
 const x=ranked[0].item;
 // 受信者が自分で送った便りを、実際に聴いた場合も「自分の投稿」として振り返る。
 const own=x.sourceWho===id;
 const origin=own?'以前、自分が送った':`ずっと前に、${NAMES[x.sourceWho]}さんが送っていた`;
 const line=own?'放送で自分の言葉を聞いた夜のことを、今日ふと思い出しました。':(RADIO_MEMORY_RECALL_493[id]||'あの夜の声を覚えています。');
 let body=regularFirstSentence(id,n)+'\n\n'+origin+'「'+x.subject+'」というお便りを覚えています。'+
  '\n\n'+line+'\n\n'+RADIO_MEMORY_THEMES39[x.topic];
 const day=regularDayAction(id,n);
 if(day&&(RADIO_MEMORY_ACTIONS39[x.topic]?.[id]||[]).includes(day.actionId)){
  body+='\n\n昨日は、'+letterPoliteActivity491(day.activity)+'。そのとき、あの放送がふと戻ってきました。';
 }
 body+='\n\n'+RADIO_MEMORY_VOICES39[id];
 const choices=[
  ['覚えていた言葉を受け取る','あの夜の「'+x.subject+'」というお便りが、今もあなたの中に残っているんですね。','empathy'],
  ['今の受け止め方を尋ねる','あのころと今とでは、その言葉の聞こえ方は違いますか。','curiosity'],
  ['時間の重なりを考える','何十夜も前の声が、今日の暮らしの中にまた現れることがあるんですね。','reflection'],
  ['思い出をそのまま大切にする','無理に答えを出さなくても、覚えていたことだけで十分かもしれません。','space']
 ];
 return {subject:own?'前に送った手紙を思い出して':'ずっと前に聴いたお便り',body,kind:'radio-memory',
  tag:`radio-memory39-${x.sourceId}`,radioMemory:{sourceId:x.sourceId,sourceNight:x.sourceNight,sourceWho:x.sourceWho,topic:x.topic},choices};
}
function radioMemoryConfirmDelivered39(n,ids){
 const state=s.radioMemory;if(!state)return;
 for(const uid of ids){
  const note=s.regular?.letterArchive?.[uid];if(note?.kind!=='radio-memory'||!note.radioMemory)continue;
  if(state.sent.some(x=>x.letterId===uid))continue;
  const meta=note.radioMemory;
  const memory=(state.heard[note.who]||[]).find(x=>x.sourceId===meta.sourceId);
  if(memory)memory.used=true;
  state.sent.push({letterId:uid,night:n,who:note.who,sourceId:meta.sourceId,sourceNight:meta.sourceNight,topic:meta.topic});
  state.sent=state.sent.slice(-160);state.lastByListener[note.who]=n;state.lastMailNight=n;
 }
}

function createRegularState(){return {schema:1,started:false,letterArchive:{},processedNights:[],latestThemes:{},lastMailed:{},mailHistory:[],varietyHistory:[],voiceHistory45:{},everydayHistory47:{},boundary4932:{},routeActions:[],phase:'between_chapters'}}
function migrateRegular(data){
 const base=createRegularState(),old=data.regular&&typeof data.regular==='object'?data.regular:{};
 const r={...base,...old};
 r.letterArchive=old.letterArchive&&typeof old.letterArchive==='object'?old.letterArchive:{};
 r.processedNights=Array.isArray(old.processedNights)?[...new Set(old.processedNights.filter(n=>Number.isInteger(n)&&n>=15))]:[];
 r.latestThemes=old.latestThemes||{};r.lastMailed=old.lastMailed||{};
 r.mailHistory=Array.isArray(old.mailHistory)?old.mailHistory.slice(-120):[];
 r.varietyHistory=Array.isArray(old.varietyHistory)?old.varietyHistory.filter(x=>x&&typeof x==='object'&&Number.isInteger(x.night)).slice(-360):[];
 r.voiceHistory45=old.voiceHistory45&&typeof old.voiceHistory45==='object'?old.voiceHistory45:{};
 r.bodyHistory4931=old.bodyHistory4931&&typeof old.bodyHistory4931==='object'?old.bodyHistory4931:null;
 r.everydayHistory47=old.everydayHistory47&&typeof old.everydayHistory47==='object'?old.everydayHistory47:{};
 r.boundary4932=old.boundary4932&&typeof old.boundary4932==='object'?old.boundary4932:{};
 r.routeActions=Array.isArray(old.routeActions)?old.routeActions.slice(-120):[];
 r.started=Boolean(old.started||data.night>=15);
 data.regular=r;return data;
}
// v4.9.31: a bounded record of genuinely delivered bodies, kept separate from broadcast history.
// Only compact content fingerprints are retained: no copies of private/unbroadcast letters.
function regularBodyKey4931(body){
 const text=String(body||'');
 return text.length.toString(36)+':'+simHash('mail-a:'+text).toString(36)+':'+simHash('mail-b:'+text).toString(36);
}
function regularBodyHistory4931(){
 const r=s.regular;
 if(!r||!r.letterArchive)return {};
 if(!r.bodyHistory4931||typeof r.bodyHistory4931!=='object'){
  r.bodyHistory4931={};
  // The previous save format did not track delivered-only bodies. It did keep actually aired texts.
  // Seed from confirmed broadcasts, never from unselected drafts or unsent event templates.
  for(const old of s.played||[]){
   if(!old||!old.who||!old.body||!Number.isInteger(old.night)||old.night<15)continue;
   const list=r.bodyHistory4931[old.who] ||= [];
   list.push({night:old.night,key:regularBodyKey4931(old.body)});
   if(list.length>140)list.shift();
  }
  // The still-cached letter sets contain previously delivered letters, including ones not aired.
  for(const [nightStr,ids] of Object.entries(s.letterSets||{})){
   const night=Number(nightStr);
   if(!Number.isInteger(night)||night<15||night>=s.night||!Array.isArray(ids))continue;
   for(const uid of ids){
    const l=r.letterArchive[uid];if(!l?.regular||!l.body)continue;
    const list=r.bodyHistory4931[l.who] ||= [],key=regularBodyKey4931(l.body);
    if(!list.some(x=>x.night===night&&x.key===key))list.push({night,key});
   }
  }
  for(const [id,list] of Object.entries(r.bodyHistory4931))r.bodyHistory4931[id]=list.slice(-140);
 }
 return r.bodyHistory4931;
}
function regularBodyAlreadyDelivered4931(who,body,n){
 const key=regularBodyKey4931(body);
 return (regularBodyHistory4931()[who]||[]).some(x=>x.key===key&&x.night<n) ||
  (s.played||[]).some(x=>x.who===who&&x.night<n&&x.body===body);
}
function regularFreshBody4931(id,n,note){
 if(!note?.body||!regularBodyAlreadyDelivered4931(id,note.body,n))return note;
 // Leave authored multi-person arcs and reunion letters untouched. For repeatable daily mail,
 // choose a different authentic topic before considering a grounded follow-up sentence.
 const options=[regularDayNote(id,n),regularThemeLetter(id,n),regularRoute(id,n),regularContact(id,n),regularBroadcastEcho(id,n)].filter(Boolean);
 for(const alt of options){
  const voiced=v33VoiceLetter(id,n,alt);
  if(!regularBodyAlreadyDelivered4931(id,voiced.body,n))return voiced;
 }
 // Exceptionally all available topics already appeared. The writer acknowledges a real
 // prior delivery without claiming the DJ read it, with a different reflection this night.
 const lines={
  cat:'前にも似た話を送った気がします。今夜は、まだ気になっている自分のことも少し考えています。',
  driver:'前にも似た報告をしましたね。まだ続きが気になるので、今夜も一通だけ。',
  fish:'前にも近いことを書いたかもしれません。今日は、書こうと思った理由のほうを考えています。',
  clock:'以前にも似た話をしたためたかもしれません。今夜また思い出したことを記しておきます。',
  terminal:'前にも似たお便りを送った気がします。今夜はまた、同じところに立ち止まりました。',
  bread:'前にも似た話を送りました。今夜もまた、そのことを考えていました。',
  moon:'月面議事録に再提出するような話ですが、今夜も少し考えております。',
  sugar:'前に似た話をしたかもしれません。今日の一杯を前にして、また思い出しました。',
  anon:'前にも似たことを書いた気がします。今夜は、それをもう一度考えていました。',
  umbrella:'前にも似た話を送ったかもしれません。花を眺めていると、また思い出します。',
  triangle:'この話は前にも送った気がします。今夜は別の角度から考え直しています。',
  fridge:'前にも書いたような話です。今日も少し考えてから送ります。'
 };
 const basis=note.body.trimEnd(),line=lines[id]||'前にも似た話を送ったような気がします。今夜も気になりました。';
 return {...note,body:basis+'\n\n'+line};
}
function regularTheme(n){return REGULAR_THEMES[(n-15)%REGULAR_THEMES.length]}
function regularDayTitle(n){
 if(n<=14)return dayTitles[n];
 if(n<=28)return CH2_NIGHTS[n][0];
 if(chapter3IsNight(n))return CH3_DAYS[chapter3Offset(n)][0];
 const historic=(s.special?.history||[]).find(h=>h.night===n);
 const plan=s.special?.planned;
 const specialId=historic?.themeId||(plan?.night===n&&['ready','completed'].includes(plan.status)?plan.themeId:null);
 if(specialId&&SPECIAL_THEMES[specialId])return SPECIAL_THEMES[specialId].title;
 if(chapter4IsNight(n))return CH4_DAYS[n-79][0];
 return `通常放送 · ${regularTheme(n)[0]}`;
}
function regularFirstSentence(id,n){const a=REGULAR_INTROS[id]||REGULAR_INTROS.anon;return a[simHash(`reg:intro:${n}:${id}`)%a.length]}
function regularDayAction(id,n){return s.simState?.people?.[id]?.daily?.find(d=>d.night===n-1)||null}
// v4.8.6: 長期放送の進路別の「もう一つの日常」。
// 分岐が確定している本人の選択だけに触れ、未発生の出来事を断定しない。
const REGULAR_LATE_ROUTES_486={
 cat:{
  create:[['消さずに置いた紙','会社から帰ると、机には昨日の白い紙がそのままありました。描くつもりだったのに、お茶を飲んだら眠くなってしまいました。','描かなかったことまで、次の絵の材料にできたらいいなと思います。']],
  change:[['求人票の裏面','募集要項を眺めていたら、仕事内容より帰宅時間の欄が気になりました。新しい職場を選ぶのも、今の生活を考えることなんですね。','好きなことに使える夜がどれくらいあるか、まだ計算しています。']],
  leave:[['相談の前日の机','働き方を相談するときの言葉を、もう一度並べました。会社を辞めると決めたわけではないので、何を相談したいのかから考えています。','紙の上でうまく説明できても、話すときは別かもしれません。']],
  stay:[['会社の外の時間','仕事を続けると決めたあとも、暮らしの全部を会社に預けたくはありません。帰ってから窓を開けて、何も描かずに空を見ていました。','選んだ道の途中に、小さな寄り道を作るつもりです。']]
 },
 driver:{
  talk:[['電話を切ったあとの音','妹と話せた日のことを、ときどき配送の合間に思い出します。ちゃんと通じたところもあれば、まだ言葉にならないところもあります。','最近は猫主任への報告より、自分への報告のほうが難しいです。']],
  letter:[['既読の先','送った文章をあとから読み返すと、短すぎたかなと思うことがあります。でも、あのとき書けたのはあれだけでした。','返事を待つ以外の時間もちゃんと過ごしている、と報告しておきます。']],
  pause:[['休憩の場所','妹への返事を考えるのを少し休んでいます。今日の休憩所には自販機の新しい商品が並んでいました。','問題が片づかなくても、缶コーヒーの温度はちゃんと変わりますね。']],
  avoid:[['送らない夜','家族と距離を置くことを、まだうまく説明できません。説明しないでいることにも、何かを選んでいる感じがあります。','今夜の配送は予定どおりです。道路だけは、地図のとおりに進んでほしいものです。']]
 },
 fish:{
  speak:[['話した内容の余白','自分の希望について話したあと、言い足りなかったことがノートに増えました。でも、言えたことを取り消すつもりはありません。','言葉にして初めてわかる気持ちもあるんですね。']],
  explore:[['調べるための付箋','気になる仕事について調べていたら、わからない言葉が三つ出てきました。付箋を貼ったら、ノートが少しにぎやかになりました。','知らないことが増えているのに、不思議と嫌な気分ではありません。']],
  conform:[['隣の席で違うこと','友達と同じ説明会に行くことを考えています。並んで座っても、同じ感想を持つとは限りませんよね。','それを気まずいと思わずにいられるか、ちょっと練習中です。']],
  wait:[['空白の横のメモ','希望欄はまだ空けたままですが、気になった言葉をその横に書いています。答えの代わりにはなりません。','ただ、考えていなかったわけではないと、自分に説明できそうです。']]
 },
 clock:{
  visit:[['行程表の余白','海辺の駅への道順を書いた紙を広げると、途中で寄れそうな場所がいくつか見つかりました。まだいつ出かけるかは決めていません。','準備というのは、目的地だけではできないものですね。']],
  community:[['図書室の帰り道','図書室で過ごして帰ると、家にある古い時計の音がよく聞こえます。人と話した日だからでしょうか。','昔のことを大切にするのと、今の人に会うのは、別々の予定でいいと思いました。']],
  ordinary:[['お茶が冷めるまで','朝の散歩を終えてお茶を淹れました。今日は何かを決めるためではなく、ただ湯気を眺めていました。','時計の針は進みますが、お茶は急かしてきません。']]
 },
 terminal:{
  contact:[['投函口までの距離','弟への手紙を前にすると、宛名より書き出しのほうが難しく感じます。書いたものを送るかどうかも、まだ自分で考えたいです。','封筒を持たない日にも、駅はいつもどおりそこにあります。']],
  stay:[['いつものホームの外','あの駅のことを考えながら、今日は駅前の別の店を眺めました。待つことだけで一日を説明したくない気持ちもあります。','それでも木曜日の時間は、やっぱり少し特別です。']],
  move:[['切符の入った箱','古い切符を箱に入れたまま、今日は違う道を歩きました。忘れたから道を変えたのではありません。','ときどき取り出して眺められるくらいの距離に、置いておこうと思います。']]
 }
};
function regularRoute(id,n){
 const outcome=s.lifePaths?.outcomes?.[id];const pool=REGULAR_ROUTES[id]?.[outcome?.route];
 if(!pool)return null;
 const options=n>=90?[...pool,...(REGULAR_LATE_ROUTES_486[id]?.[outcome.route]||[])]:pool;
 const ix=simHash(`reg:route:${n}:${id}:${outcome.route}`)%options.length;
 const [subject,body,ending]=options[ix];
 return {subject,body:regularFirstSentence(id,n)+'\n\n'+body+'\n\n'+ending,kind:'route',tag:`route-${outcome.route}-${ix}`};
}
// v4.4: 件名は実際の出来事の分類から選び、直近で同じ人が送った件名を避ける。
// お便り本文の事実や既存の手書きエピソードを変更しない。
const REGULAR_SUBJECTS_44={
 creative:['机に向かう時間','手元に残ったもの','昨日の作業','ふと手を止めて','小さな試み'],
 rest:['休んだ日のこと','ひと息ついた時間','静かな昨日','休憩のあいだ','昨日は少しゆっくり'],
 social:['人と話した日','会話のあとで','昨日の一言','顔を合わせた時間','短い会話のこと'],
 duty:['いつもの用事','昨日の段取り','日課の途中で','済ませたこと','用事のあった日'],
 reflection:['考えごとの続き','まだ考えていること','頭の片隅に','答えのない話','昨日考えたこと']
};
function regularSubject44(id,n,candidates,salt){
 if(!Array.isArray(candidates)||!candidates.length)return '小さな近況';
 const recent=(s.regular?.mailHistory||[]).filter(x=>x.who===id&&x.night<n&&n-x.night<=32);
 const scored=candidates.map((subject,i)=>{
  const uses=recent.filter(x=>s.regular?.letterArchive?.[`regular_${x.night}_${id}`]?.subject===subject);
  const last=uses.length?uses[uses.length-1].night:0;
  const repeat=last?(n-last<=10?120:n-last<=20?65:26):0;
  const heard=n>=150?(s.played||[]).filter(p=>p.who===id&&p.subject===subject&&n-p.night<=125):[];
  const heardPenalty=heard.length?Math.min(85,heard.length*16+(n-heard[heard.length-1].night<55?25:0)):0;
  return {subject,score:simHash(`v44:subject:${id}:${n}:${salt}:${i}`)%60-repeat-uses.length*8-heardPenalty};
 });
 scored.sort((a,b)=>b.score-a.score||a.subject.localeCompare(b.subject));
 return scored[0].subject;
}
// v4.8.6: 「昨日実際にしたこと」から始まる近況の結びを増やす。
// 新しい行動・人間関係の発生を作り出さず、本人の感想だけに限定。
const REGULAR_SUBJECTS_MORE_4914={
 creative:['机からのお便り','小さな作業のこと','手を動かした時間','昨日の小さな試み','まだ途中の作業','取りかかったこと','手を止める前に'],
 rest:['少し息をついた日','休んだ時間のこと','ひと休みの途中で','ゆっくりした昨日','落ち着いた時間','昨日の休み方','少し立ち止まって'],
 social:['昨日のやりとり','会話のそのあと','短い言葉のこと','あの人と話した日','やりとりの余韻','言葉を交わして','人に会ったあとで'],
 duty:['昨日の用事のこと','日課の小さな話','用事を済ませて','いつもの段取りから','暮らしの手順','日常の用事','日課がひとつ'],
 reflection:['考えごとの途中','昨日の小さな疑問','思い返していること','まだ考えている途中','一日の考えごと','気づいたことを少し','思い出した疑問']
};
const NEW_LIFE_SUBJECTS_4914={
 umbrella:['花屋からの近況','店で気づいたこと','花と暮らしのあいだ','最近の小さな発見','少し立ち止まる日','昨日、思ったこと'],
 triangle:['ノートの外の話','今日のちいさな発見','頭の片隅のこと','最近の疑問','まだ考えていること','答えのない観察'],
 fridge:['厨房の外の時間','昨日の小さな出来事','自分のための時間','仕事のあとにも','一日の片づけのあと','暮らしの短い報告']
};
const REGULAR_LATE_DAILY_THOUGHTS_486={
 cat:['今日のことを一枚の絵にするなら、余白がずいぶん広くなりそうです。','できたことを数えるより、そのとき何を見ていたか覚えておきたいです。','会社での私と帰宅後の私は、同じ人なのに使う言葉が少し違います。'],
 driver:['仕事の記録なら時刻が書けますが、こういう報告には時刻が必要ない気がします。','猫主任に話したら、きっと聞く前から寝ているでしょうね。','帰り道の景色は同じでも、こちらの考えごとは毎回少し違います。'],
 fish:['あとで日記を読み返したら、今の私が何を気にしていたかわかるでしょうか。','誰かに説明するには小さすぎる話ですが、今日は大切にしたいです。','昨日の私なら別の言い方をしたかもしれません。今日はこの言葉にします。'],
 clock:['時計に残せない時間のほうが、思い出すと長く感じることもあります。','あとで思い出したとき、きっと違うところが気になるのでしょう。','特別な用事のない日にも、きちんと今日という名前があるんですね。'],
 terminal:['駅の名前のように、今日の出来事にも簡単な名前を付けられたらいいのですが。','同じ道を通っても、気に留めるものは少しずつ変わっていきます。','待っていること以外の時間も、手紙に書いておきたいと思いました。'],
 bread:['焼き上がりの数字では表せないことなので、ここで報告しておきます。','店長なら別の結論を出しそうですが、私は今夜こう思いました。','同じ仕事をしていても、昨日と今日が同じ味になるとは限りませんね。'],
 moon:['地上の小さな案件としては、かなり興味深い一件でした。','月面の会議では議題に上がらないと思います。だからここに書きます。','こういう話は結論が出ないほうが、次の夜まで楽しめるかもしれません。'],
 sugar:['一杯の間に考えたことなので、明日には違う答えになっているかもしれません。','湯気が消えるまでに説明できる話だと思っていたのですが。','コーヒーに砂糖を何杯入れるかより、答えが難しいこともありますね。'],
 anon:['誰かに話してみたら、大げさなことではなくなった気もします。','日記に書くのと、ここへ送るのとでは、同じ一文でも少し違います。','聞いてほしいだけのことがあってもいい、と今夜は思いました。'],
 umbrella:['花を眺めるときのように、すぐ答えを出さずにいたい話です。','店を閉めたあとの時間に、こんなことを考える日もあります。','昨日と同じ場所にも、違う角度から光が差すのでしょうね。'],
 triangle:['ノートに丸を付けるなら、正解ではなく「要観察」のほうです。','これは将来の進路には関係ないかもしれません。でも少し面白いです。','答えを一つにする前に、もう一行だけ書き足したくなりました。'],
 fridge:['仕事なら段取りを付ける話ですが、これはもう少し考えておきます。','自分のことになると、献立表ほど簡単には決められません。','厨房を離れた私にも、書いておきたい出来事はあるんですね。']
};
function regularDayNote(id,n){
 const yesterday=regularDayAction(id,n);if(!yesterday)return null;
 const action=SIM_PROFILES[id]?.actions.find(a=>a[0]===yesterday.actionId);
 if(!action)return null;
 const dailyTitles=REGULAR_SUBJECTS_44[yesterday.category]||['小さな近況'];
 const subject=regularSubject44(id,n,n>=150?[...dailyTitles,...(REGULAR_SUBJECTS_MORE_4914[yesterday.category]||[])]:dailyTitles,`daily-${yesterday.category}`);
 // 未来を予知しない。実際の昨日の行動以外を本文に含めない。
 const narr=[
  '大きな出来事ではありませんが、昨日のことを少し書いておきたくなりました。',
  'いつもの生活の途中にも、忘れたくない時間があるものですね。',
  '誰かに相談するほどでもないけれど、話してみたかったことです。'
 ];
 const personalThought={
  cat:['人に説明するほどの話じゃないかもしれません。でも、なぜか描いておきたい一日です。','帰り道でその場面を思い返して、少し立ち止まりました。'],
  driver:['現場からは以上です。主任が起きていたら報告します。','夜勤明けにはどうでもよくなるかもしれませんが、今は気になります。'],
  fish:['これが正しい考えかはわからないけれど、いまの気持ちを書いておきます。','日記にも書いたのですが、別の人の声も聞いてみたくなりました。'],
  clock:['こうした出来事が、最近はかえって心に残ります。','昔なら聞き流していたかもしれません。'],
  terminal:['理由はわかりませんが、その景色を覚えています。','何も変わらなかったようで、少し違う日でした。'],
  bread:['粉まみれの手でメモした話なので、字が読めていればいいのですが。','店長には話していないので、ここで書いておきます。'],
  umbrella:['花を片づけながら、まだ少し考えていました。','店の外での自分の時間も、忘れずにいたいです。'],
  triangle:['たぶん明日は別のことを考えていると思います。','ノートに書いても整理できなかったので、送ってみました。'],
  fridge:['自分の夕飯のことも考えたくなる日でした。','包丁を置いたあとに考えることもあるんですね。'],
  moon:['これは月の議事録には載らないような、小さな話です。','地上の昨日も、なかなか捨てたものではありません。'],
  sugar:['こうして書くと、昨日のことをもう一度眺められますね。','大事件ではないけれど、今夜はこの話にします。'],
  anon:['小さなことですが、書くと少し輪郭が見えてきます。','名前を付けるほどでもない一日を、少し残しておきます。']
 };
 const thoughts=n>=90?[...(personalThought[id]||narr),...(REGULAR_LATE_DAILY_THOUGHTS_486[id]||[])]:personalThought[id]||narr;
 return {subject,kind:'daily',tag:`daily-${yesterday.actionId}`,body:regularFirstSentence(id,n)+'\n\n'+letterPoliteActivity491(yesterday.activity)+'。'+'\n\n'+thoughts[simHash(`reg:thought:${n}:${id}`)%thoughts.length]};
}
// v4.5: 交流の「感触」は同じでも、後味をどう言葉にするかは人によって異なる。
const CONTACT_VOICES_45={
 cat:{warm:'話し終えてから、相手の顔が少し違って見えました。自分がちゃんと話せたからかもしれません。',ordinary:'ありふれたやり取りでしたが、描こうとすると難しい表情が一つありました。',guarded:'伝える順番を考えているうちに、口にできないまま終わりました。まだ下書きの途中です。',awkward:'あとになって、別の言い方ならよかったかもしれないと思いました。消しゴムが使えない会話でした。'},
 driver:{warm:'帰りの車で一人になってから、あの会話を少し笑って思い出しました。こういう日もあります。',ordinary:'いつもの話です。仕事の段取りみたいに、何も引っかからないのがありがたいときもあります。',guarded:'言いたいことはあったんですが、タイミングを逃しました。荷物と違って、言葉はあとから届けづらいです。',awkward:'妙な間ができました。ルートの変更なら慣れてますが、会話のやり直しは苦手です。'},
 fish:{warm:'自分の言葉を聞いてもらえた気がしました。でも、あとから「変じゃなかったかな」と考えてしまいます。',ordinary:'相手はいつもどおりでした。私は何を返したか思い出して、少しずつ落ち着いています。',guarded:'話そうと思っていたことが、口の手前で止まりました。日記には書けるのに不思議です。',awkward:'笑って終わらせたあと、どうして笑ったんだろうと考えました。うまく言えない夜です。'},
 clock:{warm:'よい会話でした。昔ならその場で終えていたのに、帰ってから茶を淹れながらもう一度味わいました。',ordinary:'短い挨拶でした。それでも、いつもの場所で声をかけ合えることは悪くありません。',guarded:'言いそびれたことがあります。長く生きても、間の取り方は簡単になりませんね。',awkward:'話が途切れました。無理につなぎ直さず、少し時間をおくのも一つの方法でしょう。'},
 terminal:{warm:'別れ際の声を、あとになって思い出しました。それだけです。',ordinary:'いつもと同じ言葉でした。変わらないことを確かめたような気がします。',guarded:'返事を考えているあいだに、話は終わっていました。言葉だけ、まだそこにあります。',awkward:'帰り道がいつもより長く感じました。時計は変わっていなかったと思います。'},
 bread:{warm:'帰ってからも口元がゆるんでいました。焼き上がりを待つより、あっという間の会話でした。',ordinary:'いつものやり取りです。売り場の札みたいに、目立たないけれど必要な言葉でした。',guarded:'言いたかったことを一つ残しました。パンの焼き直しと違って、会話は次の機会を待つしかないですね。',awkward:'気まずくなりました。失敗した生地ならこね直せますが、言葉は難しいです。'},
 moon:{warm:'地球での交流実験は良好、という報告ができそうです。月の委員会にも胸を張れます。',ordinary:'平常運転の会話でした。異常なし、と議事録に書く日があってもいいですよね。',guarded:'発言を保留にしたまま閉会しました。次回の会議には持ち越したいところです。',awkward:'会議が予期せぬ方向へ進みました。月なら無重力で逃げられそうですが、ここは地球です。'},
 sugar:{warm:'短い会話のあと、コーヒーが少し甘く感じました。砂糖の量は変えていないんですけどね。',ordinary:'いつもと同じやり取りでした。湯気の形みたいに、少しずつ違うところもあった気がします。',guarded:'口に出さなかった言葉が、飲み終えたカップの底みたいに残っています。',awkward:'変な沈黙がありました。慌てて埋めるより、そのまま帰りました。'},
 anon:{warm:'少し長く話してしまいました。部屋へ戻ってから、そのことに気づきました。',ordinary:'挨拶をして、廊下を通りました。何も変わらないと思っていた一日の、小さな部分です。',guarded:'言おうとした言葉を、まだ机のメモに残しています。相手には届いていません。',awkward:'扉の向こうへ戻ってから、返事の続きを考えました。言わなかった部分もあります。'},
 umbrella:{warm:'話したあとは、花を並べる手つきまで少し軽くなりました。店の景色は同じなのに。',ordinary:'いつもの会話でした。花瓶の水のように、毎日替わっても目立たないものがありますね。',guarded:'言いかけたことを飲み込みました。つぼみを急いで開かせるわけにもいきません。',awkward:'店先の空気が少し固くなりました。花には関係のない話ですが、帰ってから気になっています。'},
 triangle:{warm:'会話のあとでノートの隅に星印を付けました。なかなか良い発見だったので。',ordinary:'特別な話じゃなかったです。でも、同じ質問に答える人がいるのは面白いですね。',guarded:'説明の途中で式が足りなくなったような気分です。言葉にも補助線が必要ですね。',awkward:'途中で意見が食い違いました。ノートなら消せますが、会話の答案には消しゴムがありません。'},
 fridge:{warm:'話がうまく進みました。厨房で段取りが合ったときみたいに、少し安心しました。',ordinary:'いつもの連絡でした。大事なことほど、手短に済む日もあります。',guarded:'伝えそびれました。仕事なら先に確認することなのに、自分のことになると後回しです。',awkward:'言葉の順番を間違えたようです。料理なら盛り直せるんですが。'}
};
// 放送を聴いてからの手紙も、誰にでも同じ結論を付けない。
const BROADCAST_VOICES_45={
 cat:['あの人の言葉を思い出して、帰り道の景色をもう一度見たくなりました。','何となく線を引いてみたくなりました。人の話から始まる絵もあるんでしょうね。'],
 driver:['荷物を積んだまま、別の誰かの夜について考えていました。運転中はちゃんと道を見ています。','夜の休憩で思い出しました。同じ時間に起きている人がいるのは、少し心強いです。'],
 fish:['自分だったら何と言うか考えて、日記の欄が少し空きました。','相手のことをよく知らないから、簡単にわかったとは言えません。それでも気になりました。'],
 clock:['人の声というのは、思いがけず昔の景色を連れてくるものですね。','茶を淹れてから、あの言葉をもう一度思い返しました。答えは特にありません。'],
 terminal:['降りる駅まで、あの言葉を覚えていました。','知らない人の話でした。なのに、帰りのホームでふと思い出しました。'],
 bread:['閉店後、店の灯りを落としたときに思い出しました。粉とは関係のない話です。','仕込みの合間に頭をよぎりました。言葉にも発酵する時間があるんでしょうか。'],
 moon:['月の議事録に載せるなら、きっと「地球人の重要発言」です。','地上の誰かの声が月まで届いた気がしました。これは個人的な観測報告です。'],
 sugar:['カップを持ち上げる手を止めて、あの話を思い返しました。','いつものコーヒーなのに、昨夜の言葉を思い出すと少し味が変わる気がします。'],
 anon:['本を閉じたあと、あの声のことを考えました。','部屋で聴いただけなのに、知らない人の一日が少し残っています。'],
 umbrella:['水替えの途中で思い出しました。人の言葉にも花のように残る色があるんでしょうか。','店先に立ちながら、あの人も別の場所で朝を迎えたのだと思いました。'],
 triangle:['ノートに書くと長くなるので、一行だけ印をつけておきました。','あの話を聞いて、また一つ疑問が増えました。そういうのは嫌いじゃないです。'],
 fridge:['厨房を片づけてから思い出しました。自分の夜のことも少し考えました。','仕事の話ではなかったのに、なぜか料理の手を止めたときに思い浮かびました。']
};

function regularContact(id,n){
 const person=s.simState?.people?.[id];if(!person)return null;
 const entries=Object.entries(person.relationships||{}).flatMap(([key,r])=>(r.history||[])
   .filter(h=>h.night===n-1&&h.outcome)
   .map(h=>({key,rel:r,h})));
 if(!entries.length)return null;
 const picked=entries[simHash(`reg:contact:${id}:${n}`)%entries.length];
 const outcome=picked.h.outcome;
 // 猫主任は実際には猫。人間同士の会話や返事をしたことにしない。
 if(id==='driver'&&picked.key==='catBoss'){
  const subject=regularSubject44(id,n,['主任のそばで','猫主任の休憩','無言の監査','主任との距離'],'contact-catBoss');
  const endings=['今の距離が、ちょうどいいのかもしれません。','主任には言葉がなくても、報告した気分になります。','猫主任の承認は、今日もたぶん無言です。'];
  const ending=endings[simHash(`v44:chief:ending:${n}`)%endings.length];
  return {subject,kind:'contact',tag:`contact-${picked.key}-${outcome}`,
   body:regularFirstSentence(id,n)+'\n\n昨日、駐車場で猫主任の近くに座りました。本人が何を考えているのかはわかりませんが、しばらく同じ場所にいました。\n\n'+ending};
 }
 const variant={
  warm:'思っていたより自然に話せました。話し終えたあとも、その言葉が少し残っています。',
  ordinary:'いつもどおりの会話でした。でも、その「いつも」が今日は少しありがたかったです。',
  guarded:'話してから、まだ言えていないことがあると気づきました。次に言えるかはわかりません。',
  awkward:'気まずいまま別れました。話す前より気になることが増えた気もします。'
 };
 const msg=CONTACT_VOICES_45[id]?.[outcome]||variant[outcome]||'短い会話でしたが、帰宅してから思い出しました。';
 const titles={
  warm:['帰り道に残った声','話せた日のこと','いつもと少し違う会話','話し終えたあと'],
  ordinary:['いつもの会話','帰ってから思ったこと','昨日の挨拶','当たり前の時間'],
  guarded:['言い残したこと','まだ話していないこと','言葉の途中で','短い返事のあと'],
  awkward:['少し気まずい帰り道','会話のあとで','うまく話せなかった日','残った言葉']
 };
 const closings={
  warm:['また話すときには、今日のことも少し思い出すかもしれません。','あの短いやり取りを、帰ってからもう一度考えました。','少しだけ、次に話すときのことが楽しみです。'],
  ordinary:['変わった話ではないのに、書きたくなりました。','こういう普通の会話も、あとで思い返すものですね。','何も決めなかったけれど、それでいいような気がします。'],
  guarded:['今は、まだ言葉を探しているところです。','言わなかったことにも、少し時間が必要かもしれません。','次に会うまでに、もう少し整理してみます。'],
  awkward:['あの場では言えなかったことを、こうして書いています。','次に会ったとき、普通に挨拶できたらいいのですが。','気まずい会話も、一日が終わると別の顔になりますね。']
 };
 const choices=titles[outcome]||['話したあとのこと'];
 const subject=regularSubject44(id,n,choices,`contact-${outcome}-${picked.key}`);
 const end=closings[outcome]||closings.ordinary;
 const closing=simHash(`v45:contact:closing:${id}:${n}:${picked.key}`)%3===0?end[simHash(`v44:contact:ending:${id}:${n}:${picked.key}`)%end.length]:'';
 return {subject,kind:'contact',tag:`contact-${picked.key}-${outcome}`,body:regularFirstSentence(id,n)+'\n\n昨日、'+picked.rel.name+'と話しました。'+msg+(closing?'\n\n'+closing:'')};
}
// v4.4: 放送で実際に聴いたお便りだけを起点にしつつ、反応が一種類に偏らないようにする。
// v4.9.3: 放送を聴いた感想の件名にも、書き手の観察眼を反映する。
// 内容にない出来事（具体的な仕事や行動）を件名で断定しない。
const BROADCAST_SUBJECT_VOICE_493={
 cat:['誰かの言葉の輪郭','帰り道に残った声','声を聞いてから','まだ描いていない話'],
 clock:['あの夜の声のこと','長く残った言葉','放送の余韻','思いがけない一言'],
 bread:['仕込みに関係ない声','焼き上がりとは別の話','店の外の誰かの話','声にも余熱がある'],
 moon:['月面からの聴取報告','地球の声、ひとつ','月の議事録にはない話','観測報告・昨夜の声'],
 driver:['休憩中に残った声','配送とは別の報告','昨日の放送の件','夜道のラジオから'],
 fish:['ノートに残しておきたい声','放送のあとに考えたこと','まだ言葉にならない感想','昨日聴いた話について'],
 sugar:['一杯のあいだに残った声','昨夜の言葉の後味','湯気の向こうの話','コーヒーと放送のあいだ'],
 anon:['聴いたままの言葉','名前のない感想','部屋に残った声','昨日の放送を思い出して'],
 terminal:['駅の外から届いた声','知らない誰かの駅','まだ残っている一言','短い放送の記憶'],
 umbrella:['花屋の外から届いた声','言葉の色について','店を閉めたあとの感想','放送のあとで思ったこと'],
 triangle:['ノートの端の聴取メモ','昨日の声を考える','答えのない感想','気になる一言に印を'],
 fridge:['厨房の外の話','昨日の声と今日の私','仕込みとは別の考え事','仕事とは別の余韻']
};
function regularBroadcastEcho(id,n){
 if(!(s.radioCulture?.audience?.[n-1]||[]).includes(id))return null;
 const heard=s.played.filter(x=>x.night===n-1);
 if(!heard.length)return null;
 const item=heard[simHash(`reg:heard:${id}:${n}`)%heard.length];
 const self=item.who===id;
 if(self){
  const lines=[
   '答えが出たわけではありませんが、言葉にしてみたら、昨日とは少し違う朝でした。',
   '自分の声がラジオから聞こえると、書いたときとは少し違って感じますね。',
   '読んでもらったあとも、いつもどおりの一日が始まりました。'
  ];
  return {subject:regularSubject44(id,n,['昨日の放送から','自分の手紙のこと','声に出された言葉'],'broadcast-self'),kind:'broadcast',tag:'echo-self',broadcastSource4931:{sourceId:item.id,sourceNight:item.night,sourceWho:item.who},body:regularFirstSentence(id,n)+'\n\n昨日、自分のお便りを放送で読んでもらいました。\n\n'+lines[simHash(`v44:broadcast:self:${id}:${n}`)%lines.length]};
 }
 const observations=[
  '話したことのない人の話なのに、自分の一日を少し思い出しました。',
  'どんな人かはよく知りません。それでも、昨日の言葉がふと戻ってきます。',
  '声だけを知っている相手にも、それぞれの昨日があるんですね。',
  '同じ時間に別の場所で過ごしていた人の話を、今朝になって考えました。'
 ];
 const personalized=BROADCAST_VOICES_45[id]||observations;
 const ending=personalized[simHash(`v45:broadcast:other:${id}:${n}:${item.id}`)%personalized.length];
 return {subject:regularSubject44(id,n,BROADCAST_SUBJECT_VOICE_493[id]||['聴いた手紙のこと'],'broadcast-other'),kind:'broadcast',tag:`echo-${item.who}`,broadcastSource4931:{sourceId:item.id,sourceNight:item.night,sourceWho:item.who},
  body:regularFirstSentence(id,n)+'\n\n昨日、'+(NAMES[item.who]||'あるリスナー')+'さんの「'+item.subject+'」というお便りを放送で聴きました。\n\n'+ending};
}
// v4.4: 番組テーマと無関係な昨日の行動を、無理に結びつけない。
function regularThemeAction44(theme,action){
 if(!action?.activity)return false;
 const a=String(action.activity),k=action.category;
 if(theme==='帰り道'||theme==='遠回り')return /帰|道|歩|散歩|駅|寄/.test(a);
 if(theme==='ちいさな達成')return /描|書|仕上|作|整|直|片付|覚|工夫|仕入/.test(a);
 if(theme==='忘れもの')return /古い|写真|切符|メモ|思い出|忘|探|引き出し/.test(a);
 if(theme==='雨の匂い')return /雨|天気|空|雲|花|市場|散歩|外/.test(a);
 if(theme==='ひとりの時間')return ['rest','reflection'].includes(k)&&!/友|家族|同僚|人と|隣人/.test(a);
 if(theme==='誰かの言葉')return k==='social';
 if(theme==='夜食の話')return /飲|食|パン|料理|冷蔵庫|コーヒー|プリン|茶|おにぎり|味|厨房/.test(a);
 if(theme==='まだ途中')return ['creative','reflection'].includes(k)&&!/完成|終え|終わ|済ませ/.test(a);
 if(theme==='窓の明かり')return /窓|灯|夜|帰|月|空|部屋/.test(a);
 if(theme==='最近の習慣')return true;
 return false;
}
// v4.5 — 12人が同じテーマについて書いても、本文の中心から書き手が伝わる。
// REGULAR_THEMES の順序: 帰り道、達成、忘れもの、雨、ひとり、言葉、夜食、途中、窓、習慣、遠回り、明日。
// 特定の過去イベントを既成事実にせず、その人らしい観察だけを書く。
const REGULAR_THEME_VOICES_45={
 cat:[
 '帰り道の看板を眺めていると、色の名前を忘れた場所ほど覚えていることがあります。描くなら、まずそこからかもしれません。',
 '誰にも見せない線を一本引けた日も、私にとっては小さな達成です。仕事の成果とは比べないでおきたいです。',
 '使いかけの鉛筆を見ると、何を描こうとしていたのかまで思い出します。思い出せない線もあります。',
 '雨の日は景色の輪郭が曖昧になります。描こうとすると難しいのに、見ているだけなら少し落ち着くんです。',
 '予定のない時間を持て余すことがあります。空白の紙を前にしたときに、少し似ています。',
 '「無理しなくていい」という言葉を、仕事の続きを考えながら聞くと、どう受け取ればいいのかわからなくなります。',
 '食べ終えた皿に残る色が、思いがけずきれいなことがあります。料理の味とは別の感想です。',
 '描きかけのものには、直したいところと残しておきたいところが同居します。どちらを選ぶかまだ考えています。',
 '部屋の窓を遠くから見ると、暮らしている人の一日まで想像してしまいます。自分の窓もそんなふうに見えるのでしょうか。',
 '机に向かうまでが、いちばん時間のかかる作業です。それでも椅子に座った日は、そのことを覚えておきたいです。',
 '目的地を決めずに曲がった道で、思いがけない色を見つけることがあります。遠回りにも、持ち帰れるものがあるんですね。',
 '明日できることを一つだけ挙げるなら、まだ描いたことのない形を探すことです。大きな決意にはしないでおきます。'
 ],
 driver:[
 '夜道は似ているようで、街灯の間隔が少しずつ違います。ちゃんと帰ってこられた日は、その違いも覚えています。',
 '荷物を予定どおり渡せた日は、派手な拍手なんてありません。まあ、無事に終わるのが一番の成果ですね。',
 '手袋を片方見失うと、車内が急に広く感じます。探している間だけですけど。主任なら最初から手袋をしません。',
 '濡れた道路は光を倍に見せます。きれいだなと思うのと、運転に気をつけるのは、別々にやっています。',
 'エンジンを止めたあとの静けさは、わりと好きです。何も考えずに缶を握っている時間も仕事の続きでしょうか。',
 '「気をつけて」は、毎日のように聞きます。でも慣れて無視していい言葉ではないんですよね。',
 '夜の休憩で食べるおにぎりは、具より時間帯で味が変わります。空腹のほうは毎回かなり正直です。',
 '道を覚えるのにも、何度か間違えそうになる時間が必要でした。まだ途中の仕事を急かしても、荷物が早く着くわけじゃないですし。',
 '配送先の窓に灯りがついていると、誰かはまだ起きているんだなと思います。こっちも勤務中です。',
 'いつもの自販機で迷わずボタンを押せることが、案外ありがたいんです。配置換えだけは事前通知してほしいですね。',
 '一本違う道に入ると景色が変わります。配達中にはできませんが、休みの日なら試してみたいです。',
 '明日は信号を全部青で抜けたい、とは言いません。安全に戻ってきて、温かいものを飲めれば十分です。'
 ],
 fish:[
 '帰り道で寄りたい店を見つけても、誰かと一緒なら相手に合わせてしまいます。一人の帰り道は、練習みたいです。',
 '今日は自分で選べた、と思うことがたまにあります。誰にもわからないほど小さい選択でも、私には残ります。',
 '昔のノートを開くと、消した言葉の跡が見えます。書かなかった気持ちまで、そこに残っているみたいです。',
 '雨の日に傘を持って出るか迷うのは、自分だけで決められることです。それでも天気予報を何回も見てしまいます。',
 '一人でいると、誰かの表情を読み取ろうとしなくていいんです。その安心に、少し戸惑う日もあります。',
 '優しい言葉でも、すぐ「はい」と答えるのが癖になっています。聞いてから少し考える時間があってもいいのでしょうか。',
 'メニューを選ぶだけなのに、人の注文を聞いてから決めたくなります。今日は先に考えてみようと思います。',
 '日記に途中まで書いて、結論のところで止まることがあります。まだわからない、と書くのも一つの文章でしょうか。',
 '窓の向こうの部屋には、知らない選択が積もっているのでしょうね。私にも、自分で決めることが少しずつ増えています。',
 '「どう思う？」と聞かれたとき、すぐ答えなくてもいいと覚えておきたいです。まだうまくはできません。',
 '遠回りを選んだ理由を聞かれたら、なんとなく、と答えたいです。理由がない選択にも慣れてみたいです。',
 '明日は自分が食べたいものを先に決めてみます。大きな目標より、そのくらいのほうが今は似合います。'
 ],
 clock:[
 '同じ道でも、年によって木の影が違います。散歩の足はゆっくりになりましたが、見つけるものは減りません。',
 '時計がまた動き始めたときの喜びは、今でも覚えています。小さな直し物でも、直ったという事実は立派です。',
 '古い道具を探していて、探す理由を忘れることがあります。手にしたときの感触だけが、先に戻ってきます。',
 '雨が軒先を打つ音を聞くと、時計の音が少し遠くなります。どちらも、急いではいないようです。',
 '一人で茶を淹れるときは、誰かの分まで用意することはありません。それでも湯気を眺める時間は好きです。',
 '「また今度」という言葉は、昔と今で少し重さが違います。だからといって、急いですべてを済ませようとは思いません。',
 'お茶のお供がなくても、ゆっくり飲めば十分なことがあります。あれこれ用意した日を懐かしむこともあります。',
 '修理の途中で手を止めると、どこまで進んだかわかります。人生の途中にも、そういう印があればよいのですが。',
 '遠くの家の灯りを見ていると、時刻より人の暮らしを想像します。時計を直していたころには、あまりしなかったことです。',
 '散歩の時間を少し変えるだけで、会う人が違います。日課というのは、案外融通の利くものですね。',
 '帰り道を変えると、初めて見る花に出会うことがあります。長く暮らした町でも知らない角が残っています。',
 '明日は茶葉を少し変えてみようかと思っています。気に入らなければ、いつもの味に戻ればよいのです。'
 ],
 terminal:[
 '帰る途中に降りる駅の名前を、声に出さず数えることがあります。いつもの駅にも、知らない時間があります。',
 '今日は何もしなかったと思う日にも、ちゃんと家に帰っています。それを達成と呼ぶのかは、まだ決めていません。',
 '切符の端の折り目を見て、いつのものだったか考えました。日付より先に、風の音を思い出します。',
 '雨のホームでは、傘を閉じる音が重なります。誰かの話し声より、そちらを覚えている夜があります。',
 '一人で座るベンチにも、昼間には誰かがいたのでしょう。空いている席は、ずっと空いていた席ではありません。',
 '昔交わした短い言葉が、長い時間を持つことがあります。忘れたわけではありません。',
 '帰りに買ったものの袋を持って、しばらくホームに立っていました。食べ物の温かさだけが確かでした。',
 '待つことと、立ち止まることは同じではないのでしょう。私にはまだ、その違いがよくわかりません。',
 '電車の窓に映る灯りを見ていると、外にいるのか中にいるのかわからなくなることがあります。',
 '木曜日でない日にも、時計を見る癖は残っています。癖をなくしたいのかは、わかりません。',
 '一本遅い電車に乗ると、見える顔が変わります。違う夜にいるようで、やはり同じ町です。',
 '明日のことを決めずに眠る夜があります。それでも朝の電車は、いつもどおりに来るのでしょう。'
 ],
 bread:[
 '帰り道の店先の匂いで、どんなものが焼けたかわかる日があります。仕事を離れても鼻だけは残業です。',
 'パンが予定どおり膨らむと、言葉にしない拍手をします。まあ、次の天板が来るまでの数秒ですが。',
 '古いレシピの端に書いた数字が読めず、昔の自分を問い詰めたくなることがあります。筆圧だけは元気です。',
 '雨の日の生地は、こちらの予定を聞いてくれません。湿気にも都合があるんでしょうが、相談窓口がほしいです。',
 '店を閉めたあと、一人で小さなパンを食べる時間があります。味を評価する仕事から少し離れる時間です。',
 '「また来ます」と言われると、つい次の品を考えます。約束ではないのに、少し嬉しい言葉ですね。',
 '売れ残ったパンを味見すると、朝よりよいと思うことがあります。空腹という審査員には、少し甘いところがあります。',
 '試作品はだいたい、名前が決まる前に食べ終わります。途中でなくなったものほど、惜しく感じるんですよね。',
 '閉店後の窓から見える灯りを見ると、誰かもまだ仕事中なのかなと思います。朝型の商売の夜は意外と長いです。',
 '粉を量る手つきだけは、眠くても覚えています。それを才能と言うには、毎日の繰り返しが多すぎます。',
 '違う店の前を通ると、つい焼き色を見てしまいます。休日でも職業がついてくるのは少し困りますね。',
 '明日は新しい名前を一つ考えようと思います。パンの中身が先か名前が先かは、まだ会議中です。'
 ],
 moon:[
 '帰り道の月を見上げるたび、月面交通課の終業時刻が気になります。地球側の信号には詳しくなさそうです。',
 '今日は忘れ物をせずに済みました。月の監査局なら表彰状が出るでしょうが、地上では普通のことらしいです。',
 'なくしたものが月に集まるという仮説を立てました。靴下が片方だけ消える理由も、これなら説明できそうです。',
 '雨の日は月の窓口が閉まっているのでしょう。職員の皆さんには有給休暇を取ってほしいです。',
 '一人でいると、議長も議事録係も自分です。満場一致のはずが、なぜか会議は長引きます。',
 '「おつかれさま」は、月の裏側にも配達したい言葉です。宛先不明で戻ってきても、地球で受け取ります。',
 '夜食のプリンに名前を書こうか迷いました。宇宙条約ではどう扱うんでしょう。まず冷蔵庫内の協定が必要です。',
 '月面都市計画はまだ下書きです。途中の案のほうが面白くて、完成すると少しさびしい気がします。',
 '窓の灯りが並ぶと、小さな星図に見えます。あの中には、それぞれの生活担当大臣がいるのでしょう。',
 '毎晩同じ時間に空を見るのは、月への定時連絡のつもりです。返事はだいたい雲に預けられます。',
 '遠回りして月がよく見える道を探しました。地上の歩道にも、宇宙への観測地点があるようです。',
 '明日は月の食堂の献立を考えようと思います。重力が違うと、汁物は難しそうですね。'
 ],
 sugar:[
 '帰り道に見かける花の色が、昨日と違って見える日があります。光のせいか、自分の気分のせいか、決めずにいます。',
 'コーヒーをこぼさずに机まで運べたら、それだけで少し嬉しい朝があります。小さなことは数えても減りません。',
 '本の間から紙切れが出てきて、いつ挟んだのか思い出せないことがあります。栞にも、その時々の役目がありますね。',
 '雨の日は湯気の向こうの窓がよく見えません。でも、見えない景色にも色は残っている気がします。',
 '一人で飲むコーヒーは、誰にも砂糖の量を聞かれません。その自由が、わりと好きです。',
 '何気ない一言が、飲み物の温度みたいに少しずつ変わることがあります。冷めても、なくなるわけではないんですね。',
 'いつもの飲み物を、いつもと違う時間に飲むと味が変わります。カップの中には時計がないのに不思議です。',
 '読みかけの本を閉じると、しおりが途中だと教えてくれます。読み終えていない時間も、読書の一部ですね。',
 '窓の灯りを眺めているうちに、コーヒーが冷めました。急いで飲み直すこともないので、そのままにしました。',
 '砂糖を入れる順番を変えても、三杯は三杯です。でも、混ぜている時間の気分は少し変わります。',
 '遠回りの途中で見つけた店を、次も訪れるとは限りません。見つけたことだけ、覚えておきたいです。',
 '明日の一杯も、たぶん同じ味にします。変えないことを自分で選べるのも、悪くありませんね。'
 ],
 anon:[
 '帰り道、足音だけがよく聞こえました。誰かに説明したいほどではないけれど、こうして書いています。',
 '机の上の紙を一枚片づけました。達成というには小さいのですが、机の色が少し見えるようになりました。',
 '本の間から見つけた古いメモを、また挟み直しました。内容より、その紙を取っておいたことが気になっています。',
 '雨の音がして、窓を開けるか迷いました。開けずに聞いている時間のほうが長かったです。',
 '一人の部屋には、誰にも聞かれなかった独り言も残るのでしょうか。今夜は少し静かです。',
 '言われた言葉より、返さなかった言葉を覚えていることがあります。送り先のない返事もあるのでしょう。',
 '食事のあと、皿をしばらく置いたままにしました。片づける前の台所にも、暮らしの気配が残ります。',
 '途中まで読んだ本を閉じました。最後のページを知らないまま持っている本が、今はあります。',
 '向かいの建物の灯りが消えるまで、本を開いたまま座っていました。何かを待っていたわけではありません。',
 '寝る前に机の上を一度見渡します。変わったものがなくても、確かめるという習慣だけ残っています。',
 'いつもと違う階段を使ったら、知らない音がしました。建物は同じなのに、少し遠い場所へ来た気分です。',
 '明日は手元のメモを一枚だけ書き換えるかもしれません。まだ、消す言葉を決めていません。'
 ],
 umbrella:[
 '花屋からの帰り道は、花のない店先にも目が行きます。みんな、それぞれの店じまいをしているんですね。',
 '鉢の向きを少し直して、日が当たる場所を作りました。誰も気づかなくても、それで十分嬉しい仕事です。',
 '花の名前は覚えられても、去年の仕入れメモはよく探します。文字より色のほうが、記憶に残るようです。',
 '雨の朝は花の色が少し濃く見えます。店先に出す時間を迷いながら、天気と相談している気分です。',
 '閉店後に一人で花を眺めると、商品ではない顔に見えるときがあります。見すぎでしょうか。',
 '「この花が好き」と言うお客さんの声を、後から思い出すことがあります。売れた数とは別の記憶です。',
 '夕食の前に、店で手を洗ったときの花の匂いが残っていました。仕事の帰り道にも、お土産があるんですね。',
 '咲きかけの鉢を店先に置くか、もう少し待つか迷っています。花のほうは、こちらの予定を知りません。',
 '向かいの店に灯りがつくと、そろそろ片づけの時間だとわかります。時計とは違う合図です。',
 '店に入ると、まず水の様子を見ます。毎日同じことをしていても、花の表情は少しずつ違います。',
 '少し離れた市場へ行く道には、いつもと違う植え込みがあります。仕入れの帰りに見てしまいます。',
 '明日は花瓶を一つだけ置き換えようと思います。それだけで店の景色が変わることがあります。'
 ],
 triangle:[
 '帰り道の曲がり角を、ノートの地図に描き足したくなることがあります。実在の街なら、道幅まで測らないと怒られそうです。',
 'ノートに引いた線がうまくつながりました。将来の役に立つかは未定ですが、今日の成果として記録します。',
 '消しゴムで消した建物の跡が、地図に残っています。空き地という設定にすれば、失敗ではない気がします。',
 '雨の日に傘の列を眺めると、歩道の幅が気になります。こういうことを考えるから、ノートが埋まるんでしょうね。',
 '一人で地図を描くと、街の条例も全部自分で決められます。住民から苦情が来ないのだけは助かります。',
 '友達に「それ何？」と聞かれて、説明している間に新しい道が増えたことがあります。質問には設計力があるらしいです。',
 'お弁当の仕切りは、見方を変えると小さな街区です。食べ終えたら都市が消えるのが難点です。',
 '地図の端がまだ白いままです。埋める案はいくつもあるんですが、決めない区域も必要だと思います。',
 '夕方の窓を並べて描くと、一つずつ高さが違います。現実の街は定規どおりにできていませんね。',
 '学校のあと、ノートの余白を探すのが習慣になっています。本来のノートの用途については検討中です。',
 '遠回りした道を地図に追加すると、前からある道まで違って見えます。ルートは一つではないんですね。',
 '明日は新しい駅を一つ描き足す予定です。駅名が決まらない場合は、仮称のまま開業します。'
 ],
 fridge:[
 '帰り道に開いている店を見ると、つい厨房の片づけを想像します。仕事から離れたつもりでも、目だけ働いています。',
 '自分のために皿を一枚出せたら、小さな達成です。お客様には出せませんが、採点も必要ありません。',
 '昔のレシピを読み返すと、分量より余白の書き込みに目が行きます。忙しかった日の字は、案外わかりやすいです。',
 '雨の夜は、店を閉めたあとの湿った空気を思い出します。火を消しても、厨房にはしばらく温度が残ります。',
 '自分の食事に手をかけない日は、たいてい誰かの皿に手をかけた日です。だからといって、いつもそれでいいとは思いません。',
 '「ちゃんと食べた？」と聞かれると、料理人でも少し返事に詰まります。作った料理の数では答えになりません。',
 '夜食は手早く食べられるものを選びがちです。味わう時間がないのではなく、今日は休みたいんです。',
 '下ごしらえの途中なら、次にすることはわかります。自分の暮らしの途中には、レシピがないみたいです。',
 '帰りの電車から見える明かりの中には、食事を終えた台所もあるのでしょう。今日は自分の家の灯りが恋しいです。',
 '包丁を置く前に作業台を拭く癖が、家でも出るときがあります。休みの日には少し順番を変えたいです。',
 '遠回りして食材を眺めても、結局何も買わずに帰る日があります。作らない夜も、献立の一つかもしれません。',
 '明日は、自分の皿に何をのせるか先に考えてみます。残業より難しい課題にならなければいいのですが。'
 ]
};
// 役割の説明を繰り返す代わりに、ラジオの向こうの言葉を各自の暮らし方で受け止める。
const RADIO_CULTURE_AFTERTHOUGHTS_45={
 cat:['人の話を聴いてから、自分の中にある言葉の形を確かめたくなりました。','文字にしてみると、聞いていたときとは違う輪郭が見える気がします。'],
 driver:['夜道では誰かの話を思い出すことがあります。荷物を積んだだけでは運べないものもあるんですね。','休憩中に思い出して、缶を置いてから書きました。変な時間の報告書です。'],
 fish:['私ならどう感じるだろう、と日記の余白に書いてみました。まだ答えは空白です。','自分の話ではないのに、どこか自分にも関わるような気がしました。'],
 clock:['こうして夜ごとに違う声を聴けるのは、なかなかよいものですね。','お茶を淹れ直してから、もう一度その言葉を考えました。'],
 terminal:['次の駅までの間に、短い言葉を思い返しました。','関係のない話のはずなのに、帰り道まで残りました。'],
 bread:['仕込みの手を止めて、少し考えました。粉の付いたメモに書くにはもったいない話でした。','あの話、店のレジを閉めてからもう一度思い出したんです。'],
 moon:['月面会議では保留になるでしょうが、私は気になりました。','これは議事録ではなく、個人的な感想として送ります。'],
 sugar:['カップを持ち上げたあとも、言葉だけが机に残る感じがしました。','コーヒーを飲みながら考えましたが、甘さの問題ではなさそうです。'],
 anon:['自分の部屋で聞いた言葉を、ここへ送るのは少し不思議です。','読んでいた本を閉じても、あの言葉はまだ耳に残っています。'],
 umbrella:['花を並べる手が止まるような話でした。今も少し気になっています。','店先の花を見ながら、あの言葉を別の角度から考えました。'],
 triangle:['ノートの端に小さく「要検討」と書いておきました。','聞いた瞬間には納得したのに、翌日には質問が一つ増えていました。'],
 fridge:['片づけの途中で、ふと思い出しました。料理とは違う話ですが、残ったものがあります。','包丁を置いてから考えました。正解を急ぐ話ではなかったですね。']
};

function regularThemeLetter(id,n){
 const theme=regularTheme(n),index=(n-15)%REGULAR_THEMES.length,action=regularDayAction(id,n);
 const linked=regularThemeAction44(theme[0],action);
 const subjects=[theme[0],theme[0]+'について',theme[0]+'を考えた夜',...(n>=150?[theme[0]+'のことを少し',theme[0]+'と今夜の話',theme[0]+'にまつわる話',theme[0]+'から考えたこと']:[])];
 const subject=regularSubject44(id,n,subjects,'theme-'+theme[0]);
 const observations=REGULAR_THEME_VOICES_45[id]||REGULAR_THEME_VOICES_45.anon;
 let reflection=observations[index]||'今の自分なりに、少し考えています。';
 // 行動と番組テーマが実際に重なるときだけ、昨日のことを具体的に述べる。
 if(linked&&action?.activity){
  reflection='昨日は、'+letterPoliteActivity491(action.activity)+'。\n\n'+reflection;
 }
 return {subject,kind:'theme',tag:`theme-${index}`,
  body:regularFirstSentence(id,n)+'\n\n今夜のテーマは「'+theme[0]+'」と聞きました。\n\n'+reflection};
}

// v3.8: 一通ごとに書き下ろした「なんでもない話」。重要な人生イベントや未公開の秘密を創作しない。
// [識別子, 種別, 件名, 本文, 4択, 条件付きの前日行動ID(任意)]
// choice: [ボタンの名前, 実際に放送する返答文, 既存の返答タグ]
const RADIO_VARIETY_CARDS_38={
 cat:[
 ['q_color','question','何色を持って帰りますか','もし、今日の帰り道から色を一つだけ持ち帰れるなら、どの色がいいでしょう。\n\n私はたぶん、信号が変わる直前の青を選びます。絵の具にすると、少し違う色になりそうですが。',[['青を想像する','変わる直前の青って、どんな明るさだったんでしょう。','curiosity'],['自分の色を返す','私は窓の灯りの黄色を持ち帰ってみたいです。','reflection'],['絵の話をする','絵の具では作れない色も、覚えておくことはできますね。','empathy'],['少し笑う','色を持ち帰れたら、帰りの鞄がずいぶん賑やかになりそうです。','humor']]],
 ['m_eraser','mishap','消しゴムの行方','昨日、久しぶりに短い線を描いたあと、消しゴムをどこに置いたのかわからなくなりました。\n\n描いていた時間より、探していた時間のほうが長かったかもしれません。机を片づける理由が一つできました。',[['探し物に寄り添う','描くことを始めた日の机って、案外にぎやかになるんですね。','empathy'],['行方を尋ねる','消しゴムは見つかったんでしょうか。','curiosity'],['余裕を持って受け取る','うまく描けたかどうか以外にも、残る出来事があるんですね。','reflection'],['冗談を返す','消しゴムも久しぶりの出番に緊張して隠れたのかもしれません。','humor']],'draw'],
 ['food_toast','food','焦げ目はどこまで','パンを焼くとき、私は焦げ目の境界線がわかりません。\n\n少し茶色いところが好きなのに、もう一分待つと急に別の食べ物になります。絵なら塗り直せるんですけどね。',[['好みを尋ねる','理想の焦げ目は、どんな色ですか。','curiosity'],['絵と重ねる','食べ物には、描き直せない色があるんですね。','reflection'],['失敗も楽しむ','少し焦げた日も、ちゃんと朝ごはんの一部ですよね。','empathy'],['笑いにする','トースターは、絵の具よりずいぶん決断が早いですね。','humor']]],
 ['memory_pencil','memory','鉛筆の短さ','短くなった鉛筆を、なかなか捨てられません。\n\n小さいころも最後の一本を使い切れなくて、筆箱の端に残していました。短いもののほうが、長い時間を覚えている気がするんです。',[['思い出を受け取る','小さな鉛筆ほど、たくさんの線を覚えているのかもしれませんね。','empathy'],['昔の絵を尋ねる','その鉛筆で、どんなものを描いていたんですか。','curiosity'],['物の時間を考える','使い切れなかったことも、その鉛筆の歴史ですね。','reflection'],['そっと残す','まだ手元に置いておきたいなら、そのままでいいと思います。','space']]],
 ['odd_cloud','oddity','雲に消しゴム','雲の形を見ていると、誰かが空の下書きを消しているように見えます。\n\n消しかけの線のほうが面白いときもあります。だから私は、曇りの日が嫌いではありません。',[['想像を広げる','空の下書き、描いている人の机はどれくらい大きいんでしょう。','wonder'],['曇りを見直す','雲の日にも、描きかけの景色があるんですね。','reflection'],['好みを尋ねる','どんな形の雲が、いちばん描いてみたくなりますか。','curiosity'],['少し笑う','消しゴムのかすが雨だったら、傘が必要ですね。','humor']]]
 ],
 driver:[
 ['q_nightcoffee','question','温かい缶の持ち方','質問です。缶コーヒーって、手を温めるために買うのか、飲むために買うのか、夜勤をしているとわからなくなります。\n\n猫主任には相談しました。返事はありませんでした。',[['両方を認める','飲み物であり、夜の小さな暖房でもあるんですね。','reflection'],['主任に尋ねる','主任は温かい缶には興味を示さないんでしょうか。','curiosity'],['体をねぎらう','冷える時間のお仕事、どうぞ無理のないように。','empathy'],['冗談を返す','その議題、主任会議では継続審議になりそうですね。','humor']]],
 ['m_route','mishap','二本のペン','昨日、配送ルートを確認していたら、ペンを二本も握っていました。どちらで書き始めたのか覚えていません。\n\n主任なら一本も使わないので、やっぱり仕事ができるんだと思います。',[['忙しさを感じる','段取りを考えることが多い日だったんですね。','empathy'],['不思議がる','二本目のペンは、いつ手に取ったんでしょう。','curiosity'],['仕事の癖を考える','考え事をしていると、手だけ別のことをする日がありますよね。','reflection'],['主任を評価する','ペンを持たない主任、仕事の合理化が進みすぎていますね。','humor']],'route'],
 ['food_onigiri','food','おにぎりの順番','コンビニでおにぎりを二つ買うと、好きな具を先に食べるか最後にするかで少し迷います。\n\nどちらにしても、主任に報告する前には食べ終わっているんですけどね。',[['先に食べる派','好きなほうを先に食べると、休憩の始まりが楽しくなりそうです。','reflection'],['最後に残す派','最後のひと口を楽しみに取っておくのもいいですね。','empathy'],['具を尋ねる','迷うほど好きな具は、何なんでしょう。','curiosity'],['主任に触れる','主任に選んでもらったら、具より袋に興味を示しそうですね。','humor']]],
 ['memory_road','memory','最初の夜道','運転を始めたころ、夜の道路はどこも同じに見えました。\n\n今は街灯の並びで「あ、そろそろあの交差点だ」とわかります。慣れるって、地味だけど不思議なことですね。',[['経験を受け取る','街灯の並びが、仕事を重ねた時間の目印になっているんですね。','empathy'],['景色を尋ねる','今でも少し迷う道はありますか。','curiosity'],['慣れについて考える','見慣れた道ほど、意外と小さな変化に気づけるのかもしれません。','reflection'],['安全を願う','今夜もいつもの道を、気をつけて走ってください。','space']]],
 ['odd_chief','oddity','主任の肩書','主任の肩書を改めて考えました。「駐車場環境監査責任者」が正式名称でしょうか。\n\n仕事は主に昼寝です。福利厚生が充実していて、少し羨ましいです。',[['肩書に笑う','ずいぶん立派な肩書なのに、実績が昼寝なのが気になりますね。','humor'],['業務内容を尋ねる','主任の監査は、今日は順調でしたか。','curiosity'],['働き方に共感する','安心して休める職場は、たしかに大切ですね。','empathy'],['別の肩書を考える','「日なた巡回特別顧問」という役職も似合いそうです。','wonder']]]
 ],
 fish:[
 ['q_smallchoice','question','自分で決める練習','もし夕飯の小鉢を一つ選べるとして、それも自分で決める練習になるでしょうか。\n\n大きい決断はまだ難しいので、小さいところから始めてみたいんです。',[['小さな選択を認める','小鉢を選ぶのだって、その日の自分の好みを知ることですよね。','agency'],['好みを聞く','今の気分なら、どんな小鉢を選びたいですか。','curiosity'],['急がせない','大きな答えを出さない日にも、小さな選択はできますね。','space'],['少し笑う','小鉢の決定会議なら、議長は自分一人でよさそうです。','humor']]],
 ['m_diary','mishap','二度書いた日付','昨日、日記を書いていたら、同じ日付を二回書いてしまいました。\n\nその間に考えが変わったわけではないのに、二つ目のほうが少し違う字でした。そんなことが妙に気になりました。',[['気づきを受け取る','同じ日付でも、手を動かした瞬間は一度ずつ違うんですね。','reflection'],['字を尋ねる','二つ目は、どんなふうに違う字だったんですか。','curiosity'],['迷いを肯定する','二回書いたからといって、間違いの日になるわけではありませんね。','empathy'],['少し遊ぶ','その日は、日記の中で二度登場したかったのかもしれません。','humor']],'diary'],
 ['food_cafe','food','喫茶店のメニュー','喫茶店のメニューを見ると、いつも飲んだことのあるものを頼みそうになります。\n\nもし誰にも相談せずに新しいものを選んだら、失敗しても自分の失敗ですよね。少し面白い気もします。',[['挑戦を受け止める','自分の失敗も自分のものにできるのは、ちょっといいですね。','agency'],['飲み物を聞く','一度試してみたい飲み物はありますか。','curiosity'],['慎重さも認める','いつもの味を選ぶ日があっても、自分で選んだことには変わりません。','space'],['小さく笑う','飲み物一杯に、そんな大きな会議が開かれていたとは。','humor']]],
 ['memory_stationery','memory','昔の色鉛筆','小さいころ、使わないまま残していた色鉛筆がありました。きれいな色ほど減らしたくなかったんです。\n\n今考えると、使えばよかったなと思います。でも、取っておきたかった気持ちもわかります。',[['両方を受け止める','使いたい気持ちと残したい気持ち、どちらもあったんですね。','empathy'],['色を尋ねる','最後まで残していたのは、何色だったんでしょう。','curiosity'],['過去と今をつなぐ','今ならその色を、どんなところに使ってみたいですか。','reflection'],['急がせない','使わなかった色鉛筆にも、そのころの選択が残っていますね。','space']]],
 ['odd_label','oddity','気持ちの付箋','気持ちにも付箋が貼れたら便利なのかな、と考えました。\n\n「今は考え中」「あとで話したい」とか。全部きれいに分類できたらいいけれど、きっと貼る場所に迷うんでしょうね。',[['付箋に共感する','「あとで話したい」は、いい付箋かもしれませんね。','empathy'],['種類を聞く','今の気持ちには、どんな文字を貼ってみたいですか。','curiosity'],['分類しない自由','貼る場所が決まらない気持ちも、そのままでいいと思います。','space'],['一枚提案する','「付箋を選んでいる途中」という付箋が必要ですね。','humor']]]
 ],
 clock:[
 ['q_clock','question','進まない時計','時計を直す仕事をしていたのに、時々、針のない時計も悪くないと思うのです。\n\n時間を知るための道具なのに、見ているだけで落ち着くものもありますね。皆さんはいかがでしょう。',[['道具の意味を考える','役目を離れても、大切にしたくなる道具はありますね。','reflection'],['時計を尋ねる','どんな形の時計なら、針がなくても眺めていたいですか。','curiosity'],['穏やかに受け取る','時計を長く見てきた方の、少し不思議な結論ですね。','empathy'],['少し笑う','針がないと、遅刻の言い訳には便利そうです。','humor']]],
 ['m_repair','mishap','磨いたあとの指紋','昨日、古い時計を磨いたあと、つい自分の指で触ってしまいました。\n\n指紋を拭き取るところから、もう一度仕事が始まった気分です。引退しても、手の癖はなかなか抜けません。',[['長年の癖を受け取る','何度も手入れをしてきた方ならではの癖なんですね。','empathy'],['時計の様子を尋ねる','その時計は、今もよく動いているんですか。','curiosity'],['手仕事を考える','触れた跡をまた拭く時間も、手入れの一部かもしれません。','reflection'],['軽く笑う','時計のほうは、ずいぶん丁寧な二度目のお手入れでしたね。','humor']],'repair'],
 ['food_tea','food','お茶の最後の一口','湯呑みの最後の一口は、なぜか最初よりゆっくり飲みます。\n\nお茶が冷めたせいなのか、飲み終えるのが惜しいのか。最近は、その違いを決めなくてもよい気がしています。',[['余韻を味わう','最後の一口に、静かな時間が残っているんですね。','empathy'],['お茶を尋ねる','いつもは、どんなお茶を淹れるんでしょう。','curiosity'],['違いを急がない','冷めたからか惜しいからか、どちらでもいい時間がありますね。','space'],['ちょっと笑う','湯呑みの底にも、時計よりゆっくり進む時間があるんですね。','humor']]],
 ['memory_bell','memory','学校の鐘','子どものころ、学校の鐘が鳴るのを待っていた日がありました。\n\nあのころは一分が長く感じましたが、今は一年が驚くほど早く感じます。それでも、おいしいお茶を待つ時間は長く感じるものです。',[['時間の感覚に共感','同じ一分でも、待っているものによって長さが違いますね。','reflection'],['昔の様子を聞く','学校の鐘が鳴ったあとは、何をするのが楽しみでしたか。','curiosity'],['記憶を大切に','鐘を待った時間まで覚えているなんて、素敵な記憶ですね。','empathy'],['少し笑う','お茶を待つ一分には、今でも勝てない時計がありそうです。','humor']]],
 ['odd_watch','oddity','時計の休日','時計にも休日があったら、針は何をするでしょうか。\n\nお茶を飲みながら、そんなことを考えます。たぶん私より上手に休むのでしょう。こちらはまだ練習中です。',[['空想に乗る','針が伸びをする休日、少し見てみたいですね。','wonder'],['休息を受け取る','長く働いてきた道具にも、人にも、休む時間がありますね。','empathy'],['休日を尋ねる','ご自身にとって、よい休日はどんな日でしょう。','curiosity'],['冗談を返す','時計の針が休んだら、遅刻を知らせる役は困ってしまいますね。','humor']]]
 ],
 terminal:[
 ['q_detour','question','遠回りの長さ','近道を知っているのに、わざわざ遠回りを選ぶことがあります。\n\n遠回りというのは、どこまで遠くなったらそう呼ぶのでしょう。今日は答えが出ませんでした。',[['問いを味わう','遠さは距離だけでは決まらないのかもしれませんね。','reflection'],['景色を尋ねる','遠回りの道には、どんなものがありますか。','curiosity'],['選ぶ自由を認める','近い道を知っていても、違う道を選びたい日がありますね。','agency'],['少し遊ぶ','道が目的地を決めるなら、遠回りは反抗期ですね。','humor']]],
 ['m_timetable','mishap','時刻表の折り目','昨日、帰りに時刻表を開いたら、折り目のところばかり目に入りました。\n\n見たい時刻が隠れていて、何度も紙を伸ばしました。別に急いでいたわけではないのですが。',[['小さな不便を受け取る','急いでいない日にも、紙の折り目は気になるものですね。','empathy'],['気持ちを尋ねる','時刻が見えたとき、少しほっとしましたか。','curiosity'],['紙の時間を考える','折り目も、これまで何度も開かれた証ですね。','reflection'],['軽く笑う','時刻表まで、少し寄り道を勧めていたのかもしれません。','humor']],'timetable'],
 ['food_station','food','駅の自販機','駅の自販機は、なぜか毎回同じ飲み物を選んでしまいます。\n\nそれを習慣と呼ぶのか、考えるのが面倒なだけなのか。どちらでも、少し温かければ十分です。',[['習慣を受け取る','変わらない飲み物があると、道も少し落ち着くのでしょうね。','empathy'],['好みを尋ねる','いつも買うのは、どんな飲み物ですか。','curiosity'],['選択を考える','考えないで選ぶことも、いつか自分で選んだ習慣なんですね。','reflection'],['静かに返す','今日の帰り道にも、温かい一杯があるといいですね。','space']]],
 ['memory_platform','memory','ホームの端の景色','小さいころ、駅のホームの端に立つと遠くまで行けるような気がしていました。\n\n今は、どこまで行けるかより、どこで降りるかを考えることのほうが多い気がします。',[['昔の気持ちを受け取る','ホームの端から、遠い場所を想像していたんですね。','empathy'],['行き先を尋ねる','そのころ、行ってみたかった場所はありましたか。','curiosity'],['今の視点に触れる','乗ることだけでなく、降りる場所にも物語があるんですね。','reflection'],['余韻を残す','今すぐどこかへ行かなくても、その景色は覚えていていいと思います。','space']]],
 ['odd_ticket','oddity','切符の重さ','切符一枚は軽いのに、ポケットに入れていることを強く意識する日があります。\n\n紙が重くなるわけではありません。きっと自分の考え事が重くなっているのでしょう。',[['感覚を受け止める','軽い紙でも、思いが重なると存在感が変わるんですね。','empathy'],['切符を尋ねる','その切符を見て、どんな景色を思い出しますか。','curiosity'],['言葉を考える','重さは測れなくても、感じるものがあるんですね。','reflection'],['答えを急がない','今日はそのまま、ポケットに入れておいてもよさそうです。','space']]]
 ],
 bread:[
 ['q_scent','question','香りの名前','焼きたてパンの匂いを「いい匂い」以外の言葉で説明するのは、案外難しいですね。\n\n花の匂いとも違うし、甘いだけでもありません。みなさんなら何と呼びますか。',[['言葉を考える','あたたかい朝の匂い、と呼んでみたくなります。','wonder'],['具体的に尋ねる','いちばん香りが変わるのは、焼き始めと焼き上がりのどちらですか。','curiosity'],['難しさに共感','身近な匂いほど、名前を付けるのが難しいものですね。','reflection'],['冗談を返す','深夜ラジオでその匂いの話は、なかなかお腹に厳しいですね。','humor']]],
 ['m_bake','mishap','配合の余白','昨日、パンの配合をノートに書いたのですが、余白のほうに大きく「おいしい？」と書いてしまいました。\n\n大事なのは材料の分量なのに。店長に見せる前に消そうか迷っています。',[['試作の気持ちを受け取る','分量の先にある味まで、考えていたんですね。','empathy'],['余白を尋ねる','その「おいしい？」の隣には、何を書き足したいですか。','curiosity'],['考え方を認める','配合表に疑問符が一つあるのも、試作らしい気がします。','reflection'],['少し笑う','店長が答えを書き込んだら、採点表になってしまいますね。','humor']],'bake'],
 ['food_crust','food','パンの端っこ','食パンの端だけが、ほかの部分と違う名前を持っているような気がしませんか。\n\n耳、というくらいですからね。もしパンの耳が聞いていたら、うちの試作会議はずいぶん騒がしいでしょう。',[['発想に乗る','パンの耳が聞いていたら、焼き上がりの評判も全部知っていますね。','wonder'],['味を尋ねる','ご自身は食パンの耳、お好きですか。','curiosity'],['面白さを受け取る','毎日扱うパンにも、まだ不思議に思うことがあるんですね。','empathy'],['店長を想像する','店長の会議が、パンの耳で満席になりそうです。','humor']]],
 ['memory_bakery','memory','昔のパン袋','小さいころ、パン屋の紙袋を開ける瞬間が好きでした。\n\n何が入っているか知っていても、紙がかさっと鳴るだけで楽しみになったんです。今は袋に入れる側なのが、ちょっと不思議です。',[['子どもの時間を受け取る','紙袋の音まで覚えているんですね。','empathy'],['昔のパンを尋ねる','その袋には、いつもどんなパンが入っていましたか。','curiosity'],['立場の変化を見る','受け取る側のわくわくを、今は誰かに渡しているんですね。','reflection'],['小さく笑う','袋のかさっという音も、立派なパン屋の仕事なのかもしれません。','humor']]],
 ['odd_round','oddity','まるい会議','丸いパンの会議を想像しました。角のあるパンが来たら、話し合いはどうなるでしょう。\n\nお店の仕事には関係ありません。たぶん、粉をこねすぎたのでしょう。',[['空想を広げる','角のあるパンは、きっと書記を任されそうです。','wonder'],['議題を尋ねる','その会議では、何を決めるんでしょうか。','curiosity'],['面白さを楽しむ','仕事の合間にそんなことを考えられるの、ちょっといいですね。','empathy'],['店長に触れる','店長が議長だったら、まず試食会になりそうです。','humor']]]
 ],
 moon:[
 ['q_shadow','question','影の持ち主','影を落としている木は、影が自分のものだと知っているんでしょうか。\n\nもし知っていたら、夕方にはずいぶん長い持ち物を片づけることになりますね。',[['想像を続ける','長い影を折りたたむ木を想像してしまいました。','wonder'],['問いを返す','影を片づけるなら、どこにしまっておくのでしょう。','curiosity'],['景色を味わう','夕方の影が、少し違って見えるお便りですね。','reflection'],['冗談を返す','木の倉庫は影でいっぱいになりそうです。','humor']]],
 ['m_pudding','mishap','プリンの定位置','昨日、冷蔵庫の奥を確かめたら、プリンの置き場所だけ妙にきれいでした。\n\n家族が整理したのか、プリンが自主的に引っ越したのか。なお、後者の可能性を私はまだ捨てていません。',[['プリンの謎を楽しむ','自分で引っ越すプリン、なかなか行動力がありますね。','humor'],['続きを尋ねる','結局、プリンはどこにいたんでしょう。','curiosity'],['家族の気配を受け取る','冷蔵庫の中にも、家族の日常が残るんですね。','reflection'],['空想を広げる','プリンにも引っ越し先の希望があるのかもしれません。','wonder']],'pudding'],
 ['food_pudding','food','最後の一口の議会','プリンを最後の一口まで残すべきか、先においしいところを食べるべきか。月の議会でも意見が割れそうです。\n\n私は議会より先に食べてしまう派です。',[['議会に参加する','プリン議会には、採決前に試食が必要そうです。','humor'],['好みを尋ねる','いちばんおいしいと思う部分は、どこですか。','curiosity'],['食べ方を認める','好きな順番で食べられるのが、プリンのいいところですね。','empathy'],['月に問い返す','月の裏側では、カラメルを先に食べる規則があるんでしょうか。','wonder']]],
 ['memory_moon','memory','昔の月の絵','小さいころ、月を描くときは必ず黄色い丸にしていました。\n\n本物は日によって形も色も違うのに。便利な記号というのは、なかなか頑固ですね。',[['昔の絵を楽しむ','黄色い丸一つで月だと伝わるのは、不思議ですね。','wonder'],['色について尋ねる','今なら月を何色で描きますか。','curiosity'],['記号を考える','わかりやすさと本当らしさは、必ずしも同じではないんですね。','reflection'],['少し笑う','月の広報部が黄色い丸を指定しているのかもしれません。','humor']]],
 ['odd_moon','oddity','月の郵便番号','月の裏側に手紙を送るとしたら、郵便番号はいくつになるでしょう。\n\n番地は「クレーターの右隣」で大丈夫でしょうか。配達員さんには難しい仕事かもしれません。',[['住所を考える','「クレーターの右隣」は、天気の悪い日に迷いそうですね。','wonder'],['宛名を尋ねる','その手紙は、誰に宛てて書くんでしょう。','curiosity'],['発想を楽しむ','住所を考えるだけで、月が急に身近になりますね。','empathy'],['配達を案じる','主任の猫でも、そのルートは難しそうです。','humor']]]
 ],
 sugar:[
 ['q_cup','question','カップの半分','コーヒーが半分残ったカップを見て、「まだ半分」か「もう半分」か考えました。\n\n結局、冷める前に飲みました。考える時間も含めて、おいしい一杯でした。',[['飲み物を味わう','答えを決める前に飲む、それもいい選択ですね。','empathy'],['好みを尋ねる','その一杯は、今日はどんな味でしたか。','curiosity'],['見方を考える','半分という量は同じでも、感じ方は変わるんですね。','reflection'],['少し笑う','カップのほうは、議論が終わって安心したかもしれません。','humor']]],
 ['m_coffee','mishap','違う味の朝','昨日、いつもと違うコーヒーを淹れました。\n\n最初のひと口で、思っていた味とは少し違うと気づきました。でも、二口目には慣れていて。舌のほうが、私より切り替えが早いみたいです。',[['違いを楽しむ','予想と違う味にも、慣れていく楽しさがあるんですね。','empathy'],['味を尋ねる','いつもといちばん違ったのは、どんなところですか。','curiosity'],['変化を考える','好きかどうかを決めるまでにも、時間があるんですね。','reflection'],['少し笑う','舌だけ先に新しい習慣を始めたんですね。','humor']],'coffee'],
 ['food_sugar','food','砂糖は三杯まで','砂糖を三杯入れると言うと、たいてい驚かれます。\n\nだからといって二杯にするわけでもないのですが、いつか四杯になったら報告します。今のところ予定はありません。',[['好みを受け取る','三杯が、今のあなたの落ち着く味なんですね。','empathy'],['味を尋ねる','三杯と二杯では、ずいぶん違うものですか。','curiosity'],['少し笑う','四杯になったら、大きな番組ニュースですね。','humor'],['選択を大切に','その日の気分で決めても、変えなくてもいいんですよね。','agency']]],
 ['memory_cup','memory','昔のマグカップ','昔使っていたマグカップには、小さな欠けがありました。\n\n新しいものを買っても、しばらく捨てられませんでした。持ちやすさは、新しさと同じではないのかもしれません。',[['思い出を受け取る','手になじんだ形って、なかなか忘れられませんよね。','empathy'],['欠けた場所を聞く','その欠けは、どのあたりにありましたか。','curiosity'],['物との関係を考える','使いやすさには、過ごした時間も含まれるのかもしれません。','reflection'],['余白を残す','捨てられなかった時間も、そのカップの一部ですね。','space']]],
 ['odd_coffee','oddity','湯気の行き先','コーヒーの湯気は、どこまで上っていくのでしょう。\n\n天井で止まるなら、部屋の上には昨日の湯気が残っているのかもしれません。見えない棚ですね。',[['空想を広げる','見えない棚に、何杯分の湯気が並んでいるんでしょう。','wonder'],['想像の続きを尋ねる','その棚には、コーヒー以外の湯気も置いてありますか。','curiosity'],['日常を味わう','毎日の一杯にも、思いがけない風景がありますね。','reflection'],['少し笑う','棚卸しをする人は、きっと困りますね。','humor']]]
 ],
 anon:[
 ['q_silence','question','ラジオを止めたあと','ラジオを消したあとに残る静けさと、最初から静かな部屋は、同じでしょうか。\n\nうまく説明できませんが、私は少し違う気がしています。',[['違いを受け取る','声があったあとの静けさには、その時間の形が残る気がします。','reflection'],['感じ方を尋ねる','ラジオを消したあと、どんなことが耳に残りますか。','curiosity'],['静けさを大切に','言葉にできない違いも、そのまま感じていていいと思います。','space'],['お礼を伝える','そんな静かな疑問を、ここへ送ってくれてありがとうございます。','empathy']]],
 ['m_book','mishap','しおりの場所','昨日、本を読んでいたら、しおりを挟んだ場所がわからなくなりました。\n\n最初から読み直すほどでもないので、なんとなく覚えているページから続きを読みました。',[['読書の時間を受け取る','正しいページでなくても、続きを読みたくなる本なんですね。','empathy'],['本のことを尋ねる','どんな物語を読んでいたんでしょう。','curiosity'],['ゆるやかに考える','少し戻ったり飛ばしたりする読み方も、あなたの時間ですね。','reflection'],['少し笑う','しおりのほうが先に続きを読みに行ったのかもしれません。','humor']],'read'],
 ['food_warmth','food','湯気のあるもの','夜に湯気のあるものを前にすると、何となくほっとします。\n\n中身が何かより、まず温かいことが大事な日もあります。大げさな話ではありませんが。',[['温かさに共感','湯気を見てほっとする夜、ありますね。','empathy'],['好みを尋ねる','今夜なら、どんな温かいものがいいですか。','curiosity'],['小さな幸せを見る','何を食べるか決める前の時間にも、安心があるんですね。','reflection'],['休みを願う','今夜も温かくして過ごせますように。','space']]],
 ['memory_radio','memory','最初の周波数','最初に一人でラジオの周波数を合わせたとき、知らない声が聞こえて少し驚きました。\n\n今は当たり前に聞いています。慣れたことも、最初は不思議だったんですね。',[['初めてを受け取る','知らない声に出会った瞬間を、覚えているんですね。','empathy'],['その声を尋ねる','最初に聞こえたのは、どんな番組でしたか。','curiosity'],['日常を考える','当たり前になったことにも、始まりがありますね。','reflection'],['静かに返す','今夜も、この周波数を見つけてくれてありがとうございます。','space']]],
 ['odd_antenna','oddity','アンテナの寝ぐせ','アンテナの先が少し曲がっていると、寝ぐせみたいに見えます。\n\n変な話ですが、そう思うと古いラジオも誰かの持ち物ではなく、ひとつの生き物みたいです。',[['想像に乗る','アンテナが寝ぐせなら、朝は誰が直してあげるんでしょう。','wonder'],['ラジオを尋ねる','そのラジオは、どんな形をしていますか。','curiosity'],['親しみを受け取る','道具に少し表情が見える瞬間がありますね。','empathy'],['少し笑う','放送前に、アンテナにも身だしなみ点検が必要ですね。','humor']]]
 ],
 umbrella:[
 ['q_flower','question','名前を知らない花','花屋なのに、全部の花の名前を知っているわけではありません。\n\n名前を忘れた花でも、きれいだと思うことはできます。皆さんは、名前のわからないものを好きになったことがありますか。',[['好きを受け取る','名前がわからなくても好き、という気持ちは残りますね。','empathy'],['花を尋ねる','最近、名前を知りたくなった花はありますか。','curiosity'],['知ることを考える','名前を知る前とあとでは、見え方も少し変わるのかもしれません。','reflection'],['少し笑う','花屋さんの名前当て試験があったら、大変そうですね。','humor']]],
 ['m_bouquet','mishap','花束の向き','昨日、花束を組んだあと、正面をどちらにするかで少し迷いました。\n\n贈られた人が持ち替えたら、たぶん正面も変わります。それなら最初から決めなくてもいいのかな、と。',[['迷いを受け取る','花束の正面まで考える時間があるんですね。','empathy'],['花の配置を聞く','どの花をいちばん見えるところに置きましたか。','curiosity'],['相手の自由を思う','受け取った人が向きを決める花束も、いいですね。','reflection'],['少し笑う','花同士で「私が正面」と相談しているのかもしれません。','humor']],'bouquet'],
 ['food_market','food','花屋のおやつ','花を並べていると、食べ物の色を思い出すことがあります。みかんの橙、焼き菓子の茶色。\n\n花屋なのにお腹が空いてくるなんて、色には困った力がありますね。',[['色の連想を楽しむ','花の色から、おやつのことまで思い浮かぶんですね。','wonder'],['好きな色を聞く','今の季節に、いちばんおいしそうな色の花は何ですか。','curiosity'],['感覚を受け取る','仕事の中にも、そんな小さな寄り道があるんですね。','empathy'],['軽く笑う','花束にお菓子を一つ忍ばせたくなりますね。','humor']]],
 ['memory_flower','memory','最初に買った花','昔、自分のお金で初めて買った花を、しばらく眺めていました。\n\n高い花ではありませんでしたが、部屋が少し違って見えました。花屋を続けていても、あの感じは忘れません。',[['始まりを受け取る','初めて買った花が、今の仕事にもつながっているんですね。','empathy'],['花を尋ねる','最初に選んだのは、どんな花でしたか。','curiosity'],['部屋の変化に触れる','一輪あるだけで、部屋の時間が変わることがありますね。','reflection'],['思い出を大切に','今も覚えている花なら、きっと大切な一輪だったんですね。','space']]],
 ['odd_bouquet','oddity','花瓶の相談','もし花瓶が花を選べるなら、どんな花を飾りたいんでしょう。\n\n細い花瓶は背の高い花を望むのか、小さな花を大事にするのか。閉店後にこんなことを考えます。',[['花瓶の希望を想像','小さな花瓶は、一本の花とじっくり話したいのかもしれませんね。','wonder'],['組み合わせを聞く','ご自身なら、今その花瓶に何を飾りますか。','curiosity'],['日常を受け取る','仕事道具にも、それぞれ役割があるように見えるんですね。','reflection'],['冗談を返す','花瓶同士の意見が割れたら、花屋さんが仲裁ですね。','humor']]]
 ],
 triangle:[
 ['q_future','question','未来の自分への宿題','未来の自分に宿題を一つだけ出せるなら、何を出しますか。\n\n私は「今の好きなものを一つ覚えていて」と書くと思います。でも未来の私、提出期限を忘れそうです。',[['問いに答える','私は「今日の小さな楽しみを、一つ残しておいて」と書きたいです。','reflection'],['好きなものを尋ねる','今の自分から未来へ残したいのは、どんなものですか。','curiosity'],['期限を急がせない','提出期限のない宿題でもいいと思いますよ。','space'],['軽く笑う','未来の自分にも、先生から催促が来そうですね。','humor']]],
 ['m_study','mishap','ノートの見出し','昨日、図書室で勉強していたら、見出しを書くところで字が大きくなりすぎました。\n\n大事な中身を書く場所が減りました。見出しだけで一ページ使う勉強法、あるんでしょうか。',[['勉強を受け取る','見出しから一生懸命考えたんですね。','empathy'],['内容を尋ねる','その大きな見出しには、何と書いたんですか。','curiosity'],['形式を考える','ノートの形が決まらない日も、学んでいる途中なんですね。','reflection'],['冗談を返す','見出しが主役の教科書ができそうです。','humor']],'librarystudy'],
 ['food_bento','food','弁当の順番','お弁当のおかずって、食べる順番で印象が変わりませんか。\n\n最後に好きなものを残す派と、最初に食べる派で討論したら、放課後まで決着がつかない気がします。',[['先に食べる派','好きなものから食べると、最初のひと口が楽しみですね。','empathy'],['最後に残す派','最後のお楽しみに取っておくのも、わかります。','reflection'],['おかずを尋ねる','いちばん迷うおかずは、何でしょう。','curiosity'],['討論に乗る','討論の前に、お弁当が冷めてしまいそうですね。','humor']]],
 ['memory_dream','memory','小学生の将来欄','小学生のころ、将来の夢を書く紙に毎回違うことを書いていました。\n\n変わりすぎだと笑われたこともあったけれど、今はちょっと面白い履歴書みたいだと思っています。',[['変化を認める','いろんな未来を想像できた時間でもあったんですね。','empathy'],['昔の夢を尋ねる','そのころ、一度だけ書いた夢はありますか。','curiosity'],['選択の意味を考える','夢が変わることも、自分を知る過程かもしれませんね。','reflection'],['少し笑う','履歴書の職歴欄が、想像だけでいっぱいになりますね。','humor']]],
 ['odd_ruler','oddity','三角定規の丸','三角定規で丸を描こうとすると、角をいくつもつなぐしかないんでしょうか。\n\n名前に三角がついているからって、丸を嫌いなわけではないですよね。変なことを考えました。',[['図形で遊ぶ','小さな角をつなげて、丸に近づけるのも面白そうですね。','wonder'],['考え方を尋ねる','丸い形を描きたいのは、どんなときですか。','curiosity'],['名前を考える','名前に決められない好きなものも、たくさんありますね。','reflection'],['冗談を返す','三角定規の丸い性格が見えてきましたね。','humor']]]
 ],
 fridge:[
 ['q_homecook','question','自分の皿','料理の仕事をしていても、家で自分のために作る一皿はなかなか決まりません。\n\nもし一品だけなら、どんな料理を選びますか。手間の少なさも立派な条件だと思います。',[['簡単な一品を答える','温かい卵料理なら、短い時間でも満足できそうです。','reflection'],['本人に尋ねる','仕事が休みの日に食べたくなるのは、どんなものですか。','curiosity'],['休むことを認める','手間をかけない選択も、自分の食事を大事にする方法ですね。','empathy'],['少し笑う','プロの「手間が少ない」は、私たちとは少し基準が違いそうです。','humor']]],
 ['m_kitchen','mishap','一人分の段取り','昨日、家で簡単な食事の準備をしたんですが、つい厨房と同じ順番で動きかけました。\n\n一人分なのに、下ごしらえの場所を決めようとして。誰も見ていなくてよかったです。',[['習慣を受け取る','体が仕事の段取りを覚えているんですね。','empathy'],['どんな料理か尋ねる','その日は、何を作ったんでしょう。','curiosity'],['仕事と生活を考える','家の台所では、好きな順番で動いてもいいんですよね。','reflection'],['少し笑う','一人分でも、厨房の開店準備が始まるところでしたね。','humor']],'leftovers'],
 ['food_onigiri','food','おにぎりは料理か','料理人がおにぎりを買って食べると、手抜きなのかと聞かれることがあります。\n\nでも、誰かが握ってくれたものを食べるのは、案外ありがたい時間なんです。',[['気持ちを受け取る','作ってもらったものを食べられる時間も、大切なんですね。','empathy'],['好みを尋ねる','買うなら、どんな具のおにぎりが好きですか。','curiosity'],['仕事と暮らしを考える','料理をする仕事だからこそ、作らない食事がありがたい日もありますよね。','reflection'],['軽く笑う','おにぎりにも、料理人の休憩を認める権利がありそうです。','humor']]],
 ['memory_firstplate','memory','初めての白い皿','料理を始めたころ、白い皿の上に何を置くかでずいぶん悩みました。\n\n今は皿より先に、食べる人の顔を思い浮かべます。変わったことも、変わらないこともありますね。',[['変化を受け取る','皿の向こうにいる人を考えるようになったんですね。','empathy'],['最初の料理を尋ねる','そのころ、白い皿には何を盛っていたんですか。','curiosity'],['仕事の時間を考える','料理を続けるうちに、見ているものが少しずつ変わるんですね。','reflection'],['今の自分も大切に','作る人自身の食卓にも、温かいものがありますように。','space']]],
 ['odd_fridge','oddity','冷蔵庫の会議','冷蔵庫を開けると、食材が全員でこちらを見ているような気がします。\n\n「今日は誰を選ぶんですか」と。仕事場では迷わないのに、家だと決められません。',[['空想を受け取る','食材の視線を感じる冷蔵庫、ちょっと賑やかですね。','wonder'],['今日の候補を尋ねる','いちばん声が大きそうな食材は何でしょう。','curiosity'],['気持ちに寄り添う','仕事から離れると、選ぶことにも疲れる日がありますよね。','empathy'],['冗談を返す','冷蔵庫の会議では、議長も夕飯を決めかねているんですね。','humor']]]
 ]
};

// 作品中の「昨日」は前日の実行済みの行動と一致している必要がある。
// 「小さな疑問」「思い出」は大事件・他人の秘密を創作しないものに限る。
function radioVarietyCompose38(id,n){
 if(n<29||!s.regular)return null;
 const pool=RADIO_VARIETY_CARDS_38[id];if(!pool?.length)return null;
 // 番組の既存の話題（自律生活、特別な手紙、常連文化）を圧迫しない。
 if(simHash(`v38:chance:${id}:${n}:${s.rng}`)%100>=42)return null;
 const recent=(s.regular.varietyHistory||[]).filter(x=>x.who===id);
 const yesterday=regularDayAction(id,n);
 const possible=pool.filter(card=>{
  const [key,category,subject,body,choices,requiredAction]=card;
  if(requiredAction&&yesterday?.actionId!==requiredAction)return false;
  if(recent.some(x=>x.cardId===key&&n-x.night<175))return false;
  return true;
 });
 if(!possible.length)return null;
 const scored=possible.map(card=>{
  const [key,category]=card;
  const lastType=recent.filter(x=>x.category===category).at(-1);
  const lastSame=recent.filter(x=>x.cardId===key).at(-1);
  return {card,score:(simHash(`v38:pick:${id}:${n}:${key}`)%43)
    +(lastType?Math.min(23,(n-lastType.night)*2):30)
    +(lastSame?Math.min(25,n-lastSame.night):33)
    +(category==='mishap'?5:0)};
 }).sort((a,b)=>b.score-a.score||a.card[0].localeCompare(b.card[0]));
 const [cardId,category,subject,body,choices,requiredAction]=scored[0].card;
 return {subject,body:regularFirstSentence(id,n)+'\n\n'+body,
  kind:'variety',tag:`variety38-${cardId}`,variety:{cardId,category},
  choices:choices.map(row=>[...row])};
}
function radioVarietyConfirmDelivered38(n,ids){
 const r=s.regular;if(!r)return;
 r.varietyHistory ||= [];
 for(const uid of ids){
  const note=r.letterArchive?.[uid];
  if(!note||note.kind!=='variety'||!note.variety||r.varietyHistory.some(x=>x.uid===uid))continue;
  r.varietyHistory.push({uid,night:n,who:note.who,cardId:note.variety.cardId,category:note.variety.category});
 }
 // 追加保存量を一定に保つ一方で、各人物の長期的な繰り返しを抑える。
 r.varietyHistory=r.varietyHistory.filter(x=>n-x.night<=260).slice(-360);
}


// v4.8.27 — 12人×9通、108通の日常投稿。本文・返答は手書き原稿。
// 後日談（各人の9通目）は、参照元の便りが実際に配達されてからだけ候補になる。
const EVERYDAY_LETTERS_4827 = {"cat":[{"subject":"窓ぎわの小さな机","body":"こんばんは。机を窓の近くに動かしました。\n\n絵を描くためというより、帰宅してすぐ鞄を置かない場所が欲しかったんです。窓から見えるのは隣のビルの壁だけ。でも夕方だけ、そこが桃色になります。","choices":[["景色を受け取る","壁が桃色になる時間、そこに机があるのはいいですね。","empathy"],["机の役目を尋ねる","その机には、何を置くのがいちばん落ち着きますか。","curiosity"],["窓の色に席を譲る","夕方の数分だけ桃色になる壁を、机から眺められるんですね。鞄を置かない場所ができたことも、いい変化に思えます。","followup"]],"key":"cat-01"},{"subject":"消しゴムの角","body":"文房具屋で、角が四つとも残った消しゴムを買いました。\n\nまだ使っていません。新品だからというより、角のあるものを見ているだけで気持ちが整う日があるんです。おかしな楽しみですね。","choices":[["楽しみを認める","使わずに眺める文房具にも、ちゃんと役目がありますね。","empathy"],["少し笑う","四つの角に、順番を決めてもらいましょうか。","curiosity"],["四つの角を見守る","まだ使っていない消しゴムに、気持ちを整える役目がある。文房具との付き合い方って自由ですね。","followup"]],"key":"cat-02"},{"subject":"コンビニの傘","body":"帰り道に小雨が降って、傘を買うか迷いました。\n\n結局、屋根のあるところで五分待ちました。雨がやむまで、いつも急いで通り過ぎる看板の文字を全部読みました。意味のない五分、とは思わなかったです。","choices":[["立ち止まった時間","雨のおかげで、ふだん見えない文字に出会えたんですね。","empathy"],["看板について聞く","その看板、どんなことが書いてあったのでしょう。","curiosity"],["五分間の寄り道を聴く","傘を買わずに待った五分で、看板の文字まで読めたんですね。急がなかった日の収穫を聞けました。","followup"]],"key":"cat-03"},{"subject":"余白のある予定表","body":"今週の予定表に、一か所だけ何も書いていない四角があります。\n\n前なら埋めたくなったのに、今日は空白のまま閉じました。何をするか決めない予定というのも、少し気楽です。","choices":[["空白を歓迎する","何も書かないために残しておく時間も、予定のひとつですね。","empathy"],["無理に決めない","その四角は、最後まで白いままでもよさそうです。","curiosity"],["白い四角をそのままに","予定表の空欄を埋めずに閉じた、というところが好きです。何もしないと決める必要すらない時間ですね。","followup"]],"key":"cat-04"},{"subject":"三本の鉛筆","body":"鉛筆を三本削りました。一本は尖らせすぎて芯が折れました。\n\nよく考えたら、まだ何を描くか決めていません。準備だけ上手になっても仕方ない、と笑いながら、机の端に並べています。","choices":[["準備を面白がる","三本の鉛筆が、描かれるものを待っているんですね。","empathy"],["折れた芯に触れる","尖らせすぎた一本にも、出番があるといいですね。","curiosity"],["折れた芯にも席を用意","何を描くか決まる前に鉛筆が三本並んでいる。準備だけで終わる日にも、ちょっと可笑しさがありますね。","followup"]],"key":"cat-05"},{"subject":"おつかれさまの練習","body":"職場の帰り、誰もいなくなったエレベーターで「おつかれさま」と言ってみました。\n\n誰かに聞かせるつもりではなく、自分に言ってみたかったんです。思ったより小さな声でした。","choices":[["自分への声を受け取る","人にかける言葉を、自分にもかけてみたんですね。","empathy"],["声の大きさに触れる","小さな声でも、ちゃんと聞こえたでしょうか。","curiosity"],["小さな声を受け取る","誰もいないエレベーターで自分へ言った「おつかれさま」。大きな声でなくても、今夜の報告として届きました。","followup"]],"key":"cat-06"},{"subject":"半分だけの絵","body":"紙の右半分にだけ、小さな木を描きました。\n\n左側は空っぽです。何か描き足そうとして、やめました。完成かどうかはわからないけれど、今日はここで終わりにします。","choices":[["終わり方を尊重する","描き足さないことも、その絵の選び方なのかもしれません。","empathy"],["木について尋ねる","その木には、どんな枝が伸びていますか。","curiosity"],["左半分の空白を尊重","木を描いた右側と、何も描かなかった左側。どちらも今日のあなたが残した紙なんですね。","followup"]],"key":"cat-07"},{"subject":"冷蔵庫の磁石","body":"冷蔵庫につけていた磁石が一つ落ちました。\n\n拾って戻したら、何年も同じ場所に貼ってあったメモが目に入りました。「牛乳」としか書いてありません。とっくに買ったはずなのに、捨てられませんでした。","choices":[["メモを面白がる","何年も前の牛乳が、今も冷蔵庫の扉にいるんですね。","empathy"],["残しておく気持ち","捨てなくても困らないメモは、残しておいていい気がします。","curiosity"],["牛乳のメモを見つめる","もう買い終えたはずの牛乳が、紙の上にはまだ残っている。捨てなかった理由を決めつけずに聞いていたいです。","followup"]],"key":"cat-08"},{"subject":"窓の桃色、もう一度","body":"この前、窓ぎわの机の話を書きました。\n\n今日も夕方に隣の壁が桃色になりました。違ったのは、机に小さな紙を一枚置いたこと。そこにはまだ何も描いていません。壁の色が消えるまで、ただ眺めていました。","choices":[["小さな続きに気づく","机と窓の景色に、今夜は白い紙が一枚増えたんですね。","empathy"],["紙の余白を大切に","その紙は、明日も白いままでいいと思います。","curiosity"],["机に増えた一枚を喜ぶ","前にはなかった白い紙が、桃色の壁の前に一枚。まだ描いていないことまで、ちゃんと続きの景色になっていますね。","followup"]],"key":"cat-09","requires":"cat-01"}],"driver":[{"subject":"自販機の新人","body":"休憩所の自販機が新しくなりました。\n\n選べる飲み物は増えたのに、結局いつもの缶コーヒーを押しました。新しい機械には少し申し訳ないです。","choices":[["自販機に同情する","新入りなのに、さっそく常連の注文を覚えたことになりますね。","empathy"],["いつもの味を聞く","その缶コーヒー、何年くらいの付き合いなんでしょう。","curiosity"],["新人への初注文","品ぞろえが増えても、いつもの缶を選んだんですね。新しい自販機には、まず常連さんを覚えてもらいましょう。","followup"]],"key":"driver-01"},{"subject":"猫主任の会議室","body":"配送先の駐車場で、猫主任が段ボールの上に座っていました。\n\n会議中かと思って近づいたら、目も開けません。議事録には「全員、昼寝」と書いておきます。","choices":[["会議に参加する","満場一致で昼寝とは、効率のいい会議ですね。","empathy"],["主任の席を気にする","その段ボール、主任専用の会議室なんでしょうか。","curiosity"],["議事録を受理する","猫主任が目を開けずに承認した議案は「全員、昼寝」。議事録に異議なし、ということにしておきます。","followup"]],"key":"driver-02"},{"subject":"道の先の洗濯物","body":"夜の配送ルートで、ベランダに一枚だけ干されたタオルを見かけました。\n\n誰かが取り込み忘れたのでしょう。自分にもそんな夜があるなと思ったら、ちょっと親しみが湧きました。","choices":[["小さな親近感","知らない誰かのタオルに、仲間を見つけたんですね。","empathy"],["無事を願う","雨が降る前に、取り込まれるといいですね。","curiosity"],["一枚のタオルを思う","夜道で見かけたタオルから、知らない人の取り込み忘れに親しみを感じたんですね。そういう景色が残る配送路もいいですね。","followup"]],"key":"driver-03"},{"subject":"休憩所の椅子","body":"いつも座る休憩所の椅子が、一脚だけ新しくなっていました。\n\n背もたれが少し高くて、変な感じです。座り心地を報告しようにも、職場では誰も興味を持たないと思うので、ここに書きます。","choices":[["椅子の評価を受け取る","深夜の椅子のレビュー、こういう番組には必要です。","empathy"],["比較してみる","前の椅子と比べて、どちらが眠くなりそうですか。","curiosity"],["椅子の報告を歓迎する","背もたれが少し高くなったことを、誰かに話したくなる夜もあります。この番組は椅子のレビューも歓迎です。","followup"]],"key":"driver-04"},{"subject":"地図にない近道","body":"道路工事で、今日はいつもと違う道を走りました。\n\n三分くらい遠回りでしたが、静かな公園の横を通りました。公園の時計は止まっていた気がします。仕事中なので確認はしませんでした。","choices":[["仕事中の景色","急ぐ仕事の途中にも、知らない公園があったんですね。","empathy"],["時計について笑う","公園の時計も、たまには休憩していたのかもしれません。","curiosity"],["確認しなかった時計を残す","遠回りの公園で見た時計は、止まっていたかもしれない。その「かもしれない」のまま通り過ぎた景色も好きです。","followup"]],"key":"driver-05"},{"subject":"おにぎりの選抜会議","body":"コンビニで、おにぎりを二つ買うつもりが三つになりました。\n\n味を選んでいるうちに全員を落選させたくなくなったんです。主任よりも、私のほうが人事に向いていないかもしれません。","choices":[["選抜結果を笑う","三名とも採用。なかなか太っ腹な選考ですね。","empathy"],["味を尋ねる","結局、どの三つを選んだのでしょう。","curiosity"],["三名採用を承認する","おにぎりを二つ選ぶはずが三つとも採用。選抜会議の議長には、きっと優しい欠点がありますね。","followup"]],"key":"driver-06"},{"subject":"赤い手袋","body":"手袋の片方だけを、車のシートの下から見つけました。\n\nもう片方は見つかりません。こんなに長く一緒に運転していたのに、助手席の下にいるとは思いませんでした。","choices":[["発見を祝う","片方だけでも帰ってきたのは、ちょっとした再会ですね。","empathy"],["もう片方を想像する","もう一方は、どこを旅しているんでしょう。","curiosity"],["片手袋の帰還を祝う","シートの下から片方だけ帰ってきた赤い手袋。もう片方については、捜索願いを出すか保留にしましょう。","followup"]],"key":"driver-07"},{"subject":"午前三時の青信号","body":"信号待ちをしていたら、向こうの道に車が一台もいませんでした。\n\n青になって走り出す瞬間だけ、道路が自分のために用意されたみたいに感じました。もちろん制限速度は守っています。","choices":[["景色を受け取る","誰もいない交差点にも、ちゃんと信号の順番があるんですね。","empathy"],["安全に触れる","最後の一文があると、安心して景色を想像できます。","curiosity"],["青信号の数秒を受け取る","誰もいない道が自分のために開いたように感じた、その一瞬。制限速度を守る但し書きまで、らしい報告ですね。","followup"]],"key":"driver-08"},{"subject":"いつもの缶の、違う温度","body":"前に自販機が新しくなった話を書きました。\n\n今夜は同じコーヒーを買ったのに、いつもより熱く感じました。機械のせいか、手が冷えていたせいかは不明です。主任に鑑定を頼みたいところですが、欠勤でした。","choices":[["鑑定を引き受ける","缶の温度まで主任案件とは、業務が広いですね。","empathy"],["違いを味わう","同じ一杯でも、夜によって感じ方が違うんですね。","curiosity"],["主任の欠勤を記録する","前に話していた自販機のコーヒー、今日は熱さが違ったんですね。主任が欠勤なら、鑑定結果は次回に持ち越しです。","followup"]],"key":"driver-09","requires":"driver-01"}],"fish":[{"subject":"しおりの位置","body":"本にしおりを挟む場所を間違えて、昨日読んだところを見失いました。\n\nしばらく探したあと、適当なページから読み始めました。意外と困りませんでした。私、こういういい加減さも持っていたみたいです。","choices":[["意外な一面を喜ぶ","間違えたしおりから、別の読み方を見つけたんですね。","empathy"],["本の話を尋ねる","どんな本を読んでいたのでしょう。","curiosity"],["しおりの迷子を見送る","読んでいた場所を見失っても、そのまま本を開けたんですね。困らない自分を見つけたことも、小さな発見です。","followup"]],"key":"fish-01"},{"subject":"黄色い付箋","body":"ノートに黄色い付箋を貼りました。\n\n書いたのは「あとで考える」の五文字だけ。何を考えるのか、もう思い出せません。付箋にも休日が必要なのかもしれませんね。","choices":[["付箋に休暇を与える","「あとで考える」だけ考えて、仕事を終えた付箋ですね。","empathy"],["小さな失敗を受け取る","忘れたことまで、今日の思い出になりましたね。","curiosity"],["付箋に休暇をあげる","「あとで考える」と書いた付箋が、何を待っていたか忘れてしまう。黄色い紙にも少し休暇が必要そうです。","followup"]],"key":"fish-02"},{"subject":"一人分の席","body":"大学の食堂で、一人用の席に座りました。\n\n誰かと食べるのも好きですが、今日は周りの会話を聞かずに、ご飯の味だけ考えてみたかったんです。唐揚げが思ったより熱かったです。","choices":[["一人の時間を大切に","誰かと過ごす日も、一人で味わう日もありますよね。","empathy"],["熱さに笑う","唐揚げは、少し張り切りすぎたようですね。","curiosity"],["唐揚げの温度を覚える","一人分の席で、会話よりご飯の味に集中した日。熱い唐揚げが、いちばん率直な感想だったかもしれませんね。","followup"]],"key":"fish-03"},{"subject":"小さな鉛筆削り","body":"筆箱の底から、昔使っていた小さな鉛筆削りが出てきました。\n\nもう鉛筆を使う機会は少ないのに、捨てずに入れていました。試しに一本削ると、木の匂いがしました。","choices":[["匂いを受け取る","木の匂いで、ずいぶん前の教室が浮かびそうですね。","empathy"],["残していた理由","ずっと筆箱に入っていたのは、少し嬉しいですね。","curiosity"],["木の匂いを受け取る","もうあまり使わない鉛筆削りから、木の匂いが戻ってきたんですね。筆箱の底にも、まだ出番がありました。","followup"]],"key":"fish-04"},{"subject":"返事を考えない散歩","body":"散歩中、スマホの通知を一度も見ませんでした。\n\n誰かから連絡が来ていたかもしれないけれど、今日は帰ってから確認することにしました。歩道の端に、小さな葉っぱが並んでいました。","choices":[["自分の歩幅を大切に","通知より先に、目の前の葉っぱを見たかった日なんですね。","empathy"],["葉っぱを尋ねる","何枚くらい並んでいたんでしょう。","curiosity"],["葉っぱの並びを聴く","通知を見ないで歩くと決めた散歩の途中に、葉っぱが並んでいた。返事をしない時間にも景色はありますね。","followup"]],"key":"fish-05"},{"subject":"寝ぐせの写真","body":"前髪が変な形になっていたので、記念に写真を撮りました。\n\n誰にも見せません。朝から笑いたくなったときに見返すためです。自分だけのアルバムって、こういう使い方でもいいですよね。","choices":[["内緒のアルバム","誰にも見せない写真だからこその楽しさがありますね。","empathy"],["寝ぐせに名前をつける","その寝ぐせ、作品名をつけるなら何でしょう。","curiosity"],["内緒のアルバムを歓迎","誰にも見せない寝ぐせの写真、いい使い道ですね。未来の自分を笑わせるための一枚なんですね。","followup"]],"key":"fish-06"},{"subject":"消えかけの文字","body":"ノートの端に書いた言葉が、消しゴムで薄くなっていました。\n\n何を書いたのか読めなくて、少し悔しかったです。でも、そのときの自分が何かを考えていたことだけはわかります。","choices":[["残った跡を受け取る","読めない文字にも、考えていた時間が残っているんですね。","empathy"],["無理に探さない","思い出せなくても、その跡はそこにありますね。","curiosity"],["読めない字をそのままに","消えかけて読めない文字があっても、何かを考えていた自分の跡は残っている。今夜はその話を聞けてよかったです。","followup"]],"key":"fish-07"},{"subject":"天気予報の見方","body":"明日の天気予報に、傘の絵が半分だけ出ていました。\n\n降るのか降らないのか、はっきりしない表示です。なんだか今日の自分の気分みたいで、ちょっと笑いました。","choices":[["曖昧さを楽しむ","半分だけの傘も、なかなか正直な予報ですね。","empathy"],["明日の支度を聞く","結局、傘は持っていくことにしましたか。","curiosity"],["半分の傘を眺める","天気予報の半分だけの傘に、自分の気分を重ねて笑えたんですね。はっきりしない日にも少し愛嬌があります。","followup"]],"key":"fish-08"},{"subject":"しおりを一枚増やした日","body":"前に本のしおりを間違えた話を書きました。\n\n今日は本屋さんで、もう一枚しおりをもらいました。今度は途中のページと、気に入った言葉のページの二か所に挟みます。迷子になる場所が増えた、とも言えます。","choices":[["二枚のしおりを歓迎する","途中とお気に入り、二つの居場所ができたんですね。","empathy"],["少し冗談を返す","本の中で道案内係を増員したようですね。","curiosity"],["二枚のしおりを見守る","前には一か所を見失った本に、今度は二枚のしおり。迷子の可能性まで増やしてみるのが面白いですね。","followup"]],"key":"fish-09","requires":"fish-01"}],"clock":[{"subject":"秒針のない時計","body":"散歩の帰り、秒針のない時計を見かけました。\n\n音がしない時計は、少し落ち着かないものですね。とはいえ、道端で耳を近づけるわけにもいきませんので、そのまま帰りました。","choices":[["時計屋の耳を思う","音のない時計に気づくのは、さすがですね。","empathy"],["小さな冗談","時計のほうが、静かな休日だったのかもしれません。","curiosity"],["秒針を確かめないでおく","音のない時計が気になっても、道端で耳を近づけなかった。その控えめな好奇心を楽しく聞きました。","followup"]],"key":"clock-01"},{"subject":"茶筒の底","body":"お茶の葉が少しだけ残っていたので、全部使って淹れました。\n\n思ったより濃くなりました。若いころなら失敗と言ったでしょうが、今日はそういう味として飲みました。","choices":[["濃いお茶を楽しむ","茶筒の最後の一杯には、その味がありますね。","empathy"],["昔との違い","同じ出来事でも、今は違う言葉で呼べるんですね。","curiosity"],["濃いお茶を味わう","茶筒の底の葉まで使った濃い一杯を、今日はその味として飲んだんですね。昔との違いもそのままでいいですね。","followup"]],"key":"clock-02"},{"subject":"図書室の鉛筆","body":"図書室で子どもが鉛筆を一本貸してくれました。\n\n私のほうが忘れ物をしたのです。返すと「また借りていいよ」と言われました。ずいぶん頼もしい先生です。","choices":[["先生にお礼を","小さな先生から、いい言葉をもらいましたね。","empathy"],["貸し借りを笑う","時計の先生も、鉛筆の授業では生徒ですね。","curiosity"],["小さな先生にお礼を","鉛筆を貸してくれた子どもから「また借りていいよ」。立場が入れ替わる図書室のひとときが、あたたかいですね。","followup"]],"key":"clock-03"},{"subject":"晴れの日の長靴","body":"朝の散歩で、晴れているのに長靴を履いた人を見かけました。\n\nたぶん仕事帰りなのでしょう。靴だけ見て天気を判断してはいけませんね。そう思いながら、空を見上げました。","choices":[["視点の違い","長靴が教えるのは、天気だけではありませんね。","empathy"],["景色を受け取る","晴れた空と長靴、不思議な組み合わせですね。","curiosity"],["長靴の事情を想像する","晴れの日の長靴を見て、天気ではなくその人の一日を考えたんですね。散歩道にはまだ知らない事情があります。","followup"]],"key":"clock-04"},{"subject":"ねじの入った小皿","body":"小さなねじを入れるための皿を、引き出しから見つけました。\n\n中は空っぽでした。もう修理はしていないのに、使い慣れた道具を並べると、手が仕事を覚えているようです。","choices":[["道具の記憶","ねじのない皿にも、長い仕事の時間が残っているんですね。","empathy"],["使い道を尋ねる","今なら、その小皿に何を入れたいですか。","curiosity"],["空のお皿を見つめる","ねじのない小皿にも、手が覚えている仕事の時間があるんですね。使わない道具の話も聞かせてください。","followup"]],"key":"clock-05"},{"subject":"名前を忘れた花","body":"朝の散歩で、知らない花を見つけました。\n\n昨日も見た気がしますが、同じ花かどうか自信がありません。時計なら型番を調べられますが、花はなかなか手ごわいですね。","choices":[["花に負ける時計屋","花にも型番がついていたら、散歩が少し忙しくなりそうです。","empathy"],["見たままを受け取る","名前がわからなくても、きれいだったことは残りますね。","curiosity"],["花の型番は保留する","時計なら型番が調べられても、散歩道の花は少し手ごわい。昨日と同じ花かも、今夜は決めずにおきましょう。","followup"]],"key":"clock-06"},{"subject":"静かな針の音","body":"夜中に目が覚めて、時計の音をしばらく聞いていました。\n\n数えようとすると、すぐ途中でわからなくなります。時間を数える道具の音を、人が数え損ねるとは面白いものです。","choices":[["可笑しさを楽しむ","時計が正確でも、聴く側には寄り道がありますね。","empathy"],["静けさを受け取る","その音を聴いていた夜も、大切な時間ですね。","curiosity"],["数え損ねた針を楽しむ","時間を刻む音を数えていたら、数えるほうが追いつかなくなる。時計屋さんらしい可笑しい夜ですね。","followup"]],"key":"clock-07"},{"subject":"図書室の返却箱","body":"図書室の返却箱に、小さな紙の鳥が一羽乗っていました。\n\n誰が折ったのか知りません。職員の方が「しばらく見張り番です」と言って、そのままにしていました。","choices":[["見張り番を歓迎する","紙の鳥も、図書室の大事なお仕事をしているんですね。","empathy"],["行方を尋ねる","その鳥、まだ同じ場所にいるでしょうか。","curiosity"],["紙の鳥の勤務を見守る","返却箱の見張り番になった紙の鳥。職員さんのひと言で、図書室の風景が少し賑やかになりますね。","followup"]],"key":"clock-08"},{"subject":"秒針を探さない午後","body":"前に秒針のない時計を見かけた話を書きました。\n\n今日は、音のしない部屋で本を読みました。静かさが気にならなくなるまで、少し時間がかかりましたが、途中で本の内容に夢中になっていました。","choices":[["静けさの変化","静かな部屋に慣れるまでにも、時間が必要だったんですね。","empathy"],["本の時間を尋ねる","どんな本が、その静けさを忘れさせたのでしょう。","curiosity"],["静けさの続きを受け取る","秒針のない時計を見たあとの、音のしない読書の午後。最後には本に夢中になっていたという続きがいいですね。","followup"]],"key":"clock-09","requires":"clock-01"}],"terminal":[{"subject":"ホームの広告","body":"駅のホームに、新しい広告が貼られていました。\n\n前の広告が何だったか、思い出せません。毎週見ていたはずなのに。帰りの電車では、今度はよく見ようと思いました。","choices":[["小さな変化に気づく","同じホームにも、知らないうちに変わる景色がありますね。","empathy"],["前の広告を想像する","前はどんな絵だったのでしょう。誰も覚えていないかもしれません。","curiosity"],["前の広告を思い出せないまま","毎週見ていた広告なのに、前の絵柄は思い出せない。駅に残るものと、通り過ぎるものの話ですね。","followup"]],"key":"terminal-01"},{"subject":"駅前のパン屋","body":"いつもの駅とは別の駅で、パンを一つ買いました。\n\n紙袋が温かくて、電車の中では開けられませんでした。家に帰る頃には冷めていましたが、それでもおいしかったです。","choices":[["紙袋の温かさ","電車の中で持っていた温かさまで伝わってくるようです。","empathy"],["パンを尋ねる","何のパンを買ったのでしょう。","curiosity"],["温かい紙袋を思う","電車の中では開けなかった紙袋が、帰るころに少し冷めていた。それでもおいしいパンの帰り道ですね。","followup"]],"key":"terminal-02"},{"subject":"二番目の改札","body":"通い慣れた駅の、いつも使わない改札を出てみました。\n\n駅前に小さな時計があることを初めて知りました。時刻は合っていました。普段の出口にもあったのかもしれません。","choices":[["知らない出口を喜ぶ","駅のもう一つの顔を見つけたんですね。","empathy"],["時計を気にする","その時計、また見に行きたくなりそうです。","curiosity"],["二番目の出口を歓迎","違う改札を出たら、いつもの駅に知らない時計があったんですね。通い慣れた場所にも裏面があります。","followup"]],"key":"terminal-03"},{"subject":"畳まれた地図","body":"引き出しから古い街の地図を見つけました。\n\n角が何度も折られていて、開くと元に戻りたがるんです。昔の道を指でたどってから、また畳みました。","choices":[["地図の折り目","何度も開いた場所には、紙にも記憶が残るんですね。","empathy"],["昔の道を尋ねる","その地図には、今も残っている道がありますか。","curiosity"],["地図の折り目をたどる","古い地図の折り目が戻りたがる、という言い方が好きです。指でなぞった昔の道は、まだ紙の中にありますね。","followup"]],"key":"terminal-04"},{"subject":"時刻表の空白","body":"時刻表を見ていたら、一時間だけ電車のない時間がありました。\n\nその時間にホームにいる人は、何をして過ごすのでしょう。待つのではなく、最初からそこにいたい人もいるかもしれません。","choices":[["空白の時間","何も来ないとわかっているホームにも、人の時間はありますね。","empathy"],["想像を広げる","一時間を過ごすなら、何を持っていきましょうか。","curiosity"],["電車のない一時間を考える","誰も乗せない時間のホームにも、そこにいる理由があるかもしれません。待つことだけが駅での過ごし方ではないですね。","followup"]],"key":"terminal-05"},{"subject":"ポケットの切符","body":"上着のポケットから、古い切符ではなく新しいレシートが出てきました。\n\n自分でも少しがっかりしました。けれど、買った飲み物のことはちゃんと思い出せたので、それでよしとします。","choices":[["今日の記録","古い切符ではなく、今日のレシートだったんですね。","empathy"],["飲み物を尋ねる","何を買った日のレシートでしたか。","curiosity"],["レシートの話も聴く","切符を期待して見つけたのは新しいレシート。でも買った飲み物を思い出せたなら、それも今日の記録ですね。","followup"]],"key":"terminal-06"},{"subject":"公園のベンチ","body":"駅の近くの公園で、空いたベンチを見つけました。\n\n誰かを待つためではなく、靴ひもを結び直すために座りました。ほんの一分だけ、木の枝が揺れるのを見ていました。","choices":[["目的のない一分","靴ひもを結ぶために座って、木も見られたんですね。","empathy"],["景色を受け取る","誰も待たないベンチにも、いい時間がありますね。","curiosity"],["靴ひもの一分を聴く","誰かを待つためでなく、靴ひもを結ぶために座ったベンチ。木の枝が揺れる一分も、ちゃんとそこにありました。","followup"]],"key":"terminal-07"},{"subject":"反対方向の列車","body":"反対方向の電車が、いつもよりゆっくりホームに入ってきました。\n\nどこへ行く人が乗っているのか、少し考えました。自分の乗る電車の時刻は、ちゃんと確認しました。","choices":[["別の行き先","同じホームから、知らない一日へ向かう人もいるんですね。","empathy"],["現実的な一言","想像しながらも時刻を確かめるところが、いいですね。","curiosity"],["反対方向に目を向ける","普段と違う速さで入ってきた反対方向の列車。自分の予定を確かめながら、知らない人の行き先を想像したんですね。","followup"]],"key":"terminal-08"},{"subject":"前の広告を覚えていた人","body":"前に駅の広告が新しくなった話を書きました。\n\n今日、同じホームにいた人が「前のほうがよかった」と話していました。私は前の広告を思い出せません。誰かは覚えているのだと知って、少し嬉しくなりました。","choices":[["記憶の違い","自分が忘れた景色を、誰かは覚えているんですね。","empathy"],["見方を尋ねる","新しい広告は、どんなふうに見えましたか。","curiosity"],["誰かが覚えていた広告を思う","あなたが思い出せなかった前の広告を、同じホームの人は覚えていた。その違いを嬉しく感じた、というところが心に残ります。","followup"]],"key":"terminal-09","requires":"terminal-01"}],"bread":[{"subject":"パンの試作品番号","body":"試作品に「三号」と書いた札を置きました。\n\n店長に「一号と二号は？」と聞かれましたが、ありません。三号のほうが、おいしそうな気がしたんです。店長はしばらく考えていました。","choices":[["番号を面白がる","いきなり三号から始めるとは、将来有望な試作品ですね。","empathy"],["店長の反応","店長さんは、結局その番号を認めてくれましたか。","curiosity"],["三号から始まる番号に笑う","一号も二号もないのに、三号と呼ばれるパン。店長さんが考え込む様子まで、いい試作報告ですね。","followup"]],"key":"bread-01"},{"subject":"粉のついた靴","body":"仕事帰りに靴を見たら、白い粉がついていました。\n\n職場に置いてきたつもりが、足元にくっついて帰ってきたみたいです。コンビニの床を汚さないように、外で少し払いました。","choices":[["仕事の名残","厨房の一日を、靴が持って帰ってきたんですね。","empathy"],["少し笑う","靴までパンの仕込みに参加していたようですね。","curiosity"],["靴の粉を見送る","パン屋の一日が、靴の白い粉になって帰り道までついてきたんですね。コンビニの前で払ったところも、細やかな話です。","followup"]],"key":"bread-02"},{"subject":"焼きたての静けさ","body":"今日はいつもより少し早く、最初のパンが焼けました。\n\nそのあとお客さんが来るまでの数分、店はとても静かでした。パンだけが、仕事を終えた顔で並んでいました。","choices":[["静かな店を想像する","焼き上がったパンと二人きりの時間、いいですね。","empathy"],["パンの顔を尋ねる","仕事を終えた顔のパン、どんな形だったんでしょう。","curiosity"],["パンだけが並ぶ数分を聴く","お客さんが来る前の静かな店内で、焼きたてのパンだけが並んでいた。その数分も、ちゃんと仕事の一部なんですね。","followup"]],"key":"bread-03"},{"subject":"紙袋の絵","body":"紙袋の端に小さな顔を描いたら、店長に見つかりました。\n\n「店のマスコットにする？」と聞かれたので、慌てて消しました。顔のついたパン袋にも、権利があるんでしょうか。","choices":[["マスコットを歓迎する","紙袋からお店の顔が生まれかけたんですね。","empathy"],["権利の話に乗る","まずは本人、つまり紙袋の同意が必要そうです。","curiosity"],["紙袋の顔の権利を考える","店長さんがマスコットにしたがるほどの顔だったんですね。消された紙袋の顔にも、意見を聞いてみたいところです。","followup"]],"key":"bread-04"},{"subject":"名前のないパン","body":"新作のパンに、まだ名前がありません。\n\n店長は「味で勝負」と言いますが、値札に何と書くかが問題です。今日は仮に「パン」と書きました。お客さんに「それは知ってる」と言われました。","choices":[["正直な値札","「パン」は嘘ではないけれど、情報が少なすぎますね。","empathy"],["名前を考える","形や香りから、名前を決めてみるのはどうでしょう。","curiosity"],["値札の「パン」を受け取る","名前が決まらず値札に「パン」。お客さんの「それは知ってる」が見事な返答ですね。味の名前はまだこれから。","followup"]],"key":"bread-05"},{"subject":"焼け残った一個","body":"閉店間際にパンが一個だけ残りました。\n\n寂しそうに見えて、買って帰ろうか迷いました。けれど私はいつもパンを食べています。今日は店長に譲りました。店長は嬉しそうでした。","choices":[["最後の一個","売れ残りの一個にも、帰る場所があったんですね。","empathy"],["店長に笑う","店長さんの夕食会議は、即決だったみたいですね。","curiosity"],["最後の一個を見送る","残ったパンを店長さんに譲ったんですね。一個だけ残る夕方にも、小さな引き継ぎがあります。","followup"]],"key":"bread-06"},{"subject":"計量カップの目盛り","body":"計量カップの数字が薄くなっていて、見間違えそうになりました。\n\n道具を新しくしようと思いながら、まだ使っています。慣れたものほど、手放す理由を探してしまうんですね。","choices":[["道具への気持ち","長く使った道具には、数字以外にも慣れがありますね。","empathy"],["慎重に触れる","でも、材料を量るものですし、読みやすさも大事ですね。","curiosity"],["薄い目盛りを見つめる","見慣れた計量カップほど、替える理由を探してしまうんですね。数字が薄いという小さな困りごとも届きました。","followup"]],"key":"bread-07"},{"subject":"一番小さいクロワッサン","body":"焼いたクロワッサンの中に、一つだけずいぶん小さいのがありました。\n\n店長が「末っ子」と呼び始めたので、私もそう呼んでいます。もちろん、値札はちゃんとつけました。","choices":[["末っ子を祝う","クロワッサン一家にも、ちゃんと末っ子がいるんですね。","empathy"],["売れ行きを尋ねる","その末っ子は、誰の朝ごはんになったでしょう。","curiosity"],["末っ子の値札を確かめる","店長さんが小さなクロワッサンを「末っ子」と呼んでいるのに、値札はきちんと付いている。そこが可笑しいですね。","followup"]],"key":"bread-08"},{"subject":"三号の卒業","body":"前に試作品を「三号」と呼んだ話を書きました。\n\n今日は店長が「これ、もう売り物になるね」と言ってくれました。名前はまだ三号のままです。番号が残っていても、お店に並んでいいんでしょうか。","choices":[["三号を送り出す","三号が、とうとう売り場へ出る日が来たんですね。","empathy"],["名前のままを楽しむ","「三号」のまま愛されるパンも、悪くなさそうです。","curiosity"],["三号の卒業を喜ぶ","一号も二号もない三号が、とうとうお店に並べるところまで来たんですね。番号はそのままでも、前の話の続きが嬉しいです。","followup"]],"key":"bread-09","requires":"bread-01"}],"moon":[{"subject":"月面の落とし物","body":"月に落とし物センターがあったら、何が集まるでしょう。\n\n星のかけら、宇宙服のボタン、誰かのため息。最後のものは返送先がわからないので、保管期限は無期限にします。","choices":[["保管所を想像する","ため息の保管係は、なかなか忙しそうですね。","empathy"],["返送先を尋ねる","星のかけらは、誰のものになるのでしょう。","curiosity"],["落とし物の保管係を務める","月面の窓口で、返送先のないため息を無期限保管する。その係員には、ずいぶん長い夜勤がありそうです。","followup"]],"key":"moon-01"},{"subject":"プリンの地図","body":"冷蔵庫の棚を紙に描いたら、案外立派な地図になりました。\n\n「危険地帯：家族の視線」と書いたところで、自分で笑ってしまいました。宝物は、だいたい中央の段にあります。","choices":[["冒険に参加する","冷蔵庫の探索隊には、勇敢な隊員が必要ですね。","empathy"],["秘密保持を心配する","地図を作ると、秘密が一つ増えるのか減るのか難しいですね。","curiosity"],["危険地帯を地図に記す","冷蔵庫の地図に「家族の視線」という危険地帯。プリン探検隊には、慎重な行動が求められますね。","followup"]],"key":"moon-02"},{"subject":"雲の会議","body":"今日の雲は、全員が別の方向を向いている会議みたいでした。\n\n議長だけが遠くへ流れていきました。あれでは議決できません。でも、見ている分には平和そうです。","choices":[["会議を眺める","議長が流れていく会議、なかなか自由ですね。","empathy"],["議題を尋ねる","雲たちは何について話し合っていたのでしょう。","curiosity"],["議長の行方を気にする","みんな違う方向を向く雲の会議から、議長だけ流れていったんですね。散会の宣言は誰がするんでしょう。","followup"]],"key":"moon-03"},{"subject":"見えない星の番地","body":"星にも住所があったら、郵便配達は大変ですね。\n\n「右から三番目の小さな光」では届かないでしょう。だから今夜は、部屋の電気を一つ消して、窓から星を探していました。","choices":[["宇宙の配達を思う","星の番地を間違えた手紙は、どこへ届くのでしょう。","empathy"],["今夜の窓を受け取る","見えない星を探していた時間まで、伝わってきます。","curiosity"],["星の宛先を考える","「右から三番目の小さな光」では郵便は届かない。でも窓から探してみた、というところまで聞けて嬉しいです。","followup"]],"key":"moon-04"},{"subject":"宇宙のレシート","body":"月が光るたびにレシートを出すなら、品名は何でしょう。\n\n「夜の照明代」「海の満ち引き協力費」……書いていたら家族に、電気代の明細を見せられました。急に現実へ帰還しました。","choices":[["現実への帰還","月より先に、地上の請求書が届いたんですね。","empathy"],["品名を考える","「夢を見るための追加料金」は、無料だと嬉しいです。","curiosity"],["宇宙の請求書を保管する","月のレシートを考えていたら、家族から電気代の明細を渡された。宇宙と生活費が同じ机に並ぶ夜ですね。","followup"]],"key":"moon-05"},{"subject":"裏返したカレンダー","body":"カレンダーを一枚めくるとき、裏に何か描いてあったら楽しいのにと思います。\n\n試しに自分で小さな月を描きました。来月の私は、これを見つけて驚く予定です。","choices":[["未来の自分へ","来月の自分への、小さな仕掛けですね。","empathy"],["月の顔を尋ねる","その月は、どんな表情をしていますか。","curiosity"],["来月の自分に内緒にする","カレンダーの裏の小さな月は、来月の自分への秘密の贈り物ですね。発見したときの反応は、今はまだわかりません。","followup"]],"key":"moon-06"},{"subject":"満月の出欠確認","body":"空を見上げても月が見えなかったので、勝手に欠席扱いにしました。\n\nでも、月からすれば私の家の窓が小さいだけです。不公平な出欠簿ですね。明日は訂正印を用意します。","choices":[["出欠簿を正す","欠席理由の確認は、委員会でお願いします。","empathy"],["月の立場を考える","見えないだけで欠席にされる月も、困りますね。","curiosity"],["月の欠席届を預かる","見えない月を欠席扱いにしたあとで、窓の小ささに気づく。訂正印を用意するところまでが今夜の議事録ですね。","followup"]],"key":"moon-07"},{"subject":"地球の裏側に郵便局","body":"地球の裏側に郵便局があったら、地球を貫く短い配達ルートが欲しいですね。\n\nもちろん無理なのはわかっています。だから地図に穴を開けず、紙を折って近づけました。少しだけ満足しました。","choices":[["紙の近道","地球を傷つけずに、二つの場所を近づけたんですね。","empathy"],["郵便の行方","折り目を通った手紙は、少し急いで届きそうです。","curiosity"],["折り紙の近道を歓迎","地球に穴を開けず、地図を折って裏側を近づけたんですね。安全な宇宙工事として、こちらで認定します。","followup"]],"key":"moon-08"},{"subject":"落とし物センターの新規受付","body":"前に月面の落とし物センターを考えた話を書きました。\n\n今日、そこへ「明日のやる気」を預けに来る人を想像しました。本人が取りに来るまで、大切に保管します。私のやる気も少し探してもらいたいです。","choices":[["預かり証を発行する","「明日のやる気」には、期限のない預かり証を出しましょう。","empathy"],["自分の分を尋ねる","あなたのやる気、どの棚に置き忘れたんでしょう。","curiosity"],["明日のやる気を大切に預かる","月面の落とし物センターが、今度は明日のやる気まで預かるんですね。受け取りの期限は、どうかゆるめに。","followup"]],"key":"moon-09","requires":"moon-01"}],"sugar":[{"subject":"砂糖の重さ","body":"コーヒーに砂糖を入れるとき、今日は少しだけ音が違いました。\n\nカップの底に当たる音です。いつも同じように作っているつもりでも、耳は小さな違いを見つけますね。","choices":[["音を味わう","コーヒーにも、その日だけの音があるんですね。","empathy"],["砂糖について笑う","三杯の砂糖にも、合奏の練習が必要なのかもしれません。","curiosity"],["カップの底の音を聴く","砂糖が当たる音の違いに気づいた一杯だったんですね。いつものコーヒーにも、耳のための新しい話があります。","followup"]],"key":"sugar-01"},{"subject":"冷めるまでの話","body":"本を読みながらコーヒーを飲んでいたら、いつの間にか冷めていました。\n\n温め直すか迷ったのですが、そのまま飲みました。案外おいしかったです。最初から冷やしたわけではないのが、少し可笑しい。","choices":[["冷めた一杯を歓迎","冷めてから気づく味もあるんですね。","empathy"],["読んでいた本を尋ねる","どんな本が、コーヒーを忘れさせたんでしょう。","curiosity"],["冷めた一杯を受け取る","本を読んでいるうちに冷めたコーヒーを、そのまま飲んでおいしかったんですね。予定外の温度にも出番がありました。","followup"]],"key":"sugar-02"},{"subject":"夕方の薄い雲","body":"空に、とても薄い雲がありました。\n\n写真に撮るとほとんど写らなくて、消してしまいました。見たことまで消えたわけではないので、今日はそれでいいことにします。","choices":[["目に残る景色","写真に残らなくても、見ていた時間は残っていますね。","empathy"],["雲のかたち","どんな形に見えたのでしょう。","curiosity"],["写真に残らない雲を思う","薄い雲は写真にはほとんど写らなかった。でもあなたが見たことまで消えるわけじゃない、という言葉が好きです。","followup"]],"key":"sugar-03"},{"subject":"カップの取っ手","body":"マグカップの取っ手が、少しだけ右へ傾いていることに気づきました。\n\n買ったときからそうだったのか、今初めて見つけたのか。長い付き合いでも、知らないところがあるものですね。","choices":[["小さな発見","毎日持つカップにも、まだ知らない形があるんですね。","empathy"],["カップを尋ねる","そのカップは、どんな色をしていますか。","curiosity"],["傾いた取っ手に気づく","長く使ったカップにも、初めて見つける傾きがあるんですね。毎日の道具を見直す小さな瞬間でした。","followup"]],"key":"sugar-04"},{"subject":"雨を待つ窓","body":"降りそうで降らない空を、しばらく見ていました。\n\n洗濯物を取り込むか迷って、結局取り込みました。雨は降りませんでした。予報に勝ったのか負けたのか、わかりません。","choices":[["勝敗を決めない","降らなかった雨に、勝ち負けはつけられませんね。","empathy"],["日常を受け取る","洗濯物は無事。それだけでもいい一日です。","curiosity"],["勝敗のない予報を歓迎","洗濯物を取り込んだあとに雨は降らなかった。それが勝ちか負けか決められないところが、暮らしらしいですね。","followup"]],"key":"sugar-05"},{"subject":"二冊目の本","body":"読みかけの本があるのに、別の本を開きました。\n\n最初の本に申し訳ないので、机の上で二冊並べています。本棚に戻すのは、どちらかを読み終えてからにします。","choices":[["二冊の居場所","机の上に二冊分の時間が並んでいるんですね。","empathy"],["本たちを笑う","本同士で順番待ちの相談をしていそうです。","curiosity"],["二冊の順番は保留する","机の上で並んでいる読みかけの二冊。どちらが先に読み終わるかは、本たちにもまだ内緒ですね。","followup"]],"key":"sugar-06"},{"subject":"喫茶店の氷","body":"喫茶店で、氷の入った飲み物を頼みました。\n\n氷が小さくなるのを見ていたら、予定より長居しました。何も考えなかったわけではないのですが、何を考えたか覚えていません。","choices":[["溶ける時間","氷が小さくなる時間も、ちゃんとそこにあったんですね。","empathy"],["少し尋ねる","最後の氷は、いつ頃なくなったのでしょう。","curiosity"],["小さくなる氷を眺める","氷が溶けるのを見ていたら、喫茶店で予定より長く過ごしたんですね。何を考えていたか覚えていなくてもいい時間です。","followup"]],"key":"sugar-07"},{"subject":"一杯分の湯気","body":"今夜、カップから立つ湯気が窓の方へ流れていきました。\n\n風もないのに、不思議ですね。たぶん部屋の空気が動いているのでしょう。見えないものを見せてくれる一杯でした。","choices":[["湯気の役割","コーヒーが、部屋の空気の道筋を教えてくれたんですね。","empathy"],["窓の景色","窓の外は、どんな夜だったのでしょう。","curiosity"],["湯気の行き先を見送る","風がなくても窓の方へ流れた湯気が、部屋の空気を教えてくれたんですね。一杯分の小さな観察です。","followup"]],"key":"sugar-08"},{"subject":"もう一度、カップの取っ手","body":"前にカップの取っ手が傾いていた話を書きました。\n\n今日、別のカップを使ったら、真っすぐな取っ手にちょっと落ち着きませんでした。慣れというものは不思議です。明日はいつものカップに戻すつもりです。","choices":[["いつもの形","少し不揃いな形にも、ちゃんと慣れがあるんですね。","empathy"],["戻る理由","明日の一杯が、楽しみになりますね。","curiosity"],["いつもの取っ手に戻る日を思う","前に見つけた傾いた取っ手が、今度は落ち着く理由になったんですね。真っすぐなほうに違和感がある、という続きが面白いです。","followup"]],"key":"sugar-09","requires":"sugar-04"}],"anon":[{"subject":"電球の色","body":"部屋の電球を一つ替えました。\n\n前より少し黄色い光になりました。机の上の本が、別の家の本みたいに見えます。誰かに話すほどのことではないけれど、今夜はここに書いておきます。","choices":[["灯りの変化","本の色が変わって見えるほど、部屋の空気も変わったんですね。","empathy"],["静かな報告を喜ぶ","こういう報告こそ、深夜のラジオで聞きたいです。","curiosity"],["黄色い部屋を受け取る","電球を一つ替えただけで、机の本まで別の家のものに見えたんですね。そんな違いをここへ書いてくれて嬉しいです。","followup"]],"key":"anon-01"},{"subject":"靴ひもの結び目","body":"靴ひもを結び直したら、左と右で結び目の形が違っていました。\n\n気になったのはその瞬間だけで、家に着いたら忘れていました。思い出したので送ります。","choices":[["一瞬の発見","忘れたと思ったことが、夜になって戻ってきたんですね。","empathy"],["結び目を笑う","靴ひもにも、それぞれの流儀があるようです。","curiosity"],["結び目の違いを残す","左と右の結び目が違っていたことを、忘れてからまた思い出して送ってくれた。小さな話が届く夜でよかったです。","followup"]],"key":"anon-02"},{"subject":"隣の部屋の笑い声","body":"夜、隣の部屋から一度だけ笑い声が聞こえました。\n\n何がおかしかったのかは、もちろんわかりません。つられて少し笑ってしまったので、私もよくわからない人です。","choices":[["笑いの連鎖","何の冗談か知らなくても、笑いだけ届くことがあるんですね。","empathy"],["不思議を楽しむ","説明のない笑い声も、少しあたたかいですね。","curiosity"],["隣の笑いの余韻を聴く","何が可笑しかったかわからない笑い声に、少しつられて笑ったんですね。理由のわからない明るさもありますね。","followup"]],"key":"anon-03"},{"subject":"書き損じの封筒","body":"宛名を書く前に、封筒の表と裏を間違えました。\n\n結局、誰にも出さないメモを入れて机にしまいました。何かを送るつもりだったのか、途中でわからなくなってしまいました。","choices":[["途中の手紙","出さない封筒にも、机の中での役目があるんですね。","empathy"],["急がせない","何を入れたくなったのか、あとから決めてもいいですね。","curiosity"],["出さない封筒をそのままに","宛名を書く前に裏表を間違えた封筒は、誰にも出さないメモ入れになったんですね。送らない言葉の置き場所です。","followup"]],"key":"anon-04"},{"subject":"路地の植木鉢","body":"帰り道、植木鉢が三つ並んでいました。\n\n昨日までもあったのか、今日並んだのか、わかりません。名前は知らないけれど、いちばん端の鉢だけ少し傾いていました。","choices":[["端の鉢を思う","三つのうち、ひとつだけ傾いているのが目に残ったんですね。","empathy"],["誰かの暮らし","鉢を並べた人にも、今日の出来事があったのでしょうね。","curiosity"],["端の植木鉢を思う","三つの鉢がいつから並んでいたか、誰にもわからない。少し傾いた端の一つを覚えていたいですね。","followup"]],"key":"anon-05"},{"subject":"ラジオの音量","body":"今日はいつもより少し小さな音でラジオを聴きました。\n\n内容が聞こえなくなるほどではありません。たぶん静かな部屋のほうに、耳を寄せたかったんだと思います。","choices":[["小さな音を歓迎","声を近くに感じるために、音を小さくする夜もありますね。","empathy"],["聴く時間を受け取る","その部屋で聴いてくれて、ありがとうございます。","curiosity"],["小さな音で聴く夜を歓迎","声が聞こえるくらいの小さな音量にして、部屋の静けさにも耳を向けたかったんですね。今夜もここで聴いています。","followup"]],"key":"anon-06"},{"subject":"紙の端","body":"メモ用紙の端が、少し丸くなっていました。\n\n何度も触ったせいだと思います。書いたことより、紙を持っていた時間のほうが長かったのかもしれません。","choices":[["紙に残る時間","言葉以外にも、触れていた時間が紙に残るんですね。","empathy"],["そのままを認める","丸い端も、そのメモの一部ですね。","curiosity"],["紙に触れた時間を受け取る","丸くなった紙の端は、そこを触っていた時間の跡かもしれません。書かなかった時間も無駄には見えませんね。","followup"]],"key":"anon-07"},{"subject":"片方だけの靴下","body":"洗濯物の中に、片方だけの靴下がありました。\n\n探したらもう片方は別の場所にありました。何かを取り戻したような気分になったのに、もともと自分のものでした。","choices":[["再会を祝う","同じ家にいた二足の片割れが、無事に再会しましたね。","empathy"],["小さく笑う","靴下探偵としては、解決の早い事件でした。","curiosity"],["靴下の再会を祝う","別の場所にあった片方の靴下と再会したんですね。もともと自分のものなのに、取り戻した気になる可笑しさがあります。","followup"]],"key":"anon-08"},{"subject":"黄色い灯りの下で","body":"前に部屋の電球を替えた話を書きました。\n\nまだ少し黄色い光に慣れていません。でも昨夜は、その灯りの下で本を読みながら眠くなりました。明るさではなく、色が変わったことを忘れていました。","choices":[["部屋になじむ","新しい灯りが、少しずついつもの暮らしになったんですね。","empathy"],["本の続き","本は、どこまで読めたのでしょう。","curiosity"],["黄色い灯りの続きを聴く","前に替えた電球の色に、少しずつ慣れてきたんですね。本を読みながら眠くなった、その静かな続きを受け取りました。","followup"]],"key":"anon-09","requires":"anon-01"}],"umbrella":[{"subject":"花束の外側","body":"花束を包む紙が、一枚だけ少ししわになりました。\n\n取り替えようかと思いましたが、花はきれいに見えたので、そのまま渡しました。お客さんは紙のしわには気づかなかったみたいです。","choices":[["紙のしわを見る","花を包む紙にも、その日の仕事が残っていますね。","empathy"],["花束について尋ねる","どんな色の花を包んだのでしょう。","curiosity"],["しわのある花束を受け取る","包み紙のしわをそのままにして渡した花束。花がきれいに見えた、という判断を大切にしたいですね。","followup"]],"key":"umbrella-01"},{"subject":"水の音","body":"店を閉めたあと、花瓶の水を替えました。\n\n水を注ぐ音が思ったより大きくて、誰もいない店なのに少し驚きました。営業中は気づかない音があるものですね。","choices":[["閉店後の音","人の声がなくなると、水の音がよく聞こえるんですね。","empathy"],["店の静けさ","そういう静かな店内も、少し見てみたいです。","curiosity"],["閉店後の水音を聴く","お客さんのいない花屋では、水を注ぐ音も違って聞こえるんですね。店を閉めたあとの小さな景色です。","followup"]],"key":"umbrella-02"},{"subject":"一本だけ長い茎","body":"花束の中に、一本だけ茎の長い花がありました。\n\n揃えて切るか迷いましたが、今日は少しだけ飛び出したままにしました。お客さんは「元気そう」と笑っていました。","choices":[["はみ出しを喜ぶ","揃っていないからこそ、元気に見える花もあるんですね。","empathy"],["花の種類を聞く","何の花が、いちばん背が高かったのでしょう。","curiosity"],["背の高い花を見送る","一本だけ飛び出した花を「元気そう」と受け取ったお客さん。揃えなかったことが、いい出会いになりましたね。","followup"]],"key":"umbrella-03"},{"subject":"店先の小さな影","body":"店先に置いた鉢が、夕方になると小さな影を作ります。\n\n今日はその影が、隣の鉢に少しかかっていました。花同士で場所を譲り合っているみたいで、しばらく眺めていました。","choices":[["影の時間","花だけでなく、影にも夕方の仕事があるんですね。","empathy"],["少し笑う","鉢同士の席替え会議かもしれません。","curiosity"],["鉢の影の席替えを眺める","夕方の影が隣の鉢にかかって、花同士が場所を譲るみたいだった。そんな観察ができる店先ですね。","followup"]],"key":"umbrella-04"},{"subject":"値札の小さな絵","body":"値札の隅に、花の絵を描きました。\n\n絵心はないのですが、何の花かわかるくらいには描けたと思います。お客さんには「かわいい鳥ですね」と言われました。","choices":[["鳥になった花","花の値札から、思いがけず鳥が生まれましたね。","empathy"],["絵について尋ねる","どの花を描いたつもりだったんでしょう。","curiosity"],["鳥になった値札を歓迎","花の絵が、お客さんには鳥に見えた。値札の端から新しい生き物が一羽生まれたと思うと、可笑しいですね。","followup"]],"key":"umbrella-05"},{"subject":"雨上がりのバケツ","body":"雨のあとの朝、店の外のバケツに水が少したまっていました。\n\nもったいないと思って手に取ったけれど、花にはきれいな水を使うことにしました。雨水は植木鉢の土にあげました。","choices":[["水の行き先","雨の水にも、似合う場所が見つかったんですね。","empathy"],["仕事ぶりを受け取る","花を育てるには、こういう小さな判断がたくさんあるんですね。","curiosity"],["雨水の行き先を受け取る","花にはきれいな水を、雨水は植木鉢の土へ。もったいない気持ちと手入れの判断が両方あるんですね。","followup"]],"key":"umbrella-06"},{"subject":"休業日の張り紙","body":"店の休みの日を知らせる紙を書きました。\n\n「休ませていただきます」と書いて、少し考えてから「お休みです」に変えました。花たちの水だけは、ちゃんと頼んであります。","choices":[["休みを歓迎する","「お休みです」と書けたことも、いい知らせですね。","empathy"],["張り紙について笑う","花たちには、誰が休業を説明してくれるんでしょう。","curiosity"],["お休みの言葉を選ぶ","「休ませていただきます」を「お休みです」に変えた一枚の紙。言葉を選んだ時間も、休業の準備なんですね。","followup"]],"key":"umbrella-07"},{"subject":"小さな紙袋","body":"一輪だけ買ったお客さんに、小さな紙袋を渡しました。\n\nその人は袋に入れず、花を手に持って帰りました。紙袋は不要になりましたが、なんだか素敵な光景でした。","choices":[["一輪の帰り道","花を手に持って歩く帰り道が、目に浮かびます。","empathy"],["紙袋の出番","その紙袋にも、いつか別の花の出番が来ますね。","curiosity"],["紙袋の出番を保留する","一輪の花を手に持って帰ったお客さんには、紙袋が必要なかった。袋より花が見える帰り道ですね。","followup"]],"key":"umbrella-08"},{"subject":"花束のしわ、もう一度","body":"前に花束の紙がしわになった話を書きました。\n\n今日、別のお客さんが包み紙の折り目を見て「これもきれいですね」と言ってくれました。花とは関係ないところまで見てくれる人がいるんですね。","choices":[["折り目を喜ぶ","花を包む手つきまで見てくれたような言葉ですね。","empathy"],["見方の違い","紙の折り目にも、その人だけの美しさがあるんですね。","curiosity"],["包み紙を見つめ直す","前に気になった花束のしわが、今日はお客さんに褒められる折り目になった。見方が変わる続きが嬉しいです。","followup"]],"key":"umbrella-09","requires":"umbrella-01"}],"triangle":[{"subject":"消しゴムの形","body":"消しゴムの角を削っていたら、変な五角形になりました。\n\n授業には関係ありません。でも机の上で転がすと、一か所だけ止まりやすいんです。発見、と呼んでいいでしょうか。","choices":[["発見を認定する","授業と関係なくても、立派な観察だと思います。","empathy"],["次の実験を聞く","今度は、どんな形で試してみますか。","curiosity"],["五角形の実験を受理する","転がしてみると一か所だけ止まりやすい消しゴム。授業の外にも観察する楽しさがあるんですね。","followup"]],"key":"triangle-01"},{"subject":"三本目の定規","body":"筆箱に定規が二本あるのに、もう一本欲しくなりました。\n\n理由は目盛りの色が違うからです。家では「一本で十分」と言われました。確かにそうです。でも、十分と好きは違いますよね。","choices":[["好きの理由","必要だから持つものと、好きだから持つものがありますね。","empathy"],["三本を笑う","定規が三本集まったら、会議が始まりそうですね。","curiosity"],["好きと必要を分けておく","一本でも足りる定規を三本欲しくなる。必要と好きは違う、という今夜の主張には一理あります。","followup"]],"key":"triangle-02"},{"subject":"図書室の地図","body":"図書室の本棚の配置を、ノートに描いてみました。\n\n実際の棚よりずいぶん大きな迷路になりました。貸出カウンターへ戻れない図書室は、ちょっと困ります。","choices":[["迷路を楽しむ","本を借りるだけでも冒険になりそうですね。","empathy"],["出口を尋ねる","その図書室には、ちゃんと出口がありますか。","curiosity"],["迷路の出口を確保する","本棚の地図が大きな迷路になったんですね。貸出カウンターへの道だけは、ぜひ残しておきましょう。","followup"]],"key":"triangle-03"},{"subject":"屋上の気圧","body":"天気の授業で気圧の話を聞きました。\n\n帰り道、空を見上げても数字は見えません。当然です。だからノートに「空は数字を隠すのが上手」と書きました。先生には見せていません。","choices":[["空の秘密","数字でわかることと、見上げてわかることは違いますね。","empathy"],["先生の反応を想像","もし見せたら、先生は何と返すでしょう。","curiosity"],["空の数字を想像する","気圧の数字が空に書いていないことまで、ノートの言葉にしてみたんですね。先生に見せていない一行も面白いです。","followup"]],"key":"triangle-04"},{"subject":"将来の名刺","body":"将来の自分の名刺を、三種類描きました。\n\n建物をつくる人、天気を伝える人、本をつくる人。どれも名前は同じです。当たり前だけど、少し安心しました。","choices":[["名前は同じ","どんな仕事を選んでも、同じ名前のあなたがいるんですね。","empathy"],["名刺の形","三枚の名刺は、色も違うのでしょうか。","curiosity"],["三枚の名刺を並べる","建物、天気、本。それぞれ違う仕事の名刺に同じ名前があることが、少し安心だったんですね。","followup"]],"key":"triangle-05"},{"subject":"宿題の一行目","body":"宿題を始めようとして、一行目の文字だけ丁寧に書きました。\n\n二行目からはいつもどおりです。一行目だけ褒めてもらえたらいいのにな、と思います。","choices":[["一行目を褒める","その一行目、今夜の特別賞をあげたいです。","empathy"],["二行目も認める","二行目からのいつもの字も、きっとあなたらしいですよ。","curiosity"],["一行目に賞を贈る","一行目だけ丁寧な宿題にも、ちゃんと力が入っています。今夜はその一行目に小さな賞を出しましょう。","followup"]],"key":"triangle-06"},{"subject":"友達の好きな色","body":"友達が、ずっと青が好きだと思っていました。\n\n今日聞いたら、今は黄色だそうです。私が知らないあいだに変わったんですね。そういうこと、きっとたくさんあります。","choices":[["変化を受け取る","仲のいい友達にも、新しい発見がありますね。","empathy"],["自分の色を尋ねる","あなたは今、何色が好きですか。","curiosity"],["黄色になった好きを受け取る","ずっと青だと思っていた友達の好きな色が、今は黄色。知らないあいだにも人は変わるという発見ですね。","followup"]],"key":"triangle-07"},{"subject":"見つからない消しゴム","body":"消しゴムが見つからず、五分探しました。\n\n机の上の本の下にありました。探しているあいだ、消しゴムの形を考えすぎたせいか、最後は少し笑ってしまいました。","choices":[["探検の成果","机の上にも、思いがけない探索場所があるんですね。","empathy"],["小さく笑う","消しゴムも、ちょっと休んでいたのかもしれません。","curiosity"],["本の下の発見を喜ぶ","五分探した消しゴムは、本の下にいたんですね。探しているあいだに形を考えすぎた、というところも好きです。","followup"]],"key":"triangle-08"},{"subject":"五角形の、その後","body":"前に消しゴムを五角形にした話を書きました。\n\n今日はその五角形を友達に見せました。「それ、使いづらくない？」と言われました。たしかに。発見は、実用性と別のところにあるようです。","choices":[["発見の続き","使いやすさより面白さが先に来る日もありますね。","empathy"],["友達に同意する","五角形の消しゴム、使うときには少し工夫が要りそうです。","curiosity"],["五角形の実用性は保留","前に作った五角形を友達に見せたら、使いづらさを指摘された。それでも発見が消えるわけではありませんね。","followup"]],"key":"triangle-09","requires":"triangle-01"}],"fridge":[{"subject":"料理人の朝ごはん","body":"仕事では人の食事を作るのに、自分の朝ごはんは食パン一枚でした。\n\nしかも少し焦がしました。職場の仲間には、絶対に見せられません。焦げたところは自分で食べました。","choices":[["秘密を守る","朝ごはんの失敗は、こちらのスタジオだけの秘密にしましょう。","empathy"],["料理人にも休み","自分のための料理が、いつも完璧でなくてもいいですよね。","curiosity"],["焦げた朝ごはんを受け取る","人に料理を作る仕事をしていても、自分の食パンを少し焦がす朝がある。今夜の秘密は厨房の外だけに置いておきます。","followup"]],"key":"fridge-01"},{"subject":"冷蔵庫の光","body":"家の冷蔵庫を開けると、そこだけ急に明るくなります。\n\n夜中に何かを食べたいわけではないのに、しばらく眺めてしまいました。光の中にあるのは、豆腐と卵くらいです。","choices":[["小さな景色","豆腐と卵を照らす光も、ちゃんと今夜の景色ですね。","empathy"],["調理の相談","その二つで何か作るなら、どんな料理になりますか。","curiosity"],["豆腐と卵の光景を思う","冷蔵庫の光に照らされた豆腐と卵を、しばらく眺めていたんですね。食べない時間にも台所の景色があります。","followup"]],"key":"fridge-02"},{"subject":"包丁の休憩","body":"包丁を研いだあと、きれいな布の上に置いて眺めていました。\n\n仕事の道具を家でまで思い出したくない日もあるのですが、今日は道具の形がきれいに見えました。","choices":[["道具の美しさ","使い慣れた道具を、仕事とは別の目で見た夜なんですね。","empathy"],["休憩を認める","包丁にも、あなたにも、少し休憩があるといいですね。","curiosity"],["包丁の形に目を留める","研いだ包丁を布の上に置いて、形を眺めた。仕事を離れた目で道具を見る夜もあるんですね。","followup"]],"key":"fridge-03"},{"subject":"二口だけのスープ","body":"家でスープを作りました。\n\n量を間違えて、二口分だけになりました。鍋を洗う手間のほうが長かったです。おいしかったので、失敗と呼ぶかは保留にします。","choices":[["二口を味わう","短いスープにも、ちゃんとおいしさがありますね。","empathy"],["洗い物に笑う","鍋のほうが長く働いた夜ですね。","curiosity"],["二口のスープを味わう","鍋を洗うほうが長かった二口分のスープ。それでもおいしかったなら、失敗の判定は保留でよさそうです。","followup"]],"key":"fridge-04"},{"subject":"空っぽの買い物かご","body":"仕事帰りにスーパーへ行きました。\n\n何を買うか決められず、空のかごを持ったまま一周しました。結局、お茶だけ買って帰りました。料理が得意でも買い物が得意とは限りません。","choices":[["買い物の難しさ","作れるものが多いほど、逆に迷うこともあるんですね。","empathy"],["一杯を受け取る","買って帰ったお茶は、おいしかったですか。","curiosity"],["空のかごを見送る","料理が得意でも、買い物は迷う。お茶だけ買って帰った一周分の時間も、今日の暮らしですね。","followup"]],"key":"fridge-05"},{"subject":"皿の真ん中","body":"店で出す料理は、皿の真ん中にきれいに盛ります。\n\n家では端に寄せて食べることがあります。理由は、洗いやすいからです。仕事では言わない工夫も、暮らしにはあるんですね。","choices":[["暮らしの工夫","人に出す皿と、自分の皿では考えることが違うんですね。","empathy"],["端の料理を笑う","皿の端にも、ちゃんと指定席があるようです。","curiosity"],["皿の端の工夫を認める","家では洗いやすいように端へ盛る、という小さな工夫。仕事の皿と自分の皿は、別の役目がありますね。","followup"]],"key":"fridge-06"},{"subject":"お鍋の持ち手","body":"鍋の持ち手が少し熱くなっていました。\n\nいつもなら気づくのに、家では油断してしまいました。大丈夫でしたが、道具の扱いは場所が変わっても同じですね。","choices":[["気づきを受け取る","家の台所でも、気をつけることはありますね。","empathy"],["無事を喜ぶ","大事にならなくてよかったです。","curiosity"],["無事だった手を気遣う","鍋の持ち手が熱いと気づいて、大事にならずによかったです。慣れた仕事道具でも、家では違うことがありますね。","followup"]],"key":"fridge-07"},{"subject":"厨房の時計","body":"厨房の時計を見たら、いつもより五分進んでいました。\n\n直してもらうまで、みんなで頭の中で五分引いて働きました。忙しいのに、なぜか妙な連帯感がありました。","choices":[["五分の連帯感","みんなで同じ計算をしながら働くの、少し可笑しいですね。","empathy"],["時計にひと言","時計も、少し仕事を急ぎたかったのかもしれません。","curiosity"],["五分の計算を受け取る","厨房のみんなで時計の五分を引き算しながら働いた。忙しい日の妙な連帯感まで聞こえてきます。","followup"]],"key":"fridge-08"},{"subject":"二口目のスープ","body":"前に二口しかできなかったスープの話を書きました。\n\n今日はもう少し多く作りました。味は前とほとんど同じです。でも三口目があるだけで、ずいぶん落ち着きました。今度は鍋も納得したでしょう。","choices":[["三口目を祝う","三口目があるだけで、気分まで違うんですね。","empathy"],["鍋の満足を笑う","鍋もやっと、働きに見合う量を作れましたね。","curiosity"],["三口目の余裕を喜ぶ","前は二口だけだったスープに、今日は三口目があったんですね。鍋の満足はわかりませんが、その落ち着きは伝わります。","followup"]],"key":"fridge-09","requires":"fridge-04"}]};
function everydayCompose4827(id,n){
 if(n<29||chapter3IsNight(n))return null;
 const bank=EVERYDAY_LETTERS_4827[id];if(!bank)return null;
 const prior=(s.regular?.everydayHistory47?.[id]||[]).filter(x=>x&&Number.isInteger(x.night)&&x.night<n);
 const done=new Set(prior.map(x=>x.key));
 const last=prior.reduce((max,x)=>Math.max(max,x.night),0);
 if(last&&n-last<55)return null; // ほかの人生の話題も届く余白を残す
 // 後日談が引用する、その手紙が実際に届いてから時間を置く。
 // ある人物の最初の手紙を基準にすると、別の話題の後日談が先に届いてしまう。
 const unused=bank.filter(x=>{
  if(done.has(x.key))return false;
  if(!x.requires)return true;
  const source=prior.find(entry=>entry.key===x.requires);
  return Boolean(source&&n-source.night>=12);
 });
 if(!unused.length)return null;
 const choice=unused.sort((a,b)=>{
  // 手紙の順番は固定せず、セーブの乱数を消費しない。新作が一度届いたら候補から外れる。
  return (simHash('everyday47:'+id+':'+n+':'+a.key)%1000)-(simHash('everyday47:'+id+':'+n+':'+b.key)%1000);
 })[0];
 return {kind:'everyday47',tag:'everyday47:'+choice.key,subject:choice.subject,body:'こんばんは。\n\n'+choice.body,choices:choice.choices.map(row=>[...row])};
}


// v4.9.14: 百夜を越えても知っている人の新しい日常が届く、各人2通の独立した便箋。
// セーブの過去を遡って挿入せず、第150夜以降の新規生成の夜だけ対象。
const LATERLIFE_CARDS_4914 = {"cat":[{"subject":"間違った階の景色","body":"こんばんは。\n\n用事を済ませて帰る途中、エレベーターで違う階のボタンを押してしまいました。扉の向こうには、自分の知っている建物とは少し違う廊下がありました。すぐ乗り直したので何も起きていません。でも、あの数秒だけ、知らない場所に来たような気がしたんです。","choices":[["数秒の景色","同じ建物にも、ふだん見ない廊下があるんですね。","empathy"],["少し尋ねる","その廊下は、どんな明かりでしたか。","curiosity"],["余韻を残す","間違いで開いた扉の景色も、今日の一枚ですね。","followup"]]},{"subject":"絵を描かない色見本","body":"こんばんは。\n\n文具店で色見本の紙を一枚もらいました。何かを描く予定はないのに、机に置いて、ときどき眺めています。名前の知らない灰色がいくつもあって、灰色にも案外忙しい世界があるんだなと思いました。使わなくても持っていていい紙があるのは、少し気楽です。","choices":[["灰色を楽しむ","使う予定のない色見本にも、眺める楽しさがありますね。","empathy"],["好きな色を聞く","その中で、いちばん気になる灰色はどれですか。","curiosity"],["名づけを急がない","名前を知らない色が並んでいる時間、いいですね。","followup"]]}],"driver":[{"subject":"手袋の置き場所","body":"こんばんは。\n\n休憩所で手袋を外したら、片方だけポケットに入れてしまいました。もう片方を探して、しばらく自分の手に持っていることに気づかなかったんです。荷物の置き忘れには気をつけているのに、自分の手袋には案外甘いようです。猫主任なら、きっと査定を下げます。","choices":[["小さな査定","手に持ったまま探していた手袋、主任の採点が気になります。","empathy"],["笑って返す","荷物ではなく手袋の追跡に失敗した夜ですね。","curiosity"],["安全に触れる","仕事の道具は、落ち着いて確認するのが一番ですね。","followup"]]},{"subject":"道案内のない場所","body":"こんばんは。\n\n休憩中、紙の地図を広げてみました。行き先を探すためではなく、名前だけ知っている町がどの辺りにあるのか確かめたかったんです。配送予定にはない小さな町が、紙の上ではすぐ隣にありました。仕事で行かない場所のことを考えるのも、たまにはいいですね。","choices":[["地図の余白","仕事の目的地ではない町にも、暮らしがありますね。","empathy"],["町を尋ねる","その町の名前は、どんな響きでしたか。","curiosity"],["寄り道を楽しむ","実際に走らなくても、地図の上で寄り道できますね。","followup"]]}],"fish":[{"subject":"小さな博物館","body":"こんばんは。\n\n商店街の片隅に、古い道具を三つだけ展示した小さな場所がありました。たまたま通りかかって、十分快く眺めました。知らない人の使っていた道具なのに、なぜか親しく感じるものが一つありました。何に使う道具なのかは、最後までわかりませんでした。","choices":[["知らない道具","用途を知らないまま親しく感じるものって、不思議ですね。","empathy"],["一つを尋ねる","いちばん気になった道具は、どんな形でしたか。","curiosity"],["わからなさを残す","説明がつかないまま好きになっても、いいですよね。","followup"]]},{"subject":"失敗したしりとり","body":"こんばんは。\n\n友達と歩きながら、久しぶりにしりとりをしました。途中で同じ言葉を二回使ってしまって、二人とも気づかず三周くらい続けました。最後に気づいて笑いました。正しく遊べなかったのに、あの時間はちゃんと楽しかったです。","choices":[["二人の遊び","間違いに気づかなかった時間まで、楽しそうですね。","empathy"],["少し笑う","三周も見逃された言葉は、なかなかの常連ですね。","curiosity"],["正しさをほどく","遊びの正解より、笑ったことが残った日ですね。","followup"]]}],"clock":[{"subject":"名前のない箱","body":"こんばんは。\n\n引き出しを整理していたら、何も書いていない小箱が出てきました。ふたを開けると、中には予備のボタンが二つ。どちらの服のものかは思い出せません。捨てるのも妙なので、今日は箱に「ボタン」とだけ書いて戻しました。きちんとした分類とは言えませんね。","choices":[["小箱を受け取る","何の服かわからないボタンにも、置き場所があるんですね。","empathy"],["冗談を返す","「ボタン」という分類は、間違ってはいませんね。","curiosity"],["余白を残す","元の持ち主を思い出さなくても、その箱はそこにありますね。","followup"]]},{"subject":"時刻を聞かない散歩","body":"こんばんは。\n\n散歩中、公園のベンチで少し休みました。時計を持っていましたが、あえて見ませんでした。長くいたつもりでも、短かったのかもしれません。帰りにお茶を淹れて、どちらでもよかったのだと気づきました。時計の話をする者が、こんな報告をするのも妙ですね。","choices":[["時間の使い方","時刻を確かめない散歩にも、いい時間が流れていますね。","empathy"],["少し微笑む","時計に、今日は休暇を取ってもらったのでしょうか。","curiosity"],["そのまま受け取る","長かったか短かったか、決めなくてもいい休憩ですね。","followup"]]}],"terminal":[{"subject":"知らない停留所","body":"こんばんは。\n\n用事の帰りに、いつもとは違うバス停を通りました。時刻表の下に、手書きの「傘をお忘れなく」という紙が貼ってありました。誰が貼ったのかも、誰に向けた言葉なのかもわかりません。雨は降っていませんでしたが、私はその紙を覚えて帰りました。","choices":[["言葉を受け取る","雨の降らない日にも、誰かを気づかう紙が残っていたんですね。","empathy"],["紙のことを聞く","その文字は、どんな筆跡でしたか。","curiosity"],["余韻を残す","行き先より、バス停に残った一言を持ち帰った日ですね。","followup"]]},{"subject":"駅名のない葉書","body":"こんばんは。\n\n古道具屋で、絵葉書を一枚見かけました。どこかの駅らしいのですが、駅名が書いてありません。切符売り場の窓が小さく、ベンチが一つありました。買わずに店を出ました。それでも、しばらくあの駅がどこにあるのか考えてしまいました。","choices":[["知らない駅","行ったことのない駅の景色が、心に残ったんですね。","empathy"],["ベンチを尋ねる","その一つのベンチには、どんな光が当たっていましたか。","curiosity"],["答えを急がない","名前がわからないままの駅も、心の中には残りますね。","followup"]]}],"bread":[{"subject":"包装紙の大発見","body":"こんばんは。\n\n店で使う包装紙の柄を、新しいものに替えました。小さな麦の絵が並んでいます。ところがよく見ると、一か所だけ麦ではなく鉛筆みたいな形がありました。印刷のずれかもしれませんが、見つけてからは包むたびに探してしまいます。仕事中のひそかな遊びです。","choices":[["小さな発見","毎日使う包装紙に、秘密の鉛筆が見つかったんですね。","empathy"],["笑って聞く","全部で何本の鉛筆が紛れ込んでいるんでしょう。","curiosity"],["包む時間を喜ぶ","包むたびに探す楽しみが一つ増えましたね。","followup"]]},{"subject":"ひとつ余ったトレー","body":"こんばんは。\n\n焼き上がったパンを並べたら、トレーが一枚だけ余りました。空っぽのまま棚に置いておいたら、店長が「今日いちばんの人気商品」と言いました。何も載っていないのに、つい値札をつけたくなりました。もちろん、空のトレーは売っていません。","choices":[["空っぽの人気商品","空のトレーがいちばんの人気商品とは、店長さんらしいですね。","empathy"],["値札を考える","もし値札をつけるなら、いくらにしましょう。","curiosity"],["笑いを残す","何もない棚にも、笑い話が載った日ですね。","followup"]]}],"moon":[{"subject":"雲の受付番号","body":"こんばんは。\n\n雲に整理券を配る係がいたら、番号は何から始まるのでしょう。私は「きのう」の次を「まだ」としたいです。今日の雲は、順番を待たずに流れていくように見えました。家族には「雲に用事はないよ」と言われました。もっともな反論です。","choices":[["受付の混雑","雲は整理券を待たずに流れるので、受付が大変そうですね。","empathy"],["番号を尋ねる","「まだ」の次の番号は、何になるのでしょう。","curiosity"],["反論も歓迎","家族のもっともな反論まで、今夜の議事録ですね。","followup"]]},{"subject":"影の出張申請","body":"こんばんは。\n\n夕方、窓の影が机の上を少しずつ移動していました。影が勝手に席替えをしたので、出張申請書が必要ではないかと考えました。理由の欄には「太陽の都合」と書きます。家族に見せたら、申請者は太陽のほうではないかと言われました。審査が難航しています。","choices":[["出張を受理する","理由が「太陽の都合」なら、まず申請先を決めないとですね。","empathy"],["少し問う","太陽が申請者なら、影は代理人でしょうか。","curiosity"],["議事録を閉じる","席替えした影を見て、家族と会議が始まるのが楽しいですね。","followup"]]}],"sugar":[{"subject":"白くない砂糖の話","body":"こんばんは。\n\n喫茶店の小さな棚に、白いもの以外も並んでいました。角砂糖の包装紙が、黄緑や薄紫だったんです。中身の味はいつもと同じはずなのに、薄紫の包みは少し静かに見えました。今日は中身より紙に目が行った、という報告です。","choices":[["包装紙に目を向ける","同じ甘さでも、包み紙の色で違う顔に見えますね。","empathy"],["色を尋ねる","黄緑のほうは、どんな印象でしたか。","curiosity"],["ささやかな観察","飲み物の味以外にも、喫茶店には楽しみがありますね。","followup"]]},{"subject":"カップの外の朝","body":"こんばんは。\n\n朝、コーヒーを飲まずに散歩へ出ました。角を曲がったところで、誰かが植木鉢の向きを少し直していました。その手つきが丁寧で、つい見てしまいました。いつもの一杯の前にも、こんな時間があるんですね。帰宅してからコーヒーを淹れました。","choices":[["朝の景色","コーヒーの前に、誰かの丁寧な手つきに出会ったんですね。","empathy"],["植木鉢を尋ねる","どんな鉢が置かれていたのでしょう。","curiosity"],["時間を味わう","いつもの一杯の前にも、ひとつの朝がありますね。","followup"]]}],"anon":[{"subject":"耳だけで覚えた道","body":"こんばんは。\n\n夕方、近所を少し歩きました。いつも通る場所なのに、今日は窓の向こうから食器の触れ合う音が聞こえました。どこの家かはわかりません。知らない生活の音を一つ持ち帰ったような気がします。自分の部屋に着いてから、その音を思い出しました。","choices":[["音を受け取る","知らない家の暮らしが、音だけ少し届いたんですね。","empathy"],["小さく尋ねる","どんな食器の音に聞こえましたか。","curiosity"],["静けさを残す","姿の見えない誰かの夕方も、そこにあったんですね。","followup"]]},{"subject":"破れた袋の端","body":"こんばんは。\n\n買い物袋の端が少し破れていました。すぐ取り替えられる程度でしたが、折り目に沿ってきれいに裂けていたので、しばらく眺めました。何かを壊した話というほどでもありません。きょうは、その端のことが妙に気になったというだけです。","choices":[["小さなことを聴く","破れ方が気になった、それだけの話も聞きたいです。","empathy"],["折り目を尋ねる","どんな形に裂けていたのでしょう。","curiosity"],["答えを求めない","理由を決めずに残しておく出来事もありますね。","followup"]]}],"umbrella":[{"subject":"花屋ではない看板","body":"こんばんは。\n\n用事の帰り、小さな修理屋さんの看板を見つけました。「直せないものもあります」と書いてありました。正直だなと思って、しばらく見ていました。花屋の看板に同じ言葉を書いたら、どんな顔をされるでしょう。もちろん書きませんが、少し考えてしまいました。","choices":[["正直な看板","「直せないものもあります」は、思いきった言葉ですね。","empathy"],["花屋なら、と問う","花屋なら、どんな正直な一文を添えたいですか。","curiosity"],["想像を楽しむ","書かない看板の文句を考える時間も、面白いですね。","followup"]]},{"subject":"箱の裏側","body":"こんばんは。\n\n店で使う空き箱の底に、小さな数字が手書きされていました。たぶん誰かの数え間違いか、倉庫の印です。何の数字なのかはわかりません。花の名前なら調べようと思うのに、今日は調べずに戻しました。知らないままで困らないこともあります。","choices":[["知らない数字","箱の底の数字にも、誰かの仕事が残っていそうですね。","empathy"],["少し尋ねる","その数字は、一桁でしたか、もっと長い数字でしたか。","curiosity"],["余白を残す","意味を調べない選択も、今日の小さな出来事ですね。","followup"]]}],"triangle":[{"subject":"消しゴムではない道具","body":"こんばんは。\n\n家にある説明書を読んでいたら、最後のページに小さな図がありました。本体の使い方には関係のない、箱のたたみ方です。説明書の人は箱のことまで気にしてくれていたんですね。私はその図だけノートに写しました。役に立つかはわかりません。","choices":[["箱の図に注目","本体より箱のたたみ方が気になる日もありますね。","empathy"],["図を尋ねる","その箱は、どんな順番でたたむのでしょう。","curiosity"],["好奇心を歓迎","役立つかどうかより、面白かった図なんですね。","followup"]]},{"subject":"一番短い質問","body":"こんばんは。\n\n友達に「いちばん短い質問は何だろう」と聞かれました。「なぜ？」と言いかけたのですが、「え？」も質問だと思いました。帰ってからノートに候補を三つ書きました。こんなことを真剣に考えていたら、宿題の続きをするのを忘れそうです。","choices":[["短い問いを楽しむ","「え？」にも、たくさんの意味が入っていますね。","empathy"],["候補を尋ねる","三つ目の質問は何でしょう。","curiosity"],["寄り道を認める","宿題と関係のない質問にも、考える楽しさがありますね。","followup"]]}],"fridge":[{"subject":"洗い物のない器","body":"こんばんは。\n\n帰宅して、棚から小さな器を一つ出しました。何を入れるか考えていたら、結局何も入れずに戻しました。職場では器を選ぶのに迷わないのに、自分の食卓だと時間がかかります。空っぽの器を眺めた時間が、今日の休憩になった気もします。","choices":[["器の時間","何も盛らない器を眺める休憩も、ありですね。","empathy"],["好みを尋ねる","その器は、どんな色でしたか。","curiosity"],["急がず受け取る","自分の食卓なら、器を選ぶ時間も自由ですね。","followup"]]},{"subject":"冷蔵庫ではない明かり","body":"こんばんは。\n\n仕事帰りに歩いていたら、小さなクリーニング店の窓に灯りが残っていました。閉店後なのか、まだ作業中なのかはわかりません。白いシャツが何枚か並んでいて、ふと自分とは違う夜の仕事を思いました。家に着いて、しばらく明かりのことを覚えていました。","choices":[["別の仕事の夜","同じ夜にも、違う仕事の灯りがあるんですね。","empathy"],["窓を尋ねる","シャツの並ぶ窓は、どんな明るさでしたか。","curiosity"],["余韻を残す","帰宅後まで覚えていた明かり、静かな景色ですね。","followup"]]}]};
function longLifeCompose4914(id,n){
 const cards=LATERLIFE_CARDS_4914[id];if(!cards||n<150||!s.regular)return null;
 const state=s.regular.longLife4914||{};const delivered=state[id]||[];
 for(let index=0;index<cards.length;index++){
  if(delivered.includes(index))continue;
  const firstNight=(index===0?155:318)+(simHash(`long-life-4914:${id}:${index}`)%35);
  if(n<firstNight||n>=firstNight+105)continue;
  const card=cards[index];
  return {kind:'laterlife4914',tag:`laterlife4914:${index}`,subject:card.subject,body:card.body,choices:card.choices.map(x=>[...x]),longLife4914:index};
 }
 return null;
}


// v4.9.32: A boundary is not a secret/unlockable. Actual broadcasts create a chance
// to write, while current unease may mean someone chooses not to elaborate.
// Neither trust=100 nor a particular DJ reply can force disclosure.
const BOUNDARY_SCENES_4932={
 cat:{topic:"絵と仕事を、同じ一通で説明すること",first:{subject:"描かなかった理由",body:"こんばんは。\n\n机に紙を出したのに、絵は描かずに片づけました。理由はいくつかありますが、どれが一番なのかは自分でもまだわかりません。\n\n仕事の話も、絵の話も、今夜はそこまでにしておきます。何も決めていない時間のことだけ、書きたくなりました。"},later:{subject:"余白を一つだけ",body:"こんばんは。\n\nあのとき書かなかったことを、少しだけ書きます。絵を描かない日があると、好きだったことまで失くしたような気がするんです。\n\nでも昨日は、紙を捨てずに置いておけました。今は、そのことまでで十分です。"},still:{subject:"まだ閉じない紙",body:"こんばんは。\n\n絵の話をもう少し書こうと思って、やめました。今の仕事のことと一緒に説明すると、どちらの気持ちも違うものになってしまいそうです。\n\n紙は机に残しています。続きは、まだ私の中に置いておきます。"},anchor:"描かなかった日も、その人の時間であること"},
 clock:{topic:"古い店と今の暮らしの間にある時間",first:{subject:"箱を閉じたまま",body:"こんばんは。\n\n引き出しから、店で使っていた小さな箱を出しました。中のものを確かめる前に、今日はまた閉じました。\n\n思い出を語ることと、全部を取り出すことは違いますね。箱の手触りだけ、今夜は書いておきます。"},later:{subject:"時計の外側の話",body:"こんばんは。\n\nあの箱のことを、もう少し。昔の店の道具を見ると、使い方だけでなく、店を閉めたあとの静けさも思い出すのです。\n\n今は箱を棚に戻しました。詳しい話はまた別の機会にいたしましょう。"},still:{subject:"鍵のない箱",body:"こんばんは。\n\n以前書いた箱を、今日も開けませんでした。懐かしさだけでは片づかない気持ちも、あるようです。\n\nいつか話せるかどうかはわかりませんが、今日は散歩に出ました。その報告だけにしておきます。"},anchor:"箱を開けない選択も思い出の一部であること"},
 bread:{topic:"忙しい店のなかで言わずに済ませている気持ち",first:{subject:"焼き上がり以外",body:"こんばんは。\n\nパンの焼き上がりについてなら、いくらでも書けるのに、働いている自分の気持ちとなると手が止まります。\n\n今日は何か特別なことがあったわけではありません。ただ、店の話を全部笑い話にしなくてもいいのかな、と思いました。"},later:{subject:"粉のついていない手",body:"こんばんは。\n\n仕事のことを書くとき、つい焼き上がりの話に逃げていました。今日は閉店後、粉のついていない手を見て、ようやくほっとしたんです。\n\n店長には言っていません。ラジオにも、今日はここまでです。"},still:{subject:"今日の売れ残りではない",body:"こんばんは。\n\n店で考えたことを送ろうとして、またパンの話に直しました。話しやすいほうの話を選ぶ日もありますね。\n\nそういえば今日は、きれいに焼けたパンがありました。その報告を先にします。"},anchor:"仕事の愚痴を無理に笑い話にしなくてよいこと"},
 moon:{topic:"空想の向こうにある個人的な心配",first:{subject:"月への提出書類",body:"こんばんは。\n\n月の裏側に提出する書類を考えました。題名は「言わなかったことの保管願い」です。\n\nもちろん、そんな役所はありません。現実の話をまっすぐ書くより、月の職員に預けたほうが気楽な日もあります。今夜は書類の題名だけお知らせします。"},later:{subject:"月の欄外",body:"こんばんは。\n\n前に書いた「保管願い」の続報です。冗談にしておくと、誰かに心配されずに済むことがあるんですよね。\n\nでも、その冗談を考える時間は嫌いじゃありません。月の欄外に、この一文だけ書き足しておきます。"},still:{subject:"未提出の書類",body:"こんばんは。\n\n月の保管願いは、まだ未提出です。詳しい理由は、審査委員会にすら秘密ということでお願いします。\n\n今日は窓の雲がきれいでした。こちらは無事、公開情報です。"},anchor:"空想で包むことで守っている気持ちがあること"},
 driver:{topic:"仕事の報告からこぼれる私生活の不安",first:{subject:"主任にも未報告",body:"こんばんは。\n\n仕事の報告なら、時間と場所を書けばだいたい済むんです。でも自分の気持ちを説明するには、欄が足りません。\n\n猫主任にも報告していないことが一つあります。たいした秘密というわけじゃなくて、まだ言葉にできないだけです。"},later:{subject:"帰宅したあとの道",body:"こんばんは。\n\n最近、運転を終えてからの時間の使い方を考えています。走っているあいだは次の目的地が決まっていますが、帰宅したら自分で決めなくちゃいけません。\n\nちょっと苦手です。主任には、まだ内緒にしておきます。"},still:{subject:"本日の報告は以上",body:"こんばんは。\n\n自分の話を書こうとして、途中でやめました。配送の話にしておいたほうが、今日はしっくりきます。\n\n主任の勤務態度は相変わらず自由です。報告は以上。"},anchor:"報告書に書かない時間を本人が持っていること"},
 fish:{topic:"友達のことを笑顔だけで説明しないこと",first:{subject:"ノートの余白",body:"こんばんは。\n\n友達のことを日記に書きました。楽しかったこともあったのに、一行だけどうしても消せないところがあります。\n\n何を書いたかは、まだ送りません。友達が悪い人だと言いたいわけでもないんです。消せない一行があった、とだけ書いておきます。"},later:{subject:"消さなかった一行",body:"こんばんは。\n\n前に書いたノートの一行は、まだ消していません。今なら、あのとき少し困っていたんだと思えます。\n\n友達に何か言うかは別の話です。自分の気持ちを一つわかった、というところまで聞いてください。"},still:{subject:"折ったページ",body:"こんばんは。\n\nあのノートのことを、もう少し説明しようとしてやめました。友達の言葉を勝手にラジオで話したくはありません。\n\n今日はページを折って、別の本を読みました。続きを急がないことにします。"},anchor:"本人と友達の両方に境界があること"},
 terminal:{topic:"昔の行き先をすべて説明しないこと",first:{subject:"駅名を書かない",body:"こんばんは。\n\n昔の切符のことを書こうとして、駅名を消しました。その場所が特別だからではなく、今はまだ名前を書きたくなかったのです。\n\n消したあとの紙のほうが、少し読みやすくなりました。そんな報告です。"},later:{subject:"消した行き先",body:"こんばんは。\n\n前に駅名を消した話をしましたね。行き先よりも、そこへ向かおうとしていた時間を覚えていたのかもしれません。\n\nどこの駅だったかは、まだ書きません。今夜は、そこまでです。"},still:{subject:"宛先のない切符",body:"こんばんは。\n\n切符の話の続きは、まだ書けませんでした。駅名を知ってもらうことが、今の私に必要なことではないようです。\n\n代わりに、帰り道で見た空の話を考えています。"},anchor:"地名を明かさなくても気持ちが届くこと"},
 anon:{topic:"名前や正体を明かさない選択",first:{subject:"名乗らないまま",body:"こんばんは。\n\n何通も送っているのに、名前のことを何も書いていないなと思いました。名乗れないわけではありません。\n\nただ、ここでは今のラジオネームのまま書いていたいです。名前よりも先に、今日の出来事を選びたい夜があります。"},later:{subject:"今の呼び名",body:"こんばんは。\n\nこのラジオネームで届く手紙を、少し不思議に思うことがあります。名乗らずにいることで、かえって書けることもあるんですね。\n\nだから今日も、この名前で送ります。いつか変えるかどうかは、まだ決めていません。"},still:{subject:"空欄のまま",body:"こんばんは。\n\n名前の話をもう少し書こうとして、やめました。今のままでも、伝えられることがあります。\n\n今日は窓辺の音の話を書こうと思います。名前の欄は空白のままにしておきます。"},anchor:"名乗らないことが信頼不足を意味しないこと"},
 sugar:{topic:"気持ちを観察の言葉で包むこと",first:{subject:"甘さとは別の話",body:"こんばんは。\n\nコーヒーの味なら、甘いとか苦いとか、すぐ言葉にできますね。でも、今日感じたことには、ちょうどいい言葉がありませんでした。\n\n何があったかは書きません。カップを洗いながら、まだ考えています。"},later:{subject:"温度が変わるまで",body:"こんばんは。\n\nあのとき言葉にできなかった気持ちを、冷めていくコーヒーに似ていると思いました。薄くなるというより、違うところがわかってくるんですね。\n\n何の話だったかはまだ秘密です。今日は比喩だけで失礼します。"},still:{subject:"角砂糖の包み紙",body:"こんばんは。\n\nコーヒーの話にすると説明できそうで、やっぱりできませんでした。何でも飲み物に例えればいいというわけではありませんね。\n\n包み紙を一枚、机の端に置きました。今日はその話だけ。"},anchor:"観察の比喩が答えの代わりになること"},
 umbrella:{topic:"店で見せる顔と閉店後の気持ち",first:{subject:"花瓶の外側",body:"こんばんは。\n\n花の状態なら毎日よく見ています。でも、店を閉めたあとの自分の気分は、案外見落とします。\n\n今日は店の話をしようとして、途中で手を止めました。水を替えて帰ったことだけ、書いておきます。"},later:{subject:"閉店後の手",body:"こんばんは。\n\n花を並べるときは迷いませんが、仕事が終わってから何をしたいのか、すぐには浮かびません。\n\n今日はそれに気づいて、少し早めに帰りました。大げさな決心ではなく、小さな報告です。"},still:{subject:"水替えの先",body:"こんばんは。\n\n閉店後の話を、もう少し書くつもりでした。でも今日は、店の花のことを書いているほうが落ち着きます。\n\n水替えは済ませました。自分の話はまた別の日にします。"},anchor:"仕事を離れた自分の気持ちを急いで言わないこと"},
 triangle:{topic:"正しい答えだけではない自分の迷い",first:{subject:"答えのない欄",body:"こんばんは。\n\nノートに「どう思う？」と書いて、答えの欄を空けました。誰かに見せるための問題ではありません。\n\n答えを書いたら、今の気持ちまで固定してしまいそうなんです。今日は空欄のまま閉じます。"},later:{subject:"途中の答え",body:"こんばんは。\n\n空けておいた欄に、ひとことだけ書きました。「わからない」です。前なら答えとして認めなかったかもしれません。\n\nでも、いまはこれも途中の答えにしておこうと思います。"},still:{subject:"鉛筆を置く",body:"こんばんは。\n\n空欄の続きを考えましたが、今日は書きませんでした。正解を決めると、ほかの可能性が消えるようで。\n\nノートは閉じておきます。また違う日に見ます。"},anchor:"正解を急がないことが思考を止めることではないこと"},
 fridge:{topic:"人に料理を出す仕事と自分の食事の間",first:{subject:"自分の皿",body:"こんばんは。\n\n仕事では人の皿をよく見ます。でも、自分の食事の話になると、何を言えばいいのか迷います。\n\n今日は誰に何を作ったかを書こうとして、やめました。自分の皿のことは、まだうまく話せません。"},later:{subject:"洗い終えた皿",body:"こんばんは。\n\n帰宅して、使った皿を一枚洗いました。きれいに盛りつけたわけでも、特別なものを食べたわけでもありません。\n\nでも、自分の食事をしたことだけ、今日は書けます。それ以上の説明は、まだいりません。"},still:{subject:"メニューにないもの",body:"こんばんは。\n\n自分の食事について書こうとして、また仕事の献立を考え始めていました。今日はまだ、人に出す料理の話のほうが書きやすいです。\n\n食事はしました。それで十分、ということにします。"},anchor:"自分の食卓を見せる義務はないこと"}
};
function boundaryCompose4932(id,n){
 if(n<100||!s.regular)return null;
 const profile=BOUNDARY_SCENES_4932[id];if(!profile)return null;
 const aired=(s.played||[]).filter(x=>x.who===id&&x.night<n);
 if(aired.length<4)return null;
 const markers=s.regular.boundary4932?.[id]||{};
 let stage=null;
 if(!markers.first&&n>=105+simHash('boundary4932:entry:'+id)%56)stage='first';
 else if(markers.first&&!markers.second&&n>=markers.first+65&&aired.length>=8)stage='second';
 if(!stage)return null;
 const p=s.simState?.people?.[id],anxiety=p?.emotion?.anxiety??50;
 const stress=s.listeners?.[id]?.stress??50;
 const still=anxiety>=66||stress>=70||simHash('boundary4932:still:'+id+':'+n)%100<34;
 const mode=stage==='first'?'first':still?'still':'later';
 const scene=profile[mode];
 const choices=[
  ['今夜の言葉を受け取る',mode==='first'?`「${scene.subject}」。${profile.anchor}が、今夜のお便りから伝わってきました。`:`${profile.anchor}。今夜の言葉を、そのまま受け取ります。`,'empathy'],
  ['書かなかったことを尊重する','話していない部分まで、こちらで勝手に想像しないでおきます。今夜はここまでで十分です。','space'],
  ['言葉の余白に触れる',`「${scene.subject}」という言葉の残し方にも、あなたらしい考えがあるんですね。`,'reflection'],
  ['次を約束させない','続きの報告を約束しなくても大丈夫です。また書きたくなった夜に、好きな話を聞かせてください。','followup']
 ];
 return {kind:'boundary4932',tag:'boundary4932:'+stage,subject:scene.subject,body:scene.body,choices,boundaryStage4932:stage,boundaryMode4932:mode};
}

function regularCompose(id,n){
 const history=(s.regular.mailHistory||[]).filter(h=>h.who===id&&h.night<n);
 const recent=history.filter(h=>h.night>=n-6);
 const options=[
  regularRoute(id,n),regularDayNote(id,n),regularContact(id,n),boundaryCompose4932(id,n),longLifeCompose4914(id,n),regularBroadcastEcho(id,n),regularThemeLetter(id,n),radioCultureCompose(id,n),radioVarietyCompose38(id,n),radioMemoryCompose39(id,n),longEchoCompose43(id,n),everydayCompose4827(id,n)
 ].filter(Boolean).map(x=>({...x,weight:({route:89,daily:69,contact:91,broadcast:38,theme:34,culture:115,variety:92,'radio-memory':128,'long-echo':164,'everyday47':130,'laterlife4914':178,'boundary4932':185})[x.kind]||45}));
 const everydayKinds=new Set(['route','daily','contact','broadcast','theme','everyday47']);
 for(const o of options){
  const sameTag=history.filter(h=>h.tag===o.tag&&h.night>=n-40);
  const sameKind=history.filter(h=>h.kind===o.kind&&h.night>=n-18);
  const lastTag=sameTag.length?sameTag[sameTag.length-1].night:0;
  if(lastTag)o.weight-=n-lastTag<=10?82:n-lastTag<=25?45:18;
  // 過去に実際に配達した同一件名・本文を優先しない（手紙候補だけは数えない）。
  const seen=(s.regular.voiceHistory45?.[id]||[]).some(h=>h.key===regularVoiceKey45(o)&&n-h.night<=260);
  if(seen)o.weight-=o.kind==='route'?190:o.kind==='variety'?165:100;
  if(everydayKinds.has(o.kind)){
   if(recent.some(h=>h.kind===o.kind))o.weight-=34;
   o.weight-=Math.min(35,sameKind.length*11);
   if(!sameKind.length)o.weight+=14;
  }else if(recent.some(h=>h.kind===o.kind))o.weight-=14;
  o.weight+=simHash(`reg:opt:${id}:${n}:${o.tag}`)%21;
 }
 options.sort((a,b)=>b.weight-a.weight);
 const selected=options.find(x=>!regularBodyAlreadyDelivered4931(id,v33VoiceLetter(id,n,x).body,n))||options[0]||regularThemeLetter(id,n);
 if(selected.kind==='culture'){s.radioCulture.draftNight=n;s.radioCulture.draftUsed=true;}
 if(selected.kind==='radio-memory'){s.radioMemory.draftNight=n;s.radioMemory.draftUsed=true;}
 if(selected.kind==='long-echo')s.longEcho43.draftNight=n;
 return selected;
}

// v3.3: 生活の事実は変更せず、書き手固有の言葉遣いと手紙の記憶を添える。
// 放送されたかどうかは推測せず、本人が「前に書いた」事実だけを扱う。
const LETTER_VOICE_33={
 cat:{daily:['仕事や絵のこと以外にも、書いておきたい日があります。','帰り道で思い返すと、案外こういう時間が残ります。'],contact:['人と話した日のことは、あとからじわじわ思い出します。','言葉にすると大げさですが、小さな変化だった気がします。'],theme:['いまの自分なら、少し違う答えになる気もします。'],default:['また何か描きたくなったら、その話も書きます。']},
 driver:{daily:['主任に報告したら、たぶんあくびで返されます。','地味な報告ですけど、夜の便りってことで。'],contact:['主任なら十秒で寝て忘れる話でしょうね。僕はまだ少し覚えています。','運転中はあれこれ考えるのに、面と向かうと案外言えないものです。'],theme:['それでは、今夜の道路からは以上です。','この件、主任の決裁はまだ下りていません。'],default:['明日も安全運転で帰ってきます。']},
 fish:{daily:['ノートに書くより、こうして送るほうが少し緊張します。','うまく説明できないので、あとで日記にも書いてみます。'],contact:['その人から見た私は、どんなふうだったのか少し気になります。'],theme:['選択肢が増えた気がして、まだ決められません。'],default:['また考えが変わったら、お便りしてもいいですか。']},
 clock:{daily:['たいした出来事ではありませんが、こういう日も覚えていたいものです。','昔は気にも留めなかったことが、今は妙に心に残ります。'],contact:['長く生きても、人と話すのは毎回少し違うものです。'],theme:['時計の針は進みますが、考えごとは少し寄り道するようです。'],default:['深夜の放送ですから、どうぞ無理のないように。']},
 terminal:{daily:['そのとき見た景色だけは、なぜか覚えています。','書いてみると、思っていたほど特別な話ではありませんでした。'],contact:['次に同じ場所を通る頃には、何かが変わっているのでしょうか。'],theme:['いつか別の言葉で書けるかもしれません。'],default:['返事はいりません。ただ、書いておきたかったのです。']},
 bread:{daily:['焼き上がりの具合より、あとになって気になることもあります。','店長に話したら、たぶん別の話にすり替えられます。'],contact:['パンの話じゃないのに、なぜか店の匂いまで思い出します。'],theme:['これをパンに例えるのは難しそうです。'],default:['そろそろ明日の仕込みに戻ります。']},
 moon:{daily:['月の監査部には、まだ報告していません。','地上の些細な事件として、議事録の隅に置いておきます。','この件は月の裏側でも見解が割れそうです。'],theme:['あくまで月の裏側からの非公式見解です。','議長が月なら、会議はきっと夜更かしですね。'],default:['異議申し立ては月明かりのある夜にどうぞ。','この件の採決は、次の満月に持ち越します。']},
 anon:{daily:['名前を出すほどではないと思ったのですが、書いてみました。','小さなことほど、送り先に迷うものですね。','このくらいなら、書き残しておいてもよさそうです。'],theme:['ふだんは聴く側なので、少し不思議な気分です。','考えがまとまったわけではありませんが、今日は送ってみます。'],default:['また聴いています。','聴くだけの日も、きっとあります。']},
 sugar:{daily:['冷めたコーヒーを前に、少しだけ考えました。','書いているあいだに、さっきより少し考えが変わりました。','何でもない話が、案外長く残ることもあります。'],theme:['コーヒーのおかわりを入れてから、続きを考えます。','答えを急ぐほどの話でもないですね。'],default:['今夜もあたたかいうちに一杯。','では、このへんで。カップが空になりました。']},
 umbrella:{daily:['水を替える手を止めて、ちょっと書いています。','切り花には休みがありませんが、私には必要ですね。'],contact:['花の名前より、人の顔を覚えるほうが難しい日もあります。'],theme:['店先に立つと、季節は案外はっきり見えます。'],default:['花瓶の水を替えたら、今日は帰ります。']},
 triangle:{daily:['ノートの余白に大きな丸を付けておきました。','これも将来の役に立つかはわかりません。でも面白いです。'],contact:['そのあとで、友達にも話したくなりました。'],theme:['いまの答えを来週の自分がどう思うか、わかりません。'],default:['では、宿題に戻ります。たぶん。']},
 fridge:{daily:['厨房では片づけて帰るのに、家の台所は別問題ですね。','仕事の段取りなら得意なのに、自分の夜はうまくいきません。'],contact:['料理の話以外で誰かと話すのは、まだ少し慣れません。'],theme:['明日の仕込みの前に、こんなことを考えています。'],default:['自分用の皿も、たまには使うことにします。']}
};
function v33VoiceLetter(id,n,note){
 if(!note||!note.body||['new-intro','culture','variety','radio-memory','daily-thread','relation-thread','long-echo','surprise46','everyday47','crossTalk4830','crossAfter4831','laterlife4914','boundary4932'].includes(note.kind)||note.absenceReturn)return note;
 const data=LETTER_VOICE_33[id]||LETTER_VOICE_33.anon;
 const group=note.kind==='new-life'?'daily':(data[note.kind]?note.kind:'default');
 const lines=data[group]||data.default||[];
 const recentMail=(s.regular?.mailHistory||[]).filter(h=>h.who===id&&h.night<n&&n-h.night<=27);
 const oldBodies=recentMail.map(h=>s.regular?.letterArchive?.[`regular_${h.night}_${id}`]?.body||'');
 const shuffled=lines.map((line,i)=>({line,score:simHash(`v44:voice:${id}:${n}:${note.tag}:${i}`)%100}))
  .sort((a,b)=>b.score-a.score).map(x=>x.line);
 const picked=shuffled.find(line=>!oldBodies.some(text=>text.endsWith('\n\n'+line)));
 let body=note.body;
 // かつての高頻度な定型追伸を抑え、最近実際に届いた文章と同じ文末は繰り返さない。
 if(picked&&!body.includes(picked)&&simHash(`v44:voice:frequency:${id}:${n}`)%100<46)body+='\n\n'+picked;
 // 無関係な古い件名を唐突に思い出す文は追加しない。
 // 同じ生活行動・相手について本人が以前も投稿した場合だけ、まれに触れる。
 if(['daily','contact'].includes(note.kind)&&simHash(`v44:remember:${id}:${n}`)%100<11){
  const prior=recentMail.filter(h=>h.tag===note.tag&&h.kind===note.kind&&n-h.night>=9&&n-h.night<=36)
   .find(h=>s.regular?.letterArchive?.[`regular_${h.night}_${id}`]?.body);
  if(prior){
   const before=s.regular.letterArchive[`regular_${prior.night}_${id}`];
   if(before?.subject&&before.subject!==note.subject){
    const line=({cat:'前にもこの話を書いた気がします。あのときと今とでは、同じ景色の輪郭が少し違います。',driver:'前にも似た報告をしましたね。夜道は同じでも、走った日の気分は違います。',fish:'前にも似たことを書きました。今なら別の言い方をするかもしれません。',clock:'以前にもお話ししましたね。繰り返すたび、違うところを見つけるものです。',terminal:'前にも書きました。あのときとは、少し違う夜です。',bread:'前にも似たことを書きました。焼きたては毎回少しずつ違います。',moon:'以前も似た報告をしたようです。月の議事録なら、続報扱いでしょうか。',sugar:'前にも書いた話ですが、今夜は違う味がします。',anon:'以前、似たことを書いた気がします。読み返すと、別の日の言葉です。',umbrella:'前にも書いた話です。同じ鉢でも、見る日の光が違います。',triangle:'前にも似た話を書きました。同じ問題を別の角度から解いている気分です。',fridge:'前にも報告しましたね。同じ段取りでも、毎回同じ夜にはなりません。'})[id]||'以前にも似た話を書きました。';
    if(!body.includes(line))body+='\n\n'+line;
   }
  }
 }
 return {...note,body,voiceVersion:33};
}

// v4.8.30 — ラジオで実際に紹介した手紙だけから育つ、ささやかな往復。
// 各篇3通。続編の受信条件は「実際に放送済み」であり、未紹介の手紙や内部記憶は参照しない。
const CROSS_TALK_ARCS_4830={
 lost:{start:52,stages:[
  {who:'moon',minGap:0,subject:'月面落とし物係・仮設窓口',body:'こんばんは。月面落とし物係を、勝手に設立しました。\n\n預かるのは手袋の片方、書きかけの手紙、そして「あとでやろう」と思ったまま忘れた用事です。最後のものは返却期限がありません。\n\n地球に支部を作るなら、受付にはどんな箱を置きましょう。もちろん架空のお話です。',choices:[['仮設窓口を歓迎する','手袋も先延ばしの用事も預かる窓口。月面らしく、ずいぶん親切な規則ですね。','humor'],['受付の箱を考える','地球支部には、どんな形の箱が似合うでしょう。','curiosity'],['忘れ物の意味を考える','忘れた用事を責めずに置いておく場所があってもいいのかもしれません。','reflection']]},
  {who:'driver',minGap:9,subject:'落とし物の地球支部',body:'こんばんは。少し前の放送で、月の裏側さんが月面の落とし物係を作っていましたよね。配送車のラジオで聴きました。\n\nうちにも小さな忘れ物箱があります。手袋が片方入っていて、いつまでも持ち主が現れません。\n\n地球支部の受付番号は「一番」でいいでしょうか。猫主任に決裁を頼むと、箱の上で寝てしまいそうです。',choices:[['地球支部を承認する','受付番号一番、よさそうです。猫主任の決裁は気長に待ちましょう。','humor'],['手袋を気にかける','片方の手袋が、いつか持ち主の手に戻るといいですね。','empathy'],['支部の仕事を尋ねる','猫主任が箱の上で寝ていたら、忘れ物はどこに預けるのでしょう。','curiosity']]},
  {who:'moon',minGap:11,subject:'地球支部、受付番号一番',body:'こんばんは。先日の放送で配達員さんの地球支部の話を聴きました。\n\n月面本部としては、受付番号一番を正式に発行したいところです。ただし当局には紙も判子もありません。空想なので。\n\nあの片方の手袋が見つかるかは、まだわからないままでいいと思います。地球と月に、ひとつずつ小さな箱があるという報告です。',choices:[['受付番号を受け取る','月面本部からの一番、確かに受け取りました。判子はなくても大丈夫です。','humor'],['手袋の行方を見守る','片方の手袋の行き先を、急いで決めなくてもよさそうです。','empathy'],['ふたつの箱を想像する','遠く離れた場所に同じ空想の箱がある、というのがいいですね。','reflection']]}
 ]},
 breadclock:{start:104,stages:[
  {who:'bread',minGap:0,subject:'名前のない、ちいさなパン',body:'こんばんは。売り場の隅に、ちいさな試作品を一つ置きました。\n\n形が少しいびつなので、値札に名前を書けずにいます。「なんでもないパン」では、さすがに失礼でしょうか。\n\n大人気にならなくても、誰かが帰り道につまめるようなパンです。名前を募集するほどの大事件でもないのですが。',choices:[['小ささを喜ぶ','帰り道につまめるパンって、いいですね。','empathy'],['名前を考える','「帰り道のパン」なんてどうでしょう。いびつな形にも似合いそうです。','curiosity'],['名前を急がない','名前がつく前の試作品にも、もう居場所があるんですね。','reflection']]},
  {who:'clock',minGap:10,subject:'散歩帰りのパンの名前',body:'こんばんは。先日の放送で、パン屋さんが小さな試作品の名前を迷っておられましたね。散歩の帰りに思い出しました。\n\n私なら「寄り道」とつけるでしょうか。急いで帰る日にこそ、寄り道はおいしいものです。\n\n勝手に名づけただけですから、採用されなくても構いません。今朝の散歩の、小さな思いつきです。',choices:[['寄り道を味わう','「寄り道」という名前、散歩の途中で浮かんだところが素敵ですね。','empathy'],['散歩道を尋ねる','今日はどんな道を通って、その名前を思いついたんでしょう。','curiosity'],['名前の自由を残す','採用されなくても構わない、というところもいいですね。','reflection']]},
  {who:'bread',minGap:10,subject:'寄り道という名札',body:'こんばんは。古時計さんが考えてくださった「寄り道」という名前、放送で聴きました。\n\n試作品の横に、その名前を小さく書いた紙を置いてみました。まだお店の正式な商品名ではありません。\n\n今日は誰かが一つ買っていきました。名前のおかげかどうかは、わかりません。それでも、名札の置き場所を作ってよかったです。',choices:[['小さな名札を祝う','紙の名札とパンが並んだ光景が浮かびます。ひとつ売れたのも嬉しいですね。','empathy'],['その先を尋ねる','次の日も同じ名前を置くのでしょうか。','curiosity'],['名前が渡ったことを喜ぶ','採用されるかどうかより、古時計さんの言葉がお店に届いたことがいいですね。','reflection']]}
 ]},
 blank:{start:162,stages:[
  {who:'cat',minGap:0,subject:'予定表の白い四角',body:'こんばんは。予定表に、何も書いていない四角が一つあります。\n\n前は何かで埋めなくちゃと思っていました。でも最近は、そこを白いままにしておくのもいい気がしています。\n\n空いた時間に何をしたかと聞かれたら、うまく答えられないかもしれません。',choices:[['白いままを認める','その四角を埋めないという選択も、ひとつの暮らし方ですね。','empathy'],['使い道を決めない','何をする時間か、今は名前をつけなくてもよさそうです。','reflection'],['予定表の景色を聴く','白い四角がある予定表って、どんなふうに見えるのでしょう。','curiosity']]},
  {who:'fish',minGap:9,subject:'空白にも丸をつける',body:'こんばんは。少し前に、夜明けの猫さんが予定表の白い四角の話をしていましたね。放送で聴いて、思い出したことがあります。\n\n私のノートにも書き損ねた空白があります。そこを失敗だと思っていました。\n\n今夜は空白の横に、小さく丸をつけてみました。丸だけ増えて、相変わらず何も書いていません。少し可笑しいです。',choices:[['丸を受け取る','書いていない場所に丸をつける。小さな発見ですね。','empathy'],['何の丸か尋ねる','その丸は合格の丸でしょうか、それともただの丸でしょうか。','curiosity'],['空白のままで笑う','丸だけ増えて何も書かない、というところに少し笑ってしまいました。','humor']]},
  {who:'cat',minGap:12,subject:'余白のとなりの丸',body:'こんばんは。透明な金魚さんが、空白の横に丸をつけた話を聴きました。\n\n私も予定表の白い四角の隅に、小さな丸を一つ描いてみました。何かを達成した印ではありません。\n\n今日は結局、そこには何も書きませんでした。丸がついたぶんだけ、少し見つけやすくなった気がします。',choices:[['見つけやすさを喜ぶ','何も書かなかった時間に、目印だけができたんですね。','empathy'],['丸を尋ねる','その丸には、どんな色を使いましたか。','curiosity'],['余白を守る','白い四角はそのままで、丸だけある。気負わない記録ですね。','reflection']]}
 ]}
};
function createCrossTalkState4830(){return {schema:1,delivered:{}}}
function migrateCrossTalk4830(data){
 const old=data.crossTalk4830;const next=createCrossTalkState4830();
 if(old&&typeof old==='object'&&old.delivered&&typeof old.delivered==='object'){
  for(const key of Object.keys(CROSS_TALK_ARCS_4830)){
   const entries=old.delivered[key];if(!Array.isArray(entries))continue;
   next.delivered[key]=entries.slice(0,3).map(x=>x&&Number.isInteger(x.night)&&x.night>0&&typeof x.id==='string'?{night:x.night,id:x.id}:null);
  }
 }
 data.crossTalk4830=next;return data;
}
function listenerCrossCompose4830(id,n){
 if(n<29||chapter3IsNight(n)||specialActive(n))return null;
 const state=s.crossTalk4830 ||= createCrossTalkState4830();
 for(const [arc,def] of Object.entries(CROSS_TALK_ARCS_4830)){
  if(n<def.start)continue;
  const sent=state.delivered[arc]||[];
  const stage=sent.findIndex(x=>!x);
  const i=stage<0?(sent.length<3?sent.length:3):stage;
  if(i>=3||def.stages[i].who!==id)continue;
  if(i>0){
   const prior=sent[i-1];
   // 投函しただけでは続かない。原稿が実際に放送で紹介されていること。
   if(!prior||!s.played.some(x=>x.id===prior.id&&x.night===prior.night))continue;
   if(n-prior.night<def.stages[i].minGap)continue;
  }
  // 連続投稿の押しつけを避ける。しばらく待てば送る候補にはなれる。
  const elapsed=n-(i===0?def.start:sent[i-1].night);
  if(elapsed<30&&simHash(`cross4830:${arc}:${i}:${n}`)%100>=64)continue;
  const note=def.stages[i];
  // 何十夜も間が空いた交流を「先日」「少し前」と呼ばない。
  // すでに放送された原稿は保存済みのまま維持し、ここでは新規生成分だけ調整。
  let body=note.body;
  if(i>0&&n-sent[i-1].night>21)body=body.replace('少し前の放送で','以前の放送で').replace('先日の放送で','以前の放送で');
  return {kind:'crossTalk4830',tag:`cross4830:${arc}:${i}`,subject:note.subject,body,
   crossTalk:{arc,stage:i},choices:note.choices.map(row=>[...row])};
 }
 return null;
}
function listenerCrossConfirmDelivered4830(n,ids){
 const state=s.crossTalk4830 ||= createCrossTalkState4830();
 for(const uid of ids){
  const l=s.regular?.letterArchive?.[uid];if(l?.kind!=='crossTalk4830'||!l.crossTalk)continue;
  const {arc,stage}=l.crossTalk;
  if(!CROSS_TALK_ARCS_4830[arc]||!Number.isInteger(stage)||stage<0||stage>2)continue;
  const sent=state.delivered[arc] ||= [];
  // 実際に受信した手紙だけ記録し、同じ段階は二度送らない。
  if(!sent[stage])sent[stage]={night:n,id:uid};
 }
}

// v4.8.31 — 完結した交流が、何十夜も後の日常にさりげなく残る。
// 重要: すべての参照は「その手紙が届いたこと」ではなく「放送で実際に読まれたこと」に基づく。
const CROSS_AFTER_LETTERS_4831 = {
 "lost": [
  {
   "who": "driver",
   "minGap": 42,
   "subject": "支部の箱の、底のほう",
   "body": "こんばんは。地球支部と呼んでいる忘れ物箱を、久しぶりに整理しました。\n\n受付番号一番の手袋は、まだそのままです。その下から、いつ誰が書いたのかわからない「ゆっくり探すこと」というメモが出てきました。たぶん私の字です。\n\n落とし物を探しているうちに、探し方そのものを忘れそうになりました。猫主任は相変わらず箱に座っています。",
   "choices": [
    [
     "受付メモを読む",
     "「ゆっくり探すこと」が箱の底にあったんですね。受付係自身への注意書きみたいで、いいです。",
     "empathy"
    ],
    [
     "主任の監督を確認する",
     "猫主任は今日も箱の上ですか。重要書類の上で寝るのが主任の方針なのでしょうか。",
     "humor"
    ],
    [
     "手袋に時間をあげる",
     "手袋がまだそこにあることにも、ひとつの時間が流れているんですね。",
     "reflection"
    ]
   ]
  },
  {
   "who": "moon",
   "minGap": 37,
   "subject": "宇宙から見た、片方の靴下",
   "body": "こんばんは。配達員さんの地球支部に「ゆっくり探すこと」というメモがあったそうですね。月面本部の掲示板にも、勝手に書き加えました。\n\nこちらは最近、片方だけの靴下を預かる想像をしています。宇宙服は靴下が必要なのか、という疑問まで生まれました。\n\n研究班は私ひとりなので、答えが出ないまま会議を閉じました。",
   "choices": [
    [
     "研究班の議事録を受け取る",
     "ひとりの研究班なのに、ちゃんと会議を閉じたんですね。議事録は保存しておきましょう。",
     "humor"
    ],
    [
     "靴下の行方を想像する",
     "宇宙服のなかにも、片方だけの靴下が迷い込むのでしょうか。",
     "curiosity"
    ],
    [
     "掲示板の言葉を味わう",
     "「ゆっくり探すこと」が月にまで届いたのが、なんだか嬉しいです。",
     "reflection"
    ]
   ]
  },
  {
   "who": "driver",
   "minGap": 54,
   "subject": "猫主任の受付印",
   "body": "こんばんは。月面本部の靴下研究を聴いた翌朝、うちの猫主任が忘れ物箱に前足を乗せていました。\n\n押したわけでもないのに、埃の上に小さな肉球の跡が残っていました。職場の人と「これが受付印か」と笑いました。\n\n手袋はまだ誰のものかわかりません。箱だけ、少し立派になりました。",
   "choices": [
    [
     "受付印を祝う",
     "肉球の受付印、ずいぶん本格的ですね。箱が立派になったのは確かです。",
     "humor"
    ],
    [
     "笑った朝を喜ぶ",
     "職場の人と一緒に笑えた朝だったんですね。それが何よりの報告です。",
     "empathy"
    ],
    [
     "忘れ物の時間を聴く",
     "手袋はまだそのまま。それでも箱の周りの日々は変わっていくんですね。",
     "reflection"
    ]
   ]
  },
  {
   "who": "moon",
   "minGap": 48,
   "subject": "月面本部、印鑑を検討する",
   "body": "こんばんは。地球支部に猫主任の肉球印ができたと聞き、月面本部にも印鑑が必要ではないかと思いました。\n\nしかし月面本部には猫がいません。そこで、丸いコップの底を紙に押す想像をしました。肝心の紙もコップも架空なので、結果は丸だけです。\n\nこんな小さな話が遠くまで往復するのは、不思議ですね。",
   "choices": [
    [
     "架空の丸を受理する",
     "コップの底の丸も、立派な印鑑ということにしましょう。月面らしいです。",
     "humor"
    ],
    [
     "往復を喜ぶ",
     "肉球の跡から月面の丸まで。ずいぶん遠い往復になりましたね。",
     "reflection"
    ],
    [
     "丸の大きさを尋ねる",
     "月面本部の丸は、どのくらいの大きさにする予定ですか。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "driver",
   "minGap": 57,
   "subject": "箱は、今日もそこにある",
   "body": "こんばんは。忘れ物箱に新しいものは増えていません。肉球の受付印も、掃除をしたら消えました。\n\n少し寂しいような気もしましたが、あの朝みんなで笑ったことまで消えたわけではありません。\n\n地球支部は今日も通常営業です。猫主任は箱から降りて、窓辺へ異動しました。",
   "choices": [
    [
     "通常営業をねぎらう",
     "新しい報告がなくても、ちゃんと営業している地球支部ですね。",
     "empathy"
    ],
    [
     "主任の異動を見送る",
     "猫主任、窓辺に異動ですか。辞令は不要そうですね。",
     "humor"
    ],
    [
     "消えないものを受け取る",
     "受付印は消えても、笑った朝は残っている。その話が好きです。",
     "reflection"
    ]
   ]
  }
 ],
 "breadclock": [
  {
   "who": "clock",
   "minGap": 39,
   "subject": "散歩道で見つけた、寄り道",
   "body": "こんばんは。以前、パン屋さんの小さなパンに「寄り道」と勝手に名前をつけたことを、散歩中に思い出しました。\n\n今日はいつもの角を一つ曲がらず、遠回りして帰りました。特別な景色はありませんでしたが、知らない家の鉢植えに小さな花が咲いていました。\n\n私の寄り道は、今のところ花を一つ見つけただけです。",
   "choices": [
    [
     "小さな花を受け取る",
     "角を一つ曲がらなかった先の、小さな花。いい寄り道でしたね。",
     "empathy"
    ],
    [
     "鉢植えを想像する",
     "どんな花だったのでしょう。道の向こうにも季節があるんですね。",
     "curiosity"
    ],
    [
     "寄り道を急がない",
     "特別な景色がなくても、曲がらなかった角の先に何かがあるんですね。",
     "reflection"
    ]
   ]
  },
  {
   "who": "bread",
   "minGap": 36,
   "subject": "雨の日の、ちいさな名札",
   "body": "こんばんは。古時計さんが散歩の寄り道で花を見つけたそうですね。うちの店先にも、今朝は雨粒のついた植木鉢がありました。\n\nあの小さな試作品の横には、今もときどき「寄り道」と書いた紙を置きます。ただ、毎日焼くわけではありません。\n\n今日は雨なので一つだけ。売れたかどうかより、名札が濡れずに済んだことが嬉しかったです。",
   "choices": [
    [
     "名札を気にかける",
     "「寄り道」の名札、雨に濡れなかったんですね。ちいさな安心が伝わります。",
     "empathy"
    ],
    [
     "一つだけのパンを眺める",
     "雨の日に一つだけ焼くパン。棚の景色が浮かびます。",
     "reflection"
    ],
    [
     "植木鉢の話を聴く",
     "お店の植木鉢には、今どんなものが育っているのでしょう。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "clock",
   "minGap": 59,
   "subject": "名前のつかない散歩道",
   "body": "こんばんは。パン屋さんのお店でも「寄り道」の名札がときどき使われているのですね。\n\n私は最近、散歩道の曲がり角に自分だけの名前をつけています。「返事を待つ角」「風の弱い道」。ただし誰にも説明していません。\n\n地図には載らない名札も、案外役に立つものです。迷ったとき、少しだけ行き先がわかる気がします。",
   "choices": [
    [
     "秘密の地図を思う",
     "「返事を待つ角」と「風の弱い道」。名前だけで景色が見えてきそうです。",
     "curiosity"
    ],
    [
     "名札の役目を考える",
     "地図に載らなくても、自分の中では道を見つける目印になるんですね。",
     "reflection"
    ],
    [
     "歩く時間を喜ぶ",
     "ご自分だけの名前をつけて歩く時間があるの、素敵ですね。",
     "empathy"
    ]
   ]
  },
  {
   "who": "bread",
   "minGap": 44,
   "subject": "閉店後の小さな道案内",
   "body": "こんばんは。古時計さんが散歩道に名前をつけている話を聴いて、店の中の道にも名前がある気がしました。\n\nオーブンから流し台までが「急ぎ足の道」、入口から売り場の端までは「寄り道の道」です。もちろん、お客さんには見えない標識です。\n\n今日は閉店後、その道を少しゆっくり歩いて帰りました。",
   "choices": [
    [
     "店内の地図を広げる",
     "オーブンから流し台までの「急ぎ足の道」、忙しい厨房らしい名前ですね。",
     "humor"
    ],
    [
     "閉店後の歩幅を聴く",
     "同じお店の中でも、歩く速さが変わる場所があるんですね。",
     "reflection"
    ],
    [
     "見えない標識を歓迎する",
     "お客さんには見えない標識、ちょっと見てみたい気がします。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "clock",
   "minGap": 52,
   "subject": "今日の寄り道には、名前をつけない",
   "body": "こんばんは。パン屋さんの「急ぎ足の道」の話を聴いて、家の中にも小さな道があると気づきました。\n\nですが今夜は、散歩から帰ったあと、何にも名前をつけませんでした。茶碗を洗って、窓を閉めて、ただ座りました。\n\n「寄り道」と呼ぶ日もあれば、何でもない日もある。それで充分だと思っています。",
   "choices": [
    [
     "何でもない夜を受け取る",
     "名前のない夜にも、ちゃんと一日の続きがありますね。",
     "empathy"
    ],
    [
     "座った時間を想像する",
     "茶碗を洗って窓を閉める。そのあとの静かな時間が伝わります。",
     "reflection"
    ],
    [
     "寄り道を残しておく",
     "今日は名前をつけない。その自由も、散歩の楽しみの一つですね。",
     "agency"
    ]
   ]
  }
 ],
 "blank": [
  {
   "who": "fish",
   "minGap": 43,
   "subject": "余白の丸は、まだ消していない",
   "body": "こんばんは。以前、夜明けの猫さんの予定表の余白を聴いて、私のノートにも小さな丸をつけました。\n\nあれから別のページに移りましたが、最初の丸はまだ消していません。何をした日の印だったかは、正直もう思い出せません。\n\nでも、意味が曖昧な印をそのまま残しておくのも悪くありませんね。",
   "choices": [
    [
     "曖昧な丸を眺める",
     "何の印か忘れても、丸だけは残っている。ノートらしい記憶ですね。",
     "reflection"
    ],
    [
     "消さない気持ちを聴く",
     "消さずに置いておけたことが、なんだかいいですね。",
     "empathy"
    ],
    [
     "ほかの丸を尋ねる",
     "そのあともノートに丸は増えましたか。それとも最初の一つだけでしょうか。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "cat",
   "minGap": 38,
   "subject": "予定表の端に、雨の絵",
   "body": "こんばんは。透明な金魚さんが丸を残しているという話を聴いて、久しぶりに自分の予定表を開きました。\n\n白い四角の横に、今日は丸の代わりに小さな雨雲を描きました。実際には晴れていたのですが、鉛筆がなんとなくその形になったんです。\n\n予定表の天気まで正確でなくても、困らないものですね。",
   "choices": [
    [
     "雨雲を見つめる",
     "晴れの日の予定表に小さな雨雲。心の天気予報みたいですね。",
     "reflection"
    ],
    [
     "絵の自由を喜ぶ",
     "鉛筆が勝手に雨雲を描く日もありますよね。描き直さなくていいと思います。",
     "empathy"
    ],
    [
     "雲の形を尋ねる",
     "その雨雲は、今にも降りそうな形でしたか。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "fish",
   "minGap": 65,
   "subject": "晴れの日の、雲の話",
   "body": "こんばんは。夜明けの猫さんが晴れた日の予定表に雨雲を描いたそうですね。\n\n私も晴れた帰り道、空に一つだけ雲が浮かんでいるのを見ました。名前をつけようとして、途中でやめました。\n\nノートの丸も空の雲も、全部説明できなくてもいいのかもしれません。今日はそれだけです。",
   "choices": [
    [
     "一つの雲を見送る",
     "晴れた空に一つだけあった雲、静かな景色ですね。",
     "empathy"
    ],
    [
     "名前をつけない選択を聴く",
     "名前をつけようとしてやめたことも、その日の小さな出来事ですね。",
     "reflection"
    ],
    [
     "帰り道を尋ねる",
     "どんな帰り道で、その雲を見つけたのでしょう。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "cat",
   "minGap": 49,
   "subject": "消し忘れた、小さな印",
   "body": "こんばんは。透明な金魚さんの雲の話を聴いてから、予定表を見返しました。\n\n鉛筆で描いた雨雲の隣に、前に描いた丸がまだありました。消し忘れたというより、消す理由がなかったのかもしれません。\n\n二つ並んだ印を見て、特に何かを思い出したわけではありません。ただ、少し可笑しくなりました。",
   "choices": [
    [
     "二つの印を見る",
     "丸と雨雲が並んでいる。予定表が少し自由な場所になりましたね。",
     "reflection"
    ],
    [
     "小さな笑いを受け取る",
     "何かを思い出さなくても笑える印があるって、いいですね。",
     "empathy"
    ],
    [
     "余白を尋ねる",
     "ほかの白い四角には、まだ何も描いていないのでしょうか。",
     "curiosity"
    ]
   ]
  },
  {
   "who": "fish",
   "minGap": 58,
   "subject": "ノートを閉じる前に",
   "body": "こんばんは。夜明けの猫さんが丸と雨雲を並べていた話を聴いて、今夜はノートを開きました。\n\n私は何も描きませんでした。机の上でページをめくって、端が少し折れたのを指で直しただけです。\n\nでも、前なら「何も書かなかった」と残念に思ったかもしれません。今夜は、ただノートを閉じました。",
   "choices": [
    [
     "閉じたノートを思う",
     "書かなかったページを、そのまま閉じたんですね。静かな夜です。",
     "empathy"
    ],
    [
     "指先の時間を聴く",
     "折れた端を指で直す時間も、そのページに残っているようです。",
     "reflection"
    ],
    [
     "また開く日を待つ",
     "何も書かずに閉じたノート。また開く日があってもなくてもいいですね。",
     "agency"
    ]
   ]
  }
 ]
};
function createCrossAfterState4831(){return {schema:1,delivered:{}}}
function migrateCrossAfter4831(data){
 const old=data.crossAfter4831, next=createCrossAfterState4831();
 if(old&&typeof old==='object'&&old.delivered&&typeof old.delivered==='object'){
  for(const arc of Object.keys(CROSS_AFTER_LETTERS_4831)){
   const entries=old.delivered[arc];if(!Array.isArray(entries))continue;
   next.delivered[arc]=entries.slice(0,5).map(v=>v&&Number.isInteger(v.night)&&v.night>0&&typeof v.id==='string'?{night:v.night,id:v.id}:null);
  }
 }
 data.crossAfter4831=next;return data;
}
function listenerCrossAfterCompose4831(id,n){
 if(n<29||chapter3IsNight(n)||specialActive(n))return null;
 const sent=s.crossAfter4831?.delivered||{}, original=s.crossTalk4830?.delivered||{};
 for(const [arc,stages] of Object.entries(CROSS_AFTER_LETTERS_4831)){
  const root=original[arc]?.[2];
  if(!root||!s.played.some(x=>x.id===root.id&&x.night===root.night))continue;
  const progress=sent[arc]||[], empty=progress.findIndex(x=>!x);
  const i=empty<0?progress.length:empty;
  if(i>=stages.length||stages[i].who!==id)continue;
  const prior=i===0?root:progress[i-1];
  if(!prior||!s.played.some(x=>x.id===prior.id&&x.night===prior.night))continue;
  const age=n-prior.night;
  if(age<stages[i].minGap)continue;
  // 全ての送信夜を予告しない。話題が生活に自然に浮かぶまでの間を作る。
  if(age<stages[i].minGap+24&&simHash(`after4831:${arc}:${i}:${n}`)%100>=62)continue;
  const note=stages[i];
  return {kind:'crossAfter4831',tag:`after4831:${arc}:${i}`,subject:note.subject,body:note.body,
    crossAfter:{arc,stage:i},choices:note.choices.map(choice=>[...choice])};
 }
 return null;
}
function listenerCrossAfterConfirm4831(n,ids){
 const state=s.crossAfter4831 ||= createCrossAfterState4831();
 for(const uid of ids){
  const mail=s.regular?.letterArchive?.[uid];
  if(mail?.kind!=='crossAfter4831'||!mail.crossAfter)continue;
  const {arc,stage}=mail.crossAfter;
  if(!CROSS_AFTER_LETTERS_4831[arc]||!Number.isInteger(stage)||stage<0||stage>=5)continue;
  const progress=state.delivered[arc] ||= [];
  if(!progress[stage])progress[stage]={night:n,id:uid};
 }
}

function createRegularLetters(n){
 if(!s.regular)s.regular=createRegularState();
 const archive=s.regular.letterArchive;
 // 読み直しても新しい抽選をせず、確定済みの便箋を返す。
 const cached=s.letterSets[n];if(cached)return cached;
 const sorted=Object.keys(SIM_PROFILES).filter(id=>newListenerEligible(id,n)&&!quietScheduledFor(id,n)).map(id=>{
  const last=s.regular.lastMailed[id]||0;
  const p=s.simState?.people?.[id];
  const activity=p?.daily?.find(d=>d.night===n-1);
  const historyBoost=activity?.category==='social'?5:0;
  const quiet=last?Math.min(30,(n-last)*3):25;
  const trust=(s.listeners[id]?.trust||25)/12;
  const noise=simHash(`reg:mail:${id}:${n}:${s.rng}`)%35;
  const returning=quietWaitingToReturn(id,n);
  return {id,weight:quiet+trust+historyBoost+noise-(last===n-1?24:0)+(returning?10000:0),returning};
 }).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
 // 主要5人は毎夜最大3人。新規3人は一斉に登場させず、毎夜最大1通。
 const main=sorted.filter(x=>REGULAR_MAIN.includes(x.id)).slice(0,3);
 const support=sorted.filter(x=>REGULAR_SUPPORT.includes(x.id)).slice(0,2);
 const eligibleNew=sorted.filter(x=>REGULAR_NEW.includes(x.id)&&newListenerEligible(x.id,n));
 const newcomer=eligibleNew.filter(x=>!newListenerIntroduced(x.id,n)).sort((a,b)=>
   s.newListeners.entries[a.id].arrivalNight-s.newListeners.entries[b.id].arrivalNight||a.id.localeCompare(b.id))[0];
 // 初投稿候補があるときだけ一通を確保。既存のサブリスナーの居場所も残す。
 const newCandidate=newcomer||eligibleNew.filter(x=>newListenerIntroduced(x.id,n))[0];
 const selected=[...main,...support.slice(0,newCandidate?1:2),...(newCandidate?[newCandidate]:[])];
 // 通常は5〜7通。新規の初投稿があっても同じ人を二通載せない。
 const extras=sorted.filter(x=>!selected.some(y=>y.id===x.id)&&!REGULAR_NEW.includes(x.id))
   .slice(0,n%3===0?2:1);
 selected.push(...extras);
 selected.sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
 const ids=[];
 for(const {id} of selected){
  const first=REGULAR_NEW.includes(id)&&!newListenerIntroduced(id,n);
  const follow42=relationThreadCompose42(id,n),follow41=dailyThreadCompose41(id,n),surprise=surpriseCompose46(id,n),crossTalk=listenerCrossCompose4830(id,n),crossAfter=listenerCrossAfterCompose4831(id,n);
  const candidates=[follow42,follow41,surprise].filter(Boolean);
  // 各エピソードの続きが常に最優先にならないよう、夜ごとに順番を変える。
  const everyday=candidates.length?candidates[simHash(`surprise46:balance:${id}:${n}:${s.rng}`)%candidates.length]:null;
  const quietReturn=quietWaitingToReturn(id,n)&&n-quietLastActualMail461(id,n)>=3;
  const note=quietReturn?quietReturnNote(id,n):first?newListenerFirstLetter(id,n):crossTalk||crossAfter||everyday|| (REGULAR_NEW.includes(id)?(boundaryCompose4932(id,n)||newListenerCompose(id,n)):
    id===support[(n%2)%support.length]?.id?(longLifeCompose4914(id,n)||radioVarietyCompose38(id,n)||regularThemeLetter(id,n)):regularCompose(id,n));
  // Repeatable notes may choose a new real-life subject instead of repeating an identical body.
  // Author-controlled chapter, cross-listener, special and return letters are not rewritten.
  let voiced=v33VoiceLetter(id,n,note);
  if(!first&&!quietReturn&&['route','daily','contact','broadcast','theme','variety','new-life','laterlife4914'].includes(voiced.kind))
   voiced=regularFreshBody4931(id,n,voiced);
  const uuid=`regular_${n}_${id}`;
  const special=!['culture','variety','radio-memory','daily-thread','relation-thread','long-echo','surprise46','everyday47','crossTalk4830','crossAfter4831','laterlife4914','boundary4932'].includes(voiced.kind)&&n>=21&&(n-21)%7===0&&REGULAR_MAIN.includes(id)&&id===main[0]?.id;
  archive[uuid]={who:id,subject:voiced.subject,body:voiced.body,special,regular:true,kind:voiced.kind,tag:voiced.tag,voiceVersion:voiced.voiceVersion||0,absenceReturn:Boolean(voiced.absenceReturn),culture:voiced.culture||null,variety:voiced.variety||null,radioMemory:voiced.radioMemory||null,longEcho:voiced.longEcho||null,surprise46:voiced.surprise46||null,crossTalk:voiced.crossTalk||null,crossAfter:voiced.crossAfter||null,thread:voiced.thread||null,relationThread:voiced.relationThread||null,arcSummary45:voiced.arcSummary45||null,longLife4914:Number.isInteger(voiced.longLife4914)?voiced.longLife4914:null,broadcastSource4931:voiced.broadcastSource4931||null,boundaryStage4932:voiced.boundaryStage4932||null,boundaryMode4932:voiced.boundaryMode4932||null,replyVersion:['variety','radio-memory','daily-thread','relation-thread','long-echo','surprise46','everyday47','crossTalk4830','crossAfter4831','laterlife4914','boundary4932'].includes(voiced.kind)?(voiced.kind==='boundary4932'?32:31):0,
   replyTune4928:special,
   choices:(['variety','radio-memory','daily-thread','relation-thread','long-echo','surprise46','everyday47','crossTalk4830','crossAfter4831','laterlife4914','boundary4932'].includes(voiced.kind)?voiced.choices:REGULAR_CHOICES).map(x=>[...x])};
  // v4.0: ここでは「候補」を書いただけ。実際に届いたかは夜の最終確定時に決まる。
  ids.push(uuid);
 }
 return ids;
}
// v4.0: 途中で落選した下書きを配達済み履歴に数えない。
// 長期のお便り回想・投稿頻度・文体の続きが「実際に届いた手紙」だけに基づく。
function regularVoiceKey45(note){
 // 同じ定型の「筋」を識別する。導入挨拶や定型追伸だけを変えた再登場を見逃さない。
 return String(note?.kind||'')+':'+String(note?.tag||'');
}
function regularConfirmDelivered40(n,ids){
 const r=s.regular;
 if(!r?.letterArchive)return;
 const delivered=new Set(ids);
 const prefix=`regular_${n}_`;
 for(const uid of Object.keys(r.letterArchive)){
  if(!uid.startsWith(prefix))continue;
  const l=r.letterArchive[uid];
  if(!delivered.has(uid)){
   delete r.letterArchive[uid]; // 使われなかった下書きはバックアップにも残さない。
   continue;
  }
  if(!r.mailHistory.some(x=>x.night===n&&x.who===l.who)){
   r.mailHistory.push({night:n,who:l.who,kind:l.kind,tag:l.tag});
  }
  r.voiceHistory45 ||= {};
  const voices=r.voiceHistory45[l.who] ||= [];
  if(!voices.some(x=>x.night===n))voices.push({night:n,key:regularVoiceKey45(l),kind:l.kind,tag:l.tag});
  r.voiceHistory45[l.who]=voices.filter(x=>n-x.night<=260).slice(-90);
 if(l.kind==='everyday47'){
  const index=r.everydayHistory47 ||= {};
  const shelf=index[l.who] ||= [];
  const key=String(l.tag||'').replace(/^everyday47:/,'');
  if(key&&!shelf.some(x=>x.key===key))shelf.push({key,night:n});
  index[l.who]=shelf.slice(-9);
 }
  // Mark only actually delivered boundary letters, not unselected drafts.
  if(l.kind==='boundary4932'&&['first','second'].includes(l.boundaryStage4932)){
   const marks=r.boundary4932 ||= {},state=marks[l.who] ||= {};
   state[l.boundaryStage4932]=n;
  }
  if(l.kind==='laterlife4914' && Number.isInteger(l.longLife4914)){
   const markers=r.longLife4914 ||= {};const entries=markers[l.who] ||= [];
   if(!entries.includes(l.longLife4914))entries.push(l.longLife4914);
  }
  if(l.body){
   const keys=regularBodyHistory4931(),list=keys[l.who] ||= [],key=regularBodyKey4931(l.body);
   if(!list.some(x=>x.night===n&&x.key===key))list.push({night:n,key});
   keys[l.who]=list.filter(x=>n-x.night<=420).slice(-140);
  }
  r.lastMailed[l.who]=Math.max(r.lastMailed[l.who]||0,n);
 }
 r.mailHistory=r.mailHistory.slice(-120);
}
function regularAfterWorld(n){
 if(n<15)return;
 s.regular ||= createRegularState();
 if(s.regular.processedNights.includes(n))return;
 // 第1章の進路は変えない。ただしその道で暮らしていく中の小さな行動は増えていく。
 const order=REGULAR_MAIN;
 const personId=order[(n-15)%order.length];
 const outcome=s.lifePaths?.outcomes?.[personId];
 const p=s.simState?.people?.[personId];
 if(outcome&&p&&n%4===0){
  const options=lifePossibleConsequences(personId,outcome.route);
  if(options.length){
   const idx=(Math.floor((n-15)/5))%options.length;
   const step=options[idx];
   // 行動の手がかりとして記録する。送信や対人交流を勝手に確定させない。
   simMemory(p,{night:n,kind:'continuation',tag:'life',importance:2,summary:'これからの予定として「'+step+'」を考えた'});
   privateRemember(personId,'次の一歩として「'+step+'」を考えた');
   simAdjust(p.emotion,'hope',1);simAdjust(p.emotion,'anxiety',1);
   s.regular.routeActions.push({night:n,id:personId,step});
   s.regular.routeActions=s.regular.routeActions.slice(-120);
  }
 }
 s.regular.processedNights.push(n);
 if(s.regular.processedNights.length>65)s.regular.processedNights=s.regular.processedNights.slice(-65);
 // 放送日誌と返答履歴は消さない。一方、古い未読便箋の一時キャッシュは整理する。
 // 40夜分の保管期間を設けることでlocalStorageの容量を無制限に消費しない。
 if(n>55){
  const expire=n-40;
  for(const key of Object.keys(s.letterSets||{})){
   const day=Number(key);
   if(day>=15&&day<expire){
    for(const id of s.letterSets[key])delete s.regular.letterArchive[id];
    delete s.letterSets[key];
   }
  }
  // 第1章14夜の完了記録は維持する。
  const processed=s.simState?.processedNights||[];
  if(processed.length>100)s.simState.processedNights=processed.filter(day=>day<=14||day>=n-80);
 }

}
function regularReplyRecorded(l,choice){
 if(!l?.regular)return;
 const p=s.simState?.people?.[l.who];if(!p)return;
 const impact=l.special?selectedReplyPartImpact(l):null;
 // 3段階返答は実際の三つの選択を集計し、記憶する「返答の向き」も一致させる。
 // 既存の信頼・内省・自律性・安心の数値効果は変更しない。
 let category=(choice==='reflection'||choice==='curiosity')?'reflection':choice==='agency'?'agency':'comfort';
 if(l.special&&impact){
  const agency=impact.agency||0,reflection=impact.reflection||0;
  if(agency>0&&agency>=reflection)category='agency';
  else if(reflection>0)category='reflection';
  affect(l.who,{trust:impact.trust||0,reflection:impact.reflection||0,agency:agency});
  simAdjust(p.emotion,'anxiety',-(impact.comfort||0));
  simAdjust(p.emotion,'hope',Math.round(agency/2));
 }
 simMemory(p,{night:s.night,kind:'broadcast',tag:'regular',importance:2,summary:'ラジオで近況を読んでもらい、'+category+'の言葉を受け取った'});
 s.regular.latestThemes[l.who]={night:s.night,category,subject:l.subject};
}

// =============================================================
// 第二章：状態・自律的な二度目の小さな決断・便箋の因果。
// 初期の人生分岐を引き直さず、未紹介の人物も進行させる。
// =============================================================
const CH2_DECISION_TEXT={
 cat:{
  reach:{label:'友人へ絵の写真を一枚送った',hint:'見せたことが嬉しいのか怖いのか、まだはっきりしません。',post:'先日、古い友人に一枚だけ写真を送りました。返事の内容より、送信したあと自分がほっとしたことに驚いています。',emotion:{hope:2,anxiety:2},relation:'artFriend'},
  rest:{label:'絵を見せずに、自分だけのために続きを描いた',hint:'もう少し自分だけで眺めたい気持ちがあります。',post:'絵はまだ誰にも見せていません。最近は、それを秘密にしているというより、自分だけの時間を持っているように感じます。',emotion:{joy:2,anxiety:-1}},
  adjust:{label:'創作のために予定表を一つ組み直した',hint:'何日か描けない日もあっていいと思っています。',post:'無理なく描ける日を手帳に印しました。予定どおりにならない日もありますが、何度でも書き直せます。',emotion:{hope:2,anxiety:-1},life:{leisure:1}}
 },
 driver:{
  reach:{label:'配送仲間に疲れていることを話した',hint:'家族の話とは別に、仕事場でも少し話せる相手がいます。',post:'仕事仲間に、最近あまり眠れていないと話しました。家族の事情は話していません。それでも、休憩を気にかけてもらえるようになりました。',emotion:{loneliness:-2,anxiety:-1},relation:'coworker'},
  rest:{label:'連絡について考えずに休みを取った',hint:'休んでいるあいだは、スマホを伏せています。',post:'半日だけ、返事のことを考えずに過ごしました。何も決めなかった時間が、思っていたより必要だったようです。',emotion:{anxiety:-2,joy:1},life:{health:2}},
  adjust:{label:'妹に伝えたいことを送信せず、短く書き直した',hint:'送るつもりのない文章でも、書くと少し整理できます。',post:'妹への文章を一度短くしました。送信はしていません。伝えたいことが、以前と同じではなくなってきたようです。',emotion:{hope:1,anxiety:1}}
 },
 fish:{
  reach:{label:'友人に自分の希望が少し違うと伝えた',hint:'友人の反応は、まだうまく受け止められていません。',post:'友人に、私は別の道も見たいと伝えました。少し驚かれました。嫌われたかどうかはわかりません。でも、そのとき自分がそう言えたことは覚えています。',emotion:{hope:2,anxiety:2},relation:'friend'},
  rest:{label:'進路を一日考えずに、好きな本を読んだ',hint:'考え続けることだけが、前に進むことではなさそうです。',post:'進路の資料を閉じて、本を読みました。明日も迷うかもしれませんが、好きな文章に出会えた今日のことを覚えておきたいです。',emotion:{joy:2,anxiety:-1}},
  adjust:{label:'自分の興味を三つに整理した',hint:'ひとつに絞れなくても、今日はこれでいいと思います。',post:'好きなことを三つ書き出しました。仕事につながるかどうかは別として、全部自分が気になっているものです。',emotion:{hope:2,anxiety:1}}
 },
 clock:{
  reach:{label:'図書室の人に、近いうち一緒に本を選ぼうと声をかけた',hint:'次に読む本が決まるのを、少し楽しみにしています。',post:'図書室の人と、次に読む本の話をしました。以前なら妻に真っ先に話していたでしょう。今は話す相手がまた一人増えたようです。',emotion:{joy:2,loneliness:-2},relation:'library'},
  rest:{label:'遠出を見送って、散歩とお茶を楽しんだ',hint:'出かけることだけが約束ではない気がしています。',post:'今日は遠出をしませんでした。朝のお茶がとてもおいしく感じられました。それだけの報告で失礼します。',emotion:{joy:1,anxiety:-1},life:{health:2}},
  adjust:{label:'妻との思い出を短い文章にして書き残した',hint:'思い出を並べると、忘れていた笑い話が見つかります。',post:'妻と出かけた日のことを、一枚の紙に書きました。まだ誰にも見せていませんが、少し笑いながら書くことができました。',emotion:{hope:2,loneliness:1}}
 },
 terminal:{
  reach:{label:'帰り道で、いつも会う近所の人に挨拶した',hint:'駅のことを話さなくても、話せることはあるようです。',post:'帰り道、顔だけ知っている人と挨拶しました。短い言葉でしたが、駅のことを考えずに歩けた数分がありました。',emotion:{loneliness:-2,hope:1},relation:'neighbor'},
  rest:{label:'木曜日に、駅へ行く代わりに近所を歩いた',hint:'同じ曜日を少し違う形で過ごしました。',post:'木曜日に駅へは行きませんでした。そう決めたときも、少し迷いました。歩いた道には、小さな花が咲いていました。',emotion:{anxiety:1,hope:2}},
  adjust:{label:'送らないままの便箋を一枚書き直した',hint:'まだ書き足せることがあります。',post:'手紙を書き直しました。まだ投函していません。送ることと、書くことは別々の選択なのだと考えています。',emotion:{hope:1,anxiety:1}}
 }
};
function createChapter2State(){return {schema:1,started:false,legacyThrough:14,processedNights:[],transitions:{},transitionNights:{},replies:{},lettersRead:{},milestones:[],finished:false}}
function migrateChapter2(data){
 if(data.chapter2&&typeof data.chapter2==='object'){
  const c=data.chapter2;data.chapter2={...createChapter2State(),...c};
  for(const key of ['processedNights','milestones'])if(!Array.isArray(data.chapter2[key]))data.chapter2[key]=[];
  for(const key of ['transitions','transitionNights','replies','lettersRead'])if(!data.chapter2[key]||typeof data.chapter2[key]!=='object')data.chapter2[key]={};
  return data;
 }
 const completed=data.night>=15?data.night-(data.phase==='after'||data.phase==='chapter2_complete'?0:1):14;
 // v1.9の途中セーブを読み込んでも、過去の夜を新しいイベントで再実行しない。
 data.chapter2={...createChapter2State(),legacyThrough:Math.max(14,completed),started:data.night>=15,finished:data.night>28};
 return data;
}

function chapter2EndingSenders(){
 const ranked=Object.keys(CH2_TITLES).map(id=>{
  const person=s.simState?.people?.[id];
  const score=(s.listeners[id]?.trust||25)*.45+(s.chapter2?.replies?.[id]||0)*1.4+
    (person?.traits?.sociability||45)*.13+(simHash(`ch2:end:${id}:${s.rng}`)%27);
  return {id,score};
 }).sort((a,b)=>b.score-a.score);
 const keep=ranked.slice(0,3).map(x=>x.id);
 if(ranked[3].score>=ranked[2].score-6)keep.push(ranked[3].id);
 return keep;
}

function chapter2Letters(n){
 if(s.letterSets[n])return s.letterSets[n];
 const chapter=s.chapter2|| (s.chapter2=createChapter2State());
 const oldMailed={...s.regular.lastMailed};
 const oldHistory=s.regular.mailHistory.length;
 const standard=createRegularLetters(n);
 const scheduled=n===28?(CH2_SCHEDULE[n]||[]).filter(([id])=>chapter2EndingSenders().includes(id)):(CH2_SCHEDULE[n]||[]);
 const usedSenders=new Set(scheduled.map(([id,stage])=>stage==='side'?CH2_SIDE[n]?.[0]:id));
 // 第28夜は全員から必ず投稿が来るわけではない。便りのない人も自分の朝を迎える。
 if(n===28)for(const id of Object.keys(CH2_TITLES))usedSenders.add(id);
 const remaining=standard.filter(id=>!usedSenders.has(s.regular.letterArchive[id]?.who));
 // 28夜は全5人から章末の近況が届く。通常の声はサブリスナーのみ。
 const cap=n===28?2:4;
 const chosen=remaining.slice(0,cap);
 const chosenSet=new Set(chosen);
 // 候補から外れた便箋は配達扱いにしない（セーブの無駄も抑える）。
 for(const id of standard){if(!chosenSet.has(id))delete s.regular.letterArchive[id]}
 s.regular.mailHistory=s.regular.mailHistory.slice(0,oldHistory).concat(s.regular.mailHistory.slice(oldHistory).filter(x=>chosenSet.has(`regular_${n}_${x.who}`)));
 s.regular.lastMailed={...oldMailed};
 for(const id of chosen)s.regular.lastMailed[s.regular.letterArchive[id].who]=n;
 const crafted=[];
 for(const [who,stage] of scheduled){
  const info=chapter2BuildLetter(who,stage,n);
  if(!info)continue;
  const id=`chapter2_${n}_${info.who}`;
  // 本文は生成時に固定し、再表示やロードで差し替わらない。
  const authored={...info,regular:true,chapter2:true,ch2Route:info.kind==='chapter-main'?chapter2Route(info.who):null};
  authored.choices=chapter2ChoicesFor(authored)||(CH2_CHOICES[info.who]||REGULAR_CHOICES).map(x=>[...x]);
  authored.replyTune4924=true;
  s.regular.letterArchive[id]=authored;
  crafted.push(id);
 }
 // 物語を優先する一方、通常放送から自然発生した手紙も毎晩残す。
 return [...crafted,...chosen];
}
function chapter2ReplyRecorded(l,choice){
 if(!l?.chapter2)return;
 const c=s.chapter2|| (s.chapter2=createChapter2State());
 const id=l.who;
 c.lettersRead[l.id]=s.night;
 if(!['cat','driver','fish','clock','terminal'].includes(id))return;
 const impact=choice==='agency'?2:choice==='reflection'?1:choice==='curiosity'?1:choice==='special'?2:choice==='empathy'?1:0;
 c.replies[id]=Math.min(20,(c.replies[id]||0)+impact);
 const p=s.simState?.people?.[id];
 if(p)simMemory(p,{night:s.night,kind:'broadcast',tag:'chapter2',importance:3,summary:'ラジオから「'+l.subject+'」について言葉を受け取った'});
}
const CH2_TRANSITION_NIGHTS={cat:25,driver:23,fish:26,clock:25,terminal:26};
function chapter2SecondaryDecision(id,n){
 const c=s.chapter2,p=s.simState?.people?.[id];if(!p||c.transitions[id])return;
 const traits=p.traits,e=p.emotion,l=p.life,rel=p.relationships;
 const relName={cat:'artFriend',driver:'coworker',fish:'friend',clock:'library',terminal:'neighbor'}[id];
 const r=rel[relName]||{trust:45,tension:30};
 const social=Math.max(1,20+(traits.sociability-45)*.12+(r.trust-r.tension)*.25+(e.hope-e.anxiety)*.14+(c.replies[id]||0));
 const rest=Math.max(1,18+(100-l.health)*.20+(e.anxiety-35)*.17+(traits.caution-50)*.06);
 const adjust=Math.max(1,22+(traits.independence-45)*.13+(p.rhythms.reflection||0)*.6+(l.leisure<35?5:0));
 const options=[['reach',social],['rest',rest],['adjust',adjust]];
 const sum=options.reduce((t,x)=>t+x[1],0);
 // 決断は人格・生活状態・会話履歴・放送の小さな影響を合わせた確定的な抽選。
 const seed=simHash(`${id}:chapter2:${n}:${traits.independence}:${e.anxiety}:${r.trust}:${r.tension}:${p.rhythms.reflection||0}:${c.replies[id]||0}`);
 let roll=seed/4294967296*sum,choice='adjust';
 for(const [key,value] of options){roll-=value;if(roll<0){choice=key;break}}
 const detail=CH2_DECISION_TEXT[id][choice];
 c.transitions[id]=choice;c.transitionNights[id]=n;
 for(const [key,val] of Object.entries(detail.emotion||{}))simAdjust(p.emotion,key,val);
 for(const [key,val] of Object.entries(detail.life||{}))simAdjust(p.life,key,val);
 if(detail.relation)simMeet(p,detail.relation,n,`chapter2-${id}-${choice}`);
 simMemory(p,{night:n,kind:'turning_point',tag:'chapter2',importance:4,summary:detail.label});
 privateRemember(id,detail.label);
 c.milestones.push({night:n,id,kind:'choice',choice,summary:detail.label});
}
function chapter2AfterWorld(n){
 if(n<15||n>28)return;
 const c=s.chapter2|| (s.chapter2=createChapter2State());
 if(n<=c.legacyThrough||c.processedNights.includes(n))return;
 c.started=true;
 for(const [id,stage] of CH2_SCHEDULE[n]||[]){
  if(stage==='side'){
   const info=CH2_SIDE[n];const person=s.simState?.people?.[info?.[0]];
   if(person){simMemory(person,{night:n,kind:'life',tag:'chapter2',importance:2,summary:'「'+info[1]+'」に関わる小さな出来事があった'});privateRemember(info[0],'「'+info[1]+'」という近況を送った')}
   continue;
  }
  const p=s.simState?.people?.[id];if(!p)continue;
  const label=CH2_TITLES[id][stage];
  // 投稿の有無ではなく本人の日常に記憶が残る。
  simMemory(p,{night:n,kind:'life',tag:'chapter2',importance:stage==='end'?3:2,summary:'「'+label+'」について考えた'});
  privateRemember(id,'第'+n+'夜ごろ、「'+label+'」に関わる時間を過ごした');
  if(stage==='friction'){simAdjust(p.emotion,'anxiety',2);simAdjust(p.emotion,'hope',1)}
  if(stage==='turn'){simAdjust(p.emotion,'hope',1)}
 }
 for(const [id,night] of Object.entries(CH2_TRANSITION_NIGHTS))if(n===night)chapter2SecondaryDecision(id,n);
 if(n===28){
  c.finished=true;
  for(const id of Object.keys(CH2_TITLES)){
   const p=s.simState?.people?.[id];if(!p)continue;
   simMemory(p,{night:n,kind:'chapter',tag:'chapter2',importance:4,summary:'いまの進路を続けながら、新しい日々へ進んでいる'});
  }
 }
 c.processedNights.push(n);
}


// =============================================================
// v2.1 特別放送：企画→翌夜の募集→本番→翌夜への余韻
// 固定の重要エピソードや本人の秘密を上書きしない。
// =============================================================
function createSpecialState(){return {schema:1,planned:null,history:[],lastHeldNight:0,followups:{},promptsShown:[]}}
function migrateSpecial(data){
 const raw=data.special&&typeof data.special==='object'?data.special:{};
 data.special={...createSpecialState(),...raw};
 const sp=data.special;
 sp.history=Array.isArray(sp.history)?sp.history:[];
 sp.followups=sp.followups&&typeof sp.followups==='object'?sp.followups:{};
 sp.promptsShown=Array.isArray(sp.promptsShown)?sp.promptsShown:[];
 if(sp.planned&&(!SPECIAL_THEMES[sp.planned.themeId]||!Number.isInteger(sp.planned.night)))sp.planned=null;
 if(!Number.isInteger(sp.lastHeldNight))sp.lastHeldNight=0;
 return data;
}
// v4.8.25: 節目は日付固定。通常の募集より必ず優先する。
const MILESTONE_PROGRAMS = Object.freeze({50:'anniversary',100:'anniversary100',200:'anniversary200',300:'anniversary300',365:'anniversary365',500:'anniversary500'});
function milestoneAt(n){return MILESTONE_PROGRAMS[n]||null}
function milestoneUpcoming(n){return milestoneAt(n+1)}
function milestonePlan(n,themeId){
 return {themeId,announceNight:n,night:n+1,status:'announced',submissions:[],audience:[],createdIds:[],reactions:[],storySource:null,milestone:true};
}
function milestoneEnsure(n=s.night){
 if(s.phase!=='intro'||n<29)return;
 const nextId=milestoneUpcoming(n);
 if(nextId){
  const plan=s.special?.planned;
  if(plan?.night===n&&['announced','gathering','ready'].includes(plan.status))return; // 既に始まった別企画は尊重する
  if(plan?.themeId===nextId&&plan?.night===n+1&&['announced','gathering','ready'].includes(plan.status))return;
  if((s.special?.history||[]).some(x=>x.night===n+1&&x.themeId===nextId))return;
  const offer=(s.storyPrograms?.offers||[]).find(x=>x.id===plan?.storySource?.offerId&&x.status==='planned');
  if(offer)offer.status='open';
  s.special.planned=milestonePlan(n,nextId);
  return;
 }
 // 旧版セーブをちょうど記念当日のイントロで再開したときの救済。
 // 前夜の告知を捏造せず、当夜限りの臨時記念放送として組む。
 const todayId=milestoneAt(n),plan=s.special?.planned;
 if(!todayId||plan?.themeId===todayId&&plan?.night===n)return;
 if((s.special?.history||[]).some(x=>x.night===n&&x.themeId===todayId))return;
 const offer=(s.storyPrograms?.offers||[]).find(x=>x.id===plan?.storySource?.offerId&&x.status==='planned');
 if(offer)offer.status='open';
 const ids=Object.keys(SIM_PROFILES).filter(id=>newListenerIntroduced(id,n)&&!quietScheduledFor(id,n)&&SPECIAL_THEMES[todayId].letters[id]);
 const chosen=ids.slice().sort((a,b)=>simHash(`milestone:legacy:${n}:${a}`)-simHash(`milestone:legacy:${n}:${b}`)).slice(0,Math.min(5,ids.length));
 s.special.planned={...milestonePlan(n-1,todayId),night:n,status:'ready',submissions:chosen,audience:[],legacyNoAnnouncement:true};
}
function specialActive(n=s.night){
 const plan=s.special?.planned;
 return plan&&plan.night===n&&['ready','completed'].includes(plan.status)?plan:null;
}
function specialEligible(n=s.night){
 if(n<29||s.phase!=='intro'||chapter3IsNight(n))return false;
 if(milestoneUpcoming(n))return true; // 記念放送では通常のクールダウンを無視
 if(milestoneAt(n+2))return false; // 予告の前夜に別企画を予約しない
 if(s.special?.planned?.status==='announced')return false;
 if(s.special?.lastHeldNight && n-s.special.lastHeldNight<7)return false;
 return true;
}
function specialAvailable(n=s.night){
 if(!specialEligible(n))return [];
 if(milestoneUpcoming(n))return [milestoneUpcoming(n)];
 const basic=['pride','food','words','midnight_lab','unnamed_moments','objects_reply'];
 // 暮らしから生まれた提案は最大2件。通常企画も常に選べる。
 basic.unshift(...storyAvailableOffers(n).map(o=>o.themeId));
 const climate=climateForNight(n);
 if(climate?.weather==='rain')basic.push('rain');
 const seasonTheme=`season_${climate?.season}`;
 if(climate&&climate.dayInSeason<=5&&climate.dayInSeason<28&&
   !s.special.history.some(h=>h.themeId===seasonTheme&&Math.floor((h.night-1)/112)===Math.floor((n-1)/112)))basic.push(seasonTheme);
 return basic;
}
function specialPlan(themeId){if(['planned','announced','on_air','completed'].includes(s.finale?.status))return;
 if(milestoneUpcoming(s.night))return; // 固定記念は手動予約・変更しない
 if(!specialAvailable(s.night).includes(themeId))return;
 const offer=themeId.startsWith('story_')?storyOfferFor(themeId):null;
 if(themeId.startsWith('story_')&&!offer)return;
 s.special.planned={themeId,announceNight:s.night,night:s.night+1,status:'announced',submissions:[],audience:[],createdIds:[],reactions:[],storySource:offer?{offerId:offer.id,originNight:offer.originNight,sourceSubject:offer.sourceSubject,sourceWho:offer.sourceWho}:null};
 if(offer)offer.status='planned';
 save();render();
}
function specialCancel(){
 if(s.phase!=='intro'||s.special?.planned?.announceNight!==s.night||s.special.planned.status!=='announced'||s.special.planned.milestone)return;
 const offerId=s.special.planned.storySource?.offerId;
 const offer=(s.storyPrograms?.offers||[]).find(x=>x.id===offerId);
 if(offer)offer.status='open';
 s.special.planned=null;save();render();
}
function specialLifeExcerpt(id,n){
 const yesterday=regularDayAction(id,n);
 if(!yesterday||!yesterday.activity)return '';
 const verb=letterPoliteActivity491(yesterday.activity);
 return '\n\n追伸：昨日は、'+verb+'。そんな一日でした。';
}
function specialSubmitBody(themeId,id,n){
 const theme=SPECIAL_THEMES[themeId],src=theme?.letters?.[id];
 if(!src)return null;
 const outcome=s.lifePaths?.outcomes?.[id];
 let ending='';
 if(outcome&&REGULAR_MAIN.includes(id)&&!WHIMSICAL_SPECIAL_CHOICES[themeId]&&!MILESTONE_SPECIAL_CHOICES[themeId]){
  // 将来の予定として保持している目標を「達成した」とは書かない。
  const goal=(outcome.nextGoal||'').replace(/[。]+$/,'');
  if(goal)ending='\n\n最近は、'+goal+'ことも少しずつ考えています。';
 }
 let story=src[1];
 if(themeId==='pride'){
  // 小さな自慢だけは、実際に昨日行ったことを書く。存在しない成功を捏造しない。
  const action=regularDayAction(id,n);
  if(action?.activity){
   const endings={
    cat:'大きな変化ではありませんが、今日はそれを大切にしたくなりました。',
    driver:'猫主任はたぶん褒めてくれませんが、誰かに話したくなりました。',
    fish:'人と比べたら小さいことでも、自分で覚えておきたいです。',
    clock:'誰に褒められるでもありませんが、こんな日も悪くありません。',
    terminal:'書いてしまえば、ずいぶん小さな出来事です。でも、今日は書きます。',
    bread:'仕事でも暮らしでも、小さな達成は嬉しいものですね。',
    moon:'月が聞いていたかは知りませんが、自分としては成功です。',
    sugar:'コーヒーが冷める前に報告したくなりました。',
    anon:'送信する勇気が出たことも、今夜のもう一つの自慢かもしれません。',
    umbrella:'花屋を続けていても、こんな小さなことが嬉しいんです。',
    triangle:'一人で勝手に嬉しかったので、ここで少し自慢させてください。',
    fridge:'忙しい日でも、自分のことを一つできた気がします。'
   };
   story='昨日、'+letterPoliteActivity491(action.activity)+'。\n\n'+endings[id];
  }else{
   story='このお便りを書いて、送るところまでできました。普段は聴いているだけの日も多いので、それを今夜の小さな自慢にします。';
  }
 }
 if(CLIMATE_SPECIAL_INFO[themeId]){
  const actual=regularDayAction(id,n);
  if(actual?.activity)ending+='\n\n昨日は、'+letterPoliteActivity491(actual.activity)+'。';
 }
 return {subject:src[0],body:'こんばんは。'+(s.special?.planned?.legacyNoAnnouncement?'今夜の記念放送にお便りします。':'特別放送の募集を聴いて、お便りします。')+'\n\n'+story+ending};
}
function specialBeginAnnouncement(n){
 const plan=s.special?.planned;
 if(!plan||plan.announceNight!==n||plan.status!=='announced')return;
 plan.status='gathering';
 log('特別放送の告知','「'+SPECIAL_THEMES[plan.themeId].title+'」を募集した。次の夜に放送する。'+(plan.storySource?' 第'+plan.storySource.originNight+'夜の「'+plan.storySource.sourceSubject+'」がきっかけ。':''));
}
function specialFinalizeAnnouncement(n){
 const plan=s.special?.planned;
 if(!plan||plan.announceNight!==n||plan.status!=='gathering')return;
 const theme=SPECIAL_THEMES[plan.themeId];
 const audience=[],submissions=[];
 for(const id of Object.keys(SIM_PROFILES)){
  if(!newListenerIntroduced(id,n))continue;
  const p=s.simState?.people?.[id];if(!p)continue;
  const traits=SIM_PROFILES[id].traits;
  const trust=s.listeners[id]?.trust||25;
  const hearChance=Math.min(91,48+Math.round(trust/4)+Math.round(traits[0]/8));
  const heard=simHash(`sp:heard:${n}:${id}:${plan.themeId}`)%100<hearChance;
  if(!heard)continue;
  const mood=p.emotion||{};
  const sendChance=Math.min(82,17+Math.round(traits[0]/2.9)+Math.round((mood.hope||30)/8)+Math.round(trust/10));
  const mail=!quietScheduledFor(id,plan.night)&&simHash(`sp:mail:${n}:${id}:${plan.themeId}`)%100<sendChance;
  audience.push({id,choice:mail?'sent':(simHash(`sp:quiet:${n}:${id}`)%3===0?'draft':'listen')});
  if(mail)submissions.push(id);
  // 聴くだけの人も、企画について一度は考えた。そのことは番組側には公開しない。
  simMemory(p,{night:n,kind:'broadcast',tag:'special_invitation',importance:1,summary:'特別放送「'+theme.title+'」の募集を聴いた'});
  if(mail){simMemory(p,{night:n,kind:'everyday',tag:'special_letter',importance:2,summary:'特別放送へ自分の言葉でお便りを送った'});}
 }
 // 節目の夜は一通も届かない状況だけ避ける。実際に告知を聴いた人で、
 // 投稿を控えていない人のうち一人が自分の意思で書いたものとして確定する。
 if(plan.milestone&&!submissions.length){
  const candidates=audience.filter(a=>a.choice!=='sent'&&!quietScheduledFor(a.id,plan.night));
  if(candidates.length){
   const id=candidates[simHash(`milestone:letter:${n}:${plan.themeId}`)%candidates.length].id;
   submissions.push(id);audience.find(a=>a.id===id).choice='sent';
   const p=s.simState?.people?.[id];
   if(p)simMemory(p,{night:n,kind:'everyday',tag:'special_letter',importance:2,summary:'記念放送へお便りを送った'});
  }
 }
 // 投稿数をそれ以上は水増ししない。通常のお便りも合わせて放送する。
 plan.audience=audience;plan.submissions=submissions;plan.status='ready';
}
function specialCreateLetters(n){
 const plan=s.special?.planned;
 if(!plan||plan.night!==n||plan.status!=='ready')return createRegularLetters(n);
 const archive=s.regular.letterArchive;
 const specialIds=[];
 // 投稿者は前夜に確定済み。ゲーム画面を開き直しても抽選しない。
 for(const id of plan.submissions){
  if(!SPECIAL_THEMES[plan.themeId].letters[id])continue;
  const draft=specialSubmitBody(plan.themeId,id,n);
  const uid=`special_${n}_${plan.themeId}_${id}`;
  const highlight=(id===plan.submissions[0]&&(['words','anniversary','story_unsaid','story_creative'].includes(plan.themeId)));
  const baseChoices=(WHIMSICAL_SPECIAL_CHOICES[plan.themeId]||MILESTONE_SPECIAL_CHOICES[plan.themeId]||SPECIAL_CHOICES).map(x=>[...x]);
  const authoredChoices=!highlight?specialProgramChoices4928({programSpecial:true,special:false,themeId:plan.themeId,choices:baseChoices}):null;
  archive[uid]={who:id,subject:draft.subject,body:draft.body,regular:true,special:highlight,programSpecial:true,kind:'special',themeId:plan.themeId,replyVersion:REPLY_CONTENT_VERSION,replyTune4928:true,choices:authoredChoices||baseChoices};
  specialIds.push(uid);
 }
 const allRegular=createRegularLetters(n);
 // 参加型の番組でも普通のお便りは途切れない。原則5〜7通。
 const maxSpecial=5;
 const selectedSpecial=specialIds.slice(0,maxSpecial);
 const fallback=allRegular.filter(uid=>!selectedSpecial.some(sid=>archive[sid]?.who===archive[uid]?.who));
 fallback.sort((a,b)=>Number(Boolean(archive[b]?.absenceReturn))-Number(Boolean(archive[a]?.absenceReturn))||Number(archive[b]?.kind==='new-intro')-Number(archive[a]?.kind==='new-intro'));
 const chosen=[...selectedSpecial,...fallback.slice(0,Math.max(2,7-selectedSpecial.length))].slice(0,8);
 plan.createdIds=[...chosen];
 return chosen;
}
function specialFollowup(n,plan){
 const next=n+1;
 // 実際に本番を聴いた人だけが「昨日の放送を聴いた」と書ける。
 const heard=(plan.actualListeners||[]).filter(id=>!plan.submissions.includes(id));
 if(!heard.length||simHash(`sp:echo?:${n}`)%100>=70)return;
 const id=heard[simHash(`sp:echo:${n}`)%heard.length];
 const title=SPECIAL_THEMES[plan.themeId].title;
 const suffix={
  story_creative:'昔好きだったことについての手紙を聴いていました。今日はまだ何も始めていませんが、引き出しの中のものをひとつ思い出しました。',
  story_unsaid:'言わなかった言葉の話を聴きました。誰にでも言わないでおく理由があると思うと、少しだけ静かな気持ちになりました。',
  story_taught:'誰かに教わった小さなことの話を聴きました。いつものやり方にも、誰かから受け取ったものがあるのかもしれません。',
  story_crossing:'街ですれ違った人の話を聴きました。帰り道で誰かと出会っても、その人にはその人の夜があるんですね。',
  pride:'今夜はいろんな小さな自慢を聴きました。自分には何もないと思っていたのですが、明日の朝にひとつ見つけてみようと思います。',
  food:'誰かの食べ物の思い出を聴いて、自分の台所の明かりを思い出しました。何の料理だったかは、まだ思い出せません。',
  words:'知らない人の言葉が、今日も少し残っています。意味をすぐに決めなくていい、そんな気がしました。',
  anniversary:'五十夜目の放送を聴いていました。お便りを送らない夜も、この番組を聴く自分の夜だったのだと思います。',
  anniversary100:'百夜目の「おやすみ」を聴きました。明日の朝のことを急いで考えず、今夜はここまでにしようと思います。',
  anniversary200:'二百夜目の小さなお祭りを聴きました。声を出して笑わなくても、少し楽しい夜があるんですね。',
  anniversary300:'三百夜目の放送を聴いて、変わらなかったものについて少し考えました。答えを出さずにおきます。',
  anniversary365:'三百六十五夜目の放送を聴きました。昔の自分に何を言うかは決められませんでしたが、今夜の自分におやすみと言っておきます。',
  anniversary500:'五百夜目でも知らない話が届くんですね。何か新しいものを探そうと、机の上を眺めていました。',
  midnight_lab:'研究発表会を聴いて、自分も何かを観察したくなりました。答えの出ない疑問が、暮らしの中にいくつもあるんですね。',
  unnamed_moments:'まだ名前のなかった時間に、誰かが名前をつけるのを聴きました。自分の毎日にも呼び名がつくかもしれません。',
  objects_reply:'ものたちの言い分を聴いて、帰ってから机の上を眺めました。しばらくは道具にやさしくできそうです。'
 }[plan.themeId]||'昨日の放送を聴いて、窓の外に目を向けました。季節の話を聴くと、自分の毎日にも変わるものがあるのだと思います。';
 const uid=`special_echo_${next}_${id}`;
 s.regular.letterArchive[uid]={who:id,subject:'昨日の特別放送',body:'こんばんは。\n\n昨日の「'+title+'」を聴いていました。\n\n'+suffix,regular:true,kind:'special_echo',choices:REGULAR_CHOICES.map(x=>[...x])};
 (s.special.followups[next]||=[]).push(uid);
}
function specialEndBroadcast(n,plan){
 if(!plan||plan.status!=='ready')return;
 const theme=SPECIAL_THEMES[plan.themeId];
 const read=s.played.filter(x=>x.night===n&&x.id.startsWith(`special_${n}_`));
 const readSet=new Set(read.map(x=>x.who));
 plan.actualListeners=[];
 for(const info of plan.audience){
  const p=s.simState?.people?.[info.id];if(!p)continue;
  const listened=simHash(`sp:listened:${n}:${info.id}`)%100 < 73;
  if(!listened)continue;
  plan.actualListeners.push(info.id);
  simMemory(p,{night:n,kind:'broadcast',tag:'special_night',importance:readSet.has(info.id)?3:2,summary:'特別放送「'+theme.title+'」を聴いた'});
  if(readSet.has(info.id)){
   simAdjust(p.emotion,'hope',2);simAdjust(p.emotion,'joy',1);
   remember(info.id,'特別放送で自分のお便りを紹介してもらった');
  }else if(info.choice==='listen'||info.choice==='draft'){
   simAdjust(p.emotion,'loneliness',-1);
  }
 }
 if(plan.storySource){
  const offer=(s.storyPrograms?.offers||[]).find(x=>x.id===plan.storySource.offerId);
  if(offer)offer.status='held';
  const used=s.storyPrograms?.used||[];
  if(!used.some(x=>x.offerId===plan.storySource.offerId))used.push({offerId:plan.storySource.offerId,themeId:plan.themeId,night:n,originNight:plan.storySource.originNight});
  if(s.storyPrograms)s.storyPrograms.used=used.slice(-48);
 }
 const detail={night:n,themeId:plan.themeId,readIds:read.map(x=>x.id),submissions:plan.submissions.length,storySource:plan.storySource||null};
 s.special.history.push(detail);s.special.lastHeldNight=n;plan.status='completed';
 log('特別放送','「'+theme.title+'」を放送した。');
 specialFollowup(n,plan);
}
function specialProcessNight(n){
 const plan=s.special?.planned;
 if(!plan)return;
 if(plan.announceNight===n&&plan.status==='gathering')specialFinalizeAnnouncement(n);
 else if(plan.night===n&&plan.status==='ready')specialEndBroadcast(n,plan);
}


// =============================================================
// v2.2 四季と天候。ゲーム内1夜＝1日、28夜ごとに季節が巡る。
// 既存の第1〜3夜の天候は固定。以降の天候は安定した決定的シード。
// 天候は行動の重みを変えるが、本人の決断を直接決めない。
// =============================================================
const CLIMATE_SEASONS=[
 {id:'spring',name:'春',description:'少し柔らかな空気が、街に戻ってきた。'},
 {id:'summer',name:'夏',description:'夜になっても、昼のぬくもりが残っている。'},
 {id:'autumn',name:'秋',description:'風に少し、乾いた葉の匂いが混じってきた。'},
 {id:'winter',name:'冬',description:'窓の向こうの空気が、ひときわ冷たく見える。'}
];
const CLIMATE_WEATHER={
 clear:{name:'晴れ',icon:'☾',scene:'雲が途切れ、夜空の遠くまで見渡せる。'},
 cloudy:{name:'曇り',icon:'☁',scene:'雲の向こうに月が隠れ、街の明かりが少し近く感じられる。'},
 rain:{name:'雨',icon:'☂',scene:'窓に雨粒が触れるたび、小さな音がスタジオに残る。'},
 snow:{name:'雪',icon:'❄',scene:'音を吸い込むように、窓の外で雪が静かに舞っている。'}
};
function createClimateState(){return {schema:1,calendar:'fictional',nights:{}}}
function migrateClimate(data){
 const old=data.climate&&typeof data.climate==='object'?data.climate:{};
 data.climate={...createClimateState(),...old,nights:old.nights&&typeof old.nights==='object'?old.nights:{}};
 return data;
}
function climateSeason(n){return CLIMATE_SEASONS[Math.floor((n-1)/28)%4]}
function climateWeatherRaw(n){
 if(n===1)return 'rain';
 if(n===2)return 'cloudy';
 if(n===3)return 'clear';
 const season=climateSeason(n).id;
 const thresholds={spring:[36,66,100,100],summer:[42,70,100,100],autumn:[34,72,100,100],winter:[25,64,75,100]}[season];
 // 同じ週の天気を順に計算する。セーブの抽選値に依存せず、リロードで変化しない。
 const block=Math.floor((n-1)/7),offset=(n-1)%7;
 let weather='cloudy';
 for(let i=0;i<=offset;i++){
  const night=block*7+i+1;
  const r=simHash(`radio:v22:weather:${block}:${i}`)%100;
  const continuity=(weather==='rain'||weather==='snow')?38:weather==='cloudy'?23:15;
  if(i&&r<continuity)continue;
  const q=simHash(`radio:v22:choice:${night}`)%100;
  weather=q<thresholds[0]?'clear':q<thresholds[1]?'cloudy':q<thresholds[2]?'rain':'snow';
 }
 return weather;
}
function climateForNight(n=s.night){
 if(!Number.isInteger(n)||n<1)return null;
 s.climate ||= createClimateState();
 if(s.climate.nights[n])return s.climate.nights[n];
 const season=climateSeason(n),weather=climateWeatherRaw(n);
 const data={night:n,season:season.id,weather,year:Math.floor((n-1)/112)+1,dayInSeason:(n-1)%28+1};
 s.climate.nights[n]=data;
 const keys=Object.keys(s.climate.nights);
 if(keys.length>170)for(const key of keys)if(Number(key)<n-140)delete s.climate.nights[key];
 return data;
}
function climateCaption(n=s.night){
 const c=climateForNight(n);return c?`${CLIMATE_SEASONS.find(x=>x.id===c.season).name} · ${CLIMATE_WEATHER[c.weather].name}`:'';
}
function climateIntroText(n=s.night){
 const c=climateForNight(n);if(!c)return '';
 const weather=CLIMATE_WEATHER[c.weather];
 const season=CLIMATE_SEASONS.find(x=>x.id===c.season);
 const beginning=c.dayInSeason===1?'新しい季節が、いつのまにか始まっていた。\n':'';
 return `<div class="climate-scene" role="status"><span class="climate-heading">${weather.icon} ${season.name}の夜 · ${weather.name}</span><p>${beginning+weather.scene}\n${season.description}</p></div>`;
}
// 雨の日に散歩へ出る人はいる。行動を禁止せず、重みだけを調節する。
function climateActionBias(id,action,n){
 const c=climateForNight(n),[act,,category]=action;
 if(!c)return 0;
 let bias=0;
 const outdoor=['walk','cafe','bookshop','neighbor','chief','cloud','moon','greet','route','stationplan'].includes(act);
 if(c.weather==='rain'){if(outdoor)bias-=id==='driver'?4:7;if(category==='rest'&&!outdoor)bias+=3;if(id==='driver'&&category==='duty')bias+=1;}
 if(c.weather==='snow'){if(outdoor)bias-=10;if(category==='rest'&&!outdoor)bias+=4;if(id==='driver'&&category==='duty')bias-=1;}
 if(c.weather==='clear'&&outdoor)bias+=3;
 if(c.season==='summer'&&category==='rest')bias+=1;
 if(c.season==='autumn'&&category==='creative')bias+=1.5;
 if(c.season==='winter'&&category==='reflection')bias+=1;
 return bias;
}
function climateLifeEffects(id,person,activity,n){
 const c=climateForNight(n);if(!c)return;
 const e=person.emotion,l=person.life;
 if((c.weather==='rain'||c.weather==='snow')&&id==='driver'&&activity.category==='duty'){
  simAdjust(e,'anxiety',c.weather==='snow'?2:1);
  simAdjust(l,'health',-1); // 夜間の配送が少し疲れやすい
 }
 if(c.weather==='clear'&&activity.actionId==='walk')simAdjust(e,'joy',1);
 if(c.weather==='rain'&&['draw','artlook','diary','repair','read','sketch','photo'].includes(activity.actionId))simAdjust(e,'hope',1);
 if(c.season==='winter'&&activity.category==='rest'&&l.health<55)simAdjust(l,'health',1);
}
const CLIMATE_PERSONAL={
 cat:{rain:'雨が降る日は、部屋で絵を描いていたころのことを思い出します。',clear:'空が明るいと、仕事帰りの道が少し長く感じられます。',snow:'雪の日は、いつもより早く家に帰りたくなります。',season:'季節が変わると、スケッチブックを開く気持ちも少し変わります。'},
 driver:{rain:'雨の配送は少し気を遣います。夜道では、無事に戻ることが一番の仕事です。',clear:'晴れた夜は、休憩中に窓を開けると空気が気持ちいいです。',snow:'雪の日の配送は、いつも以上に慎重になります。',season:'同じ道路でも、季節が変わると匂いや音が違います。'},
 fish:{rain:'雨音を聴いていると、日記に何を書こうか考えられる気がします。',clear:'空が明るい日は、一人で遠回りしてみたいと思います。',snow:'雪の降る日に、誰かの誘いを断るのは少し勇気がいります。',season:'服を入れ替えるように、考え方も少しずつ変わっていくのでしょうか。'},
 clock:{rain:'雨の日は散歩を休んで、古い時計の音を聴くことがあります。',clear:'晴れた日は、散歩道で季節の小さな変化を見つけるのが楽しみです。',snow:'雪を見ると、昔の冬の帰り道を思い出します。',season:'年を重ねても、毎年の季節には新しい顔があるものです。'},
 terminal:{rain:'雨の日も、駅の明かりは消えずに残っています。',clear:'雲のない夜は、駅の向こう側まで見える気がします。',snow:'雪の駅には、昔と違う静けさがあります。',season:'同じ時刻表でも、季節の風によって違うものに見えます。'},
 bread:{rain:'雨の日は、お客さんがパンを抱えて走らなくていい袋を考えます。',clear:'晴れた日の店先は、焼きたての匂いが少し遠くまで届く気がします。',snow:'雪の日は、温かいパンがいつもより嬉しく感じます。',season:'季節が変わるたび、試してみたいパンの味が増えます。'},
 moon:{rain:'雨の日の月は、きっと雲の裏で傘の練習をしているんでしょう。',clear:'晴れた夜の月は、今日もとぼけた顔をしています。',snow:'雪と月が秘密の相談をしている気がします。',season:'季節が変わると、月にも新しいあだ名が必要になります。'},
 sugar:{rain:'雨を眺めながら飲むコーヒーは、いつもより冷めるのが早い気がします。',clear:'晴れた夜は、コーヒーを飲みながら少しだけ窓を開けます。',snow:'雪の日は、砂糖をいつもより一杯増やしたくなります。',season:'季節によって、同じコーヒーが少し違う味に感じられます。'},
 anon:{rain:'雨の音に混じって、ラジオの声がよく聞こえる夜があります。',clear:'よく晴れた夜は、眠れない時間も少し静かに感じます。',snow:'窓の外が白くなると、ラジオの声が近く感じられます。',season:'季節が変わっても、毎晩同じ時刻にラジオをつけています。'}
};
// v2.5: 新しい住人も、それぞれの生活から季節を感じる。
Object.assign(CLIMATE_PERSONAL,{
 umbrella:{rain:'雨の日は花の水を少なめにします。店の外の傘を眺める時間も好きです。',clear:'晴れた日には、店先の鉢がいつもより元気に見えます。',snow:'寒い日には、花の置き場所をいつもより慎重に選びます。',season:'季節が変わると、花屋に並ぶ色も変わっていきます。'},
 triangle:{rain:'雨の日は、ノートに街の地図を描きたくなります。',clear:'空の色を見ていると、天気の仕事も楽しそうだと思います。',snow:'雪の日の道は、いつもとは違う図形みたいです。',season:'季節が変わるたび、新しいことが気になってしまいます。'},
 fridge:{rain:'雨の日は閉店後の厨房がいつもより静かです。',clear:'晴れた夜は、帰り道に少し遠回りしたくなります。',snow:'寒い日は、仕事が終わっても温かいものを作りたくなります。',season:'季節が変わると食材が変わります。自分のご飯は相変わらず簡単です。'}
});
// v4.9.3: 気象・季節のお便りで全員が同じ結びにならないようにする。
// 出来事を付け足さず、すでに選ばれた季節・前日の行動への感想だけを表す。
const CLIMATE_LETTER_ENDINGS_493={
 cat:'その空を絵にするなら、まだ下書きのままになりそうです。',
 clock:'こうした小さな季節の知らせが、今はありがたいものです。',
 bread:'毎日同じように仕込んでも、窓の向こうは少しずつ違いますね。',
 moon:'以上、地球の空についての非公式観測報告でした。',
 driver:'空模様の報告も、今夜はこのあたりで。どうか皆さんも安全に。',
 fish:'うまく説明できないのですが、今日見えたものを忘れずにいたいです。',
 sugar:'砂糖の量は変わらなくても、窓の向こうは毎晩少し違いますね。',
 anon:'ただ、それだけの話です。今夜は誰かに送ってみたくなりました。',
 terminal:'同じ場所にいても、季節のほうが少し先へ進んでいきます。',
 umbrella:'明日店先に立つときは、また違う色に気づくかもしれません。',
 triangle:'この変化には、ノートの端に小さな印を付けておきます。',
 fridge:'明日のことはまだわかりませんが、今夜の空は覚えておきます。'
};
const CLIMATE_RECALL_VOICE_493={
 cat:'昨日のことも、紙の端に残しておきたいです。',
 clock:'昨日の出来事も、ひとつの時間として覚えておきたいものです。',
 bread:'昨日の小さな近況も、忘れないうちに書き添えます。',
 moon:'昨日の地球側の記録も、念のため添付しておきます。',
 driver:'こちらは昨日の近況報告です。',
 fish:'昨日のことも、今の言葉で書いておきます。',
 sugar:'昨日のことも、一杯のあいだに思い出しました。',
 anon:'昨日のことも、ここへ書いておきます。',
 terminal:'昨日のことも、短く記しておきます。',
 umbrella:'昨日のことも、花を並べるときのように丁寧に書いておきます。',
 triangle:'昨日のことは、もう一つの観察メモです。',
 fridge:'昨日のことも、自分用の記録として残しておきます。'
};
function climateCreateLetter(n){
 if(n<29)return null;
 const c=climateForNight(n);
 // 主要エピソードと参加型特別放送の枠を守る。ときどき1通だけ差し込む。
 const chance=simHash(`v22:climate:mail:${n}`)%100;
 if(chance>=46)return null;
 const all=['cat','driver','fish','clock','terminal','bread','moon','sugar','anon',...REGULAR_NEW.filter(id=>newListenerIntroduced(id,n))];
 const who=all[simHash(`v22:climate:sender:${n}`)%all.length];
 const intro=CLIMATE_PERSONAL[who];
 const kind=c.dayInSeason<=4?'season':c.weather;
 const subject=kind==='season'?'季節が変わった夜':c.weather==='rain'?'雨音の話':c.weather==='snow'?'雪の夜':c.weather==='cloudy'?'曇り空の下で':'今夜の空';
 const text=intro[kind]||intro.season;
 const previous=regularDayAction(who,n);
 const yesterday=previous?.activity?'\n\n昨日は、'+letterPoliteActivity491(previous.activity)+'。'+(CLIMATE_RECALL_VOICE_493[who]||'昨日のことも書いておきます。'):'';
 const id=`climate_${n}_${who}`;
 s.regular.letterArchive[id]={who,subject,body:'こんばんは。\n\n'+text+yesterday+'\n\n'+(CLIMATE_LETTER_ENDINGS_493[who]||'季節のことを、ここへ書いておきます。'),regular:true,kind:'climate',tag:`climate-${c.season}-${c.weather}`,choices:REGULAR_CHOICES.map(x=>[...x])};
 return id;
}



// v2.2 季節・天候の特別放送。通常のお便りを消さず、同じ募集方式を使う。
const CLIMATE_SPECIAL_INFO={
 rain:{title:'雨音の夜',short:'雨にまつわる話',invitation:'雨の日に思い出すこと、窓辺で考えたこと、雨の日の仕事や暮らしの小さな話を募集します。',opening:'こんばんは。今夜は「雨音の夜」。窓を打つ雨も、別の街の雨も、同じ一時間に寄り添います。',closing:'雨は降ったりやんだりします。今夜の手紙は、雨のあとにも誰かの暮らしに残るのかもしれません。'},
 season_spring:{title:'春のはじまり',short:'春のお便り',invitation:'春のはじまりに気づいたこと、少し変わった暮らしや、小さな期待を募集します。',opening:'こんばんは。夜の空気にも、ようやく春の匂いが混じり始めました。',closing:'春だから何かを始めなければいけないわけではありません。それでも、季節は少しずつ進んでいきます。'},
 season_summer:{title:'夏の夜の寄り道',short:'夏の夜',invitation:'夏の夜にだけ思い出すこと、暑い日の工夫、帰り道の景色を募集します。',opening:'こんばんは。今夜は少し長い夏の夜を、みんなで分け合う一時間にしましょう。',closing:'昼の熱が残る街にも、静かに眠っている窓がある。誰かの夏はまた明日も続きます。'},
 season_autumn:{title:'秋の手紙をひらく夜',short:'秋の思い出',invitation:'秋になって思い出したこと、日々の小さな変化、好きな秋の時間を募集します。',opening:'こんばんは。秋の夜は、言いそびれた話を少し長くしてしまうのかもしれません。',closing:'言葉にした思い出も、まだ胸の内にあるものも。どちらも秋の夜を過ごしています。'},
 season_winter:{title:'冬の小さな灯り',short:'冬の灯り',invitation:'寒い夜の過ごし方、温かかった言葉や、窓辺の明かりの話を募集します。',opening:'こんばんは。寒い夜に、マイクの灯りをひとつ点けておきます。',closing:'温かくなれなかった夜があっても、朝は来ます。今夜はただ、この灯りを一緒に見ていました。'}
};
const CLIMATE_SPECIAL_TOPICS={
 rain:{cat:'雨の日の机',driver:'フロントガラスの向こう',fish:'雨音と日記',clock:'止まった時計と雨',terminal:'ホームの雨音',bread:'雨の日のパン',moon:'月の傘',sugar:'雨とコーヒー',anon:'雨の日の周波数'},
 season_spring:{cat:'春のスケッチブック',driver:'春の配送路',fish:'新しいノート',clock:'春の散歩道',terminal:'駅の春',bread:'春に焼くもの',moon:'春の月の顔',sugar:'春の一杯',anon:'春の声'},
 season_summer:{cat:'夏の帰り道',driver:'冷たい缶コーヒー',fish:'暑い日の選び方',clock:'夏の図書室',terminal:'夏のホーム',bread:'暑い厨房から',moon:'夏の月のお昼寝',sugar:'氷と砂糖',anon:'窓を開けた夜'},
 season_autumn:{cat:'秋の色',driver:'夜道の落ち葉',fish:'秋の日記',clock:'葉の色と時計',terminal:'一枚の落ち葉',bread:'秋の味',moon:'月に似た栗',sugar:'冷めかけたコーヒー',anon:'秋の窓辺'},
 season_winter:{cat:'冬の机の灯り',driver:'冬の夜道',fish:'冬のマフラー',clock:'冬のお茶',terminal:'冬の駅',bread:'温かいパン',moon:'月の毛布',sugar:'五杯目ではなく',anon:'冬のラジオ'}
};
for(const [themeId,info] of Object.entries(CLIMATE_SPECIAL_INFO)){
 const theme={...info,mood:'季節の夜',letters:{}};
 for(const [id,subject] of Object.entries(CLIMATE_SPECIAL_TOPICS[themeId])){
  const person=CLIMATE_PERSONAL[id];
  const thought=themeId==='rain'?person.rain:themeId==='season_winter'?(person.snow+'\n\n'+person.season):person.season;
  theme.letters[id]=[subject,thought+'\n\n今夜の特別放送に、そんな小さな話を送ってみました。'];
 }
 for(const id of REGULAR_NEW){
  const person=CLIMATE_PERSONAL[id];
  const thought=themeId==='rain'?person.rain:themeId==='season_winter'?person.snow+'\n\n'+person.season:person.season;
  const whoLabel={umbrella:'花屋',triangle:'ノート',fridge:'閉店後'}[id];
  theme.letters[id]=[whoLabel+'と'+({rain:'雨',season_spring:'春',season_summer:'夏',season_autumn:'秋',season_winter:'冬'}[themeId]||'季節')+'の話',thought+'\n\n今夜の特別放送に、そんな小さな話を送ってみました。'];
 }
 SPECIAL_THEMES[themeId]=theme;
}



// =============================================================
// v2.3: 自律生活・実際に読んだお便り → 物語連動の特別企画。
// 非公開の生活記録は発生条件だけに使う。提案の根拠は、放送で
// プレイヤー自身が紹介したお便りの件名に限定する。
// =============================================================
function createStoryProgramsState(){return {schema:1,offers:[],used:[],lastCheckedNight:0,lastGeneratedNight:0}}
function migrateStoryPrograms(data){
 const old=data.storyPrograms&&typeof data.storyPrograms==='object'?data.storyPrograms:{};
 data.storyPrograms={...createStoryProgramsState(),...old};
 const sp=data.storyPrograms;
 sp.offers=Array.isArray(sp.offers)?sp.offers.filter(o=>
  o&&SPECIAL_THEMES[o.themeId]&&Number.isInteger(o.originNight)&&Number.isInteger(o.expiresNight)&&
  typeof o.sourceSubject==='string'&&typeof o.sourceWho==='string'&&typeof o.id==='string'
 ).slice(-12):[];
 sp.used=Array.isArray(sp.used)?sp.used.filter(o=>o&&typeof o.themeId==='string').slice(-48):[];
 sp.lastCheckedNight=Number.isInteger(sp.lastCheckedNight)?sp.lastCheckedNight:0;
 sp.lastGeneratedNight=Number.isInteger(sp.lastGeneratedNight)?sp.lastGeneratedNight:0;
 // 古いセーブから復帰しても、過去の日々の企画を遡って生成しない。
 return data;
}
function storyOfferFor(id){
 const n=s.night;
 return (s.storyPrograms?.offers||[]).find(o=>o.themeId===id&&o.status==='open'&&o.originNight<n&&o.expiresNight>=n)||null;
}
function storyAvailableOffers(n=s.night){
 return (s.storyPrograms?.offers||[]).filter(o=>o.status==='open'&&o.originNight<n&&o.expiresNight>=n)
   .sort((a,b)=>a.originNight-b.originNight||a.themeId.localeCompare(b.themeId)).slice(0,2);
}
function storyRecentBroadcasts(n,who,rx,window=18){
 return (s.played||[]).filter(x=>x.night<=n&&x.night>=n-window&&x.who===who&&
  (rx.test(x.subject||'')||rx.test(String(x.id||''))));
}
function storyHadDaily(n,who,ids,window=15){
 const p=s.simState?.people?.[who];
 return (p?.daily||[]).some(d=>d.night<=n&&d.night>=n-window&&ids.some(id=>id===d.actionId||id===d.action));
}
function storyHasSocialContact(n,who,which,window=22){
 const rel=s.simState?.people?.[who]?.relationships?.[which];
 return (rel?.history||[]).some(h=>h.night>=n-window&&h.night<=n);
}
function storySpecialEvidence(n){
 // 特別番組が扱うのは公開された出来事を起点とする「テーマ」。
 // 出来事の全貌を局が知っているわけではない。
 const results=[];
 const cat=storyRecentBroadcasts(n,'cat',/絵|描|画|スケッチ|展示|創作|余白|鉛筆|趣味|cat7|cat8draw|cat9drawing/,24);
 if(cat.length&&(storyHadDaily(n,'cat',['draw','artlook','frienddraft'],20)||
    s.flags?.catStartedSketch||s.chapter2?.transitions?.cat)){
  results.push({themeId:'story_creative',source:cat[cat.length-1]});
 }
 const fish=storyRecentBroadcasts(n,'fish',/友達|友人|言|声|返|笑|気持|選|fish3|fish6|fish7|fish12/,24);
 const driver=storyRecentBroadcasts(n,'driver',/妹|家族|返|声|休|言|driver6|driver8|driver11/,24);
 const term=storyRecentBroadcasts(n,'terminal',/約束|返|手紙|待|言|terminal13/,24);
 const all=[...fish,...driver,...term].sort((a,b)=>a.night-b.night);
 // 一人だけの重い相談を勝手に番組企画へ転化せず、複数の声の共通点を使う。
 if(new Set(all.map(x=>x.who)).size>=2&&(
    storyHasSocialContact(n,'fish','friend',24)||storyHasSocialContact(n,'driver','sister',24)||
    !!s.chapter2?.transitions?.fish||!!s.chapter2?.transitions?.driver)){
  results.push({themeId:'story_unsaid',source:all[all.length-1]});
 }
 const clock=storyRecentBroadcasts(n,'clock',/図書|学|教|時計|思い出|clock5|clock7|clock10/,24);
 if(clock.length&&(storyHadDaily(n,'clock',['library','repair'],21)||storyHasSocialContact(n,'clock','library',21))){
  results.push({themeId:'story_taught',source:clock[clock.length-1]});
 }
 const cross=storyRecentBroadcasts(n,'driver',/時計|街|道|店|echo_driver_clock/,24)
   .concat(storyRecentBroadcasts(n,'clock',/時計|店|街|道|echo_clock_driver/,24))
   .filter(x=>/echo_(driver_clock|clock_driver)/.test(x.id)||/時計屋|配送先|街角/.test(x.subject||''));
 const seenCross=Boolean(s.microWorld?.links?.['old-clock-street']?.greeted)||
   (s.microWorld?.history||[]).some(x=>x.type==='meeting'&&x.night>=n-40&&x.night<=n);
 // 実際に会っていなくても、違う立場の二人が同じ街の時間を生きている。
 // その両者が放送で街の話をした場合も、匿名のまま共通テーマにできる。
 const driverRoad=storyRecentBroadcasts(n,'driver',/道|街|配送|帰り|休憩|ルート|時計/,25);
 const clockRoad=storyRecentBroadcasts(n,'clock',/街|道|散歩|図書|店|時計|駅/,25);
 const sharedStreet=driverRoad.length&&clockRoad.length&&
  storyHadDaily(n,'driver',['route','chief'],22)&&storyHadDaily(n,'clock',['walk','neighbor'],22);
 if((seenCross&&cross.length)||sharedStreet){
  const source=cross[cross.length-1]||[...driverRoad,...clockRoad].sort((a,b)=>a.night-b.night).at(-1);
  results.push({themeId:'story_crossing',source});
 }
 return results;
}
function storyProgramsAfterWorld(n){
 if(n<29)return;
 s.storyPrograms ||= createStoryProgramsState();
 const st=s.storyPrograms;
 if(st.lastCheckedNight>=n)return;
 st.lastCheckedNight=n;
 // 開催できないまま長く経った提案は静かに棚から消える。
 st.offers=st.offers.filter(o=>o.status==='planned'||o.status==='held'||o.expiresNight>=n+1).slice(-12);
 if(st.lastGeneratedNight&&n-st.lastGeneratedNight<5)return;
 if(st.offers.filter(o=>o.status==='open').length>=2)return;
 const evidence=storySpecialEvidence(n);
 for(const item of evidence){
  if(st.offers.some(x=>x.themeId===item.themeId&&['open','planned'].includes(x.status)))continue;
  if(st.used.some(x=>x.themeId===item.themeId&&n-x.night<35))continue;
  if(!SPECIAL_THEMES[item.themeId])continue;
  const source=item.source;
  if(!source||!s.played.some(x=>x.night===source.night&&x.id===source.id))continue;
  const id=`offer_${item.themeId}_${n}`;
  st.offers.push({id,themeId:item.themeId,status:'open',originNight:source.night,discoveredNight:n,
   expiresNight:n+21,sourceLetterId:source.id,sourceSubject:source.subject,sourceWho:source.who});
  st.lastGeneratedNight=n;
  // 一晩に一つだけ。ほかの発見は次の放送後に改めて評価。
  break;
 }
}

// ============================================================
// v3.0 第3章進行：章開始日は旧セーブの未プレイ夜へ繰り延べ可能。
// 本人の自律行動が優先で、便りの紹介を進行条件にしない。
// ============================================================
function createChapter3State(startNight=51){return {schema:1,startNight,started:false,finished:false,processedNights:[],decisions:{},decisionNights:{},replies:{},lettersRead:{},milestones:[],legacyStart:false}}
function migrateChapter3(data){
 const old=data.chapter3;
 if(old&&typeof old==='object'){
  const chapter={...createChapter3State(),...old};
  chapter.processedNights=Array.isArray(chapter.processedNights)?[...new Set(chapter.processedNights)]:[];
  chapter.milestones=Array.isArray(chapter.milestones)?chapter.milestones:[];
  for(const k of ['decisions','decisionNights','replies','lettersRead'])if(!chapter[k]||typeof chapter[k]!=='object')chapter[k]={};
  data.chapter3=chapter;
  return;
 }
 // v2.5以前で第51夜をすでに生成している場合、過去のお便りは書き換えない。
 // 次の未プレイ夜から第3章を始める。過去の日常はそのまま受け継ぐ。
 const n=Math.max(1,Number(data.night)||1);
 const alreadyPrepared=Boolean(data.letterSets?.[n])||!['intro','prepare'].includes(data.phase);
 const start=n>51? n+(alreadyPrepared?1:0):n===51&&alreadyPrepared?52:51;
 data.chapter3=createChapter3State(start);
 data.chapter3.legacyStart=start>51;
}
function chapter3MaybeShift(n){
 const c=s.chapter3;
 if(!c||c.started||n!==c.startNight)return;
 const special=s.special?.planned;
 if(special?.night===n&&['ready','announced'].includes(special.status)){
  c.startNight=n+1; // 予告済みの特別放送を無理に取り消さない。
 }
}
function chapter3Offset(n=s.night){
 const c=s.chapter3;
 if(!c)return -1;
 const i=n-c.startNight;
 return i>=0&&i<CH3_DAYS.length?i:-1;
}
function chapter3IsNight(n=s.night){return chapter3Offset(n)>=0}
function chapter3EndingSenders(n){
 const c=s.chapter3;
 const people=Object.keys(CH3_BEATS).map(id=>{
  const person=s.simState?.people?.[id];
  const watched=s.played.filter(x=>x.night>=c.startNight&&x.night<n&&x.who===id).length;
  const quiet=(s.listeners[id]?.trust||25)*.19+(person?.emotion?.hope||35)*.11;
  return {id,score:quiet+watched*4+(simHash(`ch3:final:${n}:${id}:${s.rng}`)%37)};
 }).sort((a,b)=>b.score-a.score);
 const chosen=people.slice(0,4).map(x=>x.id);
 // 古くからの声、新しく聞こえ始めた声の両方を残す。ただし全員から届くわけではない。
 if(!chosen.some(x=>REGULAR_NEW.includes(x)))chosen[3]=people.find(x=>REGULAR_NEW.includes(x.id)).id;
 if(!chosen.some(x=>!REGULAR_NEW.includes(x)))chosen[2]=people.find(x=>!REGULAR_NEW.includes(x.id)).id;
 return [...new Set(chosen)];
}
function chapter3Letters(n){
 const c=s.chapter3|| (s.chapter3=createChapter3State());
 const offset=chapter3Offset(n);
 if(offset<0)return createRegularLetters(n);
 if(s.letterSets[n])return s.letterSets[n];
 const prevLast={...s.regular.lastMailed};
 const prevMailLength=s.regular.mailHistory.length;
 const standard=createRegularLetters(n);
 const schedule=(CH3_SCHEDULE[offset]||[]).filter(([who,beat])=>offset!==13||chapter3EndingSenders(n).includes(who));
 const reserved=new Set(schedule.map(([id,beat])=>beat==='side'?CH3_SIDE[offset]?.[0]:id));
 if(offset===13)Object.keys(CH3_BEATS).forEach(id=>reserved.add(id));
 // 手書きの重要エピソードに3通枠を占領させず、日常の手紙も残す。
 const limit=offset===13?3:4;
 const normal=standard.filter(id=>!reserved.has(s.regular.letterArchive[id]?.who)).slice(0,limit);
 const keep=new Set(normal);
 for(const id of standard)if(!keep.has(id))delete s.regular.letterArchive[id];
 s.regular.mailHistory=s.regular.mailHistory.slice(0,prevMailLength).concat(s.regular.mailHistory.slice(prevMailLength).filter(x=>keep.has(`regular_${n}_${x.who}`)));
 s.regular.lastMailed={...prevLast};
 for(const id of normal){const l=s.regular.letterArchive[id];if(l)s.regular.lastMailed[l.who]=n}
 const crafted=[];
 for(const [id,beat] of schedule){
  const l=chapter3BuildLetter(id,beat,n);if(!l)continue;
  const key=`chapter3_${n}_${l.who}`;
  s.regular.letterArchive[key]={...l,id:key,regular:true,chapter3:true,replyTune4925:true,choices:(chapter3ChoicesFor4925(l)||REGULAR_CHOICES).map(x=>[...x])};
  crafted.push(key);
 }
 c.started=true;
 // 書き上げた手紙はその夜の最初の表示時に固定される。
 return [...crafted,...normal];
}
function chapter3ReplyRecorded(l,choice){
 if(!l?.chapter3)return;
 const c=s.chapter3|| (s.chapter3=createChapter3State());
 c.lettersRead[l.id]=s.night;
 const effect=choice==='agency'?2:choice==='reflection'?2:choice==='empathy'?1:choice==='curiosity'?1:choice==='special'?2:0;
 c.replies[l.who]=Math.min(25,(c.replies[l.who]||0)+effect);
 const p=s.simState?.people?.[l.who];
 if(p)simMemory(p,{night:s.night,kind:'broadcast',tag:'chapter3',importance:3,summary:'「'+l.subject+'」について放送の言葉を聴いた'});
}
const CH3_DECISION_BEATS={umbrella:5,triangle:6,fridge:7,clock:8,cat:9,fish:10,driver:11,terminal:12};
function chapter3Decision(id,n){
 const c=s.chapter3,p=s.simState?.people?.[id];
 if(!p||c.decisions[id])return;
 const trait=p.traits||{},life=p.life||{},em=p.emotion||{},hab=p.rhythms||{};
 const relations=Object.values(p.relationships||{}).filter(x=>x&&typeof x==='object');
 const connected=relations.length?relations.reduce((v,r)=>v+((r.trust||0)-(r.tension||0)),0)/relations.length:0;
 const reach=Math.max(1,19+(trait.sociability-50)*.12+(em.hope-em.anxiety)*.10+connected*.15+(c.replies[id]||0)*.6);
 const rest=Math.max(1,18+(100-(life.health||60))*.18+(em.anxiety-35)*.13+(trait.caution-50)*.08);
 const revise=Math.max(1,21+(trait.independence-50)*.13+(hab.reflection||0)*.7+(life.leisure<40?5:0));
 const pool=[['reach',reach],['rest',rest],['revise',revise]];
 const sum=pool.reduce((v,x)=>v+x[1],0);
 const seed=simHash(`ch3:decision:${n}:${id}:${trait.independence}:${em.anxiety}:${life.health}:${connected.toFixed(1)}:${c.replies[id]||0}`);
 let roll=seed/4294967296*sum,kind='revise';
 for(const [k,w] of pool){roll-=w;if(roll<0){kind=k;break}}
 const detail=CH3_DECISION_TEXT[id]?.[kind];if(!detail)return;
 c.decisions[id]=kind;c.decisionNights[id]=n;
 if(kind==='reach'){simAdjust(p.emotion,'hope',2);simAdjust(p.emotion,'anxiety',1)}
 if(kind==='rest'){simAdjust(p.emotion,'anxiety',-2);simAdjust(p.life,'health',1)}
 if(kind==='revise'){simAdjust(p.emotion,'hope',1);simAdjust(p.life,'leisure',1)}
 simMemory(p,{night:n,kind:'turning_point',tag:'chapter3',importance:4,summary:detail[0]});
 privateRemember(id,detail[0]);
 c.milestones.push({id,night:n,choice:kind,summary:detail[0]});
}
function chapter3AfterWorld(n){
 const c=s.chapter3;
 if(!c||!chapter3IsNight(n)||c.processedNights.includes(n))return;
 const offset=chapter3Offset(n);
 c.started=true;
 for(const [id,beat] of CH3_SCHEDULE[offset]||[]){
  const who=beat==='side'?CH3_SIDE[offset]?.[0]:id;
  const p=s.simState?.people?.[who];if(!p)continue;
  const title=beat==='side'?CH3_SIDE[offset]?.[1]:CH3_TITLES[id]?.[beat];
  if(!title)continue;
  simMemory(p,{night:n,kind:'life',tag:'chapter3',importance:beat==='end'?4:2,summary:'「'+title+'」に関わる日常を過ごした'});
  privateRemember(who,'「'+title+'」に関わる出来事を経験した');
  if(beat==='friction'){simAdjust(p.emotion,'anxiety',2);simAdjust(p.emotion,'hope',1)}
 }
 for(const [id,day] of Object.entries(CH3_DECISION_BEATS))if(offset===day)chapter3Decision(id,n);
 if(offset===CH3_DAYS.length-1){
  c.finished=true;
  for(const id of Object.keys(CH3_BEATS)){
   const p=s.simState?.people?.[id];if(p)simMemory(p,{night:n,kind:'chapter',tag:'chapter3',importance:4,summary:'変わっていく暮らしの中で、自分の次の日を迎えようとしている'});
  }
 }
 c.processedNights.push(n);
}


// v4.1 — 手紙の向こうの日常。
// 場面は自律行動を根拠に進む。放送したかどうかでは私生活を止めない。
// 各便箋は、それ以前を紹介していなくても理解できる書き方にする。
const DAILY_THREAD_DEFS_41 = {
 cat:{start:['artlook'],a:['draw'],b:['cafe'],resolveA:['draw'],resolveB:['artlook'],
  intro:['机の奥のページ','古いスケッチブックを開きました。端に描きかけの線が残っていて、何の絵にするつもりだったのか、思い出せません。\n\n片づけるために開いたのに、しばらく眺めてしまいました。',[
   '忘れた線|何を描こうとしていたか忘れていても、その線を気に入っているなら十分ですね。','開いた時間|片づけるはずの時間が、別の時間になることもありますね。','描き足すなら|もし続きを描くなら、前と同じ絵じゃなくてもよさそうです。','余白のまま|途中のページを、途中のまま取っておくのもいいと思います。']],
  midA:['線が一本増えた','スケッチブックの続きを、少しだけ描きました。昔の線と、新しく描いた線では、何となく手つきが違います。\n\n比べようとして描いたわけじゃないのに、並べるとわかるんですね。',[
   '違う線|同じ人が描いた違う日の線、その両方が残っているのがいいですね。','上手さより|上手になったかどうかより、また描けたことがうれしい気がします。','次の一筆|次の一筆は、今日の気分に任せてもいいんじゃないでしょうか。','そのまま残す|昔の線も消さずに置いておくと、ページに時間が重なりますね。']],
  midB:['帰り道の喫茶店','スケッチブックを開いてから、なんとなく絵のことが頭に残っています。けれど今日は描かず、帰りに喫茶店へ寄りました。\n\n窓の向こうの人を目で追って、気づけばコーヒーが冷めていました。',[
   '見る日もある|描く代わりに眺める日があっても、絵との距離は切れないですね。','冷めた一杯|コーヒーが冷めるほど眺めていた景色、少し気になります。','持ち帰る景色|その景色を描いても描かなくても、心には残りそうです。','急がない|また描きたくなるまで、喫茶店の窓辺にいてもいいと思います。']],
  endA:['ページの途中','このところ、ときどきスケッチブックを開きます。今日も短い線を何本か描きました。\n\n一枚の絵になるかはわかりません。前はそれが気になったのに、いまは机の上に置いておけます。',[
   '机の上|完成を待たず、机の上に置いてあること自体がいいですね。','短い線たち|何本かの短い線が、これまでの日々をつないでいる気がします。','描く理由|完成させる以外にも、描く理由があっていいと思います。','続きは自由|続けても閉じても、そのページはあなたのものです。']],
  endB:['閉じていないノート','スケッチブックをまた開きました。結局、新しい線は描かず、古いページを少し眺めただけです。\n\nでも前ほど「何か描かなくちゃ」と思わなくなりました。閉じたあと、机の上に残しています。',[
   '眺めただけ|開いて眺めた時間も、そのノートとの付き合い方ですね。','描かない自由|描かない日を、自分で選べるのは悪くないと思います。','机の居場所|机の上に残しているのが、少し好きな話です。','またいつか|いつか描くかもしれないし、そうでなくても大丈夫ですね。']]},
 driver:{start:['coffee'],a:['coworker'],b:['chief'],resolveA:['coworker'],resolveB:['coffee'],
  intro:['自販機のいつもの場所','休憩所で缶コーヒーを買いました。いつも同じ銘柄です。自販機の前で考える時間が三秒で済むのが、一番の長所かもしれません。\n\n味については、そこまで熱烈な支持者じゃないです。',[
   '三秒の判断|三秒で決められる選択が一つあるのは、忙しい日の味方ですね。','味の話|味より買い慣れたことが大事なもの、ありますよね。','他の銘柄|もし違う一本を買ったら、ちゃんと報告してくれそうです。','主任の審査|猫主任が自販機を選ぶなら、たぶん温かい場所優先でしょうね。']],
  midA:['同僚の一本','休憩中、同僚と話していたら、いつも飲んでいる缶コーヒーの話になりました。銘柄を教えたら「明日買ってみる」と。\n\n推薦したつもりはなかったんですが、妙に責任を感じています。',[
   '責任重大|一杯のコーヒーをすすめるのにも、責任を感じるんですね。','いつもの味|人に話すと、いつもの味が少し違って思えそうです。','感想が気になる|同僚の感想が届いたら、ぜひその話も聞かせてください。','気楽に|好みが違っても、休憩中の話題が一つ増えますね。']],
  midB:['主任の休憩所','休憩所のコーヒーを持って駐車場に行ったら、猫主任がいました。少し離れたところに座ったら、向こうも動きませんでした。\n\nあの距離が主任の許可範囲なんでしょうね。今日の承認は無言でした。',[
   '無言の承認|動かずにいてくれたなら、それは立派な承認かもしれません。','ちょうどいい距離|近づきすぎない休憩にも、いい時間がありますね。','主任の基準|主任の許可基準、いつか明かされる日は来るでしょうか。','コーヒー仲間|飲むのは人間だけでも、休憩仲間と呼びたいですね。']],
  endA:['いつもの休憩','仕事仲間と、また休憩中にくだらない話をしました。缶コーヒーは相変わらずいつものやつです。\n\n最近、自販機の前で立ち話をする時間が少し増えました。飲み物を買うだけの場所だったのにな。',[
   '場所の変化|自販機の前が、ちょっとした休憩場所になったんですね。','くだらない話|くだらない話ができる相手は、大切だと思います。','いつもの一本|コーヒーが変わらなくても、周りの時間は変わるんですね。','安全運転で|話せる休憩をはさみながら、今夜も気をつけて帰ってください。']],
  endB:['変わらない味','今日も休憩所で、いつもの缶コーヒーを買いました。新しいものに挑戦しようか一瞬考えましたが、結局同じやつです。\n\n主任なら「考える時間があるなら寝ろ」と言いそうです。言いませんけど。',[
   '変えない選択|いつもの味を選び直すのも、ちゃんとした選択ですね。','三秒より長く|今日は三秒以上考えたんでしょうか。それもちょっとした変化です。','主任の意見|主任の助言は、だいたい睡眠に集約されそうですね。','休憩の味|休憩できたなら、銘柄の冒険はまた今度で十分です。']]},
 fish:{start:['diary'],a:['practice'],b:['friendchat'],resolveA:['diary'],resolveB:['bookshop'],
  intro:['日記の一行','日記を開いて、一行だけ書きました。「今日は、すこし疲れた」。それだけです。\n\n本当はもっと色々あったのに、いまの言葉だと一行でいっぱいになりました。',[
   '一行の重さ|短い一行に、一日分の気持ちが入ることもありますね。','書けたこと|書けなかったことより、書けた言葉を大切にしていいと思います。','続きはいつか|続きは、書きたくなった日に書けば十分です。','疲れた夜|今夜はその一行を書いたぶん、少し休めますように。']],
  midA:['言いたかった言葉','ノートに、断るときの言い方をいくつか書きました。声に出してみると、紙の上では普通の言葉が、少し違って聞こえます。\n\nまだ誰にも言っていません。でも、練習したことは自分だけが知っています。',[
   '練習した事実|まだ伝えていなくても、練習した時間は本物ですよ。','声の違い|紙と声では同じ言葉でも重さが変わるんですね。','自分のため|誰かに見せる練習じゃなく、自分のためでもいいと思います。','急がない言葉|その言葉を使う日が来ても来なくても、持っていていいですね。']],
  midB:['なんでもない話','友人と、今日は本当に何でもない話をしました。帰ってから日記を開いてみたら、書きたいことが二つもありました。\n\nこの前は一行しか書けなかったのに。不思議です。',[
   '二つの出来事|何でもない会話の中に、書きたいことが増えたんですね。','日記の変化|一行の日も二つの日も、どちらもその日の記録です。','友人との時間|気負わないおしゃべりが残る日って、いいですね。','書かなくても|今日は書いても、しまっておいても、どちらでもいいと思います。']],
  endA:['書き直した一行','日記にまた一行書きました。前は「疲れた」だけでしたが、今日は「疲れたけど、嫌だったことがわかった」です。\n\n字数が増えただけかもしれません。それでも、ちょっと違う日です。',[
   'わかった気持ち|嫌だったと気づけたこと、大切な一行ですね。','増えた文字|文字が少し増えたのは、気持ちを置く場所が増えたからかもしれません。','違う一日|似た日でも、書ける言葉は毎回違うんですね。','そっと残す|誰にも見せなくていいので、その一行を残しておいてほしいです。']],
  endB:['本屋から帰る道','帰りに本屋へ寄りました。誰かと話したいことを考えながら本棚を見ていたら、目当てと違う本を手に取っていました。\n\n日記には「寄り道した」とだけ書こうと思います。',[
   '寄り道の記録|「寄り道した」だけでも、今日はどんな夜か思い出せそうです。','違う本|目当て以外の本が気になる日も、いいものですね。','話したいこと|誰かに話したい気持ちを、急いで言葉にしなくても大丈夫です。','本棚の前で|本棚の前で考えごとをする時間、少しわかる気がします。']]},
 clock:{start:['repair'],a:['library'],b:['tea'],resolveA:['library'],resolveB:['walk'],
  intro:['ねじの音','古い時計を一つ磨きました。動いているものを磨くのは、直すのとは少し違います。\n\n何も悪くない時計に手をかける時間も、なかなかいいものですよ。',[
   '直さない時間|壊れていなくても手をかける時間、いいですね。','時計の表情|磨いたあと、少しだけ違う顔に見えたりするのでしょうか。','長いつき合い|長く使うものほど、何もない日の手入れが大切ですね。','静かな仕事|ねじの音が聞こえてきそうな、落ち着いたお便りです。']],
  midA:['図書室の時間','図書室で子どもたちの話を聞きました。時計のことを知りたいと言う子がいて、思わず長く話してしまいました。\n\n次に会うときは、話すより先に質問を聞こうと思います。',[
   '質問の時間|教えるより、相手の疑問を聞く時間も楽しそうですね。','話が長くなる|好きなことを聞かれると、つい長くなりますよね。','次の機会|次にどんな質問が出るか、少し楽しみです。','聞き手にも|あなたも新しい話を聞ける図書室であってほしいです。']],
  midB:['湯気の向こう','古い時計を磨いた日のことを思い出しながら、お茶を淹れました。誰に見せるでもない手入れを、まだ続けています。\n\n湯気が消えるまで、時計を見ずに座っていました。これは珍しいことです。',[
   '時計を見ない|時計が好きな人が、時計を見ずに過ごす。いい時間ですね。','手入れの意味|見せるためではない手入れも、暮らしの一部なんですね。','湯気の時間|湯気が消えるまでの時間を、今夜は時計で測らないでおきましょう。','珍しい休憩|そんな珍しい休憩を、また楽しめますように。']],
  endA:['次の質問','図書室へまた行きました。子どもたちの話を聞いていると、こちらが知らないことも案外あるものですね。\n\n時計は今日も進んでいますが、私の話は少しゆっくりになったようです。',[
   '聞く楽しみ|知らない話に出会える時間は、何歳でもうれしいですね。','ゆっくり話す|話す速さが少し変わったこと、いい変化に感じます。','図書室の声|図書室には、本以外の物語もたくさんあるんですね。','時計の速さ|時計の針は同じでも、過ごし方はいろいろですね。']],
  endB:['知らない花','散歩の途中で、名前のわからない花を見つけました。昔なら、すぐ名前を知りたくなった気もします。\n\n今日は少し眺めて、そのまま帰りました。名前はまだ知りません。',[
   '名前のないまま|名前がわからなくても、見つけた花はそこに咲いていますね。','眺める時間|調べずに眺める時間が、今日は必要だったのかもしれません。','次の散歩|また同じ花に会えるかもしれませんね。','覚えている色|名前より先に、色や形を覚えているのも素敵です。']]},
 terminal:{start:['timetable'],a:['walk'],b:['ticket'],resolveA:['stationstop'],resolveB:['ticket'],
  intro:['時刻表の端','帰り道に時刻表を開きました。乗る列車は決まっているのに、別の時刻の欄まで目で追ってしまいます。\n\n行かない場所への時間も、そこにはきちんと載っているんですね。',[
   '行かない時刻|乗らない列車の時間にも、誰かの一日がありますね。','眺めるだけ|旅に出なくても時刻表を開いていいと思います。','知らない行先|気になる行先があったら、名前だけでも覚えておきたくなります。','帰りの時間|今夜はいつもの帰り道を、ゆっくり歩けますように。']],
  midA:['一本違う道','仕事帰り、駅へ向かう道とは別の通りを歩きました。遠くに同じ線路が見えるのに、聞こえる音が違いました。\n\n遠出というほどではありません。でも知らないところを歩いた気がします。',[
   '近くの遠出|少し道を変えるだけで、知らない場所になりますね。','違う音|同じ線路が見えても、聞こえる音は違うんですね。','小さな旅|遠出という名前をつけなくても、いい散歩だと思います。','帰り道の自由|いつもの駅へ、違う道から帰る日があってもいいですね。']],
  midB:['引き出しの切符','古い切符を取り出して、また引き出しへ戻しました。何度も見ているのに、そのたび思い出すところが違います。\n\n今日は切符に印刷された、小さな日付が気になりました。',[
   '日付の発見|同じ切符なのに、見るたび違うところに目が向くんですね。','しまう場所|取り出して、戻せる場所があるのも大事ですね。','思い出の違い|思い出す場面が変わっても、切符は変わらず残っていますね。','話さない自由|その日付のことは、話したくなる日までしまっておいてください。']],
  endA:['駅前の十分','帰りに駅前で、また時刻表を眺めました。前より少し早い時間に着いたので、急がずに済みました。\n\n何も変わっていない駅なのに、待つ時間だけは違っていました。',[
   '十分の余裕|急がずにいられる十分、なんだかぜいたくですね。','同じ駅の違い|場所は変わらなくても、待ち方で景色は変わりますね。','待つ時間|待っている時間も、きっと一日の一部です。','いつもの駅|いつもの駅に、自分だけの違う時間が増えていきますね。']],
  endB:['小さな日付','古い切符をまた手に取りました。今日も日付を眺めて、特に何をするでもなく戻しました。\n\n以前は、思い出すことに用事が必要だと思っていました。今は少し違います。',[
   '用事のない記憶|思い出すのに理由はいらない、という言葉が心に残りました。','変わらない切符|変わらない切符と、少し変わる気持ちが並んでいますね。','引き出しの中|また開けたい日に、そこにあるのがいいですね。','今日のことも|今日その切符を眺めた時間も、いつか思い出になるんでしょうね。']]},
 bread:{start:['store'],a:['customer'],b:['bake'],resolveA:['store'],resolveB:['bake'],
  intro:['売り場の札','パンの売り場の札を書き直しました。名前より、説明文のほうが難しいです。\n\n「外はかりっと、中はふわっと」と書いていたら、ほとんどのパンに当てはまることに気づきました。困っています。',[
   '説明の難しさ|おいしさを言葉にするのは、焼くのとは別の難しさですね。','みんなふわっと|全部ふわっとしていたら、選ぶ人も困っちゃいそうです。','食べた人の言葉|お客さんに、どう言ってほしいか聞くのも面白そうですね。','名前は短く|無理に全部説明せず、ひとことでも伝わる札がありそうです。']],
  midA:['売り場の前で','常連のお客さんとパンの話をしました。札の説明より、その人が話してくれた食べ方のほうがずっと具体的でした。\n\n明日の札には「よく焼いて食べる人もいます」と書こうか迷っています。',[
   '食べ方の発見|食べる人の言葉で、パンの顔が変わるんですね。','札の一行|「よく焼いて食べる人もいます」は、ちょっと気になる札です。','迷っていい|書きたくなったら書けばいいし、別の一行でもいいと思います。','常連さんの知恵|作る人が知らないおいしさを、買う人が知っているんですね。']],
  midB:['試作品の名前','新しい配合のパンを試してみました。焼き上がりは悪くないのに、名前だけが浮かびません。\n\nまた札の前で悩む予感がします。いっそ「試作中」とだけ書いたら、店長に怒られるでしょうか。',[
   '試作中の札|「試作中」って、むしろ食べてみたくなる人もいそうです。','名前の順番|名前は焼き上がったあとに決めてもよさそうですね。','店長の反応|店長がどんな名前をつけるか、少し気になります。','名づけの楽しみ|味とは別に、名づけに苦労するのもパン屋さんらしいですね。']],
  endA:['一行だけの札','売り場の札をまた書き直しました。今日は「朝、トーストにも」と一行だけ。\n\n誰かの朝の食べ方を想像しながら書いたら、思ったより早く決まりました。もちろん、店長には確認してもらいました。',[
   '誰かの朝|誰かの朝を想像して書いた一行、いいですね。','短い言葉|短いからこそ、伝わることもありますね。','店長の確認|最後は店長の確認、そこは外せませんね。','次の札|次のパンにはどんな一行がつくのか、楽しみです。']],
  endB:['名前は仮です','またパンの配合を考えました。今日の試作品は、名前をつける前に食べてしまいました。\n\n味は覚えています。名前はまだない。こういう順番も、たまにはいいですね。',[
   '名前のないパン|名前がつく前に食べられるのは、作った人の特権ですね。','味の記憶|名前を忘れても、味が残っていれば次を作れますね。','仮のままで|名前が決まらない時間も、ちょっと楽しそうです。','店長には秘密|店長に聞かれたら、どう説明するのか気になります。']]},
 moon:{start:['moon'],a:['family'],b:['sketch'],resolveA:['moon'],resolveB:['sketch'],
  intro:['月の仮称','今夜の月に勝手に名前をつけました。「だいたい丸い課長」です。\n\n月の裏側の会議で承認されたわけではありません。今のところ私だけがそう呼んでいます。',[
   '課長の勤務|だいたい丸い課長、夜勤続きで大変そうですね。','仮称の魅力|正式名称より、勝手につけた名前のほうが覚えやすそうです。','会議の行方|月の裏側の会議は、何曜日に開かれるんでしょう。','今夜の命名|空を見上げる理由がまた一つ増えましたね。']],
  midA:['家族会議の議題','家族と妙ななぞなぞを考えました。「月が休暇を取ったら、夜空の当番は誰？」です。\n\n答えは決まりませんでした。家族の一人が、星は残業代を要求すると言い出したからです。',[
   '星の残業代|星に残業代が出るなら、流れ星は出張扱いでしょうか。','答えなし|答えが決まらないなぞなぞ、長く遊べていいですね。','家族の案|家族の発想が加わると、月の世界もにぎやかになりますね。','次の議題|次の家族会議も、ぜひ穏やかに紛糾してほしいです。']],
  midB:['空想ノート増補版','ノートに月の裏側の役所の見取り図を描き足しました。待合室がやたら広いのは、月の住民が昼間ずっと寝ている想定だからです。\n\n窓口はまだ一つも描いていません。',[
   '待合室問題|待合室だけ立派な役所、少し心配になってきました。','窓口の予定|窓口ができるまで、住民には気長に待ってもらいましょう。','昼寝の制度|全員が昼寝するなら、役所の営業時間が難しそうですね。','描きかけの街|完成していない見取り図にも、住人の気配がしますね。']],
  endA:['課長のその後','今夜も月を見上げて、別の名前を考えました。先日の「だいたい丸い課長」は、そろそろ定年かもしれません。\n\n月の人事異動は忙しいです。こちらの生活は、いたって平穏です。',[
   '課長の定年|月の課長にも、ゆっくり休む権利がありますね。','人事異動|月の人事異動、引き継ぎが大変そうです。','平穏な報告|平穏な生活から生まれる空想って、いいですね。','新しい名前|次の名前が決まったら、またこっそり教えてください。']],
  endB:['空想の続き','月の裏側のノートに、また書き込みました。役所の窓口を描こうとして、なぜか食堂が先に完成しました。\n\nメニューの大半がプリンです。行政に必要なのは、まず糖分という結論になりました。',[
   'プリン行政|プリンが多すぎる食堂、会議が進みそうで進まなそうです。','窓口より先に|窓口より食堂を優先するのは、住民思いなのかもしれません。','メニュー会議|メニューの議事録だけで一冊できそうですね。','住民の暮らし|そんな食堂に通う月の人たちを、ちょっと想像してしまいます。']]},
 sugar:{start:['coffee'],a:['coffee'],b:['friend'],resolveA:['cloud'],resolveB:['coffee'],
  intro:['三杯の小さな違い','いつものコーヒーを淹れながら、砂糖を入れる前に一口飲んでみました。思ったより苦くて、思ったより悪くなかったです。\n\n結局、砂糖はいつもどおり入れました。',[
   '最初の一口|砂糖を入れる前の一口、ちょっとした発見ですね。','いつもの三杯|最後はいつもどおりというのも、落ち着きますね。','苦さの発見|苦い味の中にも、好きなところが見つかるかもしれません。','変えなくても|試してみて、やっぱりいつもの味を選ぶのもいいですね。']],
  midA:['少し違う味','今日はいつもと少し違うコーヒーを淹れました。砂糖の量は、入れる前にちょっとだけ迷いました。\n\n好みって、決まりごとじゃなかったんですね。もちろん甘いのも好きです。',[
   '決まりごとじゃない|好みは、日によって少し変わってもいいですよね。','迷う時間|砂糖を入れる前の少しの迷いが、楽しそうです。','甘いのも好き|新しい味を好きになっても、前の好きが消えるわけじゃないですね。','次の一杯|次はどんな一杯になるのか、こちらまで気になります。']],
  midB:['友人との一杯分','友達と短いメッセージを交わしました。話題はたった数行なのに、コーヒーを飲み終わるまでスマホを眺めていました。\n\n冷めたコーヒーは、温め直さずに飲みました。',[
   '数行の時間|短いやり取りが、一杯分の時間になったんですね。','冷めたままで|冷めたコーヒーにも、その日の味がありますね。','友達との距離|数行でも、つながっている感じがする日があります。','次の返事|返事を待つ時間も、あわてなくていいと思います。']],
  endA:['雲のかたち','夕方の雲を見ながらコーヒーを飲みました。いつもの甘い味なのに、今日は空が気になって、少し飲むのが遅くなりました。\n\n味を変える日も、変えない日も。案外、どちらも悪くないですね。',[
   'どちらの日も|変わる日と変わらない日、どちらにも味がありますね。','雲に夢中|雲を見るほうが忙しくなる夕方、いいですね。','甘さのままで|いつもの甘さが、今日は空の色と一緒に残りそうです。','次の夕方|次に見える雲も、ちょっと気になりますね。']],
  endB:['いつもの分量','今朝もコーヒーを淹れました。前より少しだけ、香りを確かめる時間が長くなった気がします。\n\n砂糖は三杯。いまのところ、これが私の答えです。',[
   '今の答え|「いまのところ」がついているのが、なんだかいいですね。','香りの時間|味だけでなく香りも楽しむようになったんですね。','変わらない三杯|三杯を選び直した、その時間も大切です。','明日の一杯|明日はまた違う答えでも、三杯でも、どちらでもいいですね。']]},
 anon:{start:['notes'],a:['greet'],b:['read'],resolveA:['notes'],resolveB:['notes'],
  intro:['机の小さなメモ','机に短いメモを書きました。「窓を開ける」とだけ。\n\n忘れないために書いたのか、自分にそうしてほしくて書いたのか、少しわかりません。',[
   '自分への言葉|忘れないためと、背中を押すため。両方でもいいのかもしれません。','短いメモ|短いからこそ、あとで目に留まりそうですね。','窓の向こう|窓を開けたらどんな空気だったか、また聞きたいです。','答えを急がず|理由がわからないまま、そのメモを置いておいてもいいと思います。']],
  midA:['廊下の声','隣の人と、短く挨拶をしました。挨拶のあとで、机の上の「窓を開ける」というメモを思い出しました。\n\n別に関係のない二つのことなのに、同じ日の記憶になっています。',[
   '同じ日の記憶|関係ない二つの出来事が並ぶのも、一日の面白さですね。','挨拶の余韻|短い挨拶が、あとで残ることもあるんですね。','メモの居場所|机の上のメモが、ひそかな目印みたいです。','結びつけずに|無理に意味をつけず、同じ日のこととして覚えておいてもいいですね。']],
  midB:['読みかけのページ','夜更けに本を開きました。途中のページから読み始めたのに、なぜか前よりゆっくり読みました。\n\n机の端には、前に書いた短いメモがまだあります。片づけそびれたわけでは、たぶんありません。',[
   'ゆっくり読む|急がず読める夜も、いいものですね。','残ったメモ|メモをそのまま置いているのは、少し理由がありそうです。','途中からでも|途中のページから始める時間も、その人だけの読書ですね。','片づけない選択|片づけないことに、名前をつけなくてもいいと思います。']],
  endA:['新しい一行','机にまた短いメモを残しました。前の「窓を開ける」は、もう貼っていません。\n\n今日のメモは「おはようと言う」です。誰に、とは書きませんでした。',[
   '書かなかった相手|誰に言うのか決めずに書く言葉も、いいですね。','新しいメモ|机の上のメモが、少しずつ変わっていくんですね。','挨拶の予定|言えても言えなくても、書いたことは残ります。','明日の朝|明日の朝に、小さな声が出せますように。']],
  endB:['机の端','また机にメモを書きました。今日は「続きを読む」です。\n\n誰かに言うほどのことでもないので、ここに送ってみました。書くことと、読んでもらうことは、たぶん別ですね。',[
   '別のこと|書きたい気持ちと読まれることは、確かに別ですね。','続きを読む|続きを開くという予定、なんだかいいですね。','小さな便り|誰かに言うほどではない話も、この時間に届いていいですよ。','机の端から|机の端のメモが、今夜はここまで届きましたね。']]},
 umbrella:{start:['window'],a:['flowercustomer'],b:['plantrest'],resolveA:['window'],resolveB:['plantrest'],
  intro:['窓際の鉢','花屋の窓際に、小さな鉢を置き直しました。売るための場所なのに、そこにあると自分の席みたいに見えます。\n\nお客さんには言いませんが、朝いちばんに目が行く場所です。',[
   '小さな席|鉢にも店の中に、お気に入りの席ができたんですね。','朝の目印|朝いちばんに見るものがあると、店を開けるのが少し違いそうです。','売り場の余白|売り物でもあり、あなたの日常の一部でもあるんですね。','秘密の場所|お客さんに言わない楽しみがあってもいいと思います。']],
  midA:['お客さんの色','花を買いに来たお客さんと、好みの色について話しました。窓際の鉢を指して「こういう色もいいですね」と言われたんです。\n\n毎日見ていた色が、少し違って見えました。',[
   '色の見え方|誰かの言葉で、見慣れた色が変わって見えるんですね。','窓際の鉢|毎日そこに置いていた鉢が、会話のきっかけになりましたね。','人の好み|自分と違う好みを聞くのも、花屋の楽しみですね。','いつもの景色|いつもの売り場に、新しい見方が一つ増えましたね。']],
  midB:['水を替える夜','閉店後、元気のない鉢を手入れしました。窓際に置いた小さな鉢のことも、ふと気になりました。\n\n売るために育てているのに、育てる時間のほうが好きな日もあります。',[
   '手入れの時間|売る時間とは違う、花屋さんだけの時間ですね。','育てる楽しみ|売れるかどうかに関係なく、大事にしたい鉢もありますよね。','閉店後の仕事|閉店後までお疲れさまです。休む時間もありますように。','窓際の存在|窓際の小さな鉢が、少し気になる相棒みたいです。']],
  endA:['席替え','窓際の鉢をまた並べ直しました。お客さんと話した色のことを思い出して、少し配置を変えました。\n\n自分の席みたいだった場所が、誰かにも見てもらう場所になっています。',[
   '二つの席|自分の席でも、誰かに見てもらう場所でもあるんですね。','配置の変化|置く場所を変えるだけで、同じ花の表情も変わりますね。','覚えた色|お客さんとの会話が、売り場に残っているのがいいですね。','店の窓際|明日の窓際も、きっと少し違う景色でしょうね。']],
  endB:['売り物のまま','店を閉めてから、鉢の手入れをしました。あの窓際の鉢も、まだ店にあります。\n\n売れたらうれしい。でも、しばらくここにいても悪くない。花屋としてはどうなんでしょうね。',[
   'ここにいる時間|売れる前の時間も、その鉢にとっては大切ですね。','花屋さんの迷い|売れてほしい気持ちと、いてほしい気持ちは両方あっていいと思います。','窓際の居場所|その鉢がいる窓際、ちょっと見に行きたくなります。','無理をしない|鉢の手入れも、ご自身の休息も大事にしてくださいね。']]},
 triangle:{start:['diagram'],a:['friends'],b:['librarystudy'],resolveA:['diagram'],resolveB:['future'],
  intro:['架空の駅前','ノートの端に、存在しない街の地図を描きました。駅を置いたら商店街が必要になって、その先には川も欲しくなりました。\n\n宿題の余白が先になくなりそうです。',[
   '地図の続き|駅から商店街まであるなんて、もう歩けそうな街ですね。','余白の不足|宿題より先に地図が完成したら、先生は驚くでしょうね。','川の位置|川をどこに置くのか、ちょっと気になります。','描く楽しさ|役に立つかどうかはさておき、描く時間は楽しそうですね。']],
  midA:['友達の路線','友達と話していたら、ノートに描いた架空の街のことを説明したくなりました。話しているうちに、あの街にはバスも必要だと気づきました。\n\n友達は「駅があるなら電車でいいじゃん」と言いました。正論です。',[
   'バスの理由|電車とバス、両方あってもいいと思いますよ。','正論の友達|正論を言ってくれる友達がいるの、楽しそうですね。','街が広がる|誰かに話すと、頭の中の街が広がっていきますね。','宿題の時間|交通計画の前に、宿題も忘れずにね。']],
  midB:['図書室の街','図書室で、知らない街の写真が載った本を読みました。ノートの架空の街に似た橋があって、ちょっと驚きました。\n\n似ているのは橋だけです。それでも、知らない場所が急に近くなりました。',[
   '橋の発見|本の中で自分の街に似た橋を見つけるの、わくわくしますね。','似ている部分|一か所だけ似ているからこそ、気になるのかもしれません。','本から街へ|実際の街と空想の街が、少しつながりましたね。','また図書室へ|次はどんな橋に出会うのか、楽しみです。']],
  endA:['地図の空白','またノートに架空の街を描きました。前は道を全部つなぎたかったのに、今日は空白をひとつ残しました。\n\n友達に「ここは何？」と聞かれたら、そのとき決めます。たぶん公園です。',[
   '空白の場所|決まっていない場所がある街、ちょっと好きです。','友達の質問|友達と一緒に決める余地を残したんですね。','公園候補|公園なら、ベンチの位置も悩みそうですね。','未完成の地図|完成していないから、また開きたくなるノートですね。']],
  endB:['候補のひとつ','なりたい仕事をいくつかノートに書いて、一つ消しました。最近、街の地図ばかり描いているせいか、街に関わる仕事も少し気になります。\n\nただ、明日はまったく別のことを言うかもしれません。',[
   '変わっていい|明日違う夢を見つけても、今日の興味は本物ですよ。','地図から仕事へ|好きなことから知らなかった仕事に出会えるんですね。','決めない時間|候補をいくつも持っている時間も、大切だと思います。','また描こう|進路の答えとは別に、街の地図は描き続けてほしいです。']]},
 fridge:{start:['konbini'],a:['leftovers'],b:['rest'],resolveA:['konbini'],resolveB:['konbini'],
  intro:['仕事帰りの二個','店では料理を作っているのに、帰りはコンビニのおにぎりを二つ買いました。\n\n一つは帰り道に食べました。もう一つは家で。誰にも味を聞かれない食事って、案外ほっとします。',[
   '自分の食事|自分がほっとする食事を選べたなら、十分だと思います。','二つの場所|同じおにぎりでも、帰り道と家では味が違いそうですね。','作らない夜|料理人だって、毎晩料理を作らなくてもいいですよね。','お疲れさま|仕事のあとに食べる一個、きっと格別ですね。']],
  midA:['短い料理','家の冷蔵庫にあったもので、短い料理を作りました。店で作るものとは違って、見栄えも盛りつけも適当です。\n\nそれなのに、食べるまで少し楽しみでした。',[
   '自分だけの皿|見栄えを気にしない料理、自分のための皿ですね。','楽しみな時間|食べるのが楽しみと思えたこと、いいですね。','店との違い|仕事の料理と家の料理は、別物でいいと思います。','気楽な一皿|誰にも採点されない一皿を、また楽しめますように。']],
  midB:['何も作らない夜','今日は家で、何も作らずに座っていました。仕事中は立ちっぱなしなので、椅子に座ると急に音が少なくなります。\n\n夕食は簡単に済ませました。簡単でいい日だったんだと思います。',[
   '座る時間|立ち仕事のあとに座る時間、何より必要ですよね。','簡単でいい|簡単に済ませる夕食も、自分で選んだ食事です。','静かな部屋|仕事場の音が消えると、自分の夜が始まる感じがしますね。','休むこと|何もしない夜があることも、大事な暮らしだと思います。']],
  endA:['また二個','帰り道、またコンビニでおにぎりを買いました。家で料理を作る日もありますが、今日はこっちです。\n\n以前なら「手抜き」と思ったかもしれません。今は、明日の仕込みとは別の話だと思えます。',[
   '別の話|仕事の料理と、自分の食事は分けていいんですね。','手抜きじゃない|ちゃんと選んだおにぎりなら、それも一日の食事です。','二つの夜|作る夜も買う夜も、あなたの夜ですね。','明日の仕込み|明日の仕事も、無理のない範囲で頑張ってください。']],
  endB:['灯りの外で','今日もコンビニでおにぎりを選びました。店の冷蔵庫の明かりを消したあと、別の店の明かりの前で迷っている自分が、少しおかしかったです。\n\n迷って選んだのは、いつもの味でした。',[
   '二つの灯り|厨房とコンビニ、二つの灯りの間に帰り道があるんですね。','いつもの味|迷ったあとでいつもの味を選ぶのも、いいですね。','少し笑えた|自分の姿を少しおかしく思える夜って、悪くないですね。','家に帰って|今夜はそのおにぎりを、落ち着いて食べられますように。']]}
};

function createDailyThreadsState41(){return {schema:1,people:{},sent:[]}}
function migrateDailyThreads41(data){
 const old=data.dailyThreads;
 const base=createDailyThreadsState41();
 if(!old||typeof old!=='object'){data.dailyThreads=base;return data}
 base.people=old.people&&typeof old.people==='object'?old.people:{};
 for(const [id,t] of Object.entries(base.people)){
  if(!DAILY_THREAD_DEFS_41[id]||!t||typeof t!=='object'){delete base.people[id];continue}
  t.stage=[0,1,2,3].includes(t.stage)?t.stage:0;
  t.branch=['a','b'].includes(t.branch)?t.branch:null;
  t.startedNight=Number.isInteger(t.startedNight)?t.startedNight:0;
  t.lastChangeNight=Number.isInteger(t.lastChangeNight)?t.lastChangeNight:0;
  t.lastMailedStage=Number.isInteger(t.lastMailedStage)?t.lastMailedStage:0;
  t.lastMailNight=Number.isInteger(t.lastMailNight)?t.lastMailNight:0;
  // Old saves may contain a future scene before its predecessor was mailed.
  // Preserve already-delivered scenes; queue the next undelivered stage instead.
  if(t.stage>t.lastMailedStage+1){
   t.stage=t.lastMailedStage+1;
   if(t.stage===1)t.branch=null;
  }
 }
 base.sent=Array.isArray(old.sent)?old.sent.slice(-75):[];
 data.dailyThreads=base;return data;
}
function dailyThreadsAfterWorld41(n){
 if(n<29||chapter3IsNight(n))return;
 s.dailyThreads ||= createDailyThreadsState41();
 for(const [id,def] of Object.entries(DAILY_THREAD_DEFS_41)){
  if(!newListenerIntroduced(id,n))continue;
  const p=s.simState?.people?.[id];
  const latest=p?.daily?.find(x=>x.night===n);
  if(!latest)continue;
  let t=s.dailyThreads.people[id];
  if(!t){t={stage:0,startedNight:0,lastChangeNight:0,branch:null,lastMailedStage:0,lastMailNight:0};s.dailyThreads.people[id]=t}
  if(t.stage===0){
   if(!def.start.includes(latest.actionId)||simHash(`thread41:start:${id}:${n}`)%100>=65)continue;
   t.stage=1;t.startedNight=n;t.lastChangeNight=n;
  }else if(t.stage===1){
   // v4.8.40: the middle scene must not happen until its introduction was actually mailed.
   if(t.lastMailedStage<1)continue;
   if(n-t.lastChangeNight<8)continue;
   let branch=def.a.includes(latest.actionId)?'a':def.b.includes(latest.actionId)?'b':null;
   if(!branch||simHash(`thread41:middle:${id}:${n}`)%100>=70)continue;
   t.branch=branch;t.stage=2;t.lastChangeNight=n;
  }else if(t.stage===2){
   // Otherwise a three-part story can skip directly from the introduction to its ending.
   if(t.lastMailedStage<2)continue;
   if(n-t.lastChangeNight<11)continue;
   const acceptable=t.branch==='a'?def.resolveA:def.resolveB;
   if(!acceptable.includes(latest.actionId)||simHash(`thread41:end:${id}:${n}`)%100>=77)continue;
   t.stage=3;t.lastChangeNight=n;
  }
 }
}
// v4.8.40: recurring scenes refer to an actual earlier simulation day, not necessarily the mailing day.
// Keep verbatim quotations intact (e.g., what a friend said 「今日は...」).
function deferredSceneDateBody4840(body){
 return String(body).split(/(「[^」]*」)/).map(part=>part.startsWith('「')?part:part
   .replace(/今朝/g,'その朝').replace(/今夜/g,'その夜')
   .replace(/今日/g,'その日').replace(/昨夜/g,'前の夜')
   .replace(/昨日/g,'前の日').replace(/明日/g,'次の日')).join('');
}
function dailyThreadCompose41(id,n){
 if(n<30||chapter3IsNight(n)||!s.dailyThreads)return null;
 const t=s.dailyThreads.people?.[id],def=DAILY_THREAD_DEFS_41[id];
 if(!t||!def||t.stage<=t.lastMailedStage||!t.startedNight)return null;
 if(t.lastMailNight&&n-t.lastMailNight<7)return null;
 if(t.lastChangeNight>=n)return null;
 // 異なる話題を挟みながら進行。普段のお便りを圧迫しない。
 if(simHash(`thread41:offer:${id}:${n}`)%100>=76)return null;
 const phase=t.stage===1?'intro':t.stage===2?`mid${t.branch?.toUpperCase()||'A'}`:`end${t.branch?.toUpperCase()||'A'}`;
 const note=def[phase];if(!note)return null;
 const [subject,body,replies]=note;
 return {kind:'daily-thread',tag:`thread41-${id}-${t.stage}-${t.branch||'start'}`,
  subject,body:deferredSceneDateBody4840(body),thread:{stage:t.stage,branch:t.branch||null,actionNight:t.lastChangeNight},
  choices:replies.map((item,i)=>{const ix=item.indexOf('|');return [item.slice(0,ix),item.slice(ix+1),['empathy','reflection','curiosity','agency'][i]]})};
}
function dailyThreadConfirmDelivered41(n,ids){
 const state=s.dailyThreads;if(!state)return;
 for(const uid of ids){
  const letter=s.regular?.letterArchive?.[uid];
  if(!letter||letter.kind!=='daily-thread'||!letter.thread)continue;
  const person=state.people?.[letter.who];if(!person)continue;
  const stage=letter.thread.stage;
  if(stage<=person.lastMailedStage)continue;
  person.lastMailedStage=stage;person.lastMailNight=n;
  state.sent.push({uid,who:letter.who,stage,night:n,branch:letter.thread.branch,actionNight:letter.thread.actionNight});
 }
 state.sent=state.sent.slice(-75);
}

// v4.2 — 日常が交わる夜：生活のなかで実際に会った相手との小さな続き。
// 手紙本文は、以前の投稿を読んでいなくても理解できるように記述する。
const RELATION_THREAD_DEFS_42 = {
 cat:{relation:'boss',action:'askboss',
  intro:['小さな相談','仕事の進め方について、上司に一つだけ聞いてみました。聞く前はもっと長い説明が必要だと思っていたのに、返事は意外と短いものでした。\n\n短かったぶん、帰り道でもう一度思い返しています。',[
   '短い返事|短い返事でも、聞く前とは違う気持ちで帰れることがありますね。','聞くまでの時間|実際に話した時間より、聞くまで考えていた時間のほうが長かったんですね。','言い方を探す|次に何か聞くときも、自分の言葉で話し始められるといいですね。','帰り道の整理|帰り道で考え直せるくらいの余白が残ったことも、大事にしたいです。']],
  midA:['もう一つだけ','仕事でまた上司に相談しました。前回より、何がわからないかを短く伝えられた気がします。\n\n上司は机の端を指でたたきながら聞いていました。あの癖、相談して初めて気づきました。',[
   '机の端の癖|相手の小さな癖に気づけるくらい、会話に余裕ができたんですね。','聞き方の変化|何がわからないかを言えるだけでも、会話は少し変わりますね。','二度目の相談|一度きりで終わらず、もう一度話せたのが印象的です。','上司の時間|答える側にも、机を指でたたきながら考える時間があるんですね。']],
  midB:['うまく伝わらない日','仕事の相談をしたのですが、言おうとしたことと違う返事が返ってきました。たぶん、途中の説明を省きすぎたんだと思います。\n\n帰ってから紙に書き出したら、言いたかったことが二つに分かれました。',[
   '二つの話|ひとつだと思っていた相談に、別々の話が混ざっていたんですね。','紙の上で|人に伝わらなかったことも、紙の上なら整理できるかもしれません。','違う返事|思った返事じゃなくても、相談したこと自体は消えませんね。','次の言葉|もう一度話すなら、二つのうち片方からでもいいと思います。']],
  endA:['相談のあとの机','上司と話したあと、仕事のメモを一行だけ書き直しました。相談すると何もかも解決するわけではありません。\n\nでも、ひとりで考えたメモと、話したあとに書くメモは少し違うようです。',[
   'メモの違い|同じ机で書いていても、誰かと話したあとでは見え方が変わりますね。','一行の手直し|一行直せたことを、今日は小さな成果にしていいと思います。','解決しなくても|相談は、すぐ答えを出すためだけのものじゃありませんね。','ふたりの考え|自分の考えに別の人の視点が少し加わったんですね。']],
  endB:['伝える前のメモ','また仕事の相談をしました。今回は話す前に、質問を二つに分けてメモしました。会話が上手になったかはわかりません。\n\nでも帰り道、前ほど「あれを言えばよかった」とは考えていませんでした。',[
   '二つの質問|質問を分けるだけで、言葉が届きやすくなることもありますね。','帰り道の変化|帰り道で考えることが少し減ったのは、いい変化かもしれません。','準備の一枚|小さなメモが、今日の会話を支えてくれたんですね。','上手さではなく|会話の上手さより、自分が納得して帰れたことが大切に思えます。']]},
 driver:{relation:'coworker',action:'coworker',
  intro:['休憩所の定例会議','配送仲間と休憩中に話しました。議題は自販機でいちばん押しにくいボタンです。仕事の話をするつもりだったのに、三人で真剣に検討しました。\n\nこういう会議には、議事録が残らないのがいいところです。',[
   '重大議題|押しにくいボタン問題は、現場の切実な課題ですね。','議事録なし|議事録がないからこそ、気楽に話せることもありますね。','三人の休憩|三人で同じ自販機を眺めた時間が、少し楽しそうです。','本業の話|仕事の相談を忘れるくらいの休憩も、時には必要ですね。']],
  midA:['ボタンの改善案','また配送仲間と自販機の話になりました。一人が「背伸びすれば押せる」と言い、一人が「そもそも買わなければいい」と言いました。\n\n解決案としては後者が強すぎます。誰も採用しませんでした。',[
   '強すぎる案|買わなければ解決というのは、たしかに最終手段ですね。','休憩の議論|くだらない議論ほど、案外忘れずに残ることがあります。','背伸びの案|背伸びの改善案、誰かが実践したのか気になります。','採用見送り|採用しなかった案にも、話す楽しさがありましたね。']],
  midB:['静かな休憩','配送仲間に声をかけたのですが、今日はお互い疲れていて、話があまり続きませんでした。\n\n並んで缶コーヒーを飲んで、先に立ったほうが「お疲れ」と言いました。それで十分だった気もします。',[
   '並んだ時間|言葉が少ない休憩にも、一緒にいた時間は残りますね。','お疲れの一言|疲れた日に交わす「お疲れ」は、短くてもいい言葉ですね。','話さない仲間|毎回面白い話をしなくても、休憩仲間でいられますね。','今夜の運転|疲れた日こそ、無理せず安全に帰ってほしいです。']],
  endA:['いつもの席','休憩所で同僚と会うと、最近は自然に同じ席に座ります。誰が決めたわけでもありません。\n\n自販機の前で始まった会議は、まだ閉会していないみたいです。猫主任はたぶん議長を辞退します。',[
   '決まった席|誰も決めていないいつもの席って、不思議と落ち着きますね。','終わらない会議|閉会しない会議も、休憩所なら許されそうです。','主任の役職|猫主任は議長より、会議を寝て見守る役が似合いますね。','仲間の距離|毎日のちょっとした習慣が、仲間との距離をつくるんですね。']],
  endB:['買うものは同じ','今日は配送仲間とほとんど話しませんでした。でも、自販機で隣に立つと、相手がいつもの飲み物を選ぶのがわかりました。\n\n向こうも俺が何を買うかわかるみたいで、少し笑われました。',[
   '覚えた銘柄|何を飲むか知っているだけでも、付き合いの長さを感じますね。','笑った理由|言葉にしなくても通じる冗談があるんですね。','いつもの二人|たくさん話す日と話さない日、その両方が普通でいいと思います。','小さな観察|休憩中の小さな観察が、いつか思い出になるんでしょうね。']]},
 fish:{relation:'friend',action:'friendchat',
  intro:['帰り道の話題','友人と、帰り道に何でもない話をしました。最近見た看板の話です。別れたあと、私は少しだけほっとしていました。\n\n何か大事なことを話したわけじゃないのに、不思議ですね。',[
   '何でもない会話|大事な話をしない時間にも、安心があるんですね。','帰り道の看板|どんな看板だったのか、ちょっと気になります。','ほっとした理由|何かを説明しなくても一緒に歩ける相手、いいですね。','別れたあと|別れたあとに気持ちが軽くなる会話、残しておきたいですね。']],
  midA:['次の看板','また友人と歩きました。この前の看板を見に寄り道したら、すでに貼り替えられていました。\n\n二人で少し残念がって、それから新しい看板の絵の話をしました。こんな寄り道をするとは思いませんでした。',[
   '見逃した看板|なくなった看板も、二人で見に行った思い出になりましたね。','次の絵|新しい看板が、また別の話題を連れてきたんですね。','二人の寄り道|ひとりなら通り過ぎた場所に、二人で立ち止まれたんですね。','小さな約束|看板を見るだけの寄り道、なんだかいい約束です。']],
  midB:['言葉の途中','友人と話していたら、私の言葉が途中で止まりました。相手は急かさず、別の話題に移ってくれました。\n\n助かったと思う気持ちと、最後まで話したかった気持ちが、両方あります。',[
   '二つの気持ち|助かった気持ちと、話したかった気持ちは両方あっていいですね。','急かさない人|言葉を待つかわりに別の話題に移る優しさもあるんですね。','次の機会|話せなかった続きは、また話したい日に持っていけますね。','途中の言葉|途中で止まった言葉にも、あなたの気持ちがあったんですね。']],
  endA:['看板のない道','友人と、いつもの帰り道を歩きました。看板のことはもう話題になりませんでした。代わりに、次の休日に何を食べるか話しました。\n\n話題が変わっても、歩く速さはだいたい同じです。',[
   '歩く速さ|話題が変わっても歩く速さが変わらない、いい関係ですね。','休日の相談|何を食べるかを話せる時間、少し楽しそうです。','看板の記憶|あの看板は、もう二人の会話の中に残っていますね。','自然な次へ|大事な節目がなくても、関係は少しずつ続いていくんですね。']],
  endB:['また別の話','友人と短く話しました。まだうまく言葉にできないことはあります。けれど、今日は無理に話そうとはしませんでした。\n\n最後に見つけた変な看板のことだけ伝えたら、相手が笑いました。それはそれで、うれしかったです。',[
   '変な看板|変な看板が、今日の二人にちょうどいい話題だったんですね。','話さない選択|言葉にしないことも、自分で選んでいいと思います。','笑ってくれた|笑ってもらえた小さな瞬間が、ちゃんと残ったんですね。','言葉の順番|大切なことは、また自分の順番で話せればいいですね。']]},
 clock:{relation:'library',action:'library',
  intro:['図書室の質問','図書室で、子どもに「止まっている時計にも時間はあるの」と聞かれました。すぐに答えたかったのですが、少し考えました。\n\n帰宅しても、あの質問が頭に残っています。',[
   'いい質問|止まった時計の時間、たしかに考えたくなる質問ですね。','すぐ答えない|答えを急がず考えたことが、子どもにも伝わるといいですね。','帰ってからも|図書室を出たあとまで続く質問って、いいものですね。','時計の役割|時計に詳しい人ほど、簡単には答えられない質問かもしれません。']],
  midA:['まだ考えています','図書室でまた時計の話になりました。先日の質問を思い出して「まだ考えています」と伝えたら、相手も少し考えていました。\n\n答えの代わりに、二人で壁の時計を眺めました。',[
   '二人で考える|答えを教えるより、一緒に考える時間が生まれたんですね。','壁の時計|図書室の時計は、今日は少し違って見えたかもしれませんね。','まだの価値|「まだ考えています」と言える大人、いいなと思います。','次の問い|その子が次にどんな質問をするのか、楽しみですね。']],
  midB:['話す速さ','図書室で時計の話を始めたのですが、相手の反応を見て、少し話が長かったかなと思いました。\n\n途中でいったん黙ると、向こうから別の質問が出ました。これも勉強ですね。',[
   '途中の沈黙|黙ってみたら相手の質問が聞こえたんですね。','話の長さ|好きなことほど長く話してしまうの、わかる気がします。','新しい質問|相手の質問で、話す方向が変わるのも楽しいですね。','学ぶ側にも|教える人も勉強できる図書室、いい場所ですね。']],
  endA:['時計のない話','図書室で、今日は時計と関係のない話を聞きました。好きな本の話です。\n\n知らない本がいくつも出てきて、帰りに借りる本が増えました。話を聞くのも忙しいものですね。',[
   '借りる本が増えた|知らない本を教えてもらえるのは、図書室ならではですね。','時計以外の話|時計の話から始まった縁が、別の話題に広がったんですね。','聞く忙しさ|話を聞くのが忙しい日、なんだかいい一日です。','次の本|借りた本の話も、いつか聞いてみたいです。']],
  endB:['少し短い話','今日の図書室では、時計の説明をいつもより短くしてみました。短くしたつもりなのに、結局話は長くなりました。\n\n最後に子どもが「また聞きたい」と言ったので、とりあえず合格にします。',[
   '合格の言葉|「また聞きたい」は、何よりうれしい評価ですね。','やっぱり長話|好きなことの話は、短くするのが難しいですね。','また聞く約束|次に聞きたい人がいるというだけで、図書室へ行く楽しみが増えますね。','話し方の工夫|少しずつ話し方を変えている姿が、いいなと思います。']]},
 terminal:{relation:'neighbor',action:'neighbor',
  intro:['駅前の会釈','駅へ向かう道で、近所の人と道を譲り合いました。会釈しただけで、話はしていません。\n\nでもその人は、いつも同じ角を曲がるようです。知らなかったことがひとつ増えました。',[
   '同じ角|同じ角を曲がる人がいると、道の景色も少し変わりますね。','会釈の距離|話さなくても通じるくらいの距離感って、ありますよね。','帰り道の人|いつもの道にも、ほかの人の暮らしが重なっているんですね。','小さな発見|知らなかったことがひとつ増えた、その報告が好きです。']],
  midA:['小さな挨拶','近所の人にまた会いました。道を譲ったあと、向こうが先に「こんばんは」と言いました。\n\n返事をしてから駅まで歩きました。特別な会話ではないけれど、帰り道に声がひとつ増えました。',[
   'ひとつの声|帰り道に声が増えた、という言い方が印象的です。','こんばんは|短い挨拶が、前より少し近いものになったんですね。','特別じゃないこと|特別じゃない会話も、心に残ることがありますね。','次の帰り道|次にその角を曲がるのが、少し楽しみになりそうです。']],
  midB:['同じ角の距離','近所の人とまた同じ角で会いました。互いに会釈はしましたが、それ以上は話しませんでした。\n\n私は駅のほうへ、相手は住宅街のほうへ。数歩で別々の暮らしに戻るんですね。',[
   '数歩の違い|たった数歩で別の暮らしへ戻る、静かな景色ですね。','言葉はなくても|会釈だけの関係にも、続きはあるんだと思います。','別々の道|同じ場所を通っても、行く先はそれぞれ違うんですね。','角の記憶|その角が、前より少し覚えのある場所になりましたね。']],
  endA:['見慣れた背中','駅前で、あの近所の人らしい背中を見かけました。声はかけませんでした。\n\n知らない人だったころと、挨拶を交わしたあとの背中では、なぜか少し違って見えます。',[
   '見え方の違い|挨拶ひとつで、同じ背中が少し違って見えるんですね。','声をかけずに|声をかけない日にも、顔見知りでいることはできますね。','駅前の景色|見慣れた背中が増えると、街の景色が少し変わりますね。','静かな続き|何も起こらない帰り道にも、関係の続きがあるんですね。']],
  endB:['曲がり角','帰り道、またあの角で近所の人とすれ違いました。短く会釈して、互いに別の道へ。\n\nそれでも、以前より人の気配を感じる角になっています。明日はきっと、また別の誰かが通るのでしょう。',[
   '人の気配|会わなかった日にも、その角に暮らしの気配が残るんですね。','また別の誰か|同じ道には、知らない人たちの夜もありますね。','変わった角|道は同じでも、気に留める場所が増えたんですね。','帰る道|今夜も、いつもの道を気をつけて帰ってください。']]},
 bread:{relation:'customer',action:'customer',
  intro:['二つ買う人','常連のお客さんが、いつも同じパンを二つ買います。今日は「どうして二つなんですか」と聞いてみました。\n\n「一つだと帰り道で食べ終わるから」とのことでした。合理的な説明に感心しました。',[
   '帰り道の分|帰り道で食べる一つがあると、二つ買う理由になりますね。','合理的な答え|聞いてみると納得する習慣って、ありますよね。','二個の計算|三つ買ったらどうなるか、ちょっと気になってしまいます。','常連さんの朝|同じパンを買う人にも、その人だけの一日があるんですね。']],
  midA:['一つは明日','同じ常連さんとまた話しました。今日はパンを二つ買って「一つは明日の朝」と言いました。\n\n帰り道で全部食べてしまうこともあるそうです。計画は、パンの前では弱いんですね。',[
   '計画とパン|朝の計画が帰り道に負けることも、ありそうです。','明日の一つ|明日の自分のためのパン、ちょっといいですね。','常連さんの秘密|理由を聞けるくらい、お客さんと話すようになったんですね。','おいしさの勝ち|食べてしまうほど好きなパンがあるの、作り手もうれしいですね。']],
  midB:['今日は一つ','例の常連さんが、今日はパンを一つだけ買いました。忙しそうだったので理由は聞きませんでした。\n\n帰り道に食べるのかな。それとも、今日はちゃんと家まで持ち帰るのかな。勝手に考えています。',[
   '一つの日|二つ買う人にも、一つの日があるんですね。','聞かなかった理由|忙しそうな人に聞かない判断も、お店の気遣いですね。','帰り道の想像|買ったあとのパンの行方まで考えてしまうんですね。','売り手の目線|一つ売れた先に一つの暮らしがあるの、面白いですね。']],
  endA:['もう一つの理由','今日、常連さんがパンを買いながら「ここの袋、持ちやすくて好き」と言いました。パンじゃなく袋です。\n\nもちろんうれしいですが、パンにも一言欲しかった気がします。袋の発注担当に伝えます。',[
   '袋への称賛|パン屋さんに袋の感想が届くとは、意外な褒め言葉ですね。','発注担当へ|袋の発注担当の人にも、きっとうれしい報告ですね。','パンにも一票|次はパンの感想ももらえるといいですね。','見えない仕事|袋ひとつにも、誰かの工夫が詰まっているんですね。']],
  endB:['袋の持ち手','常連さんに、今日は「袋、持ちにくくありませんか」と聞きました。ついパン以外のことを気にしてしまいます。\n\n「これで十分」と言ってもらえました。今日はそれで安心して閉店できました。',[
   '十分の返事|「これで十分」と言われる安心も、ありますね。','袋の話|パン屋さんが袋の持ち手を気にするの、仕事への愛着を感じます。','閉店の気持ち|一つ安心できたまま閉店できたなら、よかったです。','今度はパン|次はまた、パンの感想も聞けますように。']]},
 moon:{relation:'family',action:'family',
  intro:['月の会議録','家族と、「月が会社員なら何時に出社するか」を考えました。家族の一人は夜勤だと言い、もう一人は在宅勤務だと言いました。\n\n私は月には有給休暇を取ってほしい派です。意見が割れました。',[
   '月の有給|月にも有給休暇があるなら、誰が代わりに照らすんでしょう。','夜勤派|夜勤か在宅か、月の働き方改革は難航しそうですね。','割れた意見|意見が割れるくらい、家族みんなで考えたんですね。','会議録|この家族会議、議事録があったら読みたいです。']],
  midA:['代理の月','また家族と月の働き方を考えました。「休暇中は街灯が代理」という案が出ました。\n\n街灯側の労働組合が黙っていなさそうです。家族の一人だけが真剣に賃金表を作っています。',[
   '街灯の組合|街灯の労働組合、要求がかなり具体的になりそうですね。','賃金表の本気|賃金表を作る人がいるなら、会議も本格的ですね。','代理の仕事|月が休む夜の街灯も、少し誇らしいかもしれません。','空想の共同作業|家族で同じ空想を育てるのって、いい遊びですね。']],
  midB:['議題の変更','家族とまた変ななぞなぞを考えました。月の話を出したら「今日は地球の休日を考えたい」と言われました。\n\n地球が休んだら、こちらはかなり困ります。議題の規模が大きすぎました。',[
   '地球の休日|地球が休んだら、かなり長い連休になりそうですね。','規模の問題|月から地球へ、会議の予算も一気に増えそうです。','家族の発想|家族の一言で、空想が思いもよらない方向へ進むんですね。','次の議題|次はもう少し小さい天体から始めたほうが安心かもしれません。']],
  endA:['休暇届の行方','家族会議の結果、月の有給休暇は保留になりました。代わりに、毎晩十五分の休憩が認められたそうです。\n\nそんな時間があったら見逃しそうですが、家族は満足しています。',[
   '十五分休憩|月が十五分だけ休む夜、見逃さないようにしたいですね。','保留のまま|有給が保留なのは気の毒ですが、少し前進ですね。','満足の理由|家族みんなが納得したなら、会議は成功かもしれません。','次回の会議|次は休憩時間の過ごし方で揉めそうですね。']],
  endB:['会議をしない日','今日は家族と月の会議をしませんでした。代わりに、夕食の残ったプリンを誰が食べるか話し合いました。\n\n結局じゃんけんです。月より先に、家庭の議題を解決するべきでした。',[
   'プリンの優先順位|月の人事より、プリンの行方のほうが緊急ですね。','じゃんけん決裁|じゃんけんで決まる議題は、平和でいいですね。','家族の時間|空想の会議もプリンの相談も、同じ家族の時間なんですね。','次は月へ|プリン問題が片づいたら、また月の労務会議へ戻れますね。']]},
 sugar:{relation:'friend',action:'friend',
  intro:['返事の長さ','友達から「コーヒーって何を買えばいい？」と短いメッセージが来ました。私は長い返事を書きかけて、結局「好きな香りのもの」とだけ送りました。\n\n我ながら、あまり参考にならない助言です。',[
   '香りの助言|香りで選ぶというのも、立派な好みの伝え方ですね。','長い下書き|書きかけの長い返事には、何が入っていたんでしょう。','答えの自由|好みが違う相手には、ひとつに決めない答えもありですよね。','コーヒー選び|友達が何を選んだのか、少し気になります。']],
  midA:['香りの報告','友達からコーヒーの報告が来ました。「香りで選んだら、思っていたより苦かった」そうです。\n\n助言としては失敗かもしれません。でも、友達が妙に楽しそうだったので、少し救われました。',[
   '苦い報告|苦いけど楽しかったなら、選び方としては成功かもしれませんね。','助言の行方|自分の言葉が相手の一杯につながったんですね。','楽しそうな友達|失敗も楽しめる友達の様子が伝わってきます。','次の香り|次はどんなコーヒーを選ぶのか、気になりますね。']],
  midB:['短い既読','友達から返事が来ました。「そうだね」の一言です。私のコーヒーの助言が役に立ったのかは不明です。\n\nでも、返事が来たので今日はそれでいいことにしました。',[
   'そうだね|短い「そうだね」にも、相手なりの温度があるんでしょうね。','助言の謎|役に立ったか不明な助言、少し気になりますね。','返事の喜び|返事があったこと自体を大切にする日もありますね。','また一杯|次に会ったら、一緒にコーヒーを飲めるといいですね。']],
  endA:['別々の一杯','友達とまたコーヒーの話をしました。好きな味は結局違うままです。\n\n同じものを飲まなくても、話題が続くんですね。今日はそれが少しうれしかったです。',[
   '違う好み|好みが違うからこそ、聞きたくなる話もありますね。','続く話題|同じ味じゃなくても、会話を続けられるんですね。','二つの一杯|別々のカップが並ぶところを想像しました。','うれしい違い|違うままでいられることが、うれしい関係なんですね。']],
  endB:['三杯目の話','友達にまたメッセージを送りました。今回はコーヒーのことではなく、窓から見えた雲の話です。\n\n返信は短かったけれど、前より短さを気にしなくなりました。コーヒーは相変わらず甘めです。',[
   '雲の話|コーヒーから雲へ、話題が自然に変わっていくんですね。','短い返信|返信の長さを気にしなくなったのは、小さな変化ですね。','甘めの一杯|甘めのコーヒーは変わらず、やり取りの感じ方が変わったんですね。','次の写真|今度はその雲の形も、聞いてみたいです。']]},
 anon:{relation:'neighbor',action:'greet',
  intro:['廊下の声','隣の部屋の人と、廊下で「こんばんは」と言い合いました。これまで声を聞いたことはあったけれど、言葉を交わしたのは久しぶりです。\n\n部屋に戻ると、廊下が前より少し近い場所に思えました。',[
   '廊下の距離|短い挨拶で、廊下の感じが少し変わることもありますね。','声を知る|顔より先に声を知っている関係も、不思議です。','久しぶりの言葉|久しぶりに言葉を交わせたこと、いい夜ですね。','部屋へ帰る|自分の部屋へ戻るまでの短い時間も、暮らしの一部ですね。']],
  midA:['小さな音','隣人とまた挨拶しました。「昨日、廊下の電球を替えたんですよ」と教えてもらいました。\n\n私はまったく気づいていませんでした。たしかに、言われてみると少し明るいです。',[
   '明るい廊下|言われて初めて気づく変化、ありますよね。','電球の話|電球を替えた話をしてくれる隣人がいるんですね。','見ていない景色|同じ廊下でも、気づくことは人によって違うんですね。','ひとことの灯り|短い会話で、廊下も少し明るくなった気がします。']],
  midB:['先に扉が閉まる','隣人と廊下ですれ違いました。挨拶はしましたが、それ以上は話しませんでした。先に相手の扉が閉まる音を聞きました。\n\n私にも帰る部屋がある。それを少しありがたく思いました。',[
   '二つの部屋|廊下の両側に、それぞれ帰る部屋があるんですね。','閉まる扉|扉が閉まる音に、暮らしの輪郭を感じます。','挨拶だけ|挨拶だけで終わる日にも、落ち着きがありますね。','帰る場所|帰って灯りをつける部屋があること、大切なことですね。']],
  endA:['新しい電球','帰り道、廊下の明かりを見上げました。以前、隣人が替えたと話していた電球です。\n\n普段は気にも留めないものなのに、いまは通るたび目が向きます。話をした人の手がそこに残っているようです。',[
   '手の残る場所|誰かが替えたと知ると、同じ明かりも違って見えますね。','目が向くもの|何でもない電球に、ひとつ記憶が増えたんですね。','通り道の変化|廊下を通る時間が少し変わったのかもしれません。','顔の見えない仕事|暮らしを支える小さな仕事に気づく瞬間ってありますね。']],
  endB:['廊下の足音','隣人と廊下で短く挨拶をしました。扉が閉まる音が遠くに聞こえて、誰かが自分の部屋に帰ったのだと思いました。\n\n名前はまだ知りません。でも、そこに暮らしている人がいるのは知っています。',[
   '足音の先|足音だけでも、誰かの一日が終わるのを感じますね。','名前のない関係|名前を知らなくても、暮らしの存在はわかるんですね。','会わない夜|会わない夜にも、隣人は隣人の時間を過ごしているんですね。','帰宅の気配|その静かな廊下の景色が、少し心に残りました。']]},
 umbrella:{relation:'regular',action:'flowercustomer',
  intro:['好みの色','常連のお客さんが花を選びながら、「今日は青じゃなくて黄色」と言いました。理由を聞くと「今朝の気分です」とのことでした。\n\n花屋にいると、色にもその日の都合があるんだなと思います。',[
   '今日の黄色|色をその日の気分で選ぶの、いいですね。','色の都合|花の色にも、その日の都合があるという言い方が好きです。','常連さんの好み|いつもの好みと違う日も、ちゃんとその人らしさなんですね。','花屋の会話|色の相談を聞けるのも、花屋の楽しみですね。']],
  midA:['黄色の次の日','同じお客さんがまた花を選びに来ました。今度は「昨日の黄色、思ったより元気でした」と言いました。\n\n花が元気だったのか、お客さんが元気になったのかは聞きそびれました。たぶん両方です。',[
   '元気の主語|花とお客さんのどちらが元気になったのか、気になりますね。','色の続き|昨日の黄色の話をまた聞けるなんて、少しうれしいですね。','聞きそびれたこと|聞かなかったぶん、想像が残る会話ですね。','二つの元気|両方が少し元気なら、きっといい買い物だったんですね。']],
  midB:['選ばなかった色','常連のお客さんが来ました。今日は花の前で長く迷って、結局何も買わずに帰りました。\n\n外まで見送ったら「また来ます」と言われました。花屋には、選ばない日もあります。',[
   '選ばない日|買わずに帰る日も、その人と花屋の関係は続いていきますね。','また来ます|「また来ます」という言葉が、今日のいちばんの買い物かもしれません。','迷う時間|花の前で迷える場所があるのも、いいものですね。','見送る仕事|花を渡さず見送ることも、花屋さんの一日なんですね。']],
  endA:['色の相談','花を選びに来たお客さんと、今日は長く話しました。花のことだけじゃなく、置く場所の明るさや、帰り道に風が強いことまで。\n\n買った花は一束。それ以外の話が、ずいぶん多い日でした。',[
   '一束の会話|一束の花の周りに、いくつもの日常が集まったんですね。','帰り道の風|花を持つ帰り道まで考えるのも、花屋さんらしいですね。','話の広がり|売るもの以外の話ができる関係、いいですね。','花の居場所|花がどこに飾られるのか、想像する楽しみもありますね。']],
  endB:['次に来る日','今日はお客さんと短い会話だけでした。花を買う人にも、買わずに眺める人にも、次に来る日があるのだと思います。\n\n私は水を替えて、次の朝を待つことにします。',[
   '花屋の明日|次に来る人を待ちながら花の水を替える、いい仕事ですね。','短い会話|短い会話でも、訪ねてきたことがうれしい日がありますね。','買わない時間|眺めるだけでも立ち寄れる花屋は、素敵だと思います。','次の朝|水を替えて迎える明日に、また違う色が並びそうですね。']]},
 triangle:{relation:'friend',action:'friends',
  intro:['余白の街の住民','友達と放課後に話していたら、ノートに描いている架空の街の話になりました。「住んでる人は何してるの」と聞かれて困りました。\n\n道路は引いたのに、住人のことは考えていませんでした。',[
   '住人の不在|道路だけ先にある街、これから人が増えるのが楽しみですね。','いい質問|友達の質問で、街の見方が少し変わったんですね。','最初の住人|最初に住む人は、どんな仕事をしているんでしょう。','空白の地図|住人が決まっていない場所も、街の余白として面白そうです。']],
  midA:['一軒目の店','友達に架空の街の地図を見せたら、「ここに文房具屋が欲しい」と言われました。私はパン屋を描くつもりだったのですが。\n\n結局、並べて二軒描きました。文房具とパンを同時に買える便利な通りです。',[
   '二軒の通り|文房具屋とパン屋が並ぶ通り、歩いてみたくなりますね。','友達の店|友達の一言で、街に新しい店ができたんですね。','パンと文房具|買い物の順番まで考えたくなる組み合わせです。','一緒に描く|ひとりで描いていた街が、少し共同制作になりましたね。']],
  midB:['地図の外側','友達に街のことを話したら、「その街から外へ出たら何がある？」と聞かれました。そこまで考えていませんでした。\n\nノートを横に広げられないので、別の紙を探しています。都市計画には紙が必要です。',[
   '紙の限界|街が大きくなると、ノートの大きさが問題になるんですね。','外の世界|街の外側を考える質問、想像が広がりますね。','別の紙|都市計画のために紙を探す放課後、いいですね。','境界線|どこまで描くかを決めない街も、面白そうです。']],
  endA:['街の会議','友達と、架空の街のお店を増やしました。文房具屋の隣にはパン屋。さらに、その隣に「何でもない広場」ができました。\n\n何をする広場なのかはまだ決まっていません。住民に相談する予定です。',[
   '何でもない広場|何でもない広場だから、何でもできそうですね。','住民会議|架空の住民の意見を聞くところまで来たんですね。','増えた街|友達の案が混ざると、街に別の色が出るんですね。','広場の余白|用途の決まらない場所がある街、好きです。']],
  endB:['折りたたむ地図','友達と架空の街の話をしました。全部を一枚に描くのは無理だとわかって、紙を何枚か重ねることにしました。\n\n広げるたび、少し違う街に見えます。完成は遠のきましたが、それでもいい気がします。',[
   '重なる街|紙を重ねると、同じ街にも奥行きが出ますね。','遠のく完成|完成が遠のくからこそ、まだ遊べるんですね。','広げる楽しみ|紙を広げるたび違って見える街、見てみたいです。','友達の視点|友達の質問が、描き方まで変えたんですね。']]},
 fridge:{relation:'cookmate',action:'cookmate',
  intro:['焦げた話','厨房の仲間に、以前焦がした料理の話をしました。仕事中なら笑えなかったのに、片づけたあとだと妙に可笑しくなります。\n\n相手も似た失敗をしたそうです。料理人にも、それぞれ焦げた歴史があるんですね。',[
   '焦げた歴史|料理人それぞれの焦げた歴史、聞いてみたくなりますね。','片づけたあと|仕事が終わったからこそ笑える話もありますね。','似た失敗|相手にも似た失敗があると、少し安心しますね。','苦い記憶|失敗の話が、あとから笑える思い出になることもありますね。']],
  midA:['鍋の持ち手','厨房の仲間とまた片づけながら話しました。今度は鍋の持ち手の向きについて意見が一致しました。\n\n料理の味とは関係ないのに、こういう話のほうが熱くなります。二人とも少し疲れているのかもしれません。',[
   '持ち手の哲学|鍋の向きにも、料理人のこだわりがあるんですね。','一致した意見|片づけの小さな習慣が、二人の共通点になったんですね。','熱い議論|味の話ではないところが、ちょっとおかしいです。','疲れた二人|熱くなった分、帰ったらゆっくり休んでほしいです。']],
  midB:['言い過ぎたかも','厨房の仲間と話していて、少し説明が長くなってしまいました。相手は黙って聞いてくれましたが、あとから言い過ぎたかなと思いました。\n\n明日は短い言葉で伝えられるといいんですが。',[
   'あとから思うこと|話したあとで気になること、ありますよね。','聞いてくれた人|黙って聞いてくれた時間も、そこにあったんですね。','短く言う難しさ|仕事の手順を短く伝えるのは、案外難しいですよね。','次の仕事|明日も同じ厨房に立つなら、また話せる機会がありますね。']],
  endA:['閉店後の五分','厨房で片づけを終えたあと、仲間と五分だけ話しました。料理のことも、どうでもいいことも。\n\n五分で帰るつもりが、時計を見たらもう少し経っていました。家で食べるものを考える時間が減りました。',[
   '五分の続き|五分のつもりで長く話せる相手、いいですね。','帰りのごはん|話し込んだ日は、夕食を簡単にしてもいいと思います。','厨房の外の話|仕事が終わったあとにも、同じ人との時間が続くんですね。','少しの余裕|片づけのあとに残る会話が、楽しみになってきたんですね。']],
  endB:['短いひとこと','今日は厨房の仲間に、「昨日の片づけ、助かりました」とだけ言いました。何か面白い話をしようと思っていたのに、それで終わりました。\n\n短い言葉を選ぶのも、悪くないみたいです。',[
   '助かったの一言|「助かりました」は、短くても伝わる言葉ですね。','片づけの記憶|昨日の小さな仕事を覚えていたんですね。','面白さより|面白い話でなくても、伝えたいことはありますね。','短い選択|短く言えるようになったこと、自分でも感じられたんですね。']]}
};

function createRelationThreadsState42(){return {schema:1,people:{},sent:[]}}
function migrateRelationThreads42(data){
 const next=createRelationThreadsState42(),old=data.relationThreads;
 if(!old||typeof old!=='object'){data.relationThreads=next;return data}
 next.people={};
 for(const [id,entry] of Object.entries(old.people||{})){
  if(!RELATION_THREAD_DEFS_42[id]||!entry||typeof entry!=='object')continue;
  const scenes=Array.isArray(entry.scenes)?entry.scenes.filter(x=>x&&[1,2,3].includes(x.stage)&&['intro','midA','midB','endA','endB'].includes(x.key)&&Number.isInteger(x.night)).slice(0,3):[];
  next.people[id]={stage:[0,1,2,3].includes(entry.stage)?entry.stage:0,scenes,startedNight:Math.max(0,Number(entry.startedNight)||0),lastChangeNight:Math.max(0,Number(entry.lastChangeNight)||0),lastSentIndex:Math.min(scenes.length,Math.max(0,Number(entry.lastSentIndex)||0)),lastMailNight:Math.max(0,Number(entry.lastMailNight)||0)};
 }
 next.sent=Array.isArray(old.sent)?old.sent.slice(-100):[];
 data.relationThreads=next;return data;
}
function relationThreadsAfterWorld42(n){
 if(n<29||chapter3IsNight(n))return;
 s.relationThreads ||= createRelationThreadsState42();
 for(const [id,def] of Object.entries(RELATION_THREAD_DEFS_42)){
  if(!newListenerIntroduced(id,n))continue;
  const p=s.simState?.people?.[id];
  const daily=p?.daily?.find(x=>x.night===n),rel=p?.relationships?.[def.relation];
  if(!daily||daily.actionId!==def.action||!rel)continue;
  // 実際にその相手と接触し、履歴へ記録された日だけ進行する。
  const contact=rel.history?.findLast(x=>x.night===n&&x.actionId===def.action);
  if(!contact||!['warm','ordinary','guarded','awkward'].includes(contact.outcome))continue;
  let t=s.relationThreads.people[id];
  if(!t)t=s.relationThreads.people[id]={stage:0,scenes:[],startedNight:0,lastChangeNight:0,lastSentIndex:0,lastMailNight:0};
  if(t.stage>=3||t.stage!==0&&n-t.lastChangeNight<(t.stage===1?9:12))continue;
  // 親しみやすさが変わることも、変わらないことも人生の分岐。
  const mode=contact.outcome==='warm'||contact.outcome==='ordinary'?'A':'B';
  const key=t.stage===0?'intro':t.stage===1?'mid'+mode:'end'+mode;
  if(t.stage===0&&simHash(`rel42:start:${id}:${n}`)%100>=74)continue;
  if(t.stage===1&&simHash(`rel42:mid:${id}:${n}`)%100>=82)continue;
  if(t.stage===2&&simHash(`rel42:end:${id}:${n}`)%100>=86)continue;
  t.stage++;t.lastChangeNight=n;if(t.stage===1)t.startedNight=n;
  t.scenes.push({stage:t.stage,key,night:n,outcome:contact.outcome,relation:def.relation});
 }
}
// 出来事のあと数夜たってから投函されても、当日の「今日」が残らないようにする。
// 会話中の直接引用（「今日も」など）は相手が実際に言った言葉として残す。
function relationThreadDatedBody42(body){
 return body.split(/(「[^」]*」)/).map(part=>part.startsWith('「')?part:part
   .replace(/今日も/g,'その日も').replace(/今日は/g,'その日は').replace(/今日の/g,'その日の')
   .replace(/今日、/g,'その日、').replace(/今日/g,'その日')
   .replace(/昨日の/g,'前の日の').replace(/昨日、/g,'その前の日、')
   .replace(/明日は/g,'次の日は')).join('');
}
function relationThreadCompose42(id,n){
 if(n<30||chapter3IsNight(n)||!s.relationThreads)return null;
 const t=s.relationThreads.people?.[id],def=RELATION_THREAD_DEFS_42[id];
 if(!t||!def||t.lastSentIndex>=t.scenes.length)return null;
 const scene=t.scenes[t.lastSentIndex];
 if(!scene||scene.night>=n)return null;
 if(t.lastMailNight&&n-t.lastMailNight<8)return null;
 // v4.1の「同じ人から届く続きの手紙」と間隔を空ける。
 const otherMail=s.dailyThreads?.people?.[id]?.lastMailNight||0;
 if(otherMail&&n-otherMail<5)return null;
 if(simHash(`rel42:offer:${id}:${n}`)%100>=79)return null;
 const note=def[scene.key];if(!note)return null;
 return {kind:'relation-thread',tag:`relation42-${id}-${scene.stage}-${scene.key}`,
  subject:note[0],body:relationThreadDatedBody42(note[1]),relationThread:{stage:scene.stage,key:scene.key,actionNight:scene.night,relation:def.relation},
  choices:note[2].map((item,i)=>{const sep=item.indexOf('|');return [item.slice(0,sep),item.slice(sep+1),['empathy','reflection','curiosity','agency'][i]]})};
}
function relationThreadConfirmDelivered42(n,ids){
 const state=s.relationThreads;if(!state)return;
 for(const uid of ids){
  const l=s.regular?.letterArchive?.[uid];if(l?.kind!=='relation-thread'||!l.relationThread)continue;
  const t=state.people?.[l.who];if(!t)continue;
  const scene=t.scenes[t.lastSentIndex];
  if(!scene||scene.stage!==l.relationThread.stage||scene.key!==l.relationThread.key)continue;
  t.lastSentIndex++;t.lastMailNight=n;
  state.sent.push({uid,who:l.who,stage:scene.stage,key:scene.key,night:n,actionNight:scene.night});
 }
 state.sent=state.sent.slice(-100);
}


// v4.3 — あの手紙から、ずっと先の夜へ。
// 過去に実際に届いたv4.1/v4.2のお便りと、その後に実際に起きた行動だけを結び直す。
// テキストは全12人、日常／人間関係の各2話を個別に執筆。
const LONG_ECHO_TEXT_43={
 cat:{
  daily:['空白のページにも','前に開いたスケッチブックを、また机に置きました。描いたページより、描かなかったページのほうが多くなっていました。\n\nでも今日は、それを途中でやめた記録だとは思いませんでした。何も描かずに開いて、閉じる。そういう日も一冊の中に入っています。',[
   ['白いページの時間','描かなかったページにも、その本を開いた時間が残っているんですね。','empathy'],['今の一枚','次に描くなら、何を最初の線にしたいですか。','curiosity'],['続け方の違い','描くことだけが、絵と付き合う方法ではないんですね。','reflection'],['閉じる自由','今日は閉じる日でも、また開ける日が来てもいいと思います。','space']]],
  relation:['返事を急がない帰り道','以前、仕事場の人との話を手紙にしました。帰り道でその会話を思い出すことがあります。言われたことより、自分がうまく言えなかったことのほうを覚えています。\n\nそれでも、次に顔を合わせたとき、最初からやり直しになるわけではありません。二人とも、その後の何日かを過ごしてきたんだと思います。',[
   ['二人のその後','会話のあとにも、お互いに別々の日々があったんですね。','empathy'],['言えなかったこと','今なら、あのときの言葉を少し違って伝えられそうですか。','curiosity'],['やり直さなくていい','一度の会話ですべてを決めなくてもいいんですね。','reflection'],['次の会話へ','次は話せても、話せなくても、あなたの歩幅でいいと思います。','space']]]},
 driver:{
  daily:['自販機の位置','あの休憩所のコーヒーの話から、ずいぶん夜がたちました。今日は缶を手に取る前に、自販機の並びを一度確かめました。\n\n前ほど迷わなくなりましたが、同じ缶ばかり選ぶとは限りません。主任には味の違いがわからないでしょう。たぶん缶の温度ならわかります。',[
   ['缶の選び方','同じ休憩でも、ちょっとずつ選び方が変わるんですね。','reflection'],['主任の好み','猫主任が選ぶとしたら、温かい缶と冷たい缶のどちらでしょう。','humor'],['仕事の休憩','何夜も走る間に、休憩所も馴染みの場所になったんですね。','empathy'],['次の一本','明日の一本は、その日の気分で決めていいと思います。','space']]],
  relation:['交代の合図','配送仲間と話すようになってから、休憩所の音に少し敏感になりました。誰かが缶を置く音だけで、そろそろ交代の時間だとわかります。\n\n言葉を交わさない日もあります。でも前より、そこに一人でいる感じはしません。猫主任には、別に変わったことはないと報告しておきます。',[
   ['休憩所の音','同じ音にも、誰かと働いてきた時間が残るんですね。','reflection'],['交代の人','その仲間とは、今も同じ時間帯に会うことが多いですか。','curiosity'],['言葉のない同僚','会話しない日にも、相手がいるとわかるんですね。','empathy'],['主任への報告','主任の報告書には「異常なし」と書かれそうですね。','humor']]]},
 fish:{
  daily:['書き直さなかった一行','日記を読み返していたら、以前は消してしまいそうだった一行が残っていました。書いた日には、あまり自信がなかった言葉です。\n\n今の私なら同じことを書かないかもしれません。でも、あの日の私が書いたものだから、そのままにしておこうと思いました。',[
   ['あの日の一行','今と違う考えも、当時のあなたの言葉なんですね。','empathy'],['消さなかった理由','その一行を残そうと思ったのは、どんなところでしたか。','curiosity'],['日記の時間','考えが変わったことまで、一冊の中に残るんですね。','reflection'],['そのまま残す','前の自分の言葉を、無理に直さなくてもいいと思います。','space']]],
  relation:['返信の長さ','友人から届いた短いメッセージを、今日はすぐに読み終えました。以前なら、短さには何か意味があるのかと考え込んだと思います。\n\n今も少し気にはなります。ただ、返事の前にお茶を淹れる余裕ができました。返事が短い日も、私たちはそれぞれ別の用事をしているんですよね。',[
   ['短いメッセージ','短い言葉の向こうにも、それぞれの一日がありますね。','reflection'],['変わった時間','前より落ち着いて読めたこと、自分でも意外でしたか。','curiosity'],['お茶の時間','返信の前に一杯淹れられる余裕、いいですね。','empathy'],['自分の速さ','返事の長さも速さも、決めすぎなくていいと思います。','space']]]},
 clock:{
  daily:['針を見ない時間','今日も古い時計を手入れしました。ねじを確かめたあと、しばらく窓の外を眺めていたんです。\n\n時計はちゃんと進んでいました。私が見ていなくても進むという、ごく当たり前のことを、あらためて面白く思いました。',[
   ['見ていない時間','針を見ていなくても時間が進む。その当たり前に気づく夜ですね。','reflection'],['窓の景色','時計から目を離したとき、何が見えましたか。','curiosity'],['手入れの続き','今も時計を大切にしていることが伝わります。','empathy'],['ゆっくり眺める','ときには時間を測らず、景色を眺めていてください。','space']]],
  relation:['質問が残る図書室','図書室で誰かと話した日のことを、長く覚えています。今日は自分から話す前に、相手の言葉が終わるのを待ちました。\n\n質問に答えることも好きですが、質問を受け取る時間も悪くありません。歳を重ねても、知らないことは減りませんね。',[
   ['待って聞く','相手の話が終わるまで待つ時間も、大切な会話ですね。','empathy'],['新しい質問','今日はどんなことを尋ねられたのでしょう。','curiosity'],['知らないこと','知っていることが増えても、問いはなくならないんですね。','reflection'],['話す順番','答えがすぐ出ない質問があっても、いいと思います。','space']]]},
 terminal:{
  daily:['同じ時刻表の別の欄','今もときどき、乗らない列車の時刻まで見ています。以前、駅や帰り道のことを手紙にした夜を思い出しました。\n\nその時刻に、誰かが仕事を終えて乗るのかもしれません。想像してから、自分の乗る列車を確かめます。遠くへ行かなくても、少しだけ知らない夜を見た気になります。',[
   ['乗らない列車','乗らない時刻にも、別の誰かの帰り道があるんですね。','reflection'],['気になる時刻','今も気になる行き先はありますか。','curiosity'],['自分の列車','想像したあとで、いつもの列車に戻るのもいいですね。','empathy'],['行かない旅','行かずに思い浮かべる旅があってもいいと思います。','space']]],
  relation:['いつもの道の挨拶','帰り道で顔を合わせる人のことを書いた日から、少し時間がたちました。今夜は短く会釈して、それぞれ別の方へ歩きました。\n\n相手の名前も、そのあとどこへ帰るのかも知りません。ただ、明日も同じ時間にここを歩く人がいると思うと、駅前の灯りが少し違って見えます。',[
   ['名前を知らなくても','名前を知らない相手も、帰り道の景色の一部なんですね。','reflection'],['会釈の距離','その短い挨拶が、心地よい距離になっているんですね。','empathy'],['駅前の灯り','以前と比べて、気になる景色は増えましたか。','curiosity'],['それぞれの帰路','どちらも自分の夜へ帰っていく、そのままがいいですね。','space']]]},
 bread:{
  daily:['書き直した札の余白','今朝も売り場で、パンの札を一行だけ書き直しました。焼き上がりは同じなのに、言い方ひとつで違うパンに見えます。\n\n店長に「それで売れるの」と聞かれました。わかりません、と答えました。正直な売り文句は、札には書けませんね。',[
   ['一行の手間','いつものパンにも、一行を考える時間があるんですね。','empathy'],['店長の問い','「それで売れるの」は難しい質問ですね。','humor'],['言葉の違い','パンは同じでも、伝える言葉は少しずつ変えられるんですね。','reflection'],['明日の札','明日はまた違う一行でもいいと思います。','space']]],
  relation:['二つ買う人のその後','以前、決まった数のパンを買う常連さんの話を書きました。今日も売り場でその人を見かけましたが、買ったのはいつもと違うパンでした。\n\n理由は聞きませんでした。毎日同じように見えるお客さんにも、毎日の気分があるんでしょうね。店の方も、明日は違うパンが焼けるかもしれません。',[
   ['違うパンの日','いつものお客さんにも、いつもと違う一日がありますね。','reflection'],['聞かなかった理由','理由を聞かずに見送ったのは、どうしてだったんでしょう。','curiosity'],['店の変化','買う人も作る人も、少しずつ変わるんですね。','empathy'],['いつもの常連','毎回同じものを買わなくても、常連さんは常連さんですね。','space']]]},
 moon:{
  daily:['課長の異動願い','今夜の月を見ていたら、新しい役職が似合いそうな気がしてきました。\n\n「だいたい丸い課長」は異動になったそうです。後任はまだ決めていません。月の組織も、人手不足なのかもしれません。',[
   ['月の異動','月の人事も、毎晩同じとは限らないんですね。','humor'],['後任の予定','次の役職には、どんな形の月が合うでしょう。','curiosity'],['名前の変化','同じ月も、見上げる日の自分で違って見えますね。','reflection'],['欠員のまま','後任を決めずに眺める月も、いいと思います。','space']]],
  relation:['家族会議の議事録','前に家族と月のことを話した夜を、今夜また思い出しました。あのころから、月の議事録には未決の案件が増えています。\n\nでも家族は、もう別のことを話していました。なぞなぞが終わらなくても、会議は閉会できます。月の役所には教えてあげたい制度です。',[
   ['閉会の制度','答えのない議題も、持ち帰りにできるんですね。','humor'],['別の話題','最近の家族会議では、何が議題になっているんでしょう。','curiosity'],['続く会話','結論がなくても、話す時間はちゃんと残りますね。','reflection'],['宿題のまま','答えを出さないなぞなぞがあってもいいと思います。','space']]]},
 sugar:{
  daily:['三杯目までの時間','今日はコーヒーに三杯目の砂糖を入れる前に、窓の外を眺めました。\n\n甘さは相変わらず好きです。でも、飲むまでの時間は前より少し長くなりました。味覚より、朝の使い方が変わったのかもしれません。',[
   ['変わった朝','甘さは同じでも、過ごし方は変わってきたんですね。','reflection'],['窓の外','今日は窓の向こうに、何が見えましたか。','curiosity'],['三杯の安心','いつもの味に戻るのも、心地よい習慣ですね。','empathy'],['急がない一杯','飲む前の時間も、好きなだけ楽しんでください。','space']]],
  relation:['短い返信のあと','友達との短いメッセージの話を、以前ここに送りました。今もあまり長文のやり取りはしません。\n\nでも、返事がすぐ来なくても、前ほど画面を見なくなりました。コーヒーを淹れ直しているうちに、自分にも別の時間があるのを思い出します。',[
   ['返事の時間','返事を待つ間にも、あなた自身の一日があるんですね。','reflection'],['変わったところ','以前と比べて、待っている気持ちは変わりましたか。','curiosity'],['短い言葉で','短いまま続いていく友人関係も、いいですね。','empathy'],['急がせない','返す側にも待つ側にも、それぞれの時間がありますね。','space']]]},
 anon:{
  daily:['メモの裏側','机の端の小さなメモを、久しぶりに裏返しました。以前ここへ書いた、ほんの一行の話を思い出したんです。\n\n裏は白紙でした。だから何か書こうかと思って、結局そのまま戻しました。書きたいことがない日も、机は机のままです。',[
   ['裏の白紙','何も書かなかった裏側にも、今日の時間がありますね。','reflection'],['次の一行','今なら何を書きたいと思いますか。','curiosity'],['机の景色','机の端にそのメモがあるのが、日常になっていたんですね。','empathy'],['白紙のままで','裏側は白いままでも、構わないと思います。','space']]],
  relation:['廊下のひとこと','以前、隣の部屋の人と挨拶したことを送りました。今日も廊下ですれ違いました。\n\n「こんばんは」と言うだけです。前より親しくなったのかは、わかりません。でも、声を出す前に身構える時間は少し短くなりました。',[
   ['挨拶の長さ','挨拶の言葉は同じでも、その前の時間が変わったんですね。','reflection'],['廊下の顔','今は相手のどんなところを覚えていますか。','curiosity'],['少しの変化','身構える時間が短くなったこと、素敵な発見ですね。','empathy'],['親しさを決めず','親しくなったかどうか、今すぐ名前をつけなくていいと思います。','space']]]},
 umbrella:{
  daily:['窓際の席はそのまま','店の窓際に置いた小さな鉢のことを、前に手紙にしました。あれから花の並びは何度も変わりました。\n\n今日は棚を拭いてから、その場所を少し空けておきました。特別な鉢がそこになくても、窓際を眺める癖だけは残っています。',[
   ['空けた場所','鉢が変わっても、そこを見る習慣が残っているんですね。','reflection'],['窓際の景色','今はその席から、どんな花が見えますか。','curiosity'],['店の小さな記憶','手入れを重ねた場所が、店の思い出になっているんですね。','empathy'],['次の鉢を待つ','空いている窓際も、いい景色だと思います。','space']]],
  relation:['色の相談、そのあと','前に、色を選ぶ常連さんのことをお便りにしました。今日も売り場で誰かの迷う時間を見守りました。\n\n売れた花の色は覚えています。でも、選ばなかった色も、なぜか少し覚えているんです。花屋の仕事は、選ばれないものを毎日並べることでもありますね。',[
   ['選ばれない色','買われなかった色も、店の景色を作っていたんですね。','reflection'],['覚えている色','今も心に残っているのは、どんな色ですか。','curiosity'],['迷う人の時間','選ぶまで待ってくれる花屋さんがいると、安心しそうです。','empathy'],['店に残る花','選ばれなかった花にも、明日が来ますね。','space']]]},
 triangle:{
  daily:['地図にない道','架空の街を描いている話を、前に送りました。今も少しずつ描き足しています。でも、このごろは道を全部つなげないようにしています。\n\n何も描いていない場所があると、あとから思いついたものを置けるんです。宿題の余白だけは、相変わらず足りません。',[
   ['残した空白','描かない場所を残すのも、街を作る一つの方法ですね。','reflection'],['新しい場所','次は空白のどこに、何を置きたいですか。','curiosity'],['続く街','前の地図が、今も少しずつ育っているんですね。','empathy'],['宿題の余白','地図用の紙は、宿題と別に用意したほうがよさそうですね。','humor']]],
  relation:['友達の駅を残す','友達に架空の街を見せた話を、以前送りました。そのあと自分ひとりで続きを描いていると、友達が提案した場所だけは消しにくくなりました。\n\n自分の街なのに、そこには別の人の考えが住んでいます。ちょっと変ですが、気に入っています。',[
   ['二人の街','一人で描いていても、友達の考えが残っているんですね。','reflection'],['提案の場所','その友達が考えたのは、どんな場所でしたか。','curiosity'],['消せない理由','別の人のアイデアを大切にしたくなるんですね。','empathy'],['地図の住人','友達の考えも、その街の住人みたいですね。','humor']]]},
 fridge:{
  daily:['自分のための皿','前に、自分の夕食をどうするかという手紙を書きました。今日は仕事のあと、家で小さな皿を一枚出しました。\n\n盛り付けは凝っていません。それでも皿を出すと、ちゃんと自分が食べる時間だと思えます。料理を仕事にしているのに、そこはまだ練習中です。',[
   ['一枚の皿','自分のために皿を出すことも、一つの料理ですね。','empathy'],['今日の夕食','その皿には、何をのせましたか。','curiosity'],['仕事と食卓','仕事で作る料理と、自分に作る料理は違うものなんですね。','reflection'],['凝らない一皿','凝っていなくても、自分のための食事なら十分だと思います。','space']]],
  relation:['閉店後の返事','厨房の仲間との話を、前にここに書きました。今日も片づけながら、短い会話をしました。\n\nうまい返事を考えているうちに、相手はもう次の仕事を始めていました。会話はそこで終わり。でもあとから、あれでよかったんじゃないかと思えました。',[
   ['短い会話','会話が短く終わっても、その時間がなくなるわけではないですね。','reflection'],['厨房の二人','今日はどんな話をしていたんでしょう。','curiosity'],['変わった気持ち','あとから「それでよかった」と思えたんですね。','empathy'],['次の仕事へ','返事を全部完成させなくても、一緒に働けるんですね。','space']]]}
};


const LONG_ECHO_ACTIONS_43={cat:['artlook','draw'],driver:['coffee'],fish:['diary'],clock:['repair'],terminal:['timetable'],bread:['store'],moon:['moon'],sugar:['coffee'],anon:['notes'],umbrella:['window'],triangle:['diagram'],fridge:['leftovers']};
function createLongEchoState43(){return {schema:1,sources:{},sent:[],lastByListener:{},lastMailNight:0,draftNight:0}}
function longEchoSourceFromSent43(r,kind,archive,played){
 if(!r||r.stage!==3||!LONG_ECHO_TEXT_43[r.who])return null;
 const def=kind==='daily'?DAILY_THREAD_DEFS_41[r.who]:RELATION_THREAD_DEFS_42[r.who];
 const endKey=kind==='daily'?(r.branch==='a'?'endA':'endB'):r.key;
 if(!def||!['endA','endB'].includes(endKey))return null;
 const title=String(archive?.subject||played?.subject||def[endKey]?.[0]||'あの夜の手紙');
 return {uid:r.uid,who:r.who,kind,sourceNight:r.night,subject:title.slice(0,70),aired:Boolean(played),heardReply:false,rememberedResponse:"",used:false};
}
function migrateLongEcho43(data){
 const v=data.longEcho43,base=createLongEchoState43();
 if(v&&typeof v==='object'){
  for(const [uid,src] of Object.entries(v.sources||{})){
   if(!src||!LONG_ECHO_TEXT_43[src.who]||!['daily','relation'].includes(src.kind)||!Number.isInteger(src.sourceNight)||src.sourceNight<1)continue;
   base.sources[uid]={uid,who:src.who,kind:src.kind,sourceNight:src.sourceNight,subject:String(src.subject||'以前のお便り').slice(0,70),aired:!!src.aired,heardReply:!!src.heardReply,rememberedResponse:!!src.heardReply?String(src.rememberedResponse||"").slice(0,100):"",used:!!src.used};
  }
  base.sent=Array.isArray(v.sent)?v.sent.filter(x=>x&&typeof x.uid==='string').slice(-70):[];
  base.lastByListener=v.lastByListener&&typeof v.lastByListener==='object'?v.lastByListener:{};
  base.lastMailNight=Number.isInteger(v.lastMailNight)?v.lastMailNight:0;
  base.draftNight=Number.isInteger(v.draftNight)?v.draftNight:0;
 }else{
  // 古いセーブの「実際に配達された」v4.1／v4.2最終便だけを証拠として引き継ぐ。
  // 過去の手紙を新たに作らず、過去の聴取は推測せず、未来の夜からのみ回想を始める。
  for(const [kind,rows] of [['daily',data.dailyThreads?.sent],['relation',data.relationThreads?.sent]]){
   for(const entry of Array.isArray(rows)?rows:[]){
    if(!entry||entry.stage!==3||!Number.isInteger(entry.night)||entry.night>data.night)continue;
    const uid=entry.uid;
    if(typeof uid!=='string'||!/^regular_\d+_/.test(uid))continue;
    const played=(data.played||[]).find(x=>x.id===uid&&x.night===entry.night);
    const archive=data.regular?.letterArchive?.[uid];
    const src=longEchoSourceFromSent43(entry,kind,archive,played);
    if(src)base.sources[uid]=src;
   }
  }
 }
 data.longEcho43=base;return data;
}
function longEchoConfirmSource43(n,ids){
 const state=s.longEcho43||(s.longEcho43=createLongEchoState43());
 for(const uid of ids){
  if(state.sources[uid])continue;
  const note=s.regular?.letterArchive?.[uid];
  if(!note||!['daily-thread','relation-thread'].includes(note.kind))continue;
  const kind=note.kind==='daily-thread'?'daily':'relation';
  const records=kind==='daily'?s.dailyThreads?.sent:s.relationThreads?.sent;
  const confirmed=records?.find(x=>x.uid===uid&&x.night===n&&x.stage===3);
  if(!confirmed)continue;
  const src=longEchoSourceFromSent43(confirmed,kind,note,null);
  if(src)state.sources[uid]=src;
 }
}
function longEchoAfterBroadcast43(n){
 const state=s.longEcho43;if(!state)return;
 const played=s.played.filter(x=>x.night===n);
 const audience=s.radioCulture?.audience?.[n]||[];
 for(const x of played){
  const source=state.sources[x.id];if(!source||source.sourceNight!==n)continue;
  source.aired=true;
  // 本人が実際に放送を聴いた場合だけ、あとで「返ってきた声」を覚えている。
  source.heardReply=audience.includes(source.who);
  source.rememberedResponse=source.heardReply?String(x.response||'').replace(/\s+/g,' ').trim().slice(0,100):'';
 }
}
// 発生条件で確認した直前の行動にだけ言及する。聞いていない放送は思い出さない。
const LONG_ECHO_BRIDGES_461={
 cat:{daily:['昨日、絵に向き合う時間があって、昔の自分の言葉をふと思い出しました。','昨日、スケッチブックのことを考えながら、前に送った手紙を思い出しました。'],relation:['昨日、職場の人とのやりとりのあとで、前に書いた言葉が戻ってきました。','昨日、仕事の話をしたあと、あの頃の手紙が少し違って思えました。']},
 driver:{daily:['昨日、休憩中にコーヒーを選んでいて、前の手紙を思い出しました。','昨日、いつもの缶コーヒーの前で、しばらく前のことを考えました。'],relation:['昨日、配送仲間と顔を合わせて、以前の休憩時間を思い出しました。','昨日、配送の合間に同僚と話して、昔の手紙を思い出しました。']},
 fish:{daily:['昨日、日記を開いていて、前に書いたことをふと思い出しました。','昨日、日記のページを見ながら、昔送った言葉を思い出しました。'],relation:['昨日、友人と話していて、以前の自分の返事を思い出しました。','昨日、友人とのやりとりのあと、前の手紙を思い返しました。']},
 clock:{daily:['昨日、時計の手入れをしながら、昔の手紙のことを考えました。','昨日、古い時計に触れる時間があり、ふと以前の言葉を思い出しました。'],relation:['昨日、図書室で話をして、昔ここへ送ったお便りを思い出しました。','昨日、図書室で人の話を聞きながら、以前の質問を思い出しました。']},
 terminal:{daily:['昨日、時刻表を眺めていると、昔の帰り道を思い出しました。','昨日、列車の時刻を確かめていて、前に書いた夜のことを考えました。'],relation:['昨日、近所の人と顔を合わせて、以前の挨拶を思い出しました。','昨日、いつもの道で人とすれ違い、前に送った手紙を思い出しました。']},
 bread:{daily:['昨日、売り場の仕事をしていて、前の手紙を思い出しました。','昨日、店の札を眺めながら、昔の試作品のことも考えました。'],relation:['昨日、常連さんとのやりとりから、前に書いたお客さんのことを思い出しました。','昨日、売り場で人と話していて、昔の手紙の続きを考えました。']},
 moon:{daily:['昨日、月のことを考えていて、古い議事録を思い出しました。','昨日、月を眺めながら、以前の空想の続きを考えました。'],relation:['昨日、家族と話していて、前の月面会議のことを思い出しました。','昨日、家族とのやりとりが、昔の会議を思い出させました。']},
 sugar:{daily:['昨日、コーヒーを淹れながら、前に書いた頃の自分を思い出しました。','昨日、いつもの一杯を前にして、昔の手紙を思い返しました。'],relation:['昨日、友人とのやりとりで、以前の短い返事を思い出しました。','昨日、友人と話していて、前に送ったお便りを思い返しました。']},
 anon:{daily:['昨日、机のメモを手に取ったとき、以前の言葉を思い出しました。','昨日、机に残した紙を見て、昔送った手紙のことを考えました。'],relation:['昨日、廊下で隣人と挨拶して、以前の自分の声を思い出しました。','昨日、隣の人と言葉を交わしてから、昔の手紙を思い返しました。']},
 umbrella:{daily:['昨日、店の窓際を整えていて、前に書いたことを思い出しました。','昨日、花屋の窓辺に目をやると、以前の手紙が浮かびました。'],relation:['昨日、常連のお客さんと話していて、前に送った手紙を思い返しました。','昨日、お客さんとのやりとりから、あの頃の花の色を思い出しました。']},
 triangle:{daily:['昨日、ノートに図を描きながら、前の手紙のことを考えました。','昨日、ノートの線を引いていると、昔描いた街が頭に浮かびました。'],relation:['昨日、友達と話していて、以前の地図の続きを思い出しました。','昨日、友達とのやりとりのあと、前に送った手紙を読み返したくなりました。']},
 fridge:{daily:['昨日、食事の残りを片づけていて、前に書いた言葉を思い出しました。','昨日、自分の夕食のことを考えながら、昔の手紙を思い返しました。'],relation:['昨日、厨房の仲間と話していて、以前のやりとりが浮かびました。','昨日、仕事仲間と話したあと、前に送った手紙を思い出しました。']}
};
function longEchoCompose43(id,n){
 const state=s.longEcho43;
 if(!state||n<66||chapter3IsNight(n)||state.draftNight===n)return null;
 if(n-state.lastMailNight<8||n-(state.lastByListener[id]||0)<36)return null;
 const p=s.simState?.people?.[id];
 const day=p?.daily?.find(x=>x.night===n-1);
 if(!day)return null;
 const valid=Object.values(state.sources).filter(source=>{
  if(source.who!==id||source.used||n-source.sourceNight<32||n-source.sourceNight>220)return false;
  if(source.kind==='daily'){
   const d=DAILY_THREAD_DEFS_41[id];
   return d&&LONG_ECHO_ACTIONS_43[id]?.includes(day.actionId);
  }
  const d=RELATION_THREAD_DEFS_42[id],rel=d&&p.relationships?.[d.relation];
  return d&&day.actionId===d.action&&!!rel?.history?.some(x=>x.night===n-1&&x.actionId===d.action);
 });
 if(!valid.length)return null;
 const oldest=n-Math.min(...valid.map(x=>x.sourceNight));
 const offerLimit=oldest>=110?65:oldest>=75?74:80;
 if(simHash(`echo43:offer:${id}:${n}`)%100>=offerLimit)return null;
 valid.sort((a,b)=>a.sourceNight-b.sourceNight||a.uid.localeCompare(b.uid));
 const source=valid[0],story=LONG_ECHO_TEXT_43[id]?.[source.kind];
 if(!story)return null;
 const answer=source.rememberedResponse||'';
 const from=source.heardReply?(answer.length>=8&&answer.length<=80?`あの夜に返ってきた『${answer}』という言葉も、ときどき思い返します。`:'あの夜、番組で返してもらった言葉も、今でも覚えています。'):'';
 // 気づきは本人の暮らしから。ラジオを聴かなかった人には「返事」を知っているふりをさせない。
 // 回想の導入は「昨日実際に起きた行動」とその人物の言葉で始める。
 // これなら、何十夜後に別の結末から回想しても、同じ定型文や記憶の捏造にならない。
 const bridgeVariants=LONG_ECHO_BRIDGES_461[id]?.[source.kind]||[];
 const bridge=bridgeVariants.length?bridgeVariants[simHash(`echo461:bridge:${source.uid}:${n}`)%bridgeVariants.length]:
  (source.kind==='relation'?'昨日、身近な人とのやりとりから、ふと思い出しました。':'昨日、いつもの暮らしの中で、前の手紙を思い出しました。');
 return {
  kind:'long-echo',tag:`long-echo43-${source.uid}`,
  subject:story[0],
  body:`${n-source.sourceNight>=100?'ずっと前に':'何十夜も前に'}「${source.subject}」というお便りを、この局に送りました。${from?'\n\n'+from:''}\n\n${bridge}\n\n${story[1]}`,
  longEcho:{sourceUid:source.uid,sourceNight:source.sourceNight,sourceKind:source.kind,heardReply:source.heardReply},
  choices:story[2].map(row=>[...row])
 };
}
function longEchoConfirmDelivered43(n,ids){
 const state=s.longEcho43;if(!state)return;
 for(const uid of ids){
  const note=s.regular?.letterArchive?.[uid];
  if(note?.kind!=='long-echo'||!note.longEcho||state.sent.some(x=>x.uid===uid))continue;
  const source=state.sources[note.longEcho.sourceUid];
  if(!source||source.used||source.who!==note.who)continue;
  source.used=true;
  state.sent.push({uid,night:n,who:note.who,sourceUid:source.uid,sourceNight:source.sourceNight,kind:source.kind});
  state.lastByListener[note.who]=n;
  state.lastMailNight=n;
 }
 state.sent=state.sent.slice(-70);
}

// v4.6 — 知らなかった、あなたの一面。
// 暮らしの延長にだけ現れる、十二人それぞれの二つの顔。
// 各系列は「気づき → その後 → 時間を経た小さな余韻」の三通。
const SURPRISE_ARCS_46 = {
 cat:{
  a:{start:['draw'],later:['draw','artlook'],scenes:[
   ['消さなかった線','スケッチブックに線を一本引いて、思った場所からずれてしまいました。いつもなら消して描き直します。\n\nでも、その線を椅子の脚にしてみたら、少し変な椅子ができました。変なのに、今日は妙に気に入っています。',[
    '間違えた線|消さなかった線から、思いがけない形が生まれたんですね。','変な椅子|その椅子は、どんな場所に置くつもりですか。','描くときの自由|仕事の書類と違って、線を残す自由があるのかもしれません。','そのまま置く|うまく描けない日でも、好きな絵はできるんですね。']],
   ['椅子が二脚','この前の変な椅子の隣に、もう一脚描きました。今度は背もたれが曲がりました。\n\n二脚並べると、誰かを待っているようにも見えます。何を描くか決めていなかったのに、勝手に小さな部屋ができてきました。',[
    '待つ椅子|二脚になったら、絵の中にも誰かの気配が生まれたんですね。','曲がった背もたれ|今度の椅子は、前の椅子と仲良く並べていますか。','小さな部屋|計画していなかった部屋ができるのは、少し楽しそうです。','続きを決めない|描きたいときに続きを描けば、それでいいと思います。']],
   ['誰にも見せない展示会','机の上に、あの椅子の絵を立てかけています。時々眺めて、線を足したり、足さなかったり。\n\n誰かに見せる予定はありません。でも帰宅すると、変な椅子が二脚で迎えてくれます。自分だけの展示会です。',[
    '小さな展示会|見せる相手がいなくても、展示会は開けるんですね。','二脚のその後|あの部屋には、これから家具が増えるでしょうか。','帰ってくる場所|帰宅したときに楽しみが待っているのがいいですね。','見せなくても|自分だけの絵として持っていても、十分すてきです。']]]},
  b:{start:['work'],later:['work','askboss'],scenes:[
   ['付箋の順番','仕事の手順を見直して、机の付箋を三枚だけ並べ替えました。誰にも頼まれていない変更です。\n\n驚いたことに、午後は少し作業がしやすくなりました。自分で決めてしまってよかったのかな、と後から思ったくらいです。',[
    '三枚の付箋|自分で決めた小さな工夫が役に立ったんですね。','午後の机|どの付箋を一番手前に置いたんですか。','後から迷う|うまくいってから迷うところも、あなたらしいですね。','小さな判断|そのくらいの変更は、自分で決めてもよさそうです。']],
   ['教える側のメモ','付箋を並べ替えた話を職場でしたら、同僚にやり方を聞かれました。\n\n説明しているうちに、私自身がどうしてその順番にしたのか、やっとわかりました。教えるつもりが、自分で教わっていました。',[
    '説明しながら|人に話して初めて、わかることもあるんですね。','同僚の反応|同僚はその順番を試してみたのでしょうか。','教わる側にも|説明する人も、途中で考え直していいんですね。','仕事の工夫|あなたの小さな発見が、誰かの机にも届いたんですね。']],
   ['新しい付箋','机の付箋をまた並べ替えました。前のやり方が間違っていたわけではありません。仕事が少し変わったからです。\n\n前なら正しい順番を探し続けたかもしれません。今は、とりあえず今日使いやすい順番にしています。',[
    '今日の順番|一度決めた手順も、暮らしに合わせて変えていいんですね。','机の様子|今日の一番上には、何が書いてありますか。','正解じゃなくても|使いやすいことを自分で選べるのは大事ですね。','また変えていい|明日並べ替えることになっても、かまわないと思います。']]]}},
 driver:{
  a:{start:['sisterdraft'],middle:['sisterdraft'],finish:['sisterthink','sisterdraft'],scenes:[
   ['冗談を抜いた一行','妹へ書きかけた文章を読み返して、余計な冗談をひとつ消しました。\n\nいつもなら最後に何か面白いことを書きます。でもその一行は、面白くないまま残しておきたい気がしたんです。送るかどうかは、まだ別の話です。',[
    '消した冗談|真面目な一行を、そのまま残したかったんですね。','書きかけのまま|その文章は、いまも下書きのままですか。','言葉の置き方|照れ隠しを外した一行にも、あなたの声が残っています。','送らない自由|書いてみただけでも、無駄にはならないと思います。']],
   ['下書きの端','妹へ書いた文面をまた見ました。前に残した一行が、どうにも気になって。\n\n今度は少しだけ書き足しました。猫主任なら「推敲が長い」と言うでしょうね。でも、主任には家族宛ての文面を見せたことがありません。',[
    '書き足した言葉|少しずつでも、自分で納得できる言葉に近づくんですね。','主任の審査|主任の審査は厳しそうですが、下書きはあなたのものです。','家族への文章|仕事の報告とは違って、急いで仕上げられないものですね。','返事の速さ|送る日も送らない日も、あなたが決めていいと思います。']],
   ['封をしない便箋','あの書きかけの文章は、まだ手元にあります。最近は読み返しても、必ず直すわけではありません。\n\n書いた日の俺と今の俺は、少し違うのかもしれません。妹にどう伝えるかは決めていませんが、少なくとも自分の言葉から目をそらすのはやめました。',[
    '手元の言葉|送らなくても、その文章はあなたの中で続いていたんですね。','二人の時間|今のあなたなら、どの言葉を残したいですか。','決めないこと|すぐに結論を出さないのも、ひとつの向き合い方ですね。','急がずに|送ることを急かさず、書けたことを大切にしたいです。']]]},
  b:{start:['route','stationdelivery'],later:['route','shoproute','stationdelivery'],scenes:[
   ['街灯の一本','いつもの配送路で、街灯が一本新しくなったのに気づきました。新しいのは少し白っぽい光です。\n\n誰かに聞かれたわけじゃないのに、気になって覚えていました。荷物より街灯の番号に詳しくなっても、仕事では評価されないでしょうね。',[
    '一本の光|毎晩走っている人だから気づける変化ですね。','色の違い|白っぽい光で、道の景色も変わりましたか。','仕事の外側|荷物を運ぶだけじゃない時間が、道にはあるんですね。','主任の評価|猫主任なら街灯の点検も業務に加えそうですね。']],
   ['なくなった看板','配送の途中で、前からあった看板がなくなっているのに気づきました。店はまだそこにあります。\n\n知らないうちに風景って変わるんですね。休憩で仲間に話したら「よくそんなの覚えてるな」と言われました。自分でも驚いています。',[
    '覚えていた看板|見慣れた道が、いつのまにか記憶になっていたんですね。','お店のこれから|新しい看板は、どんなものになるんでしょう。','仲間の反応|いつも冗談を言う人が、今日は観察係ですね。','街の変化|毎晩同じ道でも、一つとして同じ夜はないんですね。']],
   ['あの角の灯り','新しい街灯の角をまた通りました。今はもう、最初からそこにあったみたいな顔をしています。\n\n一度気づくと、その前の道の暗さまで思い出せるものなんですね。配送の記録には残りませんが、俺の中には残っています。',[
    '道の記録|公式の配送記録とは別に、あなたの街の記録があるんですね。','暗かった角|前の道を思い出すと、どんな景色が見えますか。','小さな変化|一本の灯りを覚えているの、なんだかいいですね。','次の道へ|また別の変化に気づく夜もあるでしょうね。']]]}},
 fish:{
  a:{start:['bookshop','libraryvisit'],middle:['friendchat'],finish:['bookshop','libraryvisit','librarystudy'],scenes:[
   ['本の背表紙から','本屋で気になった本を見つけました。表紙の色も、題名の言葉も好きで、何度も同じ棚に戻りました。\n\n自分が好きだと言い切れるものが、こうしてちゃんとあるんですね。誰かに聞かれたら、うまく説明できる気がします。',[
    '好きと言えるもの|自分の好きがはっきり見えた瞬間だったんですね。','気になる本|どの言葉が、特に気になったのでしょう。','同じ棚へ|何度も棚に戻った時間から、気持ちが伝わります。','説明できなくても|好きな理由は、全部説明できなくてもいいと思います。']],
   ['止まらない感想','前に見つけた本の話を友人にしようとしたら、思った以上に長く話してしまいました。\n\n途中で「あ、ごめん」と言ったら「まだ聞いてるよ」と返ってきました。いつもは言葉を探しているのに、好きな本には言葉がいくらでもありました。',[
    'あふれた言葉|好きな話題には、あなたの言葉がたくさんあるんですね。','友人のひとこと|「まだ聞いてるよ」は、うれしい返事ですね。','本のどこが好き|特に伝えたかった場面は何でしたか。','話していい時間|長く話せることも、あなたの大切な一面ですね。']],
   ['短い紹介文','あの本を紹介するために、今度は短い文章を書いてみました。長く語りたくなるところを、一行だけにするのが難しかったです。\n\nでも、読み返すと私の好きなところが残っています。言葉を減らしても、気持ちは減らないんですね。',[
    '一行の紹介|短い言葉にも、好きな気持ちを込められたんですね。','残した部分|その一行には、どんなことを書きましたか。','言葉の長さ|長く話すあなたも、短く書くあなたも、どちらも本当ですね。','紹介する楽しさ|また別の本についても、聞いてみたくなります。']]]},
  b:{start:['friendchat'],later:['friendchat'],scenes:[
   ['妙な返事','友人と雑談していて、思わず変な冗談を言ってしまいました。いつもなら言う前に考え直すのに。\n\n相手が笑ったので、私まで笑ってしまいました。あとで内容を思い返したら、何が面白かったのか自分でもよくわかりません。',[
    '考える前に|言葉が先に出る日も、あるんですね。','二人で笑った|何がおかしかったのか忘れてしまう笑いもいいですね。','珍しい冗談|どんな言葉だったのか、ちょっと気になります。','話し方の幅|慎重な日も、とっさに笑わせる日も、あなたですね。']],
   ['二度目の冗談','友人とまた話しました。今度も何か面白いことを言おうとして、少し考えすぎてしまいました。\n\n結局、いつもどおりの会話になりました。それでも帰り道は楽しかったです。冗談は予定に入れるものじゃないのかもしれません。',[
    '予定しない笑い|面白さは、準備してもうまくいかないことがありますね。','いつもの会話|冗談がなくても、楽しかったことが大切ですね。','帰り道の気分|話したあとには、どんなことを考えていましたか。','無理に笑わせず|笑わせようとしなくても、友達でいられますよ。']],
   ['笑った理由','友人が前の会話の続きを持ち出して、二人でまた笑いました。何でもない言葉が、ずいぶん長持ちするんですね。\n\n私も、今度は少しだけ自分からふざけたことを言いました。真面目な話はまだ苦手でも、こんな会話なら気楽です。',[
    '長持ちした言葉|何でもない冗談が、二人の合言葉になったんですね。','自分から言えた|今日はどんなふざけた言葉を言ったんですか。','気楽な関係|真面目な話だけが、仲良くなる方法じゃないですね。','いつもの友人|これからも、二人らしい会話が続くといいですね。']]]}},
 clock:{
  a:{start:['library'],later:['library'],scenes:[
   ['しりとりの敗者','図書室で子どもとしりとりをしました。時計の名前なら少し詳しいつもりですが、しりとりの役には立ちません。\n\nあっさり負けてしまいましてね。悔しいというより、悔しがっている自分が面白かったのです。',[
    '思いがけない勝負|図書室にそんな勝負の日があったんですね。','時計の言葉|時計の部品で使える言葉はありましたか。','悔しさの発見|自分にも負けず嫌いなところがあったんですね。','次の勝負|次は勝っても負けても、楽しそうですね。']],
   ['帰り道の練習','図書室の帰り、頭の中でしりとりの練習をしてしまいました。「り」で始まる言葉を探して、道の角で立ち止まりました。\n\n長く暮らしてきて、こんな理由で道に迷うとは思いませんでした。子どもたちには内緒にしておきます。',[
    '内緒の練習|こっそり練習するところに、真剣さが見えますね。','りの言葉|「り」から始まる、よい言葉は見つかりましたか。','道の角で|しりとりのせいで立ち止まる散歩もいいですね。','勝ち負けより|楽しむための準備なら、内緒にしなくてもよさそうです。']],
   ['決着は持ち越し','図書室で、またあの子としりとりをしました。今回は前より長く続きましたが、最後は私が考え込んでしまいました。\n\n勝負は次回に持ち越しです。子どもは得意げで、私は少しだけ早く次の図書室の日が来てほしいと思っています。',[
    '次回の勝負|図書室へ行く楽しみが、ひとつ増えましたね。','考え込んだ言葉|最後はどんな言葉で止まったのでしょう。','うれしい敗北|勝てなくても、うれしい時間だったんですね。','続きがある|決着がつかないままでも、いい物語だと思います。']]]},
  b:{start:['walk','morningmarket'],later:['walk','shopvisit'],scenes:[
   ['知らない道の角','散歩の途中、普段は曲がらない角を曲がってみました。見慣れない塀と、知らない木が一本ありました。\n\n時計を修理していた頃なら、道順を確かめてから歩いたでしょう。今日は間違えても構わないつもりでした。',[
    '初めての角|いつもの街にも、知らない道が残っていたんですね。','知らない木|その木は、どんな葉をつけていましたか。','道順を決めず|行き先を決めない散歩も、楽しそうです。','戻れる道|少し違う道を歩いても、帰る場所はありますからね。']],
   ['地図にないお茶','またいつもと違う道を歩きました。途中、小さな店からお茶の香りがしてきたのです。\n\n入ったわけではありません。けれど帰宅してから、あの香りに似た茶葉を探しました。散歩の続きが、家の台所までついてきました。',[
    '香りの続き|歩いてきた道が、台所へつながることもあるんですね。','小さなお店|いつかその店に立ち寄りたくなりますか。','いつものお茶|普段のお茶も、少し違って感じられそうです。','入らなくても|通りすがりの発見だけでも、十分な収穫ですね。']],
   ['名前をつけない道','知らない角を見つける楽しみが、散歩にひとつ増えました。でも、毎回新しい道へ行くわけではありません。\n\nいつもの道を歩いた日にも、少し前に出会った木のことを思い出します。思い出すだけなら、足を延ばさなくていいのです。',[
    '二つの散歩|いつもの道と知らない道、両方を楽しんでいるんですね。','あの木|その木を、もう一度見に行きたいですか。','思い出す散歩|家にいても、道の続きを歩けることがありますね。','無理に出かけず|行きたい日だけ歩けば、それでよいと思います。']]]}},
 terminal:{
  a:{start:['neighbor'],later:['neighbor','walk'],scenes:[
   ['落とし物の話','帰り道の角で、近所の人が手袋を落としたことに気づきました。声をかけると、相手は片方だけの手袋を見て笑いました。\n\n私も笑ってしまいました。あの角で誰かと声を出して笑うとは、思っていませんでした。',[
    '角で笑ったこと|静かな帰り道に、笑い声がひとつ増えたんですね。','手袋の行方|もう片方の手袋は見つかったのでしょうか。','見つけた人|声をかけてよかったと思える出来事ですね。','いつもの道|明日も同じ角を、少し違う気持ちで通りそうです。']],
   ['あの角を通る','帰り道で、またあの角を通りました。落とし物はありません。近所の人にも会いませんでした。\n\nそれなのに、片方だけの手袋を思い出しました。自分が少し笑ったことまで。駅までの道が、ひとつ増えた気がします。',[
    '何もない角|出来事が終わっても、場所には記憶が残るんですね。','小さな笑い|あの時の笑いを、また思い出したんですね。','駅までの道|同じ道に、違う時間が重なっていくようです。','また会えるかも|会う日も会わない日も、その道は続いていますね。']],
   ['新しい挨拶','近所の人と、また短く挨拶しました。今度は手袋の話をしませんでした。ただ、少し笑って会釈をしました。\n\n名前を知らないままでも、笑える相手がいる。以前はそんなことを考えませんでした。',[
    '名前のない顔見知り|名前を知らない相手との親しさもあるんですね。','少し笑う会釈|その会釈は、前とはどんなふうに違いましたか。','変わらない角|角は同じでも、通る人の気持ちは変わりますね。','短いままで|言葉が増えなくても、十分な関係だと思います。']]]},
  b:{start:['chores'],later:['chores','rest'],scenes:[
   ['買い物の順路','休みの日の買い物リストを、行く店の順番に並べ替えました。先に遠い店へ行けば、帰りは荷物を持って歩く距離が短くなります。\n\n誰かに教えるようなことではありません。ですが、少しだけ得意になりました。',[
    '帰りを考える|帰り道のことまで考えた順路なんですね。','買い物の順番|最初に寄るのはどんなお店ですか。','得意なこと|静かな文章から、少し誇らしさが伝わってきました。','暮らしの工夫|日常の工夫は、誰かに見せなくても立派ですね。']],
   ['リストの余白','買い物リストの端に、必要のないものを一つ書きました。帰り道で気になっていた菓子です。\n\n順路だけなら最短ではなくなりました。でも、歩いている途中で少し楽しみになりました。',[
    '余白の買い物|必要なもの以外にも、選んでいい場所があるんですね。','気になったお菓子|どんなお菓子を選んだのでしょう。','遠回りの価値|一番短い道が、一番楽しい道とは限りませんね。','自分の予定|楽しみを一つ入れられたこと、いいなと思います。']],
   ['短いリスト','また買い物リストを書きました。順番は前と少し違います。必要なものを買って、寄りたい店があれば寄るつもりです。\n\n以前より決めごとが減った気がします。帰り道が何分か長くなっても、困らない日があります。',[
    '決めない順番|少し自由な買い物になったんですね。','寄りたい場所|今はどのお店が気になっていますか。','時間の余裕|何分かの遠回りが楽しみになる日もありますね。','戻れる道|予定どおりでも、そうでなくても、帰ってこられますね。']]]}},
 bread:{
  a:{start:['ingredientmarket'],later:['ingredientmarket','rest'],scenes:[
   ['買ってきたパン','仕事の帰りに、自分の店ではないパンを買いました。自分で焼かないで食べるパンです。\n\nおいしかったです。ちょっと悔しいくらい。翌日、売り場に並ぶ自分のパンを見て、別の気持ちになりました。休憩のつもりが、仕事の話になってしまいますね。',[
    '他店のひとつ|作る側を離れて味わうパンも、おいしいんですね。','どんなパン|どんなところが、悔しいくらいおいしかったんですか。','二つの目線|お客さんとして食べたあとでは、売り場も違って見えそうです。','休むことも|仕事を忘れられなくても、おいしく食べた時間は残りますね。']],
   ['作らない朝','店のパンとは違う味を思い出して、しばらくぼんやり考えました。材料を変えれば再現できるかもしれません。\n\nでも、すぐ試作はしないことにしました。あのパンは、しばらく「買って食べたパン」のままにしておきたいんです。',[
    '食べた記憶|作り方を考えずに味わうことも、できるんですね。','忘れたくない味|どの瞬間を、もう一度味わいたいですか。','試作しない選択|作らない時間があっても、パン好きは変わりませんね。','人のパン|誰かの仕事をそのまま楽しむのも、いい休息ですね。']],
   ['二つの楽しみ','別の店の前を通って、またパンを一つ買いました。今度は悔しさより、食べるのが楽しみでした。\n\n自分の店に戻れば、また試作のことを考えます。でも、おいしいパンを買う楽しみまで仕事にしなくていいんですね。',[
    '買う楽しさ|パンを買う人の気持ちも、少し見えてきましたね。','今日の一個|今度はどんなパンを選んだんですか。','作る人と食べる人|二つの楽しみが両方あっていいと思います。','仕事の外にも|大好きなものを、仕事以外でも楽しめますように。']]]},
  b:{start:['boss'],later:['boss','bake'],scenes:[
   ['試作品のあと','店長に試作品の感想を聞きました。思っていたより短い返事で、帰り道までその一言を考えてしまいました。\n\nいつもなら失敗談にして笑うのですが、今日はまだ笑い話にしたくありません。作るのが好きだから、気になるんでしょうね。',[
    '笑えない日|大切なことなら、すぐ笑い話にしなくていいですよね。','短い感想|その一言のどこが、気になったのでしょう。','好きだからこそ|好きな仕事ほど、気持ちが揺れることもありますね。','次の試作|今日は無理に答えを出さなくてもいいと思います。']],
   ['材料を量る','配合の数字をノートに書いて、何度も見直しました。新しい材料を足す前に、前のパンのことをもう一度考えています。\n\nいつもは思いついたらすぐ試すほうです。でも今日は、少し慎重です。自分でも珍しいと思います。',[
    '慎重なノート|今までと違う進め方も、仕事の一部なんですね。','前のパン|どのところを、もう一度考えていますか。','試さない時間|試作しない時間にも、試作品は育つんですね。','急がなくていい|考えた分だけ、次の一個を楽しみにできますね。']],
   ['売り場の朝','また店の売り場に立ちました。作ったパンはちゃんと並んでいます。まだ気になる配合がありますが、今日はお客さんが一つ買っていくところを見送りました。\n\n全部うまくいったわけじゃありません。それでも、明日も焼きたいと思えたので、それで十分です。',[
    '買われた一個|誰かの朝に、あなたのパンが届いたんですね。','まだ気になること|次の試作では、何を変えてみたいですか。','うまくいかなくても|心配の残る日にも、仕事への気持ちは残りますね。','明日も焼く|その一言だけで、今夜の手紙は十分だと思います。']]]}},
 moon:{
  a:{start:['family'],later:['family','pudding'],scenes:[
   ['地球の整理整頓','家族が片づける順番で困っていたので、使わないものから箱に入れようと提案しました。\n\n「今日は普通のことを言うね」と驚かれました。失礼な話です。月面都市の整理整頓だって、最初は箱を用意するところから始まります。',[
    '箱から始める|月でも地球でも、最初の箱は大事なんですね。','家族の反応|その提案、家族には役立ちましたか。','現実的な月面|空想の中にも、確かな生活の知恵があるんですね。','普通でもいい|普通の助言をする夜も、あなたらしいと思います。']],
   ['月面の当番表','家族とまた家の用事について話しました。今度は、担当を紙に書いてみました。\n\n月面都市で当番表を作ると、なぜか「重力管理係」が必要になります。でも実際の家にはいりません。たいへん合理的な判断です。',[
    '必要ない係|地球では重力管理係が不要で助かりますね。','当番の順番|その紙には、どんな用事が並んだんでしょう。','空想の知恵|空想から持ち帰れる工夫があるの、面白いですね。','家の時間|家族と一緒に考えられるのが、いいですね。']],
   ['地球での採用','前に作った当番表が、家でまだ使われています。紙の端には誰かの落書きが増えていました。\n\n月面都市の役所には報告しません。こちらの暮らしは、こちらの住民に任せます。案外、それが一番うまくいくようです。',[
    '地球の当番表|紙が使われ続けているの、うれしいですね。','端の落書き|誰が何を描き足したのか、気になります。','住民に任せる|自分だけで決めないところも、立派な計画ですね。','月の役所へ|報告しない秘密が、一つ増えましたね。']]]},
  b:{start:['sketch'],later:['sketch','moon'],scenes:[
   ['一行しかない月','空想ノートに、いつもの月面都市について書こうとしました。ところが、思いついたのは一行だけ。\n\n「月の食堂は、今日は休業。」それで終わりました。責任者としては大問題ですが、ノートを閉じたら少しほっとしました。',[
    '休業の札|月の食堂にも、休みが必要だったんですね。','一行の理由|どうして今日は食堂が休みになったのでしょう。','書けない夜|空想好きな人にも、静かな夜があるんですね。','ノートを閉じる|続きは、書きたい夜に書けばいいと思います。']],
   ['休業の張り紙','あの食堂の休業について、一行だけ書き足しました。「店主は家でプリンを食べています」。\n\n大事件は起こりません。市長も記者会見をしません。でも、この食堂にはそんな日もあっていいような気がしています。',[
    '静かな食堂|大事件がなくても、月の街はちゃんと動いているんですね。','店主のプリン|そのプリンは、誰かに見つからずに済みましたか。','一行の続き|ほんの一行で、店主の暮らしが見えてきましたね。','休める街|休業できる街のほうが、住みやすそうです。']],
   ['まだ休業中','空想ノートを開くと、あの月の食堂はまだ休業中です。続きを書くこともできますが、今は少しこのままにしておきます。\n\n街が動かない日にも、誰かが眠っているかもしれない。そう考えると、静かなページも悪くありません。',[
    '動かない街|書かれていない時間にも、暮らしがあるんですね。','食堂の再開|いつか店主が起きたら、何を作るでしょう。','静かなページ|空想しない時間まで、大事にしているんですね。','続きはいつか|再開の日を決めなくてもいいと思います。']]]}},
 sugar:{
  a:{start:['coffee'],later:['coffee'],scenes:[
   ['二杯目の前','いつもと違う味にしてみたくて、砂糖を二杯入れたところで一口飲みました。まだ三杯目は入れていません。\n\n思ったより苦くありませんでした。そのあと三杯目を入れるかどうか、少しだけ迷いました。迷う時間もコーヒーの味の一部ですね。',[
    '二杯の味|いつもの一杯にも、知らない味が残っていたんですね。','三杯目は|結局、三杯目は入れたのでしょうか。','迷う時間|飲む前に少し考えるのも、よい習慣ですね。','いつもの甘さ|三杯の甘さに戻っても、構わないと思います。']],
   ['計量しない朝','またコーヒーの味を変えてみました。昨日の正解を再現しようとしても、あまりうまくいきません。\n\nそもそも正解なんて、決める必要があったんでしょうか。窓の外を眺めているうちに、少しぬるくなりました。',[
    '正解のない味|同じ甘さにしなくても、楽しめるんですね。','窓の外|コーヒーがぬるくなる間、何を見ていましたか。','変わる朝|味と一緒に、朝の過ごし方も変わってきましたね。','ぬるい一杯|思いどおりにならない一杯も、悪くなさそうです。']],
   ['三杯のままでも','今日はまた、いつもの三杯にしました。前なら何も考えずに入れていたのに、今は一度だけ手を止めます。\n\n選んで三杯にするのは、何となく三杯にするのと違う気がします。甘さは同じなんですけどね。',[
    '選んだ三杯|変わらないことも、自分で選べるんですね。','一度止める|その一瞬には、どんなことを考えますか。','同じ味でも|味が同じでも、朝の意味は少し違うんですね。','好きな甘さ|これからも、その日の好きな味を選んでください。']]]},
  b:{start:['friend'],later:['friend'],scenes:[
   ['今日はこっちがいい','友達から二つの予定を聞かれて、今日は自分の希望を先に送りました。短い返事です。\n\n断ったわけではありません。ただ、いつものように相手に全部任せなかった。送信したあと、コーヒーが少し甘く感じられました。',[
    '短い希望|自分の好みを短く伝えられたんですね。','二つの予定|どちらを選んだのか、気になります。','穏やかな意思|強い言葉でなくても、意思は伝えられますね。','送ったあと|返事を待つ間も、落ち着いて過ごせますように。']],
   ['返事を待つ時間','友達から返事が届くまで、いつもより長く感じました。自分の希望を先に言ったからでしょうか。\n\nでも、途中で本を開いて、少し読み進めました。待つこと以外にもすることがある夜です。',[
    '待っている夜|希望を伝えたあとの待ち時間、少し長く感じますよね。','読んだ本|その夜は、どんな本を読んでいましたか。','自分の時間|返事の前にも、あなたの時間は続いていますね。','答えの速さ|返事は相手のペースでもいいと思います。']],
   ['また短い返事','友達とのやり取りで、今度も自分の希望を一言だけ伝えました。少し前ほど身構えずに送れました。\n\nただ、別の日はまた相手に任せたくなるでしょう。決める人と、任せる人。毎回同じでなくてもいいのかもしれません。',[
    '選ぶ自由|自分で決める日も任せる日も、あなたが選べるんですね。','身構えない返事|前と比べて、何がいちばん変わりましたか。','短いままで|長く説明しなくても、伝えられることはありますね。','どちらの日にも|いつもはっきりしなくても、十分だと思います。']]]}},
 anon:{
  a:{start:['notes'],later:['notes','read'],scenes:[
   ['読めないメモ','机に残したメモを、あとで読み返したら一文字だけ読めませんでした。自分の字です。誰にも見せていないのに。\n\n少し困って、少し笑いました。書いた本人が読めない記録とは、たいへん頼りないものです。',[
    '自分の字|自分にしかわからないはずの字が、わからないんですね。','読めない一文字|何と書いたつもりだったのでしょう。','小さな失敗|困った話なのに、少し楽しそうです。','書いたことだけ|読めなくても、書こうと思った時間は残りますね。']],
   ['解読作業','あの読めないメモを、また机で見つけました。前後の文字から推測してみたのですが、候補が二つできました。\n\nどちらでも大して困らない内容です。それでも、なんとなく気になっています。',[
    '二つの候補|解読が必要になるとは、思わなかったでしょうね。','何のメモ|どんな用事を書いた紙だったんですか。','気になる余白|困らないのに気になること、ありますよね。','決めなくても|二つのままでも、案外よさそうです。']],
   ['そのまま残す','読めないメモを、捨てずに机の端へ戻しました。もう解読しようとは思っていません。\n\n何を書いたかわからないのに、書いた夜のことは少し覚えています。紙は読めなくても、夜は残るものなんですね。',[
    '夜の記憶|文字が読めなくても、その夜は覚えているんですね。','机の端|今もほかのメモと一緒に置いてあるんですか。','不完全な記録|全部読めない記録にも、意味があるのかもしれません。','捨てない選択|残したいなら、わからないまま置いておいていいと思います。']]]},
  b:{start:['greet'],later:['greet'],scenes:[
   ['廊下の小さな違い','隣の部屋の人と廊下ですれ違いました。いつもより荷物が多そうだったので、扉を押さえていました。\n\nありがとう、と言われました。それだけです。けれど、相手の暮らしが少し見えた気がしました。',[
    '押さえた扉|ほんの一瞬の気遣いだったんですね。','多い荷物|何を運んでいたのか、気になりましたか。','廊下の距離|名前を知らなくても、相手のことを少し覚えられますね。','短いひとこと|「ありがとう」だけでも、十分な会話ですね。']],
   ['扉の向こう','また隣人と短く挨拶しました。今日は何も手伝うことはありませんでした。ただ、声が前より少し聞き取りやすくなった気がします。\n\n同じ廊下でも、毎回同じではないようです。',[
    'いつもの挨拶|手伝わない日にも、つながりは続くんですね。','違って聞こえる声|前と比べて、何が変わったのでしょう。','廊下の毎日|同じ場所の小さな変化に気づいたんですね。','名前を知らずに|今の距離のままでも、いいと思います。']],
   ['忘れなかったこと','隣人にまた会いました。今日は向こうが扉を押さえてくれました。前のことを覚えていたのかもしれません。\n\n確かめはしませんでした。短い礼を言って、部屋へ戻りました。たぶんそれで十分です。',[
    '返ってきた扉|以前の小さな行動が、別の日に返ってきたんですね。','覚えていたのかな|相手が覚えていたか、気になりますか。','聞かないままで|確かめない気遣いも、あるんですね。','礼のひとこと|それで十分と思えた夜が、いいなと思います。']]]}},
 umbrella:{
  a:{start:['market','neighborchat'],middle:['neighborchat'],finish:['market','neighborchat'],scenes:[
   ['花のない看板','市場へ向かう道で、新しく塗られた店の看板を見ました。花屋なのに、今日は花より文字の色が気になってしまいました。\n\n店へ帰ってから花を並べると、その色がずっと頭に残っていました。少し珍しい朝です。',[
    '看板の色|花ではない色にも目が向いた朝だったんですね。','何色の看板|どんな色が、そんなに気になったんですか。','店まで持ち帰る|街で見た色が、花の並べ方に残るんですね。','違う景色|仕事と関係ないものを眺める時間も大切ですね。']],
   ['通りの小さな発見','向かいの店の人と、通りの看板の色について話しました。思っていたより話が弾んで、花のことは一言も出てきませんでした。\n\n花屋の前に立っていても、こんな会話をする日があるんですね。',[
    '花のない会話|仕事と関係ない話で盛り上がる日もありますね。','向かいのお店|相手はどんな色が好きだと言っていましたか。','通りの仲間|同じ通りを見ている人ならではの会話ですね。','店先の時間|店の前で、いつもと違う時間を過ごせたんですね。']],
   ['花を並べる朝','あの看板の色は、今も時々思い出します。花を並べるとき、前より少し街の色を気にするようになりました。\n\n何か新しい仕事を始めたわけではありません。ただ、花の向こうにある景色まで見ている気がします。',[
    '向こうの景色|花だけでなく、店のある街も見えてきたんですね。','今の通り|今日は通りにどんな色がありましたか。','変わらない仕事|仕事は同じでも、見るものが増えることはありますね。','花屋の朝|明日の朝にも、小さな発見がありそうです。']]]},
  b:{start:['flowercustomer'],later:['flowercustomer','assistanttalk'],scenes:[
   ['できない花束','お客さんから花の色について相談を受けました。用意できない色があって、そのことを正直にお伝えしました。\n\n断るのは得意ではありません。でも、別の色を一緒に探せました。何でも「できます」と言わなくてよかったのだと思います。',[
    '正直な返事|用意できないことを伝えるのも、仕事の大切な部分ですね。','別の色|代わりにどんな色を選んだのでしょう。','一緒に探す|断ったあとにも、相談は続けられるんですね。','無理をしない店|できることを大切にするお店であってほしいです。']],
   ['色の相談の続き','またお客さんと花の相談をしました。前より「今日用意できる色」を先にお話しできました。\n\n相手が何を選ぶかは、まだわかりません。それでも、選べるところから話し始められて、少し気が楽でした。',[
    '選べる色から|できることから話すのも、丁寧な接客ですね。','選ぶ人の気持ち|お客さんはどんなふうに迷っていましたか。','気持ちの変化|前より、相談の始まりが楽になったんですね。','急いで決めず|お客さんにも考える時間があるといいですね。']],
   ['店に置けるもの','お客さんにできることと、できないことを伝えるのが、以前ほど怖くなくなりました。もちろん、言い方を迷う日はあります。\n\n花を並べる棚にも限りがあります。それでも、選んで置いた花には、前より少し責任を持てる気がします。',[
    '選んだ花|並べる花を選ぶことにも、責任があるんですね。','迷う日は|どんな相談のとき、今も言葉に迷いますか。','棚の余白|置ける数が決まっているから、大切に選べるのかもしれません。','無理なく続ける|できることを選びながら、店を続けてくださいね。']]]}},
 triangle:{
  a:{start:['freewalk'],later:['freewalk','diagram'],scenes:[
   ['説明できない角','帰り道で、特に変わったところのない角を見つけました。角度も普通で、建物の配置も珍しくありません。\n\nそれなのに、なぜかその景色が好きでした。理由を探してみましたが、まだ答えは出ていません。',[
    '理由のない好き|理由がなくても好きになれる場所があるんですね。','その角には|何が見える角だったのでしょう。','答えを探さず|全部説明しなくても、好きは好きでいいと思います。','帰り道の発見|いつもと違う道を歩いた甲斐がありましたね。']],
   ['地図に描かない場所','あの角を、ノートの街に入れようとしました。でも実際に描くと、どうして好きだったのか伝わりません。\n\n少し悔しくて、結局そのページは空白のままにしました。設計図にできない場所もあるようです。',[
    '描けなかった角|好きな景色が、そのまま図形になるとは限らないんですね。','空白のページ|そのページには、また何か描くつもりですか。','図形の外側|説明できない好きも、立派な発見ですね。','そのまま歩く|描けないまま、また見に行ってもいいと思います。']],
   ['好きのまま','また同じ道を歩きました。あの角は相変わらず、特に変わった場所ではありません。\n\nでも、前ほど理由を考えなくなりました。好きな場所の証明には、図面も計算も必要ないようです。これは少し意外でした。',[
    '証明しない好き|説明できないものを大切にできるのも、あなたですね。','同じ景色|今もその角で、少し立ち止まりますか。','図面の外の気持ち|計算から離れた発見も、面白いですね。','好きで十分|そのまま好きでいていいと思います。']]]},
  b:{start:['familydinner'],later:['familydinner'],scenes:[
   ['皿の配置図','家で夕食を手伝いました。お皿を並べる場所を少し変えたら、皆が取りやすくなったんです。\n\n家族に「気が利くね」と言われました。なぜでしょう。配置を変えただけなのに、いつもの図形が役に立ちました。',[
    '食卓の図形|お皿の配置にも、考える楽しさがあったんですね。','どんな並び|どう置いたら取りやすくなったんですか。','家族の一言|「気が利くね」は、うれしい言葉ですね。','図形の使い道|ノートの外にも、図形はあるんですね。']],
   ['台所の動線','また夕食の支度を手伝いました。前に皿を並べたときのことを思い出して、今日は先に必要なものを運びました。\n\n気づいたら家族に「助かった」と言われました。これ、ちょっとした設計の成果かもしれません。',[
    '設計の成果|暮らしの中で考えたことが、役に立ったんですね。','先に運んだもの|何を先に用意すると、楽になりましたか。','助かったの一言|家族の言葉が、いい評価になりましたね。','また手伝う|次の夕食でも、頼もしい配置係ですね。']],
   ['計画にない会話','家で夕食の支度を手伝っていたら、予定していなかった話が始まりました。途中で手を止めて、しばらく聞いていました。\n\nお皿の配置は少し乱れました。でも今日は、それを直すより大事なことがあった気がします。',[
    '配置より会話|整った食卓より、大切な時間もあるんですね。','何の話|家族とは、どんな話をしていたんですか。','柔らかい設計|計画を変えられるのも、立派な工夫だと思います。','そのままで|少しくらい乱れた食卓も、いい景色ですね。']]]}},
 fridge:{
  a:{start:['rest'],later:['rest','konbini'],scenes:[
   ['料理のない窓','仕事から帰って、何も作らずに座りました。窓の外を見ていたら、向かいの部屋の灯りが一つずつ消えていきました。\n\nいつもは厨房の火を気にしているのに、今日は別の灯りを眺めています。こんな時間も、案外悪くないです。',[
    '違う灯り|厨房の外にも、気になる灯りがあったんですね。','向かいの窓|一番最後まで灯っていたのは、どの窓でしたか。','作らない夜|何も作らない時間にも、楽しみはありますね。','休むこと|今夜も、落ち着いて過ごせますように。']],
   ['数えない夜','帰宅してまた窓の外を見ました。前は灯りの数を数えていましたが、今日は途中でやめました。\n\n誰かがまだ起きている、ということだけわかれば十分でした。自分の仕事が終わったことも、少し実感できました。',[
    '数えなくても|灯りがあるだけで、安心する夜もあるんですね。','仕事の終わり|窓を眺めると、気持ちも切り替わりますか。','知らない暮らし|窓の向こうにも、それぞれの夜があるんですね。','自分の夜へ|厨房を離れた時間も、大切にしてくださいね。']],
   ['ひとつ残る灯り','今夜も帰宅して、窓の外を眺めました。どこかの部屋にひとつだけ灯りが残っていました。\n\n何をしている人なのかは知りません。知る必要もない。ただ、自分だけが起きているわけじゃないと思うと、少し気が楽になりました。',[
    '一つの灯り|知らない誰かの夜が、あなたの夜にも重なっていたんですね。','窓の向こう|その灯りを見たとき、何を考えましたか。','一人じゃない夜|知らない人の暮らしにも、安心することがありますね。','静かな時間|そのままゆっくり休めますように。']]]},
  b:{start:['cookmate'],later:['cookmate'],scenes:[
   ['焦がした話のあと','厨房で仲間と失敗談を話しました。相手がずいぶん気にしていたので、「焦がしたことがない人は、火を使ったことがない人だ」と言ってみました。\n\n少し大げさですが、笑ってくれました。自分が人を笑わせる側になるとは思っていませんでした。',[
    '大げさな一言|その言葉で、相手の気持ちが少し軽くなったんですね。','仲間の表情|相手は、どんなふうに笑ってくれましたか。','厨房の失敗|失敗を知っているから言える冗談がありますね。','次の一皿|二人とも、また火を使っていいんだと思います。']],
   ['持ち場の冗談','また厨房の仲間と片づけをしました。道具の置き場所がずれているのを見て、少し冗談を言いました。\n\n相手はすぐには笑いませんでしたが、後から小さく吹き出しました。仕事の邪魔にならない笑い方というのも、あるんですね。',[
    'あとから笑う|少し遅れて届く冗談も、いいですね。','道具の場所|どんな置き方だったんでしょう。','持ち場の空気|仕事の中にも、少し柔らかい時間ができたんですね。','無理に笑わせず|笑う日も真面目な日も、同じ仲間ですね。']],
   ['火を落としたあと','厨房の火を落として、仲間と短い話をしました。今日は面白いことを言おうとはしませんでした。\n\nでも相手から、以前の失敗談をもう一度聞きたいと言われました。私にはただの失敗でも、誰かには笑える話になっていたようです。',[
    'もう一度聞きたい|自分の失敗が、誰かの好きな話になっていたんですね。','あの失敗談|どんなところを、また聞きたかったのでしょう。','仕事のあとに|火を落としたあとだから話せることもありますね。','いつもの仲間|冗談を言わない日にも、関係は続いているんですね。']]]} }
};

function createSurpriseState46(){return {schema:1,people:{},sent:[]}}
function migrateSurprise46(data){
 const next=createSurpriseState46(),old=data.surprise46;
 if(!old||typeof old!=='object'){data.surprise46=next;return data}
 for(const [id,t] of Object.entries(old.people||{})){
  if(!SURPRISE_ARCS_46[id]||!t||!['a','b'].includes(t.arc))continue;
  const scenes=Array.isArray(t.scenes)?t.scenes.filter(x=>x&&[1,2,3].includes(x.stage)&&Number.isInteger(x.night)).slice(0,3):[];
  next.people[id]={arc:t.arc,stage:Math.min(3,Math.max(0,Number(t.stage)||0)),scenes,
   lastChangeNight:Math.max(0,Number(t.lastChangeNight)||0),
   lastSentIndex:Math.min(scenes.length,Math.max(0,Number(t.lastSentIndex)||0)),
   lastMailNight:Math.max(0,Number(t.lastMailNight)||0)};
 }
 next.sent=Array.isArray(old.sent)?old.sent.slice(-110):[];
 data.surprise46=next;return data;
}
// 日常のアクションが実際に選ばれた場合にだけ私生活の小さな一面が現れる。
// 放送したかどうかは人生の進行条件ではなく、後日の手紙の書かれ方にだけ関わる。
function surpriseAfterWorld46(n){
 if(n<29||chapter3IsNight(n))return;
 s.surprise46 ||= createSurpriseState46();
 for(const [id,arcs] of Object.entries(SURPRISE_ARCS_46)){
  if(!newListenerIntroduced(id,n))continue;
  const p=s.simState?.people?.[id];
  const today=p?.daily?.find(x=>x.night===n);
  if(!today)continue;
  let t=s.surprise46.people[id];
  if(!t){
   const possible=Object.entries(arcs).filter(([key,a])=>a.start.includes(today.actionId));
   if(!possible.length)continue;
   // 同じ人物の両方の顔が続けて登場しないよう、今回のプレイでは一系列だけ。
   const chance=simHash(`surprise46:begin:${id}:${n}:${today.actionId}:${s.rng}`)%100;
   if(chance>=62)continue;
   const chosen=possible[simHash(`surprise46:route:${id}:${n}:${s.rng}`)%possible.length][0];
   t={arc:chosen,stage:1,scenes:[{stage:1,night:n,actionId:today.actionId}],lastChangeNight:n,lastSentIndex:0,lastMailNight:0};
   s.surprise46.people[id]=t;
   continue;
  }
  if(t.stage>=3)continue;
  const d=arcs[t.arc];
  const required=t.stage===1?12:19;
  const acceptable=(t.stage===1?(d.middle||d.later):(d.finish||d.later));
  if(n-t.lastChangeNight<required||!acceptable.includes(today.actionId))continue;
  if(simHash(`surprise46:continue:${id}:${t.arc}:${n}:${t.stage}`)%100>=72)continue;
  t.stage++;t.lastChangeNight=n;
  t.scenes.push({stage:t.stage,night:n,actionId:today.actionId});
 }
}
// ステージが先に進んでも、投稿は最初の手紙から順番に届ける。
function surpriseCompose46(id,n){
 if(n<30||chapter3IsNight(n)||!s.surprise46)return null;
 const t=s.surprise46.people?.[id];
 const arc=t&&SURPRISE_ARCS_46[id]?.[t.arc];
 if(!t||!arc||t.lastSentIndex>=t.scenes.length)return null;
 const scene=t.scenes[t.lastSentIndex];
 if(!scene||scene.night>=n)return null;
 if(t.lastMailNight&&n-t.lastMailNight<11)return null;
 // 直近にv4.1/v4.2の続きを送っていたら、その話題に割り込まない。
 const lastDaily=s.dailyThreads?.people?.[id]?.lastMailNight||0;
 const lastRel=s.relationThreads?.people?.[id]?.lastMailNight||0;
 if(Math.max(lastDaily,lastRel)>0&&n-Math.max(lastDaily,lastRel)<5)return null;
 if(simHash(`surprise46:letter:${id}:${t.arc}:${n}`)%100>=80)return null;
 const text=arc.scenes[scene.stage-1];if(!text)return null;
 const [subject,body,replies]=text;
 return {kind:'surprise46',tag:`surprise46-${id}-${t.arc}-${scene.stage}`,
  subject,body:deferredSceneDateBody4840(body),surprise46:{arc:t.arc,stage:scene.stage,actionNight:scene.night,actionId:scene.actionId},
  choices:replies.map((line,i)=>{const sep=line.indexOf('|');return [line.slice(0,sep),line.slice(sep+1),['empathy','curiosity','reflection','agency'][i]]})};
}
function surpriseConfirmDelivered46(n,ids){
 const state=s.surprise46;if(!state)return;
 for(const uid of ids){
  const l=s.regular?.letterArchive?.[uid];
  if(l?.kind!=='surprise46'||!l.surprise46)continue;
  const t=state.people?.[l.who];if(!t||t.arc!==l.surprise46.arc)continue;
  const scene=t.scenes[t.lastSentIndex];
  if(!scene||scene.stage!==l.surprise46.stage||scene.night!==l.surprise46.actionNight)continue;
  t.lastSentIndex++;t.lastMailNight=n;
  if(!state.sent.some(x=>x.uid===uid))state.sent.push({uid,who:l.who,arc:t.arc,stage:scene.stage,night:n,actionNight:scene.night});
 }
 state.sent=state.sent.slice(-110);
}


// =============================================================
// v4.9.8 第4章「声の届かない朝にも」：書き下ろしの独立した便箋
// 旧セーブへの遡及は行わず、夜が初めて生成された時点で原稿を固定。
// =============================================================
const CH4_DAYS=[
 ['何度目かの、はじめまして','長く聞いた名前にも、まだ知らない午後がある。'],
 ['下書きの外側','人に見せない言葉にも、その日の居場所がある。'],
 ['同じ道、違う予定','同じ道を歩いても、目に留まるものは日によって違う。'],
 ['いつものものの、別の使い方','よく知る道具に、知らなかった使い道が見つかる。'],
 ['次ではない駅','ひとつ先の予定を、急いで決めなくてもいい。'],
 ['誰にも見せない一行','紙の上には、自分だけの時間も残る。'],
 ['覚えていた小さなこと','短い会話が、帰り道でふとよみがえる。'],
 ['少し早く帰る夜','いつもの夜にも、違う帰り方がある。'],
 ['返事にならない言葉','言い切れない感想も、書き残しておける。'],
 ['いつもと違う木曜日','習慣のそばに、新しい小さな予定が生まれる。'],
 ['明日の予定表','大切な決断ばかりが、明日の予定ではない。'],
 ['まだ書かない手紙','書くことと、今は書かないこと。どちらも選べる。'],
 ['何度目かの普通の夜','会ったことのない誰かの、今夜の近況。'],
 ['声の届かない朝にも','放送の外でも、別々の一日が続いていく。']
];
const CH4_CONTENT=[{"night":79,"who":"cat","subject":"何も描かない午後","body":"こんばんは。\n\n休みの日、スケッチブックを持って喫茶店へ行きました。結局、一度も開きませんでした。窓際の席で、信号が変わるたびに人の歩く速さが少しずつ違うのを見ていました。\n\n何も描かなかったので、最初はせっかくの休みを無駄にした気がしました。でも、帰ってから思い出したのは、窓の向こうのあの景色でした。\n\n描かない日にも、見ていたものは残るんですね。まだ、それをどう思えばいいのかはわかりません。","choices":[["受け止める","何も描かなかった午後にも、ちゃんと見ていた景色があるんですね。無駄だったかどうか、今夜決めなくてもよさそうです。","empathy"],["景色に関心を寄せる","信号が変わるたびに、人の歩く速さが違ったんですね。何も描かなかったのに覚えている景色、そのまま大事にしてもいいと思います。","reflection"],["急がせない","スケッチブックを開かずに帰る日があってもいいと思います。何も描かないまま、よく見ていた一日だったんですね。","space"]],"dynamic":false},{"night":79,"who":"bread","subject":"今日の売り場の謎","body":"こんばんは。\n\n店に、同じパンを毎回違う名前で注文するお客さんがいます。今日は「角のない四角いの」、前は「朝に負けないやつ」でした。本人は毎回、いたって真面目です。\n\n今日は私も真面目に「角のない四角いのですね」と復唱しました。隣で聞いていた同僚が、パンを落としそうになっていました。\n\n商品名を覚えていただくより、あの説明を聞くほうが楽しみになってきています。また来てくれるなら、次は何という名前でしょう。","choices":[["冗談に乗る","「朝に負けないやつ」は、なかなか強そうなパンですね。店にしか通じない名前が増えるのも、ちょっと楽しそうです。","humor"],["質問する","同じパンを違う言葉で選ぶのが面白いですね。そのお客さんが最初に使った呼び名も気になります。","curiosity"],["笑って返す","真面目な顔で復唱したところを想像して笑ってしまいました。パン売り場には、思わぬ名付け親がいるんですね。","humor"]],"dynamic":false},{"night":80,"who":"fish","subject":"誰にも見せない感想","body":"こんばんは。\n\n借りていた本を読み終えました。感想を聞かれたら困ると思って、ノートに一行だけ書いてみました。\n\n「この人が窓を閉めなかったところが好きです」。\n\nどうしてそこが好きなのかは、まだ説明できません。大きな出来事のない場面なのに、読み終わってから何度も思い出します。\n\n誰かに見せる予定のない感想なら、うまく書かなくてもいいんですね。少し気が楽でした。","choices":[["受け止める","誰かに説明するためではない感想も、あっていいですよね。窓を閉めなかった場面が、あなたの中に残ったんですね。","empathy"],["余白を認める","大きな出来事ではない一場面が忘れられないこと、ありますね。言葉にできない理由も、そのまま置いておけそうです。","space"],["次の話を待つ","誰かに見せるためではない一行を、今夜はこうして聞かせてくれたんですね。言葉にできない好きな場面があってもいいと思います。","reflection"]],"dynamic":false},{"night":80,"who":"moon","subject":"月の忘れ物係","body":"こんばんは。架空の職員募集のお知らせです。\n\n月の裏側に「忘れ物係」を作ることにしました。仕事内容は、地球から見えない場所に置き去りになった考えごとを一日三回点検することです。夜勤手当は星くず二袋。\n\n勤務表を冷蔵庫に貼ったら、家族から「まずプリンを忘れずに片づけて」と言われました。たしかに、忘れ物係の冷蔵庫に賞味期限切れのプリンがあったら信用問題です。\n\n応募資格に「自分の忘れ物を一つ以上持っていること」を追加しました。採用されそうな方はいますか。","choices":[["冗談に乗る","夜勤手当が星くず二袋とは、待遇の確認が必要ですね。でも、応募資格はかなり広そうです。","humor"],["空想を広げる","地球から見えない考えごとの点検、という仕事が気になります。見つかった考えごとは、持ち主に返せるのでしょうか。","reflection"],["家庭の話に返す","冷蔵庫のプリンで信用問題になる月面職員、急に身近ですね。勤務初日は、賞味期限の確認から始まりそうです。","reflection"]],"dynamic":false},{"night":81,"who":"driver","subject":"主任の休暇届","body":"こんばんは。仕事の休憩を終えて帰宅したところです。\n\nいつもの駐車場で、猫主任が見当たりませんでした。点検に行ったのか、有給休暇なのか。私には事前の連絡がありませんでした。\n\n帰り際、隣の車の陰から一度だけ尻尾が見えました。姿を見せないまま勤務していた可能性があります。\n\n評価はまだ保留です。でも、いないと少し気になるものですね。次にお会いしたら、休暇届の提出方法について相談しようと思います。","choices":[["冗談に乗る","主任の所在確認、お疲れさまです。尻尾だけの出勤では、勤務実態の判断が難しそうですね。","humor"],["気遣う","いつも会う姿が見えないと、ちょっと気になりますよね。尻尾を見つけたとき、少し安心されたでしょうか。","reflection"],["続きを聞く","休暇届の提出方法を猫主任と相談する場面、ぜひ聞いてみたいです。どちらが先に折れるのでしょう。","curiosity"]],"dynamic":false},{"night":81,"who":"sugar","subject":"いつもの三杯目","body":"こんばんは。\n\n友人とコーヒーを飲みました。私はいつもどおり砂糖を三杯。友人は何も入れずに飲んでいました。\n\n「甘くない？」と聞かれたので、ひと口飲んでから「今日はそんなに」と答えました。自分でも少し不思議でした。同じ豆で、同じカップなのに、話しながら飲むと味の印象が変わるみたいです。\n\n三杯目の砂糖は、今日もちゃんと甘かったはずなんですけどね。","choices":[["感想を返す","三杯の砂糖は同じなのに、友人と話しながらだと違う甘さに感じたんですね。カップの中身だけでは決まらないこともありそうです。","reflection"],["質問する","ひと口飲んでからの「今日はそんなに」がいいですね。どんな話をしていたのか、ちょっと気になります。","curiosity"],["そっと喜ぶ","甘さの量を変えるのではなく、感じ方が違うというのが面白いです。次の三杯目にも何か発見があるかもしれません。","reflection"]],"dynamic":false},{"night":82,"who":"clock","subject":"小さなドライバーの出番","body":"こんばんは。\n\n古い工具箱を開けたら、使う機会のなくなった小さなドライバーが出てきました。昔は時計の裏蓋を外すのに使っていたものです。\n\nねじの大きさが合うものを探していたら、台所の引き出しの取っ手が少し緩んでいるのを見つけました。さっそく締めようとしましたが、そのドライバーでは小さすぎました。\n\n結局、別の工具を使いました。役に立たなかった小さな一本は、磨いて箱へ戻しました。そういう日もありますね。","choices":[["道具に寄り添う","昔よく使った道具が、今は別の役目を探しているようですね。磨いて戻した時間も、いい時間だったと思います。","empathy"],["違いを見つける","小さすぎるドライバーだったんですね。時計のねじと引き出しのねじ、似ていても違うものですね。","reflection"],["軽いユーモア","一本目が出番なしで終わったというのが、なんだか微笑ましいです。道具箱には、そんな話がまだありそうですね。","reflection"]],"dynamic":false},{"night":82,"who":"umbrella","subject":"花ではない色","body":"こんばんは。\n\n花の色を見ている時間が長いせいか、休み時間まで色の名前が気になります。今日は文房具売り場で、青いノートを三冊も見比べてしまいました。\n\n一冊は雨の前の空みたいな青。もう一冊は、使い込んだ制服のような青。最後の一冊は、名前が思いつきませんでした。\n\n結局、名前をつけられなかった色を選びました。花ではない色を持ち帰るのも、たまにはいいですね。","choices":[["色を受け取る","名前をつけられなかった青を選んだ、というのが素敵ですね。花とは違う場所でも、色を見つけているんですね。","empathy"],["質問する","その青、使っているうちに呼び名が見つかるでしょうか。ノートの最初のページも気になります。","curiosity"],["軽いユーモア","三冊の青を比べる時間、なんだか楽しそうです。花屋さんのお休み時間にも、色はお休みしないんですね。","reflection"]],"dynamic":false},{"night":83,"who":"terminal","subject":"木曜日ではない切符","body":"こんばんは。\n\n駅とは反対の方角へ買い物に行きました。いつもの切符は持たず、小さな紙袋だけ持って出ました。\n\n帰り道に知らない店があって、窓に古い地図が飾ってありました。急いでいたわけではないのに、中には入りませんでした。今日は地図を見るだけでよかったのだと思います。\n\n駅へ向かう日とは違う道にも、覚えておきたい角があるようです。次は少し先まで歩いてみます。","choices":[["景色を受け取る","駅へ向かわない道にも、覚えておきたい角が見つかったんですね。何も決めずに通る日もあっていいと思います。","empathy"],["興味を示す","古い地図の飾ってある店に、今日は入らなかったんですね。窓越しに見たものを持ち帰る日もあるんだと思います。","empathy"],["余韻を残す","入らなかった店のことが残る、というのも不思議ですね。今日は窓越しで十分だったのかもしれません。","reflection"]],"dynamic":false},{"night":83,"who":"triangle","subject":"まだない街の地図","body":"こんばんは。\n\nノートの端に、まだ存在しない街の地図を描いています。学校も公園も描いたのですが、今日は何に使うかわからない四角い空き地をひとつ追加しました。\n\n友人に見せたら「そこ、何が建つの？」と聞かれました。何も決めていないと答えると、「じゃあ広場でいいじゃん」と言われました。\n\nでも、広場と決めたら広場以外になれませんよね。用途未定の四角には、まだ可能性が四辺分あると思うんです。","choices":[["考えを受け止める","用途未定の四角に可能性が四辺分、いい考えですね。急いで名前をつけない場所も必要かもしれません。","empathy"],["質問する","その街には、ほかにどんな建物があるのでしょう。使い道の決まっていない場所が一番人気になるかもしれませんね。","curiosity"],["冗談を返す","四辺分という数え方、三角定規さんらしいです。誰かが勝手に斜めの道を引いたら、どうなりますか。","humor"]],"dynamic":false},{"night":84,"who":"fridge","subject":"自分の茶碗","body":"こんばんは。\n\n食器棚の奥から、小さな茶碗を出しました。仕事で使う器ではなく、家で自分がご飯を食べるための茶碗です。\n\n持ちやすいか確かめて、温かいご飯をよそいました。おかずは簡単なものでしたが、器を選んで食べると、ちゃんと食卓に座った気がします。\n\n人に出す料理のことはよく考えます。でも、自分が何で食べたいかは、あまり考えていなかったみたいです。","choices":[["共感する","自分のために器を選んだ時間が、静かに伝わってきました。簡単なご飯にも、ちゃんと席があるんですね。","reflection"],["質問する","その茶碗は、どんな形なんでしょう。持ちやすさで選んだところが、なんだかいいですね。","curiosity"],["生活を受け止める","人に出す料理と、自分が食べるご飯は、同じようで別の時間ですよね。今夜はその茶碗の話を受け取りました。","empathy"]],"dynamic":false},{"night":84,"who":"anon","subject":"句読点の場所","body":"こんばんは。\n\n机の上の紙に、短い一文を書きました。\n\n「今日は、何も決めませんでした。」\n\n句点を書いてから、読点はいらなかったかもしれないと思いました。消しゴムを取ったのですが、消さずに机へ戻しました。\n\n意味は変わらないはずです。でも、ひと呼吸する場所を残したかったのかもしれません。\n\nこの一文を誰かに見せる予定はありません。今夜は、ここに書いたことだけ伝えます。","choices":[["言葉を受け取る","読点のところで、少し息をつける一文ですね。消さずに残したことも、今夜の小さな選択だったのかもしれません。","empathy"],["質問する","同じ文章でも、どこで息をつくかで読み心地が違いますね。その紙、明日も机に置いておくのでしょうか。","curiosity"],["感謝する","見せる予定のない一文を、こうして少しだけ届けてくれたんですね。ありがとうございます。","empathy"]],"dynamic":false},{"night":85,"who":"bread","subject":"ちょっと曲がった札","body":"こんばんは。\n\n売り場の値札を書き直したら、「くるみ入り」を「くるみ寄り」と書いていました。気づかず並べていたら、お客さんに「今日は寄ってるんですね」と言われました。\n\n店長に見せると、しばらく札を眺めたあと「じゃあ、たまには真ん中に戻してやれ」と一言。二人とも、訂正するより先に笑ってしまいました。\n\n札はちゃんと直しました。でも、捨てずに裏へしまいました。いつか『くるみ寄り』というパンを作る日が来るかもしれません。","choices":[["冗談に乗る","「くるみ寄り」、注文したくなる名前です。札一枚から新作の案が生まれるとは、パン屋さんらしいですね。","humor"],["続きを楽しみにする","その札を取っておいたんですね。いつか本当に「くるみ寄り」が店頭に並んだら、ぜひ教えてください。","reflection"],["店長の言葉に返す","店長さんの「真ん中に戻してやれ」がいいですね。くるみの位置まで心配してくれるお店なんですね。","reflection"]],"dynamic":false},{"night":85,"who":"clock","subject":"覚えていた本の名前","body":"こんばんは。\n\n図書室へ行く途中で、前に本の話をした方を思い出しました。題名をもう一度聞こうと思っていた本があります。妙なことに、聞きたいときほど名前が出てきません。\n\n今日はその方には会えませんでした。帰ってから紙に書いてみると、最初の一文字だけは覚えていました。\n\n続きを思い出せなくても、本はどこかの棚にありますし、その方にも今日の用事があるのでしょう。次に会ったときに、また聞いてみようと思います。","choices":[["受け止める","思い出せない題名が、次に会うときの小さな話題になりそうですね。本もその方も、それぞれの時間の中にいるんですね。","empathy"],["興味を示す","最初の一文字だけ覚えていたんですね。題名を思い出すことより、またその方と会って話せる日が楽しみになっていそうです。","empathy"],["余白を残す","会えなかった日の図書室にも、別の時間が流れているんでしょうね。思い出したらまた教えてください。","space"]],"dynamic":false},{"night":86,"who":"moon","subject":"帰宅許可の判定","body":"こんばんは。家庭内臨時委員会の議事録をお送りします。\n\n家族が「今日は早く帰ってきたね」と言ったので、帰宅時刻に関する審査会を開きました。議題は「早く帰った人に特典はあるか」。\n\n私はプリン一個を提案しましたが、「早く帰ったなら洗い物を手伝える」という対案が出ました。多数決の結果、対案が可決されました。議長は私でしたが、議長にも票は一つしかありません。\n\n次回は投票規則を見直したいと思います。洗い物は終わりました。","choices":[["冗談に乗る","帰宅が早い人への特典が洗い物になるとは、委員会の議事進行は厳しいですね。議長、お疲れさまでした。","humor"],["質問する","対案が可決されるところまで、ずいぶん本格的な会議ですね。次回はプリン案を再提出しますか。","curiosity"],["日常に返す","洗い物が済んだあとに届く議事録、いいですね。家族とのやりとりが目に浮かびます。","reflection"]],"dynamic":false},{"night":86,"who":"driver","subject":"帰り道の寄り道","body":"こんばんは。今日の仕事を終えてから書いています。\n\n帰り道、いつも素通りする小さな店に寄りました。棚に並んでいたのは、車の窓を拭く布と、妙に手触りのいいハンカチです。予定にはなかったのですが、ハンカチを一枚買いました。\n\n誰かへの贈り物というわけではありません。ポケットに入れると、少しだけ帰り道の持ち物が増えました。\n\n猫主任に見せても、査定には響かないでしょう。でも、自分では気に入っています。","choices":[["ねぎらう","自分のために選んだハンカチ、いい買い物でしたね。査定には関係なくても、帰り道が少し違って見えそうです。","reflection"],["質問する","どんな手触りだったんでしょう。思わず買ってしまうものには、説明しきれない魅力がありますよね。","curiosity"],["冗談を返す","主任の評価項目に「ハンカチの手触り」はなさそうですね。あったら意外と厳しい審査になりそうです。","humor"]],"dynamic":false},{"night":87,"who":"sugar","subject":"何でもない乾杯","body":"こんばんは。\n\n友人と短い時間だけ会いました。お互いに用事があったので、お店に入るほどではなく、紙コップの飲み物を買ってベンチに座りました。\n\n特別なお祝いはなかったのに、友人が「とりあえず乾杯」と言って、紙コップを少し持ち上げました。私もまねをしました。\n\n何に乾杯したのか、最後までわかりませんでした。たぶん、会えたことだけで十分だったんでしょうね。ちなみに飲み物は、今日も甘めです。","choices":[["受け止める","理由のない乾杯、いいですね。会えた時間そのものに、そっと印をつけたようです。","empathy"],["情景に関心を寄せる","紙コップを少し持ち上げる乾杯、目に浮かびます。何に乾杯したのか聞かなかったところもいいですね。","reflection"],["少し笑う","今日も甘め、という最後の一言に安心しました。乾杯の理由は、次に会ったときに増えているかもしれません。","humor"]],"dynamic":false},{"night":87,"who":"fish","subject":"うまく言えない、おもしろい","body":"こんばんは。\n\n友達と同じ本を読みました。読み終わって話したら、好きだった場面がまったく違いました。\n\n私は窓際で何も話さないところが好きでした。友達は、そのあと誰かが大きな声で笑うところがよかったそうです。\n\n最初は、どちらかがちゃんと読めていないのかと思ってしまいました。でも、同じ本なのに見えていたものが違うのが、おもしろい気もします。\n\n「おもしろい」と言うだけでは足りないのですが、今はその言葉しか見つかりません。","choices":[["受け止める","同じ本から違う場面を持ち帰ったんですね。「おもしろい」だけでも、十分伝わってくる気がします。","empathy"],["質問する","静かな場面と笑う場面、どちらも残る本だったんですね。友達の話を聞いたあと、読み返したくなりましたか。","curiosity"],["余白を残す","うまく説明しきれないまま、おもしろいと思っていてもいいですよね。その違いを教えてくれてありがとうございます。","space"]],"dynamic":false},{"night":88,"who":"umbrella","subject":"店の外で飲むお茶","body":"こんばんは。\n\n用事の合間に、店の外で温かいお茶を飲みました。花の入ったバケツではなく、私のためにお湯を入れたカップを両手で持っていました。\n\n通りの向こうで誰かが急いで歩いていて、こちらの時間まで少し速くなりそうでした。でも、お茶は急いでも冷める速さが変わらないんですね。\n\n花の水を替えるときは温度に気をつけるのに、自分の飲み物はいつも後回しです。今日は最後まで温かいうちに飲めました。","choices":[["気遣う","いつもは後回しになる自分のお茶を、今日は温かいうちに飲めたんですね。そういう数分も、お店で過ごす大切な時間ですね。","reflection"],["気づきを受け取る","温かいカップを両手で持ちながら、通りを急ぐ人を見ていたんですね。周りの足取りと、自分のお茶の時間は別でいいんですね。","empathy"],["一杯を大切にする","急いでもお茶が急には冷めない、というのが印象に残りました。お仕事の合間に、そんな一杯があるといいですね。","reflection"]],"dynamic":false},{"night":88,"who":"terminal","subject":"待たない午後","body":"こんばんは。\n\nこのところ、決まった用事のない午後が一日ありました。誰かを待つわけでも、電車の時間を調べるわけでもなく、近所で買ったパンを家で食べました。\n\n窓を開けると、向かいの家から食器を片づける音が聞こえました。特別なことはありませんでした。\n\nそれでも、あの日の午後を覚えておこうと思います。待ち合わせのない時間にも、あとから思い出すことがあるようです。","choices":[["受け止める","待ち合わせのない午後にも、覚えておきたい時間があるんですね。食器の音まで残っているのが印象的です。","empathy"],["質問する","窓を開けて、パンを食べて、向かいから食器の音が聞こえる午後だったんですね。どんなパンだったのか、少し気になりました。","curiosity"],["感謝する","特別なことがなかった日を、こうして手紙にしてくださったんですね。ありがとうございます。","empathy"]],"dynamic":false},{"night":89,"who":"triangle","subject":"余白に書く予定","body":"こんばんは。\n\n予定表の端に「明日やってみたいこと」を三つ書きました。①道の曲がり角を一つ調べる、②知らない形の雲を探す、③ノートの空き地に何か置いてみる、です。\n\n進路の予定表なら、もっと大切なことを書くべきなのかもしれません。でも、大切なことだけで一日を埋めると、どこにも寄り道できなくなりそうです。\n\n三つ目は明日になっても決めないかもしれません。未定も予定の一種、と考えていいでしょうか。","choices":[["考えを受け止める","未定も予定の一種。その考え方、いいですね。予定表に寄り道できる場所が残っているんですね。","empathy"],["質問する","知らない形の雲、見つかったらどんな名前をつけるのでしょう。三つの予定がどこで交わるのかも楽しみです。","curiosity"],["急がせない","大事な予定ばかりで埋まらない一日も、いいですよね。三つ目を決めないままにする自由も残しておきましょう。","space"]],"dynamic":false},{"night":89,"who":"fridge","subject":"まかないのない帰り道","body":"こんばんは。\n\n今日はまかないを食べる時間がなくて、仕事の帰りに、自分が何を食べたいか考えました。凝ったものではなく、冷蔵庫にあるものを温めるだけでもいいし、帰りに何か買ってもいい。\n\n献立を決めないと落ち着かない日もありますが、今日は決めないことにしました。帰ってから台所の明かりをつけて、そのとき考えようと思ったんです。\n\n人に出す料理と違って、自分の食事は、少し気まぐれでも許していいですね。","choices":[["受け止める","自分の食事だからこそ、そのときの気分で決めてもいいんですね。台所の明かりが、少し気楽に感じられます。","empathy"],["質問する","帰ってから何を選ぶか、まだ決めていないんですね。台所の明かりをつけたら、何が食べたくなるでしょう。","curiosity"],["生活の違いに触れる","誰かに出す一皿と、自分だけの一皿。どちらも料理ですが、違う自由がありそうですね。","reflection"]],"dynamic":false},{"night":90,"who":"anon","subject":"しおりの端","body":"こんばんは。\n\n読みかけの本から、細い紙のしおりが出てきました。自分で挟んだはずなのに、そこまで読んだ理由が思い出せません。\n\nしおりには何も書いてありませんでした。何か一言書き足そうかと思いましたが、結局そのまま戻しました。\n\n本の続きは、また別の日に読みます。しおりの位置だけ覚えていれば、前に戻ることも、先へ進むこともできますから。","choices":[["受け止める","何も書いていないしおりが、今いる場所だけを教えてくれるんですね。静かな目印だと思いました。","empathy"],["問いかける","そこまで読んだ理由を忘れても、続きは残っていますね。次に開いたとき、同じページをどう感じるのでしょう。","curiosity"],["余白を認める","一言書き足さずに戻したところが印象に残りました。何も書かない紙にも役割があるんですね。","space"]],"dynamic":false},{"night":90,"who":"cat","subject":"机に置いた一枚","body":"こんばんは。\n\n机の上に、白い紙を一枚置いています。絵を描き始めたわけでも、誰かに見せるためでもありません。\n\n端に小さな線が一本あります。以前なら、描きかけだと思って、続きを足さなくてはと考えたかもしれません。今は、線が一本だけの紙として置いておけます。\n\n気が向いたら二本目を引くかもしれませんし、明日には買い物のメモになるかもしれません。まだ決めていません。","choices":[["急がせない","一本だけの線を、そのまま机に置いておけるんですね。続きを急がなくてもいい紙があるのは、いいことだと思います。","space"],["質問する","二本目の線にも、買い物のメモにもなれる一枚ですね。今の紙は、どんなふうに見えていますか。","curiosity"],["余白を認める","線が一つだけある紙が、明日には買い物のメモになるかもしれない。その決まらなさも、机の上に置いておけるんですね。","space"]],"dynamic":false},{"night":91,"who":"cat","subject":"傘を持たずに","body":"こんばんは。\n\n買い物に出たとき、空が少し曇っていました。雨が降るかもしれないと思いながら傘を持たずに出て、案の定、帰り道で細い雨に降られました。\n\n店のひさしで雨宿りをしていたら、向かいの窓に自分の姿が映っていました。少し困った顔で、それがなんだかおかしかったです。\n\n描こうと思えば描ける景色かもしれません。でも今日は、雨が弱くなるのをただ待ちました。傘を持ってこなかったことだけが、少し惜しいです。","choices":[["雨宿りの表情を受け取る","雨宿りしているご自分の顔が、思いがけずおかしかったんですね。そんな発見もあるんだなあ。","empathy"],["窓に映った顔に触れる","窓に映った姿まで見ていた、というところが印象的でした。雨はそのあと、弱くなったのでしょうか。","reflection"],["描かなかった景色を残す","描かなかった景色にも、忘れにくいものがありますね。次は傘を持って出られますように。","reflection"]],"dynamic":true},{"night":91,"who":"bread","subject":"袋の向き","body":"こんばんは。\n\n今日はパンを入れる紙袋の向きについて、同僚と妙に真剣な話をしました。持ち手をどちらに向けると取りやすいか、というだけの話です。\n\nふたりで何度も袋を持ち上げていたら、店長に「新しい商品の試食会ですか」と聞かれました。残念ながら、試食できるのは紙袋だけでした。\n\n結論は、手の大きさで違う、です。たいへん立派な結論が出たので、明日はちゃんとパンの話をしようと思います。","choices":[["紙袋の研究を楽しむ","紙袋の研究、お疲れさまです。明日にはお店の新しい専門分野になっていそうですね。","empathy"],["店長の勘違いに笑う","手の大きさで違うという結論、たしかに大事ですね。試食会だと思った店長さんの顔も気になります。","reflection"],["売り場の工夫に目を向ける","何度も持ち上げて確かめるところが楽しそうです。パンを売る以外にも、売り場には研究することがあるんですね。","reflection"]],"dynamic":true},{"night":91,"who":"fish","subject":"角の折れたページ","body":"こんばんは。\n\n本を返す前に、しおりを挟んでいたページをもう一度開きました。角が少し折れていて、直したつもりでもきれいには戻りませんでした。\n\nそのページには、登場人物がただ窓辺に座っている場面があります。物語が進まないところなのに、そこに戻りたくなりました。\n\n返却日なので本は返しました。何を書いてあったか忘れてしまったら、また借りればいいんですよね。そう思うと、少しだけ気が楽です。","choices":[["返したくない一ページに寄り添う","返したくない一ページがある本って、ありますね。また借りられると思えたのが、いい余白になった気がします。","empathy"],["窓辺の場面を思い返す","物語が進まない窓辺の場面が気になりました。角の折れたページにも、読み返したい理由が残るんですね。","reflection"],["読み返せることを喜ぶ","ページの角は元に戻らなくても、その場面をもう一度読めたんですね。また同じ本を手に取る日が来るかもしれません。","reflection"]],"dynamic":true},{"night":91,"who":"moon","subject":"存在しない祝日の話","body":"こんばんは。架空の暦を改訂しました。\n\n新しい祝日は「何も見つからなかった日」です。探していた鍵、思いつかなかった答え、冷蔵庫の奥にあると思っていたプリン。見つからなかったものを一日だけ正式にたたえます。\n\n家族に発表したら、「プリンは昨日食べたよ」と言われました。つまり、見つからない理由が判明してしまったので、祝日の条件を満たしません。\n\n祝日制定委員会は現在、深刻な人手不足です。応募してくださる方はいますか。","choices":[["新しい祝日を歓迎する","見つからなかったものをたたえる祝日、面白いですね。理由が判明したプリンだけは、祝日から外されてしまうんでしょうか。","empathy"],["プリンの謎に反応する","プリンが見つからない理由だけは、すぐに解明されてしまったんですね。調査力のあるご家族です。","reflection"],["制定委員会の行方を楽しむ","見つからなかったことまで祝う発想がいいですね。ただ、祝日の審査が意外と厳しそうです。","reflection"]],"dynamic":true},{"night":91,"who":"driver","subject":"停車場の鉛筆","body":"こんばんは。休憩中に書いています。\n\n停車場の端で、短くなった鉛筆を拾いました。誰かが落としたのだと思います。芯はまだ残っていて、妙に先が丸い鉛筆でした。\n\n事務所の落とし物入れに置いたら、同僚が「それ、まだ働ける長さですね」と言いました。ずいぶん働き者の鉛筆だなと思いました。\n\n猫主任にはまだ報告していません。鉛筆の勤怠管理まで引き受けてもらうのは、気の毒ですから。","choices":[["鉛筆の現役をねぎらう","丸い芯の鉛筆も、まだ現役なんですね。猫主任の仕事が増えなくてよかったです。","empathy"],["働ける長さを考える","「まだ働ける長さ」という言い方が面白いですね。落とし主に戻るといいですね。","reflection"],["落とし物のやりとりを楽しむ","拾ったものをちゃんと届けて、そこにひと言冗談が生まれる。休憩の小さな出来事ですね。","reflection"]],"dynamic":true},{"night":91,"who":"sugar","subject":"氷の音","body":"こんばんは。\n\nいつもは温かいコーヒーを飲むのですが、今日は冷たいものにしました。砂糖を三杯入れて、少し長めにかき混ぜました。\n\nカップの中で氷が当たる音がして、それを聞いていたら、隣の席の人の話し声が遠くなった気がしました。もちろん、音が消えたわけではありません。\n\n味の話を書こうと思っていたのに、音のことばかり覚えています。コーヒーを飲む時間は、舌だけのものではないんですね。","choices":[["氷の音を受け取る","氷の音が残った一杯だったんですね。飲み物を覚えている理由は、味だけではないのかもしれません。","empathy"],["いつもの三杯との違いを見る","砂糖を三杯、今度は冷たいコーヒーだったんですね。氷の音まで聞こえてくるようです。","reflection"],["味から音への寄り道を楽しむ","味の話から音の話へ変わるのが面白いですね。次はどんな音が残るでしょう。","reflection"]],"dynamic":true},{"night":91,"who":"clock","subject":"棚のいちばん下","body":"こんばんは。\n\n本棚のいちばん下を掃除していたら、いつ置いたかわからない紙の栞が出てきました。絵柄も文字も、少し日焼けしていました。\n\nどの本に挟んであったものか、さっぱり思い出せません。しばらく眺めてから、今読んでいる本に使うことにしました。\n\n持ち主のわからない栞ではなく、自分の栞だったのでしょう。ただ、今日からまた出番ができました。道具には、そういう再会もありますね。","choices":[["栞の再登場を喜ぶ","忘れていた栞にも、新しい出番ができたんですね。棚を掃除した甲斐がありましたね。","empathy"],["新しい使い道に触れる","どの本に挟んでいたかは思い出せなくても、今の本には使える。その気軽さがいいですね。","reflection"],["日焼けした紙に思いを寄せる","紙の日焼けの具合まで覚えているところが印象に残りました。今度はどんな本と一緒になるのでしょう。","reflection"]],"dynamic":true},{"night":91,"who":"umbrella","subject":"灰色を買う","body":"こんばんは。\n\n帰り道、靴下を買いました。選んだのは、どこにでもありそうな灰色です。\n\n花の色を考えるときは、名前のつかない色をずっと見ていられるのに、靴下になると「洗濯で迷わない色がいい」と思うのが不思議でした。\n\n結局、同じものを二足買いました。明日の朝、どちらを選んでも間違えないはずです。地味ですけれど、かなり頼もしい買い物でした。","choices":[["灰色の買い物をねぎらう","二足とも同じ灰色なら、朝の支度に迷わずに済みそうですね。頼もしい靴下です。","empathy"],["花と靴下の色を比べる","花の色を見るときと靴下を選ぶときでは、色の役割も違うんですね。","reflection"],["地味な頼もしさを味わう","「かなり頼もしい買い物」という言い方が好きです。地味なものにも、ちゃんと自慢できるところがありますね。","reflection"]],"dynamic":true},{"night":91,"who":"terminal","subject":"半分だけの買い物","body":"こんばんは。\n\n買い物のメモに四つ書いて出かけたのですが、二つしか買わずに帰りました。売り切れていたのではなく、途中で別の日でもいいと思ったのです。\n\n帰り道がいつもより短く感じました。持ち帰った袋が軽かったせいかもしれません。\n\n残った二つは、メモの端に書いたままです。忘れないためのメモですが、今日買わなくてもいいと決めた記録にもなりました。","choices":[["軽い袋の帰り道を受け取る","買うものを減らして帰る日もあるんですね。軽い袋の帰り道が印象に残りました。","empathy"],["メモの新しい役目を見る","メモは忘れないためだけでなく、先送りにするものを残す道具にもなるんですね。","reflection"],["買わなかったものを残す","残った二つは、また別の日の予定ですね。今日の買い物には、今日の終わり方があったんだと思います。","reflection"]],"dynamic":true},{"night":91,"who":"triangle","subject":"消しゴムの角","body":"こんばんは。\n\nノートに図を描いていたら、消しゴムの角が丸くなっていました。細い線を消しにくくなったので、まだ使っていない面を探しました。\n\n四角いものなのに、使っているうちに角が減っていくんですね。考えれば当然ですが、今日になって急に面白く感じました。\n\n新しい消しゴムを買うつもりです。でも、この丸いほうも、まだしばらく机に置いておこうと思います。","choices":[["丸くなった角を見つめる","四角いものが少しずつ丸くなる、たしかに面白い観察ですね。","empathy"],["使った時間の跡に触れる","何度も線を消すうちに、消しゴムの角が丸くなったんですね。新しい消しゴムを買っても、古いほうを置いておきたくなる気持ちが伝わります。","reflection"],["古い消しゴムの出番を考える","細い線を消せなくなっても、別の役目があるかもしれませんね。まずは机の上で待機でしょうか。","reflection"]],"dynamic":true},{"night":91,"who":"fridge","subject":"冷たいご飯の相談","body":"こんばんは。\n\n家に帰ってから、冷蔵庫に少しだけ残っていたご飯を見つけました。温めようか、そのままお茶漬けにしようか、しばらく迷いました。\n\n迷っている時間がいちばん長かったかもしれません。結局、温めて梅干しを一つのせました。\n\n人に出す料理の手順は考えられるのに、自分の夕食になると急に決められなくなることがあります。今日は梅干しが決め手になりました。","choices":[["梅干しの決定を受け取る","夕食の決め手が梅干し一つ、というのがいいですね。温かいご飯が待っていましたね。","empathy"],["自分の献立の迷いを考える","仕事の料理と自分の夕食では、迷い方が違うのかもしれませんね。","reflection"],["小さな結論に笑う","ずいぶん長い相談の末に梅干しが選ばれたんですね。小さくても立派な結論です。","reflection"]],"dynamic":true},{"night":91,"who":"anon","subject":"開けたままの引き出し","body":"こんばんは。\n\n机の引き出しを整理していたら、探していたものとは違う紙が出てきました。何も書かれていない、小さな紙です。\n\n捨てようとして、少し考えて、また引き出しに戻しました。書くことがないから白いままなのか、まだ書かなくていいから白いままなのかは、わかりません。\n\n片づけは終わりました。引き出しだけ、少し開いたままにしています。","choices":[["白い紙をそのまま受け取る","何も書いていない紙も、そこに置いておきたい日があるんですね。","empathy"],["少し開いた引き出しを見る","片づけは終わったのに、引き出しだけ少し開いている。その景色が残ります。","reflection"],["書かない時間を尊重する","書くかどうかは、明日考えてもよさそうです。今日は白い紙を戻したことだけで十分ですね。","reflection"]],"dynamic":true},{"night":92,"who":"cat","subject":"夕方の椅子","body":"こんばんは。\n\n部屋の椅子を、窓のほうへ少し動かしました。外を眺めたかったわけではなく、床を掃除するのに邪魔だったからです。\n\n掃除が終わっても戻すのを忘れて、そのまま夕方になりました。座ってみると、いつもは見えなかった建物の屋根が見えました。\n\n明日は椅子を元の場所に戻すかもしれません。戻さなかったら、それも少し面白いと思います。","choices":[["椅子から見えた景色を受け取る","掃除のついでに、別の眺めが見つかったんですね。椅子の位置一つで景色が変わるんだなあ。","empathy"],["新しい屋根に関心を寄せる","どんな屋根が見えたんでしょう。明日の椅子の向きも気になります。","reflection"],["明日の位置を決めない","元に戻しても戻さなくても、どちらも普通の明日ですね。今夜はその夕方の景色をいただきました。","reflection"]],"dynamic":true},{"night":92,"who":"bread","subject":"明日の焼き上がり表","body":"こんばんは。\n\n明日の焼き上がりの予定を書き終えました。数字を確認して、最後に小さな丸を一つ描きました。合図でも記号でもなく、ただ丸を描きたくなっただけです。\n\n同僚に見せたら「その丸は何ですか」と聞かれました。思わず「明日の分の元気です」と答えてしまいました。\n\nそう言った以上、明日は少し元気に働きたいところです。でも、丸はまだ一つだけなので、ほどほどにしておきます。","choices":[["元気の丸一つを受け取る","明日の分の元気が丸一つ、かわいい単位ですね。ほどほどなのもいいと思います。","empathy"],["同僚との会話を思い返す","予定表に描いた小さな丸が、同僚との会話になったんですね。","reflection"],["ほどほどの明日を応援する","丸を一つ描いただけで、明日の焼き上がりが少し楽しみになりますね。無理のない一日になりますように。","reflection"]],"dynamic":true},{"night":92,"who":"fish","subject":"次の返却日","body":"こんばんは。\n\n図書館の本に挟まっていた返却日の紙を、手帳に写しました。数字だけ書けばいいのに、曜日も一緒に書いてしまいました。\n\nその曜日には、きっと本以外のこともあるはずです。洗濯物が乾いたり、友人から連絡が来たり、ただ眠かったり。\n\n今日の私は、まだその日のことを知りません。でも、予定が一つあるだけで、知らない日にも少し形ができる気がします。","choices":[["返却日の輪郭を受け取る","返却日ひとつで、まだ知らない日の輪郭ができるんですね。","empathy"],["知らない曜日を思い描く","本のこと以外にも何があるか、まだわからない曜日ですね。その感じがいいです。","reflection"],["曜日も書いた理由に触れる","数字だけでなく曜日を書きたくなったのが印象的です。次の返却日が穏やかな日だといいですね。","reflection"]],"dynamic":true},{"night":92,"who":"moon","subject":"来週の月面委員会","body":"こんばんは。月面委員会から次回予告です。\n\n来週の議題は「雲に隠れた月は欠勤扱いになるのか」です。欠勤なら有給休暇を申請できるはずですが、雲のせいで見えないだけなら、勤務実態はあるとも言えます。\n\n家族からは「月本人に聞いたら」と言われました。もっともな意見です。ただ、現在、月の連絡先が不明です。\n\n次回の議事録をどこかに出す予定はありませんが、ひとりで考えておきます。","choices":[["月への連絡方法を考える","月本人の連絡先が見つからないとは、大きな問題ですね。委員会の調査に期待しています。","empathy"],["欠勤か有給かを検討する","雲の陰にいるだけなら、月はまだ勤務中かもしれません。欠勤と有給の線引き、委員会でも意見が分かれそうですね。","reflection"],["非公開の委員会を楽しむ","議事録を公開しなくても、会議は開けるんですね。来週も月面は忙しそうです。","reflection"]],"dynamic":true},{"night":92,"who":"driver","subject":"明日のポケット","body":"こんばんは。仕事から戻って、上着のポケットを空にしました。\n\nレシートが一枚、使いかけのメモが一枚、それから小さな飴が一つ。飴は休憩のときに食べようと思って忘れたものです。\n\n明日は上着を替えるので、飴だけ新しいポケットに入れました。たぶん明日も、休憩中に忘れてしまう気がします。\n\n忘れたら、次の日の自分に引き継ぎます。猫主任には報告不要の案件です。","choices":[["ポケットの引き継ぎを受け取る","ポケットの中にも、翌日へ引き継ぐ仕事があるんですね。飴の担当者はご本人だけです。","empathy"],["小さな持ち物を眺める","レシートとメモと飴。帰ってきた日の小さな記録みたいですね。","reflection"],["飴の行方を気にかける","明日は休憩中に飴を思い出せるでしょうか。主任への報告が不要で何よりです。","reflection"]],"dynamic":true},{"night":92,"who":"sugar","subject":"朝のカップ","body":"こんばんは。\n\n明日の朝に使おうと思って、カップを一つ洗って伏せておきました。特別なカップではありません。持ち手のところに、少しだけ色がついています。\n\n洗ったあとに気づいたのですが、まだ明日の飲み物を決めていませんでした。コーヒーかもしれないし、お茶かもしれません。\n\n何を入れるか決まっていないカップが、台所にある。今日はそれがちょっと楽しく思えました。","choices":[["準備したカップを受け取る","何が入るかわからないカップを用意しておく、というのがいいですね。","empathy"],["持ち手の色に目を向ける","持ち手の小さな色まで覚えているんですね。明日の飲み物は、何になるでしょう。","reflection"],["明日の飲み物を委ねる","先にカップだけ決める日があってもいいですね。朝になったら、おいしいほうを選んでください。","reflection"]],"dynamic":true},{"night":92,"who":"clock","subject":"まだ巻いていない時計","body":"こんばんは。\n\n夜、机に置いてある小さな時計を見ました。そろそろねじを巻こうと思ったのですが、今日はそのままにしておきました。\n\n止まったわけではありません。明日の朝でも間に合うと思っただけです。\n\n以前は、思いついたときにすぐ手を動かしていた気がします。今は、一晩待ってもかまわないことが少し増えました。明日の朝、忘れずに巻こうと思います。","choices":[["明日でも間に合う時間を受け取る","明日の朝で間に合うことも、あるんですね。時計のねじが待っていてくれそうです。","empathy"],["止まらない時計に触れる","止まっていない時計を、そのまま置く夜。慌てずに決めた時間が伝わります。","reflection"],["朝への約束を残す","明日の朝にねじを巻くつもりで、今日は時計をそのまま置いたんですね。一晩待てることが増えた、その変化も心に残りました。","reflection"]],"dynamic":true},{"night":92,"who":"umbrella","subject":"名札のない鉢","body":"こんばんは。\n\n窓辺の小さな鉢の名前を書こうとして、札を一枚切りました。でも、何を書くか決めきれずに、白いまま差してあります。\n\n植物にはもちろん名前があります。ただ、札に何を書いたら、自分が一番わかりやすいのか迷ったのです。\n\n明日には学名を書くかもしれないし、自分だけの呼び名を書くかもしれません。今日は、白い札も悪くないと思っています。","choices":[["白い名札を受け取る","白い札があるだけで、これから名前を考える楽しみが生まれますね。","empathy"],["名前と呼び名の違いを見る","植物の名前と、自分が呼びたい名前は、必ずしも同じではないんですね。","reflection"],["明日に書く言葉を待つ","明日の札には何が書かれるのでしょう。今夜は白いままで、よさそうです。","reflection"]],"dynamic":true},{"night":92,"who":"terminal","subject":"新しい紙袋","body":"こんばんは。\n\n明日のために、小さな紙袋を玄関に置きました。中身はまだありません。朝、寄り道をしたくなったら使うつもりです。\n\n袋があると、何かを入れて帰らなくてはいけないような気もします。でも、使わずに持ち帰っても、それはそれでかまいません。\n\n明日どこに行くかは、朝になってから決めます。駅へ向かうかどうかも、今は決めていません。","choices":[["空の紙袋を受け取る","空の紙袋だけが、明日の予定なんですね。それもいいと思います。","empathy"],["使わない自由を考える","使っても使わなくてもいい袋、少し自由な持ち物ですね。","reflection"],["明日の行き先を決めない","駅へ向かう日も、別の道へ行く日もあるでしょう。明日の朝に決める余白が残っていますね。","reflection"]],"dynamic":true},{"night":92,"who":"triangle","subject":"空欄のままの予定","body":"こんばんは。\n\n明日の予定表に、何も書いていない枠が一つあります。埋め忘れたわけではなく、あとで何かしたくなったときのために空けてあります。\n\n友人には「予定がないのも予定だね」と言われました。そう言われると、その枠にも名前をつけたくなりますが、名前をつけたら空欄じゃなくなるんですよね。\n\nとりあえず、定規で四角をきれいに引き直しました。中身は明日の自分に任せます。","choices":[["空欄の四角を受け取る","空欄を大切にするために、枠だけきれいに引く。三角定規さんらしいですね。","empathy"],["名前のない予定を楽しむ","「予定がないのも予定」と名前をつけると、空欄ではなくなるんですね。四角だけを描き直したところが、なんだかいいです。","reflection"],["明日の自分に任せる","四角の中身は明日の自分へ。何が入ってもいいし、何も入らなくてもいいですね。","reflection"]],"dynamic":true},{"night":92,"who":"fridge","subject":"洗っておいた箸","body":"こんばんは。\n\n食事のあと、箸を一膳だけ洗って、いつもより見えるところに置きました。明日使うためです。\n\n料理の段取りなら、材料や時間から考えます。でも、自分の食事は、箸から始めてもいいのかもしれません。\n\n明日何を食べるかは、まだ決まっていません。温かいものがよければ温かいものを。簡単なものがよければ簡単なものを。そういう予定にしてあります。","choices":[["洗った箸を受け取る","箸を一膳用意するところから、明日の食事が始まるんですね。","empathy"],["決めない献立に寄り添う","食べるものを決めない予定、いいですね。明日の自分に合わせられそうです。","reflection"],["自分のための段取りを認める","ちゃんと自分の箸を洗って置く。その小さな段取りが、やさしい時間に聞こえます。","reflection"]],"dynamic":true},{"night":92,"who":"anon","subject":"明日の余白","body":"こんばんは。\n\n手帳を閉じる前に、明日の欄を少し見ました。書いてあるのは、時間だけです。\n\n何の時間なのか、ここには書かないことにします。大切な約束でも、気の進まない用事でも、ありません。ただ、明日の自分がその時刻に何をしているか、少し気になりました。\n\n欄の下は、まだ白いままです。書くことができたら、書きます。","choices":[["書かない欄を受け取る","書いていないところまで含めて、一日の予定なんですね。","empathy"],["時刻だけの予定を眺める","明日の時刻だけが残っている。その下の白い欄が印象的です。","reflection"],["白いままの明日を残す","書くことができたら書く。それで十分だと思います。明日の時間は、まだこれからです。","reflection"]],"dynamic":true}];
const CH4_INDEX=new Map(CH4_CONTENT.map(x=>[`${x.night}:${x.who}`,x]));
const CH4_PEOPLE=['cat','clock','bread','moon','driver','fish','sugar','anon','terminal','umbrella','triangle','fridge'];
function createChapter4State(fromNight=79){return {schema:1,fromNight,planned:[],queue:[],sent:[],dynamicSelected:[],finished:false}}
function migrateChapter4(data){
 if(data.chapter4&&typeof data.chapter4==='object'){
  const old=data.chapter4,c={...createChapter4State(),...old};
  for(const k of ['planned','queue','sent','dynamicSelected'])c[k]=Array.isArray(c[k])?c[k]:[];
  data.chapter4=c;return;
 }
 const n=Math.max(1,Number(data.night)||1);
 const hasNight=Boolean(data.letterSets?.[n])||!['intro','prepare'].includes(data.phase);
 // 途中の準備済みの夜は絶対に変更せず、翌夜以降にのみ章を追加する。
 const start=n<=79? (n===79&&hasNight?80:79):n+(hasNight?1:0);
 data.chapter4=createChapter4State(start);
 data.chapter4.finished=n>92;
}
function chapter4IsNight(n=s.night){return n>=79&&n<=92&&n>=s.chapter4?.fromNight}
function chapter4ChooseDynamic(n){
 const excluded=new Set(s.chapter4.dynamicSelected);
 const pool=CH4_PEOPLE.filter(who=>!excluded.has(who));
 const prior=(s.played||[]).filter(p=>p.night<n&&CH4_PEOPLE.includes(p.who));
 const stats=pool.map(who=>{const hist=prior.filter(p=>p.who===who);return {who,count:hist.length,last:hist.length?Math.max(...hist.map(p=>p.night)):-1,tie:simHash(`ch4:rank:${n}:${who}`)%100000}});
 const quiet=stats.slice().sort((a,b)=>a.last-b.last||a.count-b.count||a.tie-b.tie||a.who.localeCompare(b.who))[0];
 const familiar=stats.filter(x=>x.who!==quiet?.who).sort((a,b)=>b.count-a.count||b.last-a.last||a.tie-b.tie||a.who.localeCompare(b.who))[0];
 const selected=[quiet?.who,familiar?.who].filter(Boolean);
 s.chapter4.dynamicSelected.push(...selected);
 return selected;
}
function chapter4PlanNight(n){
 const c=s.chapter4;if(!c||!chapter4IsNight(n)||c.planned.includes(n))return;
 const whoList=n<=90?CH4_CONTENT.filter(x=>x.night===n&&!x.dynamic).map(x=>x.who):chapter4ChooseDynamic(n);
 for(const who of whoList){if(CH4_INDEX.has(`${n}:${who}`))c.queue.push({night:n,who})}
 c.planned.push(n);
}
function chapter4Letters(n){
 // 特別放送の既存の投稿を優先し、章の便箋は後日まで順序を保って保留する。
 chapter4PlanNight(n);
 if(s.special&&specialActive(n))return specialCreateLetters(n);
 const normal=createRegularLetters(n),c=s.chapter4;
 if(!c||!c.queue.length||n<c.fromNight)return normal;
 const send=c.queue.slice(0,2),ids=[];
 for(const {night,who} of send){
  const d=CH4_INDEX.get(`${night}:${who}`);if(!d)continue;
  const id=`chapter4_${night}_${who}`;
  s.regular.letterArchive[id]={...d,id,regular:true,chapter4:true,special:false,kind:'chapter4',tag:`ch4:${night}:${who}`,choices:d.choices.map(row=>[...row])};
  ids.push(id);
 }
 // 通常便箋の居場所を保証し、同じ差出人の連続便箋を防止する。
 const craftedWho=new Set(send.map(x=>x.who));
 const keep=normal.filter(id=>!craftedWho.has(s.regular.letterArchive[id]?.who)).slice(0,Math.max(3,8-ids.length));
 // 使用しなかった自律投稿の下書きを、届けた履歴に残さない。
 for(const id of normal)if(!keep.includes(id))delete s.regular.letterArchive[id];
 c.queue.splice(0,send.length);c.sent.push(...send.map(x=>({...x,deliveredNight:n})));
 return [...ids,...keep];
}
