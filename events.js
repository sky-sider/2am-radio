function log(type,message){s.logs.push({night:s.night,type,message})}
function event(message){s.events.push({night:s.night,message})}
function affect(id,changes){const o=s.listeners[id];if(!o)return;for(const [k,v] of Object.entries(changes))if(typeof o[k]==='number')o[k]=clamp(o[k]+v)}
function remember(id,mem){let a=s.listeners[id]?.memories;if(a&&!a.includes(mem))a.push(mem)}
function applyReply(l,choice,assembled){let id=l.who;if(!s.listeners[id])s.listeners[id]={trust:25,reflection:40,agency:40,stress:35,memories:[],known:false};s.listeners[id].known=true;affect(id,{trust:1});if(l.id==='cat1'){s.flags.catRead=true;s.flags.catReply=choice;remember('cat','退職についてラジオに相談した');const e={empathy:{trust:2,reflection:1},reflection:{reflection:3,agency:1},caution:{stress:-5,reflection:1},agency:{agency:3,trust:1}};affect('cat',e[choice]||{})}if(l.id==='clock1'){s.flags.clockRead=true;s.flags.clockPast=choice==='past';remember('clock','止まった時計の話をした');if(choice==='past')affect('clock',{trust:3,reflection:2})}if(l.id==='moon1'&&choice==='question')s.flags.moonQuestion=true;if(l.id==='driver2')s.flags.driverRead=true;if(l.id==='fish3'){s.flags.fishRead=true;s.flags.fishParts=[...s.replyParts];remember('fish','笑ってしまう癖について初めて相談した');const impacts={};s.replyParts.forEach((ix,k)=>{let e=fishParts[k].options[ix][2];for(let [a,v] of Object.entries(e))impacts[a]=(impacts[a]||0)+v});affect('fish',{trust:impacts.trust||0,reflection:(impacts.reflection||0)*2,agency:(impacts.agency||0)*2,stress:-(impacts.comfort||0)*2});s.flags.fishImpact=impacts}if(l.id==='clock2'){s.flags.clockWifeKnown=true;remember('clock','妻が買った時計について話した')}if(l.id==='clock3'&&s.flags.clockWifeKnown)remember('clock','散歩で見つけた花について話した');if(l.id==='bread1')remember('bread','くるみと蜂蜜のパンが売り切れた');if(l.id==='driver2')remember('driver','配送先の猫を「主任」と呼んでいる');if(l.id==='fish3')s.flags.fishRead=true;if(l.id==='cat2'||l.id==='cat2unread')remember('cat','上司に仕事の相談をした');if(l.id==='driver3'||l.id==='driver3first')remember('driver','猫主任が車の前で寝ていた');if(l.id==='bread3')remember('bread','新しいパンの試作に失敗した');if(l.id==='clock2generic')remember('clock','朝の散歩で時計の音を聞いた');if(l.id==='moon2'||l.id==='moon3')remember('moon','秘密の隠し場所について考えた');if(choice==='empathy')affect(id,{trust:2});if(choice==='agency')affect(id,{agency:2});if(choice==='reflection')affect(id,{reflection:2});if(choice==='humor')affect(id,{trust:1,stress:-2});if(choice==='curiosity'||choice==='followup'||choice==='past')affect(id,{trust:1,reflection:1});extendedApplyReply(l,choice,assembled);regularReplyRecorded(l,choice);chapter3ReplyRecorded(l,choice);socialVisibleClue(l);simReplyImpact(id,choice,assembled,l.id);s.guidance.seen.reply=true;s.played.push({id:l.id,who:id,subject:l.subject,body:l.body,response:assembled,night:s.night});log('放送',`${NAMES[id]}「${l.subject}」に返答した。`);s.cursor++;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.phase='broadcast';save();render()}
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
  log('オープニング',opening[s.opening]);
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

