function log(type,message){s.logs.push({night:s.night,type,message})}
function event(message){s.events.push({night:s.night,message})}
function affect(id,changes){const o=s.listeners[id];if(!o)return;for(const [k,v] of Object.entries(changes))if(typeof o[k]==='number')o[k]=clamp(o[k]+v)}
function remember(id,mem){let a=s.listeners[id]?.memories;if(a&&!a.includes(mem))a.push(mem)}
function applyReply(l,choice,assembled){let id=l.who;if(!s.listeners[id])s.listeners[id]={trust:25,reflection:40,agency:40,stress:35,memories:[],known:false};s.listeners[id].known=true;affect(id,{trust:1});if(l.id==='cat1'){s.flags.catRead=true;s.flags.catReply=choice;remember('cat','退職についてラジオに相談した');const e={empathy:{trust:2,reflection:1},reflection:{reflection:3,agency:1},caution:{stress:-5,reflection:1},agency:{agency:3,trust:1}};affect('cat',e[choice]||{})}if(l.id==='clock1'){s.flags.clockRead=true;s.flags.clockPast=choice==='past';remember('clock','止まった時計の話をした');if(choice==='past')affect('clock',{trust:3,reflection:2})}if(l.id==='moon1'&&choice==='question')s.flags.moonQuestion=true;if(l.id==='driver2')s.flags.driverRead=true;if(l.id==='fish3'){s.flags.fishRead=true;s.flags.fishParts=[...s.replyParts];remember('fish','笑ってしまう癖について初めて相談した');const impacts={};s.replyParts.forEach((ix,k)=>{let e=fishParts[k].options[ix][2];for(let [a,v] of Object.entries(e))impacts[a]=(impacts[a]||0)+v});affect('fish',{trust:impacts.trust||0,reflection:(impacts.reflection||0)*2,agency:(impacts.agency||0)*2,stress:-(impacts.comfort||0)*2});s.flags.fishImpact=impacts}if(l.id==='clock2'){s.flags.clockWifeKnown=true;remember('clock','妻が買った時計について話した')}if(l.id==='clock3'&&s.flags.clockWifeKnown)remember('clock','散歩で見つけた花について話した');if(l.id==='bread1')remember('bread','くるみと蜂蜜のパンが売り切れた');if(l.id==='driver2')remember('driver','配送先の猫を「主任」と呼んでいる');if(l.id==='fish3')s.flags.fishRead=true;if(l.id==='cat2'||l.id==='cat2unread')remember('cat','上司に仕事の相談をした');if(l.id==='driver3'||l.id==='driver3first')remember('driver','猫主任が車の前で寝ていた');if(l.id==='bread3')remember('bread','新しいパンの試作に失敗した');if(l.id==='clock2generic')remember('clock','朝の散歩で時計の音を聞いた');if(l.id==='moon2'||l.id==='moon3')remember('moon','秘密の隠し場所について考えた');if(choice==='empathy')affect(id,{trust:2});if(choice==='agency')affect(id,{agency:2});if(choice==='reflection')affect(id,{reflection:2});if(choice==='humor')affect(id,{trust:1,stress:-2});if(choice==='curiosity'||choice==='followup'||choice==='past')affect(id,{trust:1,reflection:1});extendedApplyReply(l,choice,assembled);simReplyImpact(id,choice,assembled,l.id);s.played.push({id:l.id,who:id,subject:l.subject,response:assembled,night:s.night});log('放送',`${NAMES[id]}「${l.subject}」に返答した。`);s.cursor++;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.phase='broadcast';save();render()}
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
    .filter(id=>!s.chosen.includes(id)&&letterDB[id]?.carry&&!(s.pending||[]).some(item=>item.id===id))
    .map(id=>({id,until:s.night+letterDB[id].carry}));
  const merged=new Map();
  for(const entry of [...existing,...fresh]){
    if(!merged.has(entry.id))merged.set(entry.id,entry);
  }
  // 溜まり続けて選べなくなるのを避け、最大2通まで持ち越す。
  s.pending=[...merged.values()].slice(0,2);
}

function recordOpening(){
  const tone=s.stationTone ||= {warmth:0,curiosity:0,quiet:0};
  if(s.opening===0)tone.warmth++;
  if(s.opening===1)tone.quiet++;
  if(s.opening===2)tone.curiosity++;
  log('オープニング',opening[s.opening]);
}

// 選曲は運命を直接変更せず、その晩に放送を受け取ったリスナーの気分だけに作用する。
function applySongMood(){
  const heard=new Set(s.played.filter(x=>x.night===s.night).map(x=>x.who));
  for(const id of heard){
    if(s.song===0)affect(id,{reflection:1});
    else if(s.song===1)affect(id,{stress:-2});
    else if(s.song===2)affect(id,{agency:1});
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
