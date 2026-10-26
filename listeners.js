const NAMES={cat:'夜明けの猫',clock:'古時計',bread:'眠れないパン屋',moon:'月の裏側',driver:'午前3時の配達員',fish:'透明な金魚',sugar:'砂糖を三杯',anon:'名前はまだありません',terminal:'終点のひとつ前',station:'番組スタッフ',umbrella:'逆さまの傘',triangle:'三角定規',fridge:'冷蔵庫の明かり'};
const defaultState=()=>({version:1,night:1,phase:'intro',tab:'studio',guidance:{welcomeSeen:false,suppressHints:false,seen:{} ,bookmarksOnly:false},bookmarks:[],broadcastStyle:{closing:null,interludes:{},completed:{},history:[]},opening:null,chosen:[],played:[],cursor:0,current:null,replyStep:0,replyParts:[null,null,null],song:null,logs:[],events:[],listeners:{cat:{trust:30,reflection:30,agency:25,stress:65,memories:[],known:false},clock:{trust:30,reflection:45,agency:45,stress:25,memories:[],known:false},bread:{trust:30,reflection:40,agency:55,stress:20,memories:[],known:false},moon:{trust:30,reflection:50,agency:50,stress:10,memories:[],known:false},driver:{trust:35,reflection:40,agency:50,stress:35,memories:[],known:false},fish:{trust:20,reflection:40,agency:20,stress:60,memories:[],known:false},terminal:{trust:15,reflection:65,agency:28,stress:43,memories:[],known:false},anon:{trust:25,reflection:45,agency:45,stress:22,memories:[],known:false},sugar:{trust:25,reflection:45,agency:45,stress:18,memories:[],known:false},umbrella:{trust:24,reflection:43,agency:53,stress:37,memories:[],known:false},triangle:{trust:20,reflection:57,agency:55,stress:31,memories:[],known:false},fridge:{trust:28,reflection:40,agency:59,stress:49,memories:[],known:false}},flags:{},pending:[],contentVersion:14,climate:createClimateState(),special:createSpecialState(),storyPrograms:createStoryProgramsState(),newListeners:createNewListenerState(),chapter2:createChapter2State(),chapter3:createChapter3State(),regular:createRegularState(),microWorld:createMicroWorldState(),socialWorld:createSocialWorldState(),lifePaths:createLifePaths(),storyState:initializeStoryState(),privateMemories:{},stationTone:{warmth:0,curiosity:0,quiet:0},letterSets:{},world:[],rng:20261026});



