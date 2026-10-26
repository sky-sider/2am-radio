function log(type,message){s.logs.push({night:s.night,type,message})}
function event(message){s.events.push({night:s.night,message})}
function affect(id,changes){const o=s.listeners[id];if(!o)return;for(const [k,v] of Object.entries(changes))if(typeof o[k]==='number')o[k]=clamp(o[k]+v)}
function remember(id,mem){let a=s.listeners[id]?.memories;if(a&&!a.includes(mem))a.push(mem)}
function applyReply(l,choice,assembled){let id=l.who;if(!s.listeners[id])s.listeners[id]={trust:25,reflection:40,agency:40,stress:35,memories:[],known:false};s.listeners[id].known=true;affect(id,{trust:1});if(l.id==='cat1'){s.flags.catRead=true;s.flags.catReply=choice;remember('cat','退職についてラジオに相談した');const e={empathy:{trust:2,reflection:1},reflection:{reflection:3,agency:1},caution:{stress:-5,reflection:1},agency:{agency:3,trust:1}};affect('cat',e[choice]||{})}if(l.id==='clock1'){s.flags.clockRead=true;s.flags.clockPast=choice==='past';remember('clock','止まった時計の話をした');if(choice==='past')affect('clock',{trust:3,reflection:2})}if(l.id==='moon1'&&choice==='question')s.flags.moonQuestion=true;if(l.id==='driver2')s.flags.driverRead=true;if(l.id==='fish3'){s.flags.fishRead=true;s.flags.fishParts=[...s.replyParts];remember('fish','笑ってしまう癖について初めて相談した');const impacts={};s.replyParts.forEach((ix,k)=>{let e=fishParts[k].options[ix][2];for(let [a,v] of Object.entries(e))impacts[a]=(impacts[a]||0)+v});affect('fish',{trust:impacts.trust||0,reflection:(impacts.reflection||0)*2,agency:(impacts.agency||0)*2,stress:-(impacts.comfort||0)*2});s.flags.fishImpact=impacts}if(l.id==='clock2'){s.flags.clockWifeKnown=true;remember('clock','妻が買った時計について話した')}if(l.id==='clock3'&&s.flags.clockWifeKnown)remember('clock','散歩で見つけた花について話した');if(l.id==='bread1')remember('bread','くるみと蜂蜜のパンが売り切れた');if(l.id==='driver2')remember('driver','配送先の猫を「主任」と呼んでいる');if(l.id==='fish3')s.flags.fishRead=true;if(l.id==='cat2'||l.id==='cat2unread')remember('cat','上司に仕事の相談をした');if(l.id==='driver3'||l.id==='driver3first')remember('driver','猫主任が車の前で寝ていた');if(l.id==='bread3')remember('bread','新しいパンの試作に失敗した');if(l.id==='clock2generic')remember('clock','朝の散歩で時計の音を聞いた');if(l.id==='moon2'||l.id==='moon3')remember('moon','秘密の隠し場所について考えた');if(choice==='empathy')affect(id,{trust:2});if(choice==='agency')affect(id,{agency:2});if(choice==='reflection')affect(id,{reflection:2});if(choice==='humor')affect(id,{trust:1,stress:-2});if(choice==='curiosity'||choice==='followup'||choice==='past')affect(id,{trust:1,reflection:1});extendedApplyReply(l,choice,assembled);regularReplyRecorded(l,choice);simReplyImpact(id,choice,assembled,l.id);s.played.push({id:l.id,who:id,subject:l.subject,response:assembled,night:s.night});log('放送',`${NAMES[id]}「${l.subject}」に返答した。`);s.cursor++;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.phase='broadcast';save();render()}
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

