function log(type,message){s.logs.push({night:s.night,type,message})}
function event(message){s.events.push({night:s.night,message})}
function affect(id,changes){const o=s.listeners[id];if(!o)return;for(const [k,v] of Object.entries(changes))if(typeof o[k]==='number')o[k]=clamp(o[k]+v)}
function remember(id,mem){let a=s.listeners[id]?.memories;if(a&&!a.includes(mem))a.push(mem)}
function applyReply(l,choice,assembled){let id=l.who;if(!s.listeners[id])s.listeners[id]={trust:25,reflection:40,agency:40,stress:35,memories:[],known:false};s.listeners[id].known=true;affect(id,{trust:1});if(l.id==='cat1'){s.flags.catRead=true;s.flags.catReply=choice;remember('cat','退職についてラジオに相談した');const e={empathy:{trust:2,reflection:1},reflection:{reflection:3,agency:1},caution:{stress:-5,reflection:1},agency:{agency:3,trust:1}};affect('cat',e[choice]||{})}if(l.id==='clock1'){s.flags.clockRead=true;s.flags.clockPast=choice==='past';remember('clock','止まった時計の話をした');if(choice==='past')affect('clock',{trust:3,reflection:2})}if(l.id==='moon1'&&choice==='question')s.flags.moonQuestion=true;if(l.id==='driver2')s.flags.driverRead=true;if(l.id==='fish3'){s.flags.fishRead=true;s.flags.fishParts=[...s.replyParts];remember('fish','笑ってしまう癖について初めて相談した');const impacts={};s.replyParts.forEach((ix,k)=>{let e=fishParts[k].options[ix][2];for(let [a,v] of Object.entries(e))impacts[a]=(impacts[a]||0)+v});affect('fish',{trust:impacts.trust||0,reflection:(impacts.reflection||0)*2,agency:(impacts.agency||0)*2,stress:-(impacts.comfort||0)*2});s.flags.fishImpact=impacts}if(l.id==='clock2'){s.flags.clockWifeKnown=true;remember('clock','妻が買った時計について話した')}if(l.id==='clock3'&&s.flags.clockWifeKnown)remember('clock','散歩で見つけた花について話した');if(l.id==='bread1')remember('bread','くるみと蜂蜜のパンが売り切れた');if(l.id==='driver2')remember('driver','配送先の猫を「主任」と呼んでいる');if(l.id==='fish3')s.flags.fishRead=true;if(l.id==='cat2'||l.id==='cat2unread')remember('cat','上司に仕事の相談をした');if(l.id==='driver3'||l.id==='driver3first')remember('driver','猫主任が車の前で寝ていた');if(l.id==='bread3')remember('bread','新しいパンの試作に失敗した');if(l.id==='clock2generic')remember('clock','朝の散歩で時計の音を聞いた');if(l.id==='moon2'||l.id==='moon3')remember('moon','秘密の隠し場所について考えた');if(choice==='empathy')affect(id,{trust:2});if(choice==='agency')affect(id,{agency:2});if(choice==='reflection')affect(id,{reflection:2});if(choice==='humor')affect(id,{trust:1,stress:-2});if(choice==='curiosity'||choice==='followup'||choice==='past')affect(id,{trust:1,reflection:1});extendedApplyReply(l,choice,assembled);s.played.push({id:l.id,who:id,subject:l.subject,response:assembled,night:s.night});log('放送',`${NAMES[id]}「${l.subject}」に返答した。`);s.cursor++;s.current=null;s.replyStep=0;s.replyParts=[null,null,null];s.phase='broadcast';save();render()}
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
  }
}

function createNightLetters(n){
  if(n===4)return ['terminal4','cat4',s.flags.fishRead?(s.flags.fishAction==='journal'?'fish4':'fish4follow'):'fish4first','clock4','driver4','bread4'];
  if(n===5)return ['driver5','clock5','cat5','bread5','moon5'];
  if(n===6)return [s.flags.fishSpoke?'fish6':'fish6hesitant','driver6','clock6','bread6','anon6'];
  if(n===7)return ['cat7','clock7','driver7','fish7','bread7','moon7'];
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