// v1.5: それぞれの暮らし。行動と他者との交流は、放送とは独立した非公開データ。
// 過去の放送と生活が、翌日の行動候補の重みに影響する。自由文生成AIではない。
const SIM_PROFILES = {
 cat:{traits:[28,82,83,42],life:[50,61,58,20],mood:[18,65,14,42,33],
  routine:['通勤電車で窓の外を眺めた','頼まれた仕事を片付けた','雨の匂いが残る道を歩いた'],
  relations:{boss:['職場の上司',54,58,35],artFriend:['学生時代の友人',59,63,15],coworker:['同僚',51,55,20,'mizuno_brother']},
  actions:[
   ['work','仕事の段取りを一つ見直した','duty',17,null,{work:1,anxiety:1},'仕事の途中で、少し手順を変えてみました。'],
   ['rest','帰宅後、照明を落としてゆっくり休んだ','rest',15,null,{health:2,anxiety:-3},'昨夜は早めに照明を落として過ごしました。'],
   ['artlook','机の奥のスケッチブックを開いて眺めた','creative',17,null,{hope:2,leisure:1},'昨日、古いスケッチブックを久しぶりに見ました。'],
   ['cafe','帰り道に喫茶店へ寄った','rest',13,null,{joy:1,leisure:2},'帰り道、いつもの喫茶店へ寄りました。'],
   ['askboss','上司に仕事の進め方を一つ相談した','social',8,'boss',{anxiety:-1,work:1},'仕事の小さな相談ができました。',1],
   ['frienddraft','昔の友人に送る文章を下書きした','reflection',12,null,{hope:1,anxiety:1},'昔の友人へのメッセージを書きかけています。',6],
   ['draw','机に向かって短い線を何本か描いた','creative',12,null,{joy:3,hope:2,leisure:1},'少しだけ絵を描いてみました。',8,'catStartedSketch']
 ]},
 driver:{traits:[80,53,67,70],life:[72,48,54,38],mood:[48,48,20,29,38],
  routine:['配送車を点検した','休憩所で缶コーヒーを買った','駐車場の猫主任を見かけた'],
  relations:{sister:['妹',48,43,73],coworker:['配送仲間',62,67,19],catBoss:['猫主任',36,45,0]},
  actions:[
   ['route','翌日の配送ルートを確認した','duty',17,null,{work:1,anxiety:-1},'配送の段取りを少し工夫しました。'],
   ['coffee','休憩所で温かい缶コーヒーを飲んだ','rest',16,null,{health:1,joy:1},'休憩所のコーヒーが妙においしかったです。'],
   ['chief','駐車場で猫主任の近くに座ってみた','social',16,'catBoss',{joy:2,loneliness:-1},'主任に、今日は少し近づけました。'],
   ['coworker','同僚に休憩中の出来事を話した','social',13,'coworker',{loneliness:-2,joy:1},'仕事仲間とくだらない話で笑いました。'],
   ['sleep','いつもより長く仮眠を取った','rest',14,null,{health:3,anxiety:-2},'少し長めに休憩を取りました。'],
   ['sisterdraft','妹への短い返事を下書きした','reflection',12,null,{hope:1,anxiety:1},'まだ送っていない文章を、少し書き直しました。',6],
   ['sisterthink','妹と話したころの写真を見つめた','reflection',11,null,{hope:1,loneliness:1},'古い写真を見返しました。',6]
 ]},
 fish:{traits:[55,83,88,35],life:[45,67,48,36],mood:[24,71,16,54,34],
  routine:['講義のノートを取り直した','友人からのメッセージを読み返した','日記のページを開いた'],
  relations:{friend:['親しい友人',75,64,52],brother:['兄',71,75,14,'mizuno_brother'],family:['家族',75,69,26]},
  actions:[
   ['study','講義のメモを整理した','duty',14,null,{work:1,anxiety:-1},'講義のノートを整理しました。'],
   ['diary','日記に今日の気持ちを一行書いた','reflection',19,null,{anxiety:-2,hope:1},'日記を一行だけ書きました。'],
   ['bookshop','ひとりで本屋を歩いた','rest',14,null,{joy:2,leisure:2},'帰りに本屋へ寄りました。'],
   ['friendchat','友人といつもの雑談をした','social',11,'friend',{loneliness:-2,joy:1},'友人と他愛ない話をしました。'],
   ['brother','兄から届いた短いメッセージを読んだ','social',11,'brother',{loneliness:-1,hope:1},'兄と少し近況をやりとりしました。'],
   ['practice','断りたいときの言葉をノートに書いた','reflection',17,null,{hope:1,anxiety:1},'自分の言葉をノートに書いてみました。'],
   ['career','文章に関わる仕事について少し調べた','creative',12,null,{hope:2,leisure:-1},'気になる仕事について、少し調べています。',8]
 ]},
 clock:{traits:[35,58,75,78],life:[18,66,65,57],mood:[37,32,7,47,39],
  routine:['朝の散歩に出た','古い時計のねじを巻いた','妻の好きだったお茶を入れた'],
  relations:{library:['図書室の人たち',55,65,12],oldFriend:['古い知人',47,62,15],neighbor:['近所の人',49,58,13]},
  actions:[
   ['walk','知らない花を見つけながら散歩した','rest',16,null,{health:2,joy:1},'散歩道で、知らない花を見つけました。'],
   ['repair','手元の古い時計を一つ磨いた','creative',15,null,{joy:2,leisure:1},'古い時計を一つ磨きました。'],
   ['library','図書室で子どもたちの話を聞いた','social',17,'library',{loneliness:-2,joy:2},'図書室で思いがけない話を聞きました。',4],
   ['tea','好きなお茶を丁寧に淹れた','rest',17,null,{anxiety:-2,joy:1},'昨夜はゆっくりお茶を淹れました。'],
   ['neighbor','散歩の帰りに近所の人と立ち話をした','social',9,'neighbor',{loneliness:-2,hope:1},'帰り道で、近所の人と少し話しました。'],
   ['photo','写真の入った箱を少し整理した','reflection',14,null,{hope:1,loneliness:1},'古い写真を少し整理しました。'],
   ['stationplan','海辺の駅までの道順を紙に書いてみた','reflection',10,null,{hope:2,anxiety:1},'行きたい場所までの道順を調べました。',8]
 ]},
 terminal:{traits:[23,85,73,55],life:[48,62,57,29],mood:[18,53,9,58,29],
  routine:['仕事帰りに時刻表を見た','駅前の道をゆっくり歩いた','古い切符を引き出しにしまった'],
  relations:{brother:['弟',66,45,61],neighbor:['近所の人',34,46,15]},
  actions:[
   ['timetable','仕事帰りに時刻表を開いた','reflection',16,null,{hope:1,loneliness:1},'帰り道に、時刻表を眺めました。'],
   ['chores','休みの日の買い物リストを作った','duty',14,null,{work:1,anxiety:-1},'買い物リストを書き直しました。'],
   ['walk','駅へ向かう道とは別の通りを歩いた','rest',16,null,{health:1,joy:1},'昨日はいつもと違う道を歩きました。'],
   ['ticket','古い切符を取り出して戻した','reflection',16,null,{hope:1,anxiety:1},'古い切符を見つめる時間がありました。'],
   ['letterdraft','誰かに宛てた便箋を一枚書きかけた','reflection',12,null,{hope:1,anxiety:1},'まだ出していない手紙があります。',9],
   ['neighbor','近所の人に道を譲って会釈した','social',10,'neighbor',{loneliness:-1},'帰り道、誰かと会釈を交わしました。'],
   ['rest','早く帰って窓の灯りを眺めた','rest',12,null,{health:2,anxiety:-1},'昨日は早めに帰りました。']
 ]},
 bread:{traits:[66,62,57,69],life:[68,65,60,69],mood:[61,39,17,18,63],routine:['売り場を整えた','焼きたての匂いを確かめた','新しい材料を探した'],
  relations:{boss:['店長',61,67,20],customer:['常連のお客さん',45,60,8]},
  actions:[
   ['bake','新しいパンの配合をノートに書いた','creative',19,null,{hope:2,leisure:1},'また変わった配合を考えています。'],
   ['store','売り場の札を書き直した','duty',15,null,{work:1},'売り場の札を書き直しました。'],
   ['boss','店長に試作品の感想を聞いた','social',12,'boss',{hope:1,anxiety:1},'店長と試作品の話をしました。'],
   ['customer','常連さんの好みを聞いた','social',12,'customer',{joy:1,loneliness:-1},'常連さんとパンの話をしました。'],
   ['rest','閉店後に温かい飲み物を飲んだ','rest',15,null,{health:2,anxiety:-1},'閉店後に温かい飲み物を飲みました。']
 ]},
 moon:{traits:[58,39,73,73],life:[45,72,53,68],mood:[57,17,8,19,69],routine:['帰り道で月を見上げた','ノートに空想を書いた','冷蔵庫のプリンを確かめた'],
  relations:{family:['家族',68,70,14],friend:['友達',61,63,10]},
  actions:[
   ['moon','月の形を勝手に命名した','creative',19,null,{joy:2,hope:1},'今夜の月には、自分だけの名前をつけました。'],
   ['pudding','冷蔵庫の奥を確認した','rest',17,null,{joy:1},'冷蔵庫のプリンは無事でした。'],
   ['family','家族と変ななぞなぞを考えた','social',17,'family',{joy:2,loneliness:-1},'家族と変ななぞなぞを考えました。'],
   ['sketch','空想をノートに書き足した','creative',17,null,{leisure:2,hope:1},'ノートに新しい空想を書きました。']
 ]},
 sugar:{traits:[53,60,60,58],life:[53,68,49,60],mood:[51,23,10,24,54],routine:['コーヒーを淹れた','空の色を眺めた','静かに本を読んだ'],
  relations:{friend:['友達',58,60,10]},
  actions:[
   ['coffee','コーヒーの味を少し変えた','rest',20,null,{joy:1},'いつもと違うコーヒーを淹れました。'],
   ['cloud','夕方の雲を眺めた','creative',17,null,{joy:1,hope:1},'夕方の雲が面白い形でした。'],
   ['friend','友達と短いメッセージを交わした','social',13,'friend',{loneliness:-1},'友達から短い返事が来ました。']
 ]},
 anon:{traits:[32,70,80,56],life:[52,61,51,48],mood:[32,37,9,35,45],routine:['机の上を片付けた','夜更けに本を開いた','ラジオの周波数を合わせた'],
  relations:{neighbor:['隣人',40,50,12]},
  actions:[
   ['read','好きな本を数ページ読んだ','rest',20,null,{joy:1,anxiety:-1},'昨夜は好きな本を読みました。'],
   ['walk','帰り道に少し遠回りした','rest',16,null,{health:1,hope:1},'昨日は少し遠回りして帰りました。'],
   ['notes','短いメモを机に残した','reflection',19,null,{hope:1},'短いメモを書き残しました。'],
   ['greet','隣人と短い挨拶をした','social',12,'neighbor',{loneliness:-1},'誰かと短い挨拶を交わしました。']
 ]}
};