// v1.9 継続放送: chapter 2 や特別放送とは独立した、繰り返し可能な夜。
// 内容は作者によるテンプレート。実際の生活記録から本文を作り、保存して固定する。
const REGULAR_MAIN=['cat','driver','fish','clock','terminal'];
const REGULAR_SUPPORT=['bread','moon','anon','sugar'];
function createRegularState(){return {schema:1,started:false,letterArchive:{},processedNights:[],latestThemes:{},lastMailed:{},mailHistory:[],routeActions:[],phase:'between_chapters'}}
function migrateRegular(data){
 const base=createRegularState(),old=data.regular&&typeof data.regular==='object'?data.regular:{};
 const r={...base,...old};
 r.letterArchive=old.letterArchive&&typeof old.letterArchive==='object'?old.letterArchive:{};
 r.processedNights=Array.isArray(old.processedNights)?[...new Set(old.processedNights.filter(n=>Number.isInteger(n)&&n>=15))]:[];
 r.latestThemes=old.latestThemes||{};r.lastMailed=old.lastMailed||{};
 r.mailHistory=Array.isArray(old.mailHistory)?old.mailHistory.slice(-120):[];
 r.routeActions=Array.isArray(old.routeActions)?old.routeActions.slice(-120):[];
 r.started=Boolean(old.started||data.night>=15);
 data.regular=r;return data;
}
function regularTheme(n){return REGULAR_THEMES[(n-15)%REGULAR_THEMES.length]}
function regularDayTitle(n){const p=s.special?.planned;return n<=14?dayTitles[n]:n<=28?CH2_NIGHTS[n][0]:p?.night===n&&['ready','completed'].includes(p.status)?SPECIAL_THEMES[p.themeId].title:`通常放送 · ${regularTheme(n)[0]}`}
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
 return {subject,kind:'daily',tag:`daily-${yesterday.actionId}`,body:regularFirstSentence(id,n)+'\n\n'+yesterday.activity+(yesterday.activity.endsWith('。')?'':'。')+'\n\n'+narr[simHash(`reg:thought:${n}:${id}`)%narr.length]};
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
 const heard=s.played.filter(x=>x.night===n-1);
 if(!heard.length)return null;
 const p=s.simState?.people?.[id];
 const trust=s.listeners[id]?.trust||25;
 const hasListened=simHash(`reg:listen:${id}:${n}`)%100 < 30+Math.min(45,trust/2);
 if(!hasListened)return null;
 const item=heard[simHash(`reg:heard:${id}:${n}`)%heard.length];
 if(item.who===id)return {subject:'昨日の放送から',kind:'broadcast',tag:'echo-self',body:regularFirstSentence(id,n)+'\n\n昨日、自分のお便りを読んでもらいました。答えが出たわけではありませんが、言葉にしてよかったと思います。\n\n今日もいつもどおりの一日を過ごしています。'};
 const other=NAMES[item.who]||'あるリスナー';
 return {subject:'昨日の声',kind:'broadcast',tag:`echo-${item.who}`,
  body:regularFirstSentence(id,n)+'\n\n昨日、'+other+'さんのお便りを聴きました。\n\n「'+item.subject+'」という話が、なぜか今日まで頭に残っています。話したことのない人なのに、少しだけ隣にいる気がしました。\n\n自分の暮らしにも、似たような瞬間があるのかもしれません。'};
}
function regularThemeLetter(id,n){
 const theme=regularTheme(n),p=s.simState?.people?.[id];
 const action=regularDayAction(id,n),extras=action?`\n\nちなみに昨日は、${action.activity}。`:' ';
 const endings={
  cat:'慌ただしい毎日ですが、こんなことを考える余裕も残しておきたいです。',
  driver:'夜の道路で一人になると、変な考えが浮かぶんですよね。',
  fish:'日記にも書いてみようと思います。',clock:'歳をとっても知らないことは多いものですね。',
  terminal:'答えは、今のところありません。',bread:'パンとは関係ありませんが、こういう話も好きです。',
  moon:'なお、これが正しいかどうかは月に聞いてください。',anon:'聴いているだけの日も多いですが、今日は送ってみました。',sugar:'コーヒーが冷める前に、このへんで。'
 };
 return {subject:theme[0]+'のこと',kind:'theme',tag:`theme-${(n-15)%REGULAR_THEMES.length}`,
  body:regularFirstSentence(id,n)+'\n\n今夜のテーマは「'+theme[0]+'」だそうですね。'+theme[1]+'について考えていたら、自分の今日と昨日を思い出しました。'+extras+'\n\n'+(endings[id]||'またお便りします。')};
}
function regularCompose(id,n){
 const recent=(s.regular.mailHistory||[]).filter(h=>h.who===id&&h.night>=n-5);
 const unavailable=new Set(recent.map(h=>h.tag));
 const options=[
  regularRoute(id,n),regularDayNote(id,n),regularContact(id,n),regularBroadcastEcho(id,n),regularThemeLetter(id,n)
 ].filter(Boolean).map(x=>({...x,weight:({route:68,daily:65,contact:90,broadcast:54,theme:48})[x.kind]||45}));
 for(const o of options){
  if(unavailable.has(o.tag))o.weight-=65;
  if(recent.some(h=>h.kind===o.kind))o.weight-=18;
  o.weight+=simHash(`reg:opt:${id}:${n}:${o.tag}`)%21;
 }
 options.sort((a,b)=>b.weight-a.weight);
 return options[0]||regularThemeLetter(id,n);
}
function createRegularLetters(n){
 if(!s.regular)s.regular=createRegularState();
 const archive=s.regular.letterArchive;
 // 読み直しても新しい抽選をせず、確定済みの便箋を返す。
 const cached=s.letterSets[n];if(cached)return cached;
 const sorted=Object.keys(SIM_PROFILES).map(id=>{
  const last=s.regular.lastMailed[id]||0;
  const p=s.simState?.people?.[id];
  const activity=p?.daily?.find(d=>d.night===n-1);
  const historyBoost=activity?.category==='social'?5:0;
  const quiet=last?Math.min(30,(n-last)*3):25;
  const trust=(s.listeners[id]?.trust||25)/12;
  const noise=simHash(`reg:mail:${id}:${n}:${s.rng}`)%35;
  return {id,weight:quiet+trust+historyBoost+noise-(last===n-1?24:0)};
 }).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id));
 // 主要人物の声を残しつつ、サブリスナーも少しずつ現れる。
 const main=sorted.filter(x=>REGULAR_MAIN.includes(x.id)).slice(0,3);
 const support=sorted.filter(x=>REGULAR_SUPPORT.includes(x.id)).slice(0,2);
 const extras=sorted.filter(x=>!main.concat(support).some(y=>y.id===x.id)).slice(0,(n%3===0?2:1));
 const selected=[...main,...support,...extras].sort((a,b)=>b.weight-a.weight);
 const ids=[];
 for(const {id} of selected){
  const note=id===support[(n%2)%support.length]?.id?regularThemeLetter(id,n):regularCompose(id,n);
  const uuid=`regular_${n}_${id}`;
  const special=n>=21&&(n-21)%7===0&&REGULAR_MAIN.includes(id)&&id===main[0]?.id;
  archive[uuid]={who:id,subject:note.subject,body:note.body,special,regular:true,kind:note.kind,tag:note.tag,
   choices:REGULAR_CHOICES.map(x=>[...x])};
  s.regular.lastMailed[id]=n;
  s.regular.mailHistory.push({night:n,who:id,kind:note.kind,tag:note.tag});
  ids.push(uuid);
 }
 s.regular.mailHistory=s.regular.mailHistory.slice(-120);
 // 古い配達済みの便箋もセーブに残して、再読時に本文が変わらないようにする。
 return ids;
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
   const effects=(l.chapter2?CH2_REPLY_PARTS[l.who]:REGULAR_REPLY_PARTS)[k].options[ix][2];
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
 if(n<29||s.phase!=='intro'||s.special?.planned?.status==='announced')return false;
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
    anon:'送信する勇気が出たことも、今夜のもう一つの自慢かもしれません。'
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
  const p=s.simState?.people?.[id];if(!p)continue;
  const traits=SIM_PROFILES[id].traits;
  const trust=s.listeners[id]?.trust||25;
  const hearChance=Math.min(91,48+Math.round(trust/4)+Math.round(traits[0]/8));
  const heard=simHash(`sp:heard:${n}:${id}:${plan.themeId}`)%100<hearChance;
  if(!heard)continue;
  const mood=p.emotion||{};
  const sendChance=Math.min(82,17+Math.round(traits[0]/2.9)+Math.round((mood.hope||30)/8)+Math.round(trust/10));
  const mail=simHash(`sp:mail:${n}:${id}:${plan.themeId}`)%100<sendChance;
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
function climateCreateLetter(n){
 if(n<29)return null;
 const c=climateForNight(n);
 // 主要エピソードと参加型特別放送の枠を守る。ときどき1通だけ差し込む。
 const chance=simHash(`v22:climate:mail:${n}`)%100;
 if(chance>=46)return null;
 const all=['cat','driver','fish','clock','terminal','bread','moon','sugar','anon'];
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