function socialLetterFor(ev,who,day){
 const desc=SOCIAL_LETTER_TEXT[ev.pair]?.[who];if(!desc)return null;
 const relation=s.socialWorld.pairs[ev.pair];const my=relation.perspectives[who];
 const personal=ev.views?.[who]||ev.outcome;
 const close=personal==='warm'?'今日はちょっと、いい気分で帰りました。':personal==='awkward'?'悪いことがあったわけではないのですが、少し気まずさが残りました。':ev.outcome==='guarded'?'もう少し話してもよかった気がします。':'何でもないことなのに、帰り道で思い出しました。';
 // 本人の観測と主観のみ。相手のラジオネーム・本名・知らない気持ちは記さない。
 const opener=day>=ev.night+2?desc.intro.replace('昨夜','先日の夜').replace('昨日','先日'):desc.intro;
 return {who,subject:desc.subject,body:'こんばんは。\n\n'+opener+'\n\n'+(desc[ev.action]||desc.talk)+'\n\n'+close,
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
 const item=(meta.milestones||[]).find(x=>x.night>meta.lastArcMailNight&&x.night<n);
 if(!item)return null;
 const paragraphs={
  umbrella:'店を続けていると、花を手渡す時間は好きなのに、自分の休みをうまく作れないことがあります。今は'+item.summary+'。\n\n花屋を続けるかどうかではなく、続け方を少し考える夜です。',
  triangle:'将来の夢は相変わらず一つに決まっていません。最近は'+item.summary+'。\n\n友達の答えと、自分の答えが違ってもいいのか、考えています。',
  fridge:'料理の仕事をしていると、一日の終わりがわからなくなることがあります。最近は'+item.summary+'。\n\n仕事が好きだという気持ちは、そのまま持っていたいです。'
 };
 return {subject:{umbrella:'花屋を続ける時間',triangle:'まだ決めていない答え',fridge:'火を消したあとの時間'}[id],body:regularFirstSentence(id,n)+'\n\n'+paragraphs[id],kind:'new-arc',tag:`new-arc-${item.night}`};
}
function newListenerPersonalNote(id,n){
 const day=regularDayAction(id,n);if(!day)return null;
 const me=SIM_PROFILES[id],action=me.actions.find(a=>a[0]===day.actionId),subject={umbrella:'花屋の小さな話',triangle:'ノートの端の話',fridge:'仕事が終わってから'}[id];
 const tails={
  umbrella:['花のことを知っているつもりでも、毎日知らないことに出会います。','店の外にも暮らしがある、と最近少し思います。','誰かのための花を選びながら、自分の帰り道のことも考えています。'],
  triangle:['ひとつ決めるたびに、別のことも気になってしまうんです。','今はまだ答えを一つにしなくてもいい気がします。','先生に聞けば簡単なのかもしれないけれど、しばらく自分で考えたいです。'],
  fridge:['厨房とは別に、自分の夜がちゃんとあると思いたいです。','仕事に慣れていても、自分の暮らしはまだ練習中です。','家では誰にも採点されないから、少し気楽です。']
 };
 const tail=tails[id][simHash(`new:tail:${id}:${n}`)%3];
 return {subject,body:regularFirstSentence(id,n)+'\n\n'+day.activity.replace(/。+$/,'')+'。\n\n'+tail,kind:'new-life',tag:`new-life-${day.actionId}`};
}
function newListenerCompose(id,n){
 const arc=newListenerArcNote(id,n);
 const recent=(s.regular?.mailHistory||[]).filter(x=>x.who===id&&x.night>=n-7);
 if(arc&&!recent.some(x=>x.tag===arc.tag))return arc;
 const candidates=[newListenerPersonalNote(id,n),regularContact(id,n),regularBroadcastEcho(id,n),regularThemeLetter(id,n),radioCultureCompose(id,n),radioVarietyCompose38(id,n),radioMemoryCompose39(id,n)].filter(Boolean);
 const weighted=candidates.map(x=>({...x,weight:({contact:83,'new-life':76,broadcast:55,theme:45,culture:115,variety:92,'radio-memory':128})[x.kind]||45}));
 for(const item of weighted){
  if(recent.some(x=>x.tag===item.tag))item.weight-=60;
  if(recent.some(x=>x.kind===item.kind))item.weight-=13;
  item.weight+=simHash(`new:pick:${id}:${n}:${item.tag}`)%15;
 }
 weighted.sort((a,b)=>b.weight-a.weight);
 const selected=weighted[0]||regularThemeLetter(id,n);
 if(selected.kind==='culture'){s.radioCulture.draftNight=n;s.radioCulture.draftUsed=true;}
 if(selected.kind==='radio-memory'){s.radioMemory.draftNight=n;s.radioMemory.draftUsed=true;}
 return selected;
}
function newListenerOnLettersDelivered(n,ids){
 for(const id of REGULAR_NEW){
  const intro=`regular_${n}_${id}`;
  const entry=s.newListeners?.entries?.[id];if(!entry)continue;
  if(ids.includes(intro)){
   if(!entry.firstSentNight)entry.firstSentNight=n;
   const l=s.regular?.letterArchive?.[intro];
   if(l?.kind==='new-arc')entry.lastArcMailNight=n;
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
function quietReturnNote(id,n){
 const q=s.quiet?.active?.[id];if(!q||n<=q.endNight)return null;
 const voices=QUIET_RETURN_VOICES_34[id]||QUIET_RETURN_VOICES_34.cat;
 const start=voices[simHash(`quiet34:return:${id}:${q.startNight}`)%voices.length];
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
 const fact=again?.activity?'\n\n昨日は、'+again.activity.replace(/。+$/,'')+'。':'';
 return {subject:'久しぶりのお便り',kind:'return',tag:`return-${q.startNight}`,
  body:start+fact+'\n\n'+suffix,absenceReturn:true,voiceVersion:34};
}
// 便箋が最終的に夜の投函箱へ届いた場合にだけ、実際の帰還として確定する。
function quietConfirmDelivered(n,ids){
 const q=s.quiet;if(!q)return;
 for(const uid of ids){
  const letter=s.regular?.letterArchive?.[uid];if(!letter?.absenceReturn)continue;
  const id=letter.who,active=q.active[id];
  if(!active||n<=active.endNight)continue;
  q.history.push({who:id,...active,returnedNight:n,returnLetterId:uid});
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
   }else if(!meta){topic=radioCultureIdentify(x)}
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
  body=regularFirstSentence(id,n)+'\n\n先日の放送で、'+NAMES[x.sourceWho]+'さんの'+t.intro+'を聴きました。'
   +'\n\n'+t.responses[id]+'\n\nラジオ越しなので直接話したわけではありませんが、少し書いてみたくなりました。';
 }else{
  subject='先日の放送のお返事に';
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
 flower:'店先の花についての話でした。誰かが毎日少しずつ景色を整えていると思うと、いつもの道も違って見える気がします。',
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
   if(note?.kind==='culture'||note?.kind==='radio-memory')return null; // 回想の無限連鎖を防止
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
 const line=own?'放送で自分の言葉を聞いた夜のことを、今日ふと思い出しました。':'あの夜、たしかにこの耳で聴いた話です。';
 let body=regularFirstSentence(id,n)+'\n\n'+origin+'「'+x.subject+'」というお便りを覚えています。'+
  '\n\n'+line+'\n\n'+RADIO_MEMORY_THEMES39[x.topic];
 const day=regularDayAction(id,n);
 if(day&&(RADIO_MEMORY_ACTIONS39[x.topic]?.[id]||[]).includes(day.actionId)){
  body+='\n\n昨日は、'+String(day.activity||'').replace(/[。！!]+$/,'')+'。そのとき、あの放送がふと戻ってきました。';
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

function createRegularState(){return {schema:1,started:false,letterArchive:{},processedNights:[],latestThemes:{},lastMailed:{},mailHistory:[],varietyHistory:[],routeActions:[],phase:'between_chapters'}}
function migrateRegular(data){
 const base=createRegularState(),old=data.regular&&typeof data.regular==='object'?data.regular:{};
 const r={...base,...old};
 r.letterArchive=old.letterArchive&&typeof old.letterArchive==='object'?old.letterArchive:{};
 r.processedNights=Array.isArray(old.processedNights)?[...new Set(old.processedNights.filter(n=>Number.isInteger(n)&&n>=15))]:[];
 r.latestThemes=old.latestThemes||{};r.lastMailed=old.lastMailed||{};
 r.mailHistory=Array.isArray(old.mailHistory)?old.mailHistory.slice(-120):[];
 r.varietyHistory=Array.isArray(old.varietyHistory)?old.varietyHistory.filter(x=>x&&typeof x==='object'&&Number.isInteger(x.night)).slice(-180):[];
 r.routeActions=Array.isArray(old.routeActions)?old.routeActions.slice(-120):[];
 r.started=Boolean(old.started||data.night>=15);
 data.regular=r;return data;
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
 return `通常放送 · ${regularTheme(n)[0]}`;
}
function regularFirstSentence(id,n){const a=REGULAR_INTROS[id]||REGULAR_INTROS.anon;return a[simHash(`reg:intro:${n}:${id}`)%a.length]}
function regularDayAction(id,n){return s.simState?.people?.[id]?.daily?.find(d=>d.night===n-1)||null}
function regularRoute(id,n){
 const outcome=s.lifePaths?.outcomes?.[id];const pool=REGULAR_ROUTES[id]?.[outcome?.route];
 if(!pool)return null;
 const ix=simHash(`reg:route:${n}:${id}:${outcome.route}`)%pool.length;
 const [subject,body,ending]=pool[ix];
 return {subject,body:regularFirstSentence(id,n)+'\n\n'+body+'\n\n'+ending,kind:'route',tag:`route-${outcome.route}-${ix}`};
}
function regularDayNote(id,n){
 const yesterday=regularDayAction(id,n);if(!yesterday)return null;
 const action=SIM_PROFILES[id]?.actions.find(a=>a[0]===yesterday.actionId);
 if(!action)return null;
 const subject={creative:'今日の机の上',rest:'休んだ日の話',social:'短い会話',duty:'いつもの用事',reflection:'まだ考えていること'}[yesterday.category]||'小さな近況';
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
  fridge:['自分の夕飯のことも考えたくなる日でした。','包丁を置いたあとに考えることもあるんですね。']
 };
 const thoughts=personalThought[id]||narr;
 return {subject,kind:'daily',tag:`daily-${yesterday.actionId}`,body:regularFirstSentence(id,n)+'\n\n'+yesterday.activity+(yesterday.activity.endsWith('。')?'':'。')+'\n\n'+thoughts[simHash(`reg:thought:${n}:${id}`)%thoughts.length]};
}
function regularContact(id,n){
 const person=s.simState?.people?.[id];if(!person)return null;
 const entries=Object.entries(person.relationships||{}).flatMap(([key,r])=>(r.history||[])
   .filter(h=>h.night===n-1&&h.outcome)
   .map(h=>({key,rel:r,h})));
 if(!entries.length)return null;
 const picked=entries[simHash(`reg:contact:${id}:${n}`)%entries.length];
 const outcome=picked.h.outcome;
 const variant={
  warm:'思っていたより自然に話せました。帰り道まで、その声が少し残っています。',
  ordinary:'いつもどおりの会話でした。でも、その「いつも」が今日は少しありがたかったです。',
  guarded:'話してから、まだ言えていないことがあると気づきました。次に言えるかはわかりません。',
  awkward:'気まずいまま別れました。話す前より気になることが増えた気もします。'
 };
 const msg=variant[outcome]||'短い会話でしたが、帰宅してから思い出しました。';
 const subject='話したあとのこと';
 return {subject,kind:'contact',tag:`contact-${picked.key}-${outcome}`,body:regularFirstSentence(id,n)+'\n\n昨日、'+picked.rel.name+'と話しました。'+msg+'\n\nすぐに結論を出さず、もう少しこのままにしておきます。'};
}
function regularBroadcastEcho(id,n){
 // 「聴いた」は実際に聴取者として記録された放送にだけ使用する。
 if(!(s.radioCulture?.audience?.[n-1]||[]).includes(id))return null;
 const heard=s.played.filter(x=>x.night===n-1);
 if(!heard.length)return null;
 const item=heard[simHash(`reg:heard:${id}:${n}`)%heard.length];
 if(item.who===id)return {subject:'昨日の放送から',kind:'broadcast',tag:'echo-self',body:regularFirstSentence(id,n)+'\n\n昨日、自分のお便りを読んでもらいました。答えが出たわけではありませんが、言葉にしてよかったと思います。\n\n今日もいつもどおりの一日を過ごしています。'};
 return {subject:'昨日の声',kind:'broadcast',tag:`echo-${item.who}`,
  body:regularFirstSentence(id,n)+'\n\n昨日、'+(NAMES[item.who]||'あるリスナー')+'さんのお便りを聴きました。\n\n「'+item.subject+'」という話が、なぜか今日まで頭に残っています。話したことのない人なのに、少しだけ隣にいる気がしました。\n\n自分の暮らしにも、似たような瞬間があるのかもしれません。'};
}
function regularThemeLetter(id,n){
 const theme=regularTheme(n),p=s.simState?.people?.[id];
 const action=regularDayAction(id,n),extras=action?`\n\nちなみに昨日は、${action.activity}。`:' ';
 const endings={
  cat:'慌ただしい毎日ですが、こんなことを考える余裕も残しておきたいです。',
  driver:'夜の道路で一人になると、変な考えが浮かぶんですよね。',
  fish:'日記にも書いてみようと思います。',clock:'歳をとっても知らないことは多いものですね。',
  terminal:'答えは、今のところありません。',bread:'パンとは関係ありませんが、こういう話も好きです。',
  moon:'なお、これが正しいかどうかは月に聞いてください。',anon:'聴いているだけの日も多いですが、今日は送ってみました。',sugar:'コーヒーが冷める前に、このへんで。',
  umbrella:'花を並べながら、そんなことを考えました。',triangle:'まだまだ知らないことばかりです。',fridge:'厨房以外のことも考える夜でした。'
 };
 return {subject:theme[0]+'のこと',kind:'theme',tag:`theme-${(n-15)%REGULAR_THEMES.length}`,
  body:regularFirstSentence(id,n)+'\n\n今夜のテーマは「'+theme[0]+'」だそうですね。'+theme[1]+'について考えていたら、自分の今日と昨日を思い出しました。'+extras+'\n\n'+(endings[id]||'またお便りします。')};
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
 ['memory_bell','memory','学校の鐘','子どものころ、学校の鐘が鳴るのを待っていた日がありました。\n\nあのころは一分が長く感じましたが、今は一年が驚くほど早い。それでも、おいしいお茶を待つ時間は長く感じるものです。',[['時間の感覚に共感','同じ一分でも、待っているものによって長さが違いますね。','reflection'],['昔の様子を聞く','学校の鐘が鳴ったあとは、何をするのが楽しみでしたか。','curiosity'],['記憶を大切に','鐘を待った時間まで覚えているなんて、素敵な記憶ですね。','empathy'],['少し笑う','お茶を待つ一分には、今でも勝てない時計がありそうです。','humor']]],
 ['odd_watch','oddity','時計の休日','時計にも休日があったら、針は何をするでしょうか。\n\n店を閉めてからそんなことを考えます。たぶん私より上手に休むのでしょう。こちらはまだ練習中です。',[['空想に乗る','針が伸びをする休日、少し見てみたいですね。','wonder'],['休息を受け取る','長く働いてきた道具にも、人にも、休む時間がありますね。','empathy'],['休日を尋ねる','ご自身にとって、よい休日はどんな日でしょう。','curiosity'],['冗談を返す','時計の針が休んだら、遅刻を知らせる役は困ってしまいますね。','humor']]]
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
  if(recent.some(x=>x.cardId===key&&n-x.night<38))return false;
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
 r.varietyHistory=r.varietyHistory.filter(x=>n-x.night<=100).slice(-180);
}

function regularCompose(id,n){
 const recent=(s.regular.mailHistory||[]).filter(h=>h.who===id&&h.night>=n-5);
 const unavailable=new Set(recent.map(h=>h.tag));
 const options=[
  regularRoute(id,n),regularDayNote(id,n),regularContact(id,n),regularBroadcastEcho(id,n),regularThemeLetter(id,n),radioCultureCompose(id,n),radioVarietyCompose38(id,n),radioMemoryCompose39(id,n)
 ].filter(Boolean).map(x=>({...x,weight:({route:68,daily:65,contact:90,broadcast:54,theme:48,culture:115,variety:92,'radio-memory':128})[x.kind]||45}));
 for(const o of options){
  if(unavailable.has(o.tag))o.weight-=65;
  if(recent.some(h=>h.kind===o.kind))o.weight-=18;
  o.weight+=simHash(`reg:opt:${id}:${n}:${o.tag}`)%21;
 }
 options.sort((a,b)=>b.weight-a.weight);
 const selected=options[0]||regularThemeLetter(id,n);
 if(selected.kind==='culture'){s.radioCulture.draftNight=n;s.radioCulture.draftUsed=true;}
 if(selected.kind==='radio-memory'){s.radioMemory.draftNight=n;s.radioMemory.draftUsed=true;}
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
 moon:{daily:['月の監査部には、まだ報告していません。'],theme:['あくまで月の裏側からの非公式見解です。'],default:['異議申し立ては月明かりのある夜にどうぞ。']},
 anon:{daily:['名前を出すほどではないと思ったのですが、書いてみました。'],theme:['ふだんは聴く側なので、少し不思議な気分です。'],default:['また聴いています。']},
 sugar:{daily:['冷めたコーヒーを前に、少しだけ考えました。'],theme:['コーヒーのおかわりを入れてから、続きを考えます。'],default:['今夜もあたたかいうちに一杯。']},
 umbrella:{daily:['水を替える手を止めて、ちょっと書いています。','切り花には休みがありませんが、私には必要ですね。'],contact:['花の名前より、人の顔を覚えるほうが難しい日もあります。'],theme:['店先に立つと、季節は案外はっきり見えます。'],default:['花瓶の水を替えたら、今日は帰ります。']},
 triangle:{daily:['ノートの余白に大きな丸を付けておきました。','これも将来の役に立つかはわかりません。でも面白いです。'],contact:['そのあとで、友達にも話したくなりました。'],theme:['いまの答えを来週の自分がどう思うか、わかりません。'],default:['では、宿題に戻ります。たぶん。']},
 fridge:{daily:['厨房では片づけて帰るのに、家の台所は別問題ですね。','仕事の段取りなら得意なのに、自分の夜はうまくいきません。'],contact:['料理の話以外で誰かと話すのは、まだ少し慣れません。'],theme:['明日の仕込みの前に、こんなことを考えています。'],default:['自分用の皿も、たまには使うことにします。']}
};
function v33VoiceLetter(id,n,note){
 if(!note||!note.body||['new-intro','culture','variety','radio-memory','daily-thread'].includes(note.kind)||note.absenceReturn)return note;
 const data=LETTER_VOICE_33[id]||LETTER_VOICE_33.anon;
 const group=note.kind==='new-life'?'daily':(data[note.kind]?note.kind:'default');
 const lines=data[group]||data.default||[];
 const pick=lines.length?lines[simHash(`v33:voice:${id}:${n}:${note.tag}`)%lines.length]:'';
 let body=note.body;
 // 元の生活記録・実在した会話の記述には触れない。文末のみ語り口を加える。
 if(pick&&!body.includes(pick)&&simHash(`v33:frequency:${id}:${n}`)%100<72)body+='\n\n'+pick;
 // 同じ人が以前書いた事柄を、数夜の間隔を空けて本人が思い出す。
 // 過去の放送日誌・公開状況には決して言及しない。
 const old=(s.regular?.mailHistory||[]).filter(h=>h.who===id&&h.night<=n-5&&h.night>=n-28&&h.tag!==note.tag);
 if(old.length && simHash(`v33:remember?:${id}:${n}`)%100<24){
  const prev=old[simHash(`v33:remember:${id}:${n}`)%old.length];
  const archived=s.regular?.letterArchive?.[`regular_${prev.night}_${id}`];
  if(archived?.subject && !/^初めまして|初投稿/.test(archived.subject)){
   const title=archived.subject.replace(/[\n\r「」]/g,'').slice(0,26);
   const remembering={
    cat:`少し前に「${title}」と書きました。あの日の気持ちを、今も少し覚えています。`,
    driver:`そういえば、前に「${title}」って送りましたね。主任は忘れてると思います。`,
    fish:`前に「${title}」と書いたときとは、少し考えが違うかもしれません。`,
    clock:`以前「${title}」という便りを書きました。いま思い返すと、また違う景色です。`,
    terminal:`前に「${title}」と書いたことがあります。あれから何日か経ちました。`,
    bread:`前に「${title}」なんて書きました。あれも、たしかに私の一日でした。`,
    umbrella:`前に「${title}」と書きました。花は変わっても、気になることは残るものです。`,
    triangle:`以前「${title}」と書いたのを覚えています。あのときとは別のことも気になります。`,
    fridge:`前に「${title}」と書きました。片づいたようで、まだ続きを考えています。`
   };
   const phrase=remembering[id]||`以前「${title}」という話を書いたのを思い出しました。`;
   body+='\n\n'+phrase;
  }
 }
 return {...note,body,voiceVersion:33};
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
  const note=quietWaitingToReturn(id,n)?quietReturnNote(id,n):first?newListenerFirstLetter(id,n):dailyThreadCompose41(id,n)|| (REGULAR_NEW.includes(id)?newListenerCompose(id,n):
    id===support[(n%2)%support.length]?.id?(radioVarietyCompose38(id,n)||regularThemeLetter(id,n)):regularCompose(id,n));
  const voiced=v33VoiceLetter(id,n,note);
  const uuid=`regular_${n}_${id}`;
  const special=!['culture','variety','radio-memory','daily-thread'].includes(voiced.kind)&&n>=21&&(n-21)%7===0&&REGULAR_MAIN.includes(id)&&id===main[0]?.id;
  archive[uuid]={who:id,subject:voiced.subject,body:voiced.body,special,regular:true,kind:voiced.kind,tag:voiced.tag,voiceVersion:voiced.voiceVersion||0,absenceReturn:Boolean(voiced.absenceReturn),culture:voiced.culture||null,variety:voiced.variety||null,radioMemory:voiced.radioMemory||null,thread:voiced.thread||null,replyVersion:['variety','radio-memory','daily-thread'].includes(voiced.kind)?31:0,
   choices:(['variety','radio-memory','daily-thread'].includes(voiced.kind)?voiced.choices:REGULAR_CHOICES).map(x=>[...x])};
  // v4.0: ここでは「候補」を書いただけ。実際に届いたかは夜の最終確定時に決まる。
  ids.push(uuid);
 }
 return ids;
}
// v4.0: 途中で落選した下書きを配達済み履歴に数えない。
// 長期のお便り回想・投稿頻度・文体の続きが「実際に届いた手紙」だけに基づく。
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
 const category=(choice==='reflection'||choice==='curiosity')?'reflection':choice==='agency'?'agency':'comfort';
 if(l.special){
  const impact={};
  for(let k=0;k<3;k++){
   const ix=s.replyParts[k];if(!Number.isInteger(ix)||!REGULAR_REPLY_PARTS[k]?.options[ix])continue;
   const effects=partsForLetter(l)[k].options[ix][2];
   for(const [key,val] of Object.entries(effects))impact[key]=(impact[key]||0)+val;
  }
  affect(l.who,{trust:impact.trust||0,reflection:impact.reflection||0,agency:impact.agency||0});
  simAdjust(p.emotion,'anxiety',-(impact.comfort||0));
  simAdjust(p.emotion,'hope',Math.round((impact.agency||0)/2));
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
  s.regular.letterArchive[id]={...info,regular:true,chapter2:true,choices:(CH2_CHOICES[info.who]||REGULAR_CHOICES).map(x=>[...x])};
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
function specialActive(n=s.night){
 const plan=s.special?.planned;
 return plan&&plan.night===n&&['ready','completed'].includes(plan.status)?plan:null;
}
function specialEligible(n=s.night){
 if(n<29||s.phase!=='intro'||s.special?.planned?.status==='announced'||chapter3IsNight(n))return false;
 // 50夜目の記念放送だけは、直前に別の特別放送があっても開催を選べる。
 if(n===49&&!s.special.history.some(h=>h.themeId==='anniversary'))return true;
 if(s.special?.lastHeldNight && n-s.special.lastHeldNight<7)return false;
 return true;
}
function specialAvailable(n=s.night){
 if(!specialEligible(n))return [];
 const basic=['pride','food','words'];
 // 暮らしから生まれた提案は最大2件。通常企画も常に選べる。
 basic.unshift(...storyAvailableOffers(n).map(o=>o.themeId));
 const climate=climateForNight(n);
 if(climate?.weather==='rain')basic.push('rain');
 const seasonTheme=`season_${climate?.season}`;
 if(climate&&climate.dayInSeason<=5&&climate.dayInSeason<28&&
   !s.special.history.some(h=>h.themeId===seasonTheme&&Math.floor((h.night-1)/112)===Math.floor((n-1)/112)))basic.push(seasonTheme);
 if(n===49&&!s.special.history.some(h=>h.themeId==='anniversary'))basic.unshift('anniversary');
 return basic;
}
function specialPlan(themeId){
 if(!specialAvailable(s.night).includes(themeId))return;
 const offer=themeId.startsWith('story_')?storyOfferFor(themeId):null;
 if(themeId.startsWith('story_')&&!offer)return;
 s.special.planned={themeId,announceNight:s.night,night:s.night+1,status:'announced',submissions:[],audience:[],createdIds:[],reactions:[],storySource:offer?{offerId:offer.id,originNight:offer.originNight,sourceSubject:offer.sourceSubject,sourceWho:offer.sourceWho}:null};
 if(offer)offer.status='planned';
 save();render();
}
function specialCancel(){
 if(s.phase!=='intro'||s.special?.planned?.announceNight!==s.night||s.special.planned.status!=='announced')return;
 const offerId=s.special.planned.storySource?.offerId;
 const offer=(s.storyPrograms?.offers||[]).find(x=>x.id===offerId);
 if(offer)offer.status='open';
 s.special.planned=null;save();render();
}
function specialLifeExcerpt(id,n){
 const yesterday=regularDayAction(id,n);
 if(!yesterday||!yesterday.activity)return '';
 const verb=yesterday.activity.replace(/。+$/,'');
 return '\n\n追伸：昨日は、'+verb+'。そんな一日でした。';
}
function specialSubmitBody(themeId,id,n){
 const theme=SPECIAL_THEMES[themeId],src=theme?.letters?.[id];
 if(!src)return null;
 const outcome=s.lifePaths?.outcomes?.[id];
 let ending='';
 if(outcome&&REGULAR_MAIN.includes(id)){
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
   story='昨日、'+action.activity.replace(/。+$/,'')+'。\n\n'+endings[id];
  }else{
   story='このお便りを書いて、送るところまでできました。普段は聴いているだけの日も多いので、それを今夜の小さな自慢にします。';
  }
 }
 if(CLIMATE_SPECIAL_INFO[themeId]){
  const actual=regularDayAction(id,n);
  if(actual?.activity)ending+='\n\n昨日は、'+actual.activity.replace(/。+$/,'')+'。';
 }
 return {subject:src[0],body:'こんばんは。特別放送の募集を聴いて、お便りします。\n\n'+story+ending};
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
 // 投稿数が少なくても水増ししない。通常のお便りも合わせて放送する。
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
  archive[uid]={who:id,subject:draft.subject,body:draft.body,regular:true,special:highlight,programSpecial:true,kind:'special',themeId:plan.themeId,choices:SPECIAL_CHOICES.map(x=>[...x])};
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
  anniversary:'五十夜目の放送を聴いていました。お便りを送らない夜も、この番組を聴く自分の夜だったのだと思います。'
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
 const yesterday=previous?.activity?'\n\n昨日は、'+previous.activity.replace(/。+$/,'')+'。そのことも、少しだけ思い出しています。':'';
 const id=`climate_${n}_${who}`;
 s.regular.letterArchive[id]={who,subject,body:'こんばんは。\n\n'+text+yesterday+'\n\n何か大きな事件があったわけではありません。ただ、今夜の空気を誰かに話したくなりました。',regular:true,kind:'climate',tag:`climate-${c.season}-${c.weather}`,choices:REGULAR_CHOICES.map(x=>[...x])};
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
  s.regular.letterArchive[key]={...l,id:key,regular:true,chapter3:true,choices:REGULAR_CHOICES.map(x=>[...x])};
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
   if(n-t.lastChangeNight<8)continue;
   let branch=def.a.includes(latest.actionId)?'a':def.b.includes(latest.actionId)?'b':null;
   if(!branch||simHash(`thread41:middle:${id}:${n}`)%100>=70)continue;
   t.branch=branch;t.stage=2;t.lastChangeNight=n;
  }else if(t.stage===2){
   if(n-t.lastChangeNight<11)continue;
   const acceptable=t.branch==='a'?def.resolveA:def.resolveB;
   if(!acceptable.includes(latest.actionId)||simHash(`thread41:end:${id}:${n}`)%100>=77)continue;
   t.stage=3;t.lastChangeNight=n;
  }
 }
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
  subject,body,thread:{stage:t.stage,branch:t.branch||null,actionNight:t.lastChangeNight},
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