// v2.5: 三人とも自分の暮らし・目的・交流を持ち、放送で取り上げられなくても生活する。
Object.assign(SIM_PROFILES,{
 umbrella:{traits:[65,58,71,71],life:[63,64,53,51],mood:[43,39,12,29,52],
  routine:['花屋のシャッターを上げた','水揚げした花の名前を確かめた','店先の小さな鉢を並べ直した'],
  relations:{regular:['花を買いに来る常連',55,58,16],assistant:['週末に手伝う知人',48,55,23],neighbor:['向かいの店の人',52,53,18]},
  actions:[
   ['bouquet','店で季節の花束を一つ組んだ','creative',19,null,{hope:1,leisure:1},'売り物になる前の花束をひとつ作りました。'],
   ['window','店の窓辺に小さな鉢を飾り直した','creative',16,null,{joy:2},'店先の鉢の置き方を変えてみました。'],
   ['flowercustomer','店でお客さんの好みを聞いた','social',16,'regular',{joy:1,loneliness:-1},'お客さんの話から、花の色を選び直しました。'],
   ['market','朝の市場で小さな花を仕入れた','duty',17,null,{work:1,health:-1},'朝の市場で、名前の知らない小さな花を見つけました。'],
   ['assistanttalk','手伝いに来る知人と店の予定を話した','social',12,'assistant',{anxiety:-1,hope:1},'手伝いをお願いする曜日を考えました。'],
   ['plantrest','店を閉めてから、枯れかけた鉢の手入れをした','rest',15,null,{health:1,hope:1},'花を売るより、育て直すほうが難しい日もあります。'],
   ['neighborchat','向かいの店の人と短く立ち話をした','social',12,'neighbor',{loneliness:-1},'向かいの店と、通りの話をしました。']
  ]},
 triangle:{traits:[56,68,79,61],life:[45,77,48,58],mood:[47,41,12,23,66],
  routine:['学校の時間割を確認した','ノートの端に図形を描いた','部活のない放課後をどう過ごすか考えた'],
  relations:{friend:['クラスの友人',61,65,19],teacher:['学校の先生',49,55,24],family:['家族',65,70,23]},
  actions:[
   ['librarystudy','放課後、図書室で資料を読んだ','duty',17,null,{work:1,leisure:1},'放課後、図書室で知らない分野の本を読みました。'],
   ['diagram','ノートに思いついた街の地図を描いた','creative',17,null,{joy:2,hope:1},'ノートの端に、まだない街の地図を描きました。'],
   ['friends','友達と進路とは関係ない話をした','social',16,'friend',{joy:1,loneliness:-2},'友達と、明日の予定とは関係のない話をしました。'],
   ['future','なりたい職業を三つ書いて、一つ消した','reflection',17,null,{hope:1,anxiety:1},'なりたい職業を三つ書いて、ひとつだけ消しました。'],
   ['teacher','先生に気になる授業について質問した','social',12,'teacher',{hope:1,anxiety:-1},'学校で、気になった授業の続きを尋ねました。'],
   ['freewalk','帰宅途中、いつもと違う道を選んだ','rest',15,null,{health:1,joy:1},'帰り道を少し変えたら、知らない看板を見つけました。'],
   ['familydinner','家で夕食の支度を手伝った','social',13,'family',{joy:1,loneliness:-1},'夕食を並べながら、今日の話をしました。']
  ]},
 fridge:{traits:[47,67,61,76],life:[76,51,57,24],mood:[33,54,15,36,42],
  routine:['厨房の火を落とした','使った包丁を研いだ','閉店後に冷蔵庫の明かりを確かめた'],
  relations:{cookmate:['店の料理人仲間',59,58,27],sibling:['兄',49,57,31],supplier:['食材の仕入れ先',48,59,20]},
  actions:[
   ['prep','閉店後に翌日の仕込みを少し済ませた','duty',18,null,{work:1,health:-1},'厨房に残って、翌日の仕込みを少し済ませました。'],
   ['konbini','仕事帰りのコンビニで、おにぎりを二つ買った','rest',19,null,{joy:1,health:1},'料理人なのに、仕事帰りはコンビニのおにぎりを選びました。'],
   ['leftovers','家の冷蔵庫にあるもので短い料理を作った','creative',12,null,{leisure:1,joy:2},'家で、あり合わせのもので短い料理を作りました。'],
   ['supply','早朝に食材の卸売店へ仕入れに出た','duty',16,'supplier',{work:1,health:-1},'早朝に食材を仕入れて、夜とは違う街を見ました。'],
   ['cookmate','厨房で仲間に失敗談を一つ話した','social',15,'cookmate',{loneliness:-2,joy:1},'厨房の仲間と、焦がした料理の話で笑いました。'],
   ['rest','家に帰って、何も作らず静かに座った','rest',17,null,{health:2,anxiety:-2},'帰宅して、何も作らずに休みました。'],
   ['brother','兄に短い近況を送った','social',10,'sibling',{loneliness:-1,hope:1},'兄へ、短い近況だけ送りました。']
  ]}
});
// 同じ時刻に複数の場所を訪れたことにはしない。追加の訪問も通常行動として選択される。
SIM_PROFILES.cat.actions.push(['flowerstop','仕事の帰りに花屋の小さな鉢を眺めた','rest',12,null,{joy:1,leisure:1},'帰り道、花屋の鉢を少し眺めました。']);
SIM_PROFILES.clock.actions.push(['morningmarket','朝の市場に寄り、季節の花を見た','rest',12,null,{joy:1,health:1},'朝の市場で、花の並びを眺めました。']);
SIM_PROFILES.driver.actions.push(['conveniencestop','深夜のコンビニに寄って温かい飲み物を買った','rest',13,null,{health:1,joy:1},'深夜のコンビニで、温かい飲み物を買いました。']);
SIM_PROFILES.bread.actions.push(['ingredientmarket','朝の仕入れ先で小麦粉と果物を選んだ','duty',13,null,{work:1,health:-1},'仕入れ先で、今日はいつもと違う果物を見つけました。']);

// v2.4: 新たな行動を既存の自律生活の選択肢に統合する。行動が選ばれない日は、訪問したことにならない。
SIM_PROFILES.cat.actions.push(['bakery','仕事帰りにパン屋へ寄り、夕食のパンを選んだ','rest',15,null,{joy:1,leisure:1},'帰り道に、お気に入りのパン屋へ寄りました。']);
SIM_PROFILES.fish.actions.push(['libraryvisit','地域の図書室へ行き、好きな本を探した','rest',15,null,{joy:1,leisure:1},'地域の図書室で、少し本を読みました。']);
SIM_PROFILES.clock.actions.push(['shopfront','昔の時計店があった通りを歩いた','reflection',13,null,{hope:1,loneliness:1},'昔の店があった通りを歩きました。']);
SIM_PROFILES.clock.actions.push(['shopvisit','昔の時計店の窓を眺め、商店街をゆっくり歩いた','rest',13,null,{joy:1,loneliness:1},'昔の店の近くを歩きました。']);
SIM_PROFILES.fish.actions.push(['librarystudy','地域の図書室で、レポートの資料を調べた','duty',14,null,{work:1,leisure:1},'図書室で資料を調べました。']);
SIM_PROFILES.driver.actions.push(['shoproute','古い時計店のある通りへ荷物を届けた','duty',15,null,{work:1,health:-1},'昔の時計屋の通りへ配達に行きました。']);
SIM_PROFILES.driver.actions.push(['stationdelivery','駅前の配送先へ荷物を届けた','duty',15,null,{work:1,health:-1},'駅前へ荷物を届けました。']);
SIM_PROFILES.terminal.actions.push(['stationstop','帰宅途中、駅前でしばらく時刻表を眺めた','reflection',13,null,{hope:1},'帰りに駅前で時刻表を眺めました。']);
const MOOD_KEYS=['joy','anxiety','anger','loneliness','hope'];
const LIFE_KEYS=['work','health','finance','leisure'];
const SIM_CATEGORIES=['duty','rest','creative','social','reflection'];
function simNumber(value,fallback){return Number.isFinite(value)?Math.max(0,Math.min(100,Math.round(value))):fallback}
function simAdjust(obj,key,delta){obj[key]=simNumber((obj[key]??50)+delta,50)}
function simHash(str){let n=2166136261;for(let i=0;i<str.length;i++)n=Math.imul(n^str.charCodeAt(i),16777619)>>>0;return n>>>0}
function simPick(items,seed){return items[seed%items.length]}
function simRelationDefaults(profile){
 const rel={};
 for(const [key,info] of Object.entries(profile.relations||{}))rel[key]={name:info[0],closeness:info[1],trust:info[2],tension:info[3],personKey:info[4]||null,contactCount:0,lastContactNight:0,history:[]};
 return rel;
}
function createSimulationState(){
 const people={};
 for(const [id,p] of Object.entries(SIM_PROFILES))people[id]={
  traits:{sociability:p.traits[0],caution:p.traits[1],sensitivity:p.traits[2],independence:p.traits[3]},
  emotion:Object.fromEntries(MOOD_KEYS.map((k,i)=>[k,p.mood[i]])),
  life:Object.fromEntries(LIFE_KEYS.map((k,i)=>[k,p.life[i]])),
  relationships:simRelationDefaults(p),signals:{},habits:{},activityCounts:{},rhythms:{},habitNotes:[],
  lastAction:'',lastActionId:'',daily:[],memories:[]};
 return {schema:2,processedNights:[],people};
}
// v1.3 / v1.4 セーブの行動履歴と既存数値を維持し、不足項目だけ補完する。
// 既に経過した夜に新しい処理を遡及適用しない（ダブル処理防止）。
function migrateSimulation(data){
 const base=createSimulationState();
 const sim=data.simState&&typeof data.simState==='object'?data.simState:{};
 sim.processedNights=Array.isArray(sim.processedNights)?[...new Set(sim.processedNights.filter(n=>Number.isInteger(n)&&n>=1&&n<=100000))]:[];
 sim.people=sim.people&&typeof sim.people==='object'?sim.people:{};
 for(const [id,b] of Object.entries(base.people)){
  const old=sim.people[id]||{},out={...b,...old};
  out.traits=b.traits;
  for(const kind of ['emotion','life']){
   out[kind]={...b[kind]};
   for(const [key,value] of Object.entries(b[kind]))out[kind][key]=simNumber(old[kind]?.[key],value);
  }
  // v1.6: 途中で知り合った人物との追加の関係も、セーブ読込後に残す。
  out.relationships={...b.relationships,...(old.relationships||{})};
  for(const [key,def] of Object.entries(b.relationships)){
   const o=old.relationships?.[key]||{};
   out.relationships[key]={...def,
    closeness:simNumber(o.closeness,def.closeness),trust:simNumber(o.trust,def.trust),tension:simNumber(o.tension,def.tension),
    contactCount:Math.max(0,Math.round(o.contactCount||0)),lastContactNight:Math.max(0,Math.round(o.lastContactNight||0)),
    history:Array.isArray(o.history)?o.history.slice(-12):[]};
  }
  out.signals=typeof old.signals==='object'&&old.signals?old.signals:{};
  out.habits=typeof old.habits==='object'&&old.habits?old.habits:{};
  out.activityCounts=typeof old.activityCounts==='object'&&old.activityCounts?old.activityCounts:{};
  out.rhythms=typeof old.rhythms==='object'&&old.rhythms?old.rhythms:{};
  out.habitNotes=Array.isArray(old.habitNotes)?old.habitNotes.slice(-12):[];
  out.daily=Array.isArray(old.daily)?old.daily.slice(-56):[];
  out.memories=Array.isArray(old.memories)?old.memories.slice(-45):[];
  out.lastAction=typeof old.lastAction==='string'?old.lastAction:'';
  out.lastActionId=typeof old.lastActionId==='string'?old.lastActionId:'';
  sim.people[id]=out;
 }
 sim.schema=2;data.simState=sim;return data;
}
function simMemory(person,entry){
 const found=person.memories.find(m=>m.night===entry.night&&m.summary===entry.summary);
 if(found){found.importance=Math.min(5,Math.max(found.importance||1,entry.importance||1));return}
 person.memories.push(entry);
 // 永続性の高い記憶を残し、日常の細部のみ古いものから圧縮する。
 if(person.memories.length>45){
  let ix=person.memories.findIndex(m=>m.importance<=1&&m.night<s.night-4);
  if(ix<0)ix=person.memories.findIndex(m=>m.importance<=2);
  if(ix<0)ix=0;
  person.memories.splice(ix,1);
 }
}
function simReplyTopic(letterId){
 if(/^cat/.test(letterId))return 'creative';
 if(/^driver/.test(letterId))return 'reconnect';
 if(/^fish/.test(letterId))return 'boundaries';
 if(/^clock/.test(letterId))return 'memories';
 if(/^terminal/.test(letterId))return 'reconnect';
 return 'everyday';
}
function simReplyImpact(id,choice,assembled,letterId){
 const p=s.simState?.people?.[id];if(!p)return;
 const effects={empathy:[2,-2,0,-1,1],humor:[3,-1,0,-1,1],caution:[0,-3,0,0,1],agency:[1,0,0,0,3],reflection:[0,1,0,0,2],space:[1,-2,0,-1,1],curiosity:[1,0,0,-1,2],past:[1,1,0,-1,1],honesty:[0,0,-1,0,2]};
 const mood=effects[choice]||[1,-1,0,0,1];
 MOOD_KEYS.forEach((k,i)=>simAdjust(p.emotion,k,mood[i]));
 if(assembled&&/嫌|つら|苦し|怖/.test(assembled))simAdjust(p.emotion,'anxiety',-1);
 const topic=(letterId||'').startsWith('regular_')?({cat:'creative',driver:'reconnect',fish:'boundaries',clock:'memories',terminal:'reconnect',bread:'creative',moon:'everyday',umbrella:'creative',triangle:'creative',fridge:'everyday'}[id]||'everyday'):simReplyTopic(letterId||'');
 // 本人が考えるきっかけ。家族や友人の「信頼値」を放送だけで増やさない。
 p.signals[topic]=Math.min(8,(p.signals[topic]||0)+2);
 if(choice==='agency')p.signals.boundaries=Math.min(8,(p.signals.boundaries||0)+1);
 if(choice==='reflection'||choice==='past')p.signals.memories=Math.min(8,(p.signals.memories||0)+1);
 simMemory(p,{night:s.night,kind:'broadcast',tag:topic,importance:3,summary:'放送で「'+(choice==='special'?'自分への言葉':choice)+'」という向き合い方の返答を聴いた'});
}
function simEligible(action,night){
 if(action[7]&&night<action[7])return false;
 if(action[8]&&!s.flags[action[8]])return false;
 return true;
}
function simCategoryWeight(p,action,night){
 const [id,,category,base,rel]=action;
 const t=p.traits,e=p.emotion,l=p.life;
 let w=base;
 if(category==='duty')w+=(t.caution-50)*.09+(l.work>60?2:0);
 if(category==='rest')w+=(e.anxiety-35)*.10+(58-l.health)*.14;
 if(category==='creative')w+=(e.hope-40)*.13+(l.leisure-35)*.1;
 if(category==='social')w+=(t.sociability-48)*.14+(e.loneliness-35)*.12-(e.anxiety>75?4:0);
 if(category==='reflection')w+=(t.sensitivity-55)*.1+(e.anxiety-40)*.04;
 if(rel){
  const r=p.relationships[rel];
  if(r){w+=(r.trust-45)*.055-(r.tension-45)*.075;
   const last=r.history?.[r.history.length-1];
   if(last?.outcome==='warm')w+=2.5;
   if(last?.outcome==='awkward')w-=2.5;
   if(r.lastContactNight===night-1)w-=2;
   if(night-r.lastContactNight>=5&&r.lastContactNight>0)w+=2;
  }
 }
 // 既に慣れた活動は再び選びやすいが、数日連続だと他の活動も選ぶ。
 w+=Math.min(8,(p.activityCounts[id]||0)*2)+Math.min(5,(p.rhythms[category]||0)*.7);
 const recent=p.daily.slice(-3).filter(d=>d.actionId===id).length;
 w-=recent*5;
 const signals=p.signals||{};
 if(category==='creative')w+=(signals.creative||0)*1.5;
 if(category==='reflection')w+=(signals.memories||0)*.9;
 if(category==='social')w+=(signals.reconnect||0)*1.5;
 if(category==='reflection'&&id==='practice')w+=(signals.boundaries||0)*2;
 // 強く残った放送や習慣の記憶は、数日後の関心にも残る。
 const recentMemories=p.memories.filter(m=>m.importance>=3&&night-m.night<=6&&night>=m.night);
 if(category==='creative')w+=Math.min(5,recentMemories.filter(m=>m.tag==='creative').length*1.5);
 if(category==='reflection')w+=Math.min(4,recentMemories.filter(m=>m.tag==='memories'||m.tag==='boundaries').length*1.2);
 if(category==='social')w+=Math.min(4,recentMemories.filter(m=>m.tag==='reconnect'||m.tag==='social').length*1.1);
 // 趣味・相談にまだ取り組める時間のある日だけ行動が自然に起きる。
 if(category==='creative'&&l.leisure<28)w-=10;
 return Math.max(.5,w);
}
function simChooseAction(id,p,night){
 const actions=SIM_PROFILES[id].actions.filter(x=>simEligible(x,night));
 const candidates=actions.map(a=>[a,Math.max(.5,simCategoryWeight(p,a,night)+lifeDailyActionBias(id,a,night)+climateActionBias(id,a,night)+socialActionBias(id,a,night))]);
 const total=candidates.reduce((sum,x)=>sum+x[1],0);
 const seed=simHash(`${id}:${night}:${JSON.stringify(p.emotion)}:${JSON.stringify(p.life)}:${JSON.stringify(p.signals)}:${JSON.stringify(p.activityCounts)}`);
 let r=(seed/4294967296)*total;
 for(const [action,weight] of candidates){r-=weight;if(r<0)return action;}
 return candidates[candidates.length-1][0];
}
function simMeet(person,relKey,night,actionId){
 const rel=person.relationships[relKey];if(!rel)return;
 const previous=rel.lastContactNight,hadContact=previous>0;
 // 同じ相手との会話でも、本人の気持ち・緊張・これまでの経験によって手応えは異なる。
 // 交流をしただけで自動的に仲直りしたり信頼が増えたりしない。
 const e=person.emotion,t=person.traits;
 const roll=(simHash(`${night}:${relKey}:${actionId}:${rel.contactCount}:${e.anxiety}:${rel.tension}`)%53)-26;
 const score=rel.trust-rel.tension*.62+(e.hope-e.anxiety)*.12+(t.sociability-50)*.08+roll;
 const outcome=score>=64?'warm':score>=40?'ordinary':score>=17?'guarded':'awkward';
 const impact={warm:{closeness:2,trust:2,tension:-2},ordinary:{closeness:1,trust:0,tension:0},
  guarded:{closeness:0,trust:0,tension:1},awkward:{closeness:0,trust:-1,tension:2}}[outcome];
 for(const [key,delta] of Object.entries(impact))simAdjust(rel,key,delta);
 if(outcome==='warm'){simAdjust(e,'joy',2);simAdjust(e,'loneliness',-1)}
 if(outcome==='guarded'||outcome==='awkward')simAdjust(e,'anxiety',1);
 rel.lastContactNight=night;rel.contactCount++;
 const summary={warm:'少し気持ちの通うやりとりをした',ordinary:'いつもどおり言葉を交わした',
  guarded:'言いたかったことを少し残して話を終えた',awkward:'話したあと、気まずさが残った'}[outcome];
 rel.history.push({night,actionId,outcome,summary});rel.history=rel.history.slice(-12);
 if(!hadContact||night-previous>=3||outcome==='awkward'||outcome==='warm')
  simMemory(person,{night,kind:'relationship',tag:'social',importance:outcome==='awkward'||outcome==='warm'?3:2,
   summary:`${rel.name}と${summary}`});
}
function simStoryRelationEcho(n){
 // 主要な脚本イベントはそちらが正。こちらは確認できた行動の結果だけを反映。
 const all=s.simState?.people||{};
 if(n===5&&s.flags.fishSpoke&&all.fish?.relationships.friend){
  simAdjust(all.fish.relationships.friend,'tension',2);
  all.fish.relationships.friend.history.push({night:n,summary:'初めて誘いを断った'});
 }
 if(n===9&&s.flags.driverRepliedEarly&&all.driver?.relationships.sister){
  const r=all.driver.relationships.sister;
  r.contactCount++;r.lastContactNight=n;r.history.push({night:n,summary:'短い返信を送った'});
 }
 if(n===12&&s.flags.driverSentBy12&&all.driver?.relationships.sister){
  const r=all.driver.relationships.sister;
  r.contactCount++;r.lastContactNight=n;r.history.push({night:n,summary:'短いメッセージを送った'});
 }
 if(n===10&&s.flags.fishSecondBoundary&&all.fish?.relationships.friend){
  const r=all.fish.relationships.friend;
  simAdjust(r,'tension',-1);
  r.history.push({night:n,summary:'自分の希望を伝えた'});
 }
}
function simRegisterAction(id,p,action,n){
 const [actionId,text,category,,rel,changes]=action;
 const e=p.emotion,l=p.life;
 for(const [key,delta] of Object.entries(changes||{})){
  if(Object.hasOwn(e,key))simAdjust(e,key,delta);
  else if(Object.hasOwn(l,key))simAdjust(l,key,delta);
 }
 if(rel)simMeet(p,rel,n,actionId);
 p.activityCounts[actionId]=Math.min(99,(p.activityCounts[actionId]||0)+1);
 p.rhythms[category]=Math.min(99,(p.rhythms[category]||0)+1);
 p.habits[text]=Math.min(99,(p.habits[text]||0)+1); // v1.4互換・旧習慣も維持
 const prior=p.daily.slice(-3),recentInCategory=prior.filter(d=>d.category===category).length;
 const isHabit=p.rhythms[category]>=3&&recentInCategory>=1;
 if(isHabit&&!p.habitNotes.includes(category)){
  p.habitNotes.push(category);
  simMemory(p,{night:n,kind:'habit',tag:category,importance:4,summary:`${{duty:'仕事や用事',rest:'休息',creative:'創作',social:'人との交流',reflection:'考え事'}[category]}が、生活の小さな習慣になり始めた`});
 }
 simMemory(p,{night:n,kind:'daily',tag:category,importance:1,summary:text});
 p.lastAction=text;p.lastActionId=actionId;
 return {actionId,category,activity:text};
}
function simulateDailyLives(n){
 if(!s.simState)s.simState=createSimulationState();
 const sim=s.simState;
 if(sim.processedNights.includes(n))return;
 for(const [id,p] of Object.entries(sim.people)){
  const pr=SIM_PROFILES[id],e=p.emotion,l=p.life;
  const seed=simHash(`${id}:morning:${n}`);
  const morning=simPick(['少し時間をかけて身支度をした','いつもよりゆっくり起きた','窓を開けて外の空気を確かめた'],seed);
  const day=pr.routine[(seed>>>4)%pr.routine.length];
  const action=simChooseAction(id,p,n);
  const activity=simRegisterAction(id,p,action,n);
  climateLifeEffects(id,p,activity,n);
  // その日がつらかったからといって、必ず翌日にすべて忘れるわけではない。
  if(l.work>70)simAdjust(e,'anxiety',1);
  if(l.health<45)simAdjust(e,'anxiety',2);
  if(e.anxiety>68)simAdjust(l,'health',-1);
  if(e.joy>55&&l.leisure>50)simAdjust(e,'hope',1);
  if(activity.category==='social')simAdjust(e,'loneliness',-1);
  if(activity.category==='rest')simAdjust(e,'anxiety',-1);
  // 感情は複数並存する。希望が増えたからといって、不安を自動でゼロにしない。
  for(const key of Object.keys(p.signals)){
   p.signals[key]=Math.max(0,p.signals[key]-1);
   if(p.signals[key]===0)delete p.signals[key];
  }
  p.daily.push({night:n,morning,day,evening:activity.activity,...activity,climate:climateForNight(n)?.weather||'clear'});
  p.daily=p.daily.slice(-56);
 }
 simStoryRelationEcho(n);
 sim.processedNights.push(n);
}
function simLetterPostscript(id,night){
 const p=s.simState?.people?.[id];if(!p||night<=1)return '';
 const yesterday=p.daily.find(d=>d.night===night-1);if(!yesterday)return '';
 const seed=simHash(`postscript:${id}:${night}`);
 if(seed%4!==0)return '';
 const action=SIM_PROFILES[id]?.actions.find(x=>x[0]===yesterday.actionId);
 if(!action||!action[6])return '';
 // 本人が投稿することを選んだ、平凡な近況だけ。関係性の内部数値は漏らさない。
 return '\n\n追伸。'+action[6];
}

// v1.7: 実際に経験した関係の変化だけを、本人の手紙に使う。
function simLatestContact(id,relKey,beforeNight){
 const r=s.simState?.people?.[id]?.relationships?.[relKey];
 if(!r||!Array.isArray(r.history))return null;
 return [...r.history].reverse().find(h=>h.night<beforeNight&&h.night>=beforeNight-4&&h.outcome)||null;
}
function simContactCount(id,relKey){return s.simState?.people?.[id]?.relationships?.[relKey]?.contactCount||0}
function simRelationshipPostscript(id,night){
 const p=s.simState?.people?.[id];if(!p||night<=3)return '';
 const contact=Object.entries(p.relationships||{}).flatMap(([key,r])=>(r.history||[])
  .filter(h=>h.night===night-1&&h.outcome).map(h=>({key,rel:r,info:h})));
 if(!contact.length||simHash(`relpost:${id}:${night}`)%5!==0)return '';
 const a=contact[simHash(`relpostpick:${id}:${night}`)%contact.length];
 const message={warm:'昨日は、誰かと話す時間が少し嬉しかったです。',ordinary:'昨日は、誰かと何でもない言葉を交わしました。',
  guarded:'昨日、言いかけたことを飲み込んでしまいました。',awkward:'昨日の会話が、まだ少し気になっています。'}[a.info.outcome];
 return message?'\n\n追伸。'+message:'';
}
