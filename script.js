'use strict';
const SAVE='radio_2am_prototype_v1';
let s=load();
function migrateState(data){
  if(!data||data.version!==1||!data.listeners||!data.flags)return null;
  const defaults=defaultState();
  data.contentVersion=2;
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
  if(data.night===3&&data.phase==='complete'){
    // v1.1で第3夜を終えたデータも、第4夜に進める。
    data.phase='after';
  }
  if(!Array.isArray(data.replyParts))data.replyParts=[null,null,null];
  if(!Array.isArray(data.chosen))data.chosen=[];
  if(!Number.isInteger(data.night)||data.night<1||data.night>7)return null;
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
function letter(id){let l=letterDB[id];if(!l)return null;let body=l.body;if(id==='clock3')body=body.replace('{wife}',s.flags.clockWifeKnown?'妻なら知っていたでしょうが、私は花の名前には疎いもので。':'昔なら、名前を知っている人に聞けたのですが、今は自分で調べるしかありません。');if(id==='cat2'&&s.flags.catReply==='reflection')body=body.replace('今日、上司と話しました。','昨日、辞めたい理由と辞めたあとにしたいことは別だと言ってくれましたよね。あれから少し考えていました。\n\n今日、上司と話しました。');return {...l,id,body}}
function nightLetters(n){
  if(s.letterSets[n])return s.letterSets[n];
  let fresh=[];
  if(n===1)fresh=['cat1','clock1','bread1','moon1'];
  else if(n===2)fresh=['driver2',s.flags.catRead?'cat2':'cat2unread',s.flags.clockRead&&s.flags.clockPast?'clock2':'clock2generic',s.flags.moonQuestion?'sugar2':'moon2'];
  else if(n===3)fresh=['fish3','clock3',s.flags.driverRead?'driver3':'driver3first','bread3','moon3'];
  else fresh=createNightLetters(n);
  const carried=n>=5?(s.pending||[]).filter(x=>x.until>=n).map(x=>x.id):[];
  const picked=[...new Set([...fresh,...carried])].filter(id=>letterDB[id]);
  s.letterSets[n]=picked.slice(0,8);
  save();
  return s.letterSets[n];
}
function setTab(tab){s.tab=tab;save();render()}
function selectLetter(id){let i=s.chosen.indexOf(id);if(i>=0)s.chosen.splice(i,1);else if(s.chosen.length<3)s.chosen.push(id);save();render()}
function startNight(){s.phase='prepare';s.tab='studio';nightLetters(s.night);save();render()}
function beginBroadcast(){if(!s.chosen.length||s.opening===null)return;recordOpening();s.phase='broadcast';s.cursor=0;save();render()}
function chooseReply(i){let l=letter(s.current);let c=l.choices[i];applyReply(l,c[2],c[1])}
function finishBroadcast(){if(s.song===null)return;s.phase='after';log('曲',`「${songs[s.song][0]}」を流した。`);applySongMood();const omitted=nightLetters(s.night).filter(id=>!s.chosen.includes(id));log('未紹介',omitted.length?omitted.map(id=>NAMES[letter(id).who]).join('、')+'のお便りは放送で紹介されなかった。':'今夜届いたお便りはすべて紹介した。');updatePendingLetters();advanceWorld();save();render()}
function nextNight(){
  if(s.night>=7){s.phase='complete';save();render();return}
  s.night++;
  s.phase='intro';s.opening=null;s.chosen=[];s.cursor=0;s.current=null;
  s.replyParts=[null,null,null];s.replyStep=0;s.song=null;s.tab='studio';
  nightLetters(s.night);save();render();
}
function resetGame(){if(!confirm('進行状況を最初からやり直しますか？ 現在のセーブは消えます。'))return;s=defaultState();save();render()}
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
  '終点のひとつ前','いつもの道の途中','言いそびれた返事','ひとり分の余白'];
function shell(content){let done=s.phase==='complete';return `<header class="header"><div><div class="brand">MIDNIGHT LETTERS / A RADIO STORY</div><h1>午前2時のラジオ局</h1><div class="small">${done?'第1〜7夜 終了':`第${s.night}夜　${dayTitles[s.night]}`}</div></div><div class="chip">${s.phase==='broadcast'||s.phase==='reply'?'● ON AIR':'◌ OFF AIR'}</div></header><div class="studio" role="img" aria-label="月明かりの差す深夜のラジオスタジオ。机にマイクとランプが置かれている"><div class="studio-caption">02:00 AM · YOUR VOICE, SOMEWHERE</div><div class="moon"></div><div class="lamp"></div><div class="mic"></div><div class="desk"></div><div class="onair">${s.phase==='broadcast'||s.phase==='reply'?'ON AIR':'STANDBY'}</div></div><div class="layout"><main id="main">${content}</main><aside class="sidebar"><div class="panel"><div class="overline">BROADCAST DESK</div>${navButtons()}</div><div class="panel"><div class="overline">今夜の放送</div><div class="status"><span>紹介枠</span><span>${s.chosen.length} / 3</span></div><div class="progress"><div style="width:${s.chosen.length/3*100}%"></div></div><div class="status"><span>放送済み</span><span>${s.played.filter(x=>x.night===s.night).length}通</span></div><div class="status"><span>保存</span><span>自動保存</span></div></div></aside></div><nav class="bottomnav" aria-label="メニュー"><button class="${s.tab==='studio'?'active':''}" onclick="setTab('studio')"><span>◉</span>放送</button><button class="${s.tab==='letters'?'active':''}" onclick="setTab('letters')"><span>✉</span>お便り</button><button class="${s.tab==='journal'?'active':''}" onclick="setTab('journal')"><span>▤</span>記録</button><button class="${s.tab==='listeners'?'active':''}" onclick="setTab('listeners')"><span>♧</span>リスナー</button><button class="${s.tab==='settings'?'active':''}" onclick="setTab('settings')"><span>⚙</span>設定</button></nav><div class="footer">『午前2時のラジオ局』第1〜7夜プロトタイプ v1.2 · オフライン対応</div>`}
function navButtons(){return [['studio','◉ 放送'],['letters','✉ お便り'],['journal','▤ 放送日誌'],['listeners','♧ リスナー'],['settings','⚙ 設定・セーブ']].map(([id,t])=>`<button class="navbtn ${s.tab===id?'active':''}" onclick="setTab('${id}')">${t}</button>`).join('')}
function intro(){
  const t=s.night;
  const texts={
    1:'雨が、窓を叩いている。\n\n机の上には、冷めかけたコーヒーと、何通かのお便り。\n\n壁の時計が、小さな音を立てて進んでいる。\n\n今夜から、この番組を担当することになった。\n\n午前2時からの1時間。\n\n眠れない誰かに、声を届ける仕事だ。',
    2:'昨日の雨は上がった。\n\nスタジオの机には、新しいお便りが届いている。\n\n昨夜、マイクの向こうには、どんな人がいたのだろう。\n\nその答えが、少しだけわかる夜になるかもしれない。',
    3:'窓の外は、静かに晴れている。\n\nお便りの束に、見慣れないラジオネームを見つけた。\n\n誰かが言えなかった言葉は、午前2時の声に変えられるだろうか。',
    4:'机の隅に、昨夜スタッフが見つけた古い封筒がある。\n\n「終点のひとつ前で、待っています。」\n\n誰の言葉なのか、まだわからない。\n\n郵便受けには、今夜も新しい便箋が届いている。',
    5:'金曜日の夜。\n\nガラス越しに、遠くの道路の灯りが流れていく。\n\n昨日と同じ街を走る人にも、昨日と違う一日があった。\n\n届いた手紙は、どれも少しだけ体温が違う。',
    6:'土曜日。スタジオの前の廊下は、いつもより静かだ。\n\n宛名のない封筒、書き直された便箋、短い近況報告。\n\n言いそびれた返事は、どこへ行くのだろう。',
    7:'一週間の最後の夜。\n\n窓の外の月が、いつもより近く見える。\n\n手紙の中には、まだ結末のついていない話がいくつもある。\n\n今夜は、どんな言葉を届けよう。'
  };
  const times=['','01:48','01:42','01:36','01:43','01:45','01:39','01:41'];
  return `<section class="panel"><div class="overline">${times[t]} / STUDIO</div><h2>${dayTitles[t]}</h2><p>${fmt(texts[t])}</p><div class="actions"><button class="btn" onclick="startNight()">お便りを確認する →</button></div></section>`;
}
function prepare(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">BEFORE BROADCAST / 01:48</div><h2>今夜のお便り</h2><p class="muted">最大3通を紹介できます。読まなかったお便りの送り主も、明日を生きていきます。まずお便りを選びましょう。</p>${ids.map(id=>{let l=letter(id),selected=s.chosen.includes(id);return `<div class="letter"><div class="letter-top"><span class="letter-title">${esc(NAMES[l.who])}</span><span class="tag">${l.special?'特別返答':''}</span></div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div><div class="actions"><button class="btn ${selected?'secondary':'ghost'}" onclick="selectLetter('${id}')" ${!selected&&s.chosen.length>=3?'disabled':''}>${selected?'✓ 紹介する予定':'＋ このお便りを紹介'}</button></div></div>`}).join('')}<div class="notice">紹介予定：${s.chosen.length} / 3通　${s.chosen.map(id=>NAMES[letter(id).who]).join('・')||'まだ選んでいません'}</div><h3>オープニングの言葉</h3>${opening.map((o,i)=>`<button class="choice ${s.opening===i?'selected':''}" onclick="s.opening=${i};save();render()"><strong>${'ABC'[i]}.</strong> ${esc(o)}</button>`).join('')}<div class="actions"><button class="btn" ${s.chosen.length===0||s.opening===null?'disabled':''} onclick="beginBroadcast()">午前2時、放送を始める →</button></div></section>`}
function broadcast(){if(s.cursor>=s.chosen.length){return `<section class="panel"><div class="overline">02:53 / ENDING</div><h2>今夜の最後の一曲</h2><p>お便りを読み終えた。マイクの向こうでは、まだ誰かが聴いている。</p>${songs.map((a,i)=>`<button class="choice ${s.song===i?'selected':''}" onclick="s.song=${i};save();render()"><strong>♪ ${esc(a[0])}</strong><br><span class="small">${esc(a[1])}</span></button>`).join('')}<div class="actions"><button class="btn" ${s.song===null?'disabled':''} onclick="finishBroadcast()">エンディングを放送する →</button></div></section>`}let id=s.chosen[s.cursor],l=letter(id);return `<section class="panel"><div class="overline">${['02:08','02:23','02:39'][s.cursor]} / ON AIR · LETTER ${s.cursor+1} / ${s.chosen.length}</div><h2>お便りを紹介する</h2><div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div><div class="actions"><button class="btn" onclick="s.current='${id}';s.phase='reply';save();render()">このお便りに返答する →</button></div></section>`}
function reply(){
  const l=letter(s.current);
  if(!l){s.phase='broadcast';return broadcast()}
  if(!l.special){
    return `<section class="panel"><div class="overline">ON AIR / REPLY</div><h2>${esc(NAMES[l.who])}への返答</h2><div class="quote">${fmt(l.body)}</div><h3>どんな言葉を返しますか？</h3>${l.choices.map((c,i)=>`<button class="choice" onclick="chooseReply(${i})"><strong>${esc(c[0])}</strong><br>${esc(c[1])}</button>`).join('')}<p class="small">※ 返答は確定すると取り消せません。人物の変化は後日の投稿から見えてきます。</p></section>`;
  }
  const parts=l.id==='cat7'?catParts:fishParts;
  const step=s.replyStep,part=parts[step];
  const preview=s.replyParts.map((index,i)=>index===null?null:parts[i].options[index][1]).filter(Boolean).join('\n\n');
  return `<section class="panel"><div class="overline">SPECIAL REPLY / ON AIR</div><h2>言葉を組み立てる</h2><p class="muted">${esc(NAMES[l.who])}のお便りに、どんなふうに向き合いますか。</p><div class="steps">${parts.map((x,i)=>`<span class="${i===step?'active':''}">${i+1}. ${esc(x.name)}</span>`).join('')}</div><h3>STEP ${step+1}：${esc(part.name)}</h3>${part.options.map((option,i)=>`<button class="choice ${s.replyParts[step]===i?'selected':''}" onclick="s.replyParts[${step}]=${i};save();render()"><strong>${esc(option[0])}</strong><br>${esc(option[1])}</button>`).join('')}<h3>放送原稿プレビュー</h3><div class="quote">${preview?fmt(preview):'まだ言葉を選んでいません。'}</div><div class="actions">${step>0?`<button class="btn secondary" onclick="s.replyStep--;save();render()">← 戻る</button>`:''}${step<2?`<button class="btn" ${s.replyParts[step]===null?'disabled':''} onclick="s.replyStep++;save();render()">次の言葉へ →</button>`:`<button class="btn" ${s.replyParts.some(x=>x===null)?'disabled':''} onclick="confirmSpecial()">この言葉を放送する →</button>`}</div></section>`;
}
function confirmSpecial(){
  const l=letter(s.current);
  const parts=l.id==='cat7'?catParts:fishParts;
  const text=s.replyParts.map((v,i)=>parts[i].options[v][1]).join('\n\n');
  if(!confirm('この返答を放送しますか？'))return;
  applyReply(l,'special',text);
}
function after(){
  const n=s.night;
  const scenes={
    1:'マイクの赤いランプが消えた。\n\nスタジオには、雨の音だけが残っている。\n\n今夜、あなたの言葉を聴いた人がいる。\n\nその人が明日、どんな朝を迎えるのか。\n\nまだ、誰にもわからない。',
    2:'マイクを切ったあと、短いメッセージが届いた。\n\n「こんばんは。昨日の放送を聴いていました。お便りは送らなかったけれど、なんとなく今日もラジオをつけています。それだけです。おやすみなさい。」\n\nラジオネームは「名前はまだありません」。\n\n聴いているだけの人も、確かにここにいる。',
    3:'放送が終わり、スタジオの照明が少し明るくなる。\n\nスタッフが郵送物を整理していたところ、古い封筒が紛れていたという。宛名はない。消印はずいぶん前の日付だ。\n\n封筒の裏には、短い文章が書かれていた。\n\n「終点のひとつ前で、待っています。」\n\n誰が、誰を待っているのだろう。',
    4:s.played.some(x=>x.night===4&&x.id==='terminal4')?'封筒の裏に書かれていた駅と、今夜紹介したお便りの駅。\n\n同じ場所のことなのかもしれない。\n\nけれど、同じ人だと決めつける理由もない。\n\nスタジオの時計が、静かに進んでいく。':'古い封筒の言葉を、もう一度読み返す。\n\n「終点のひとつ前で、待っています。」\n\nあの手紙の続きを、まだ知らない。\n\n窓の向こうで、遠い電車の音がした。',
    5:'今夜、誰かは仕事で失敗し、誰かは次に読む本を考えている。\n\n一日の中で起こることには、放送で紹介されないもののほうが多い。\n\nそれでも、たった一通の便箋から、その人の暮らしが少し見えることがある。',
    6:'放送の最後の曲が終わる。\n\n言いたいことを言えた人も、まだ言葉を探している人もいる。\n\nマイクを切ったら、その先はそれぞれの夜になる。\n\n窓の外を、一台の配送車がゆっくり通り過ぎた。',
    7:'マイクの赤いランプが消えた。\n\n一週間で紹介したのは、ほんの一部のお便りだった。\n\n話してくれた人にも、話さなかった人にも、明日が来る。\n\n机の上には、まだ白い便箋が何枚も残っている。\n\n次の木曜日が来たら、あの駅にも灯りがつくだろうか。'
  };
  return `<section class="panel end"><div class="overline">03:00 / OFF AIR</div><h2>放送が終わった</h2><p>${fmt(scenes[n])}</p><hr class="divider"><div class="small">今夜紹介したお便り：${s.played.filter(x=>x.night===n).length}通</div><div class="small">放送しなかったお便り：${nightLetters(n).length-s.chosen.length}通</div><p class="small">リスナーたちは、それぞれの一日を過ごします。変化の一部は、次の放送で届くかもしれません。</p><div class="actions"><button class="btn" onclick="nextNight()">${n===7?'第1〜7夜を振り返る':'次の夜へ進む →'}</button></div></section>`;
}
function complete(){
  return `<section class="panel end"><div class="overline">END OF CHAPTER SAMPLE</div><h2>まだ、朝にならない話</h2><p>七夜の放送が終わった。\n\n描き始めた人も、まだ鉛筆を握れない人もいる。\n\n返事を送った人も、画面に文字を打ったままの人もいる。\n\n駅のベンチには、来週も誰かが座るのだろうか。\n\nあなたの声が届かない夜にも、誰かの人生は続いている。</p><div class="notice">第8夜以降へ続く物語は、これから拡張できます。放送日誌とバックアップには、ここまでの選択が残っています。</div><div class="actions"><button class="btn secondary" onclick="setTab('journal')">放送日誌を見る</button><button class="btn" onclick="setTab('settings')">セーブを書き出す</button></div></section>`;
}
function lettersTab(){let ids=nightLetters(s.night);return `<section class="panel"><div class="overline">POST OFFICE</div><h2>届いたお便り</h2><p class="muted">第${s.night}夜のお便り一覧。内容を読み返せます。</p>${ids.map(id=>{let l=letter(id),played=s.played.some(x=>x.id===id),sel=s.chosen.includes(id);return `<div class="letter"><div class="letter-title">${esc(NAMES[l.who])}</div><div class="small">${esc(l.subject)} · ${played?'放送済み':sel?'紹介予定':'未紹介'}</div><hr class="divider"><div class="letter-text">${fmt(l.body)}</div></div>`}).join('')}</section>`}
function journal(){let nights=Array.from({length:s.night},(_,i)=>i+1);return `<section class="panel"><div class="overline">BROADCAST JOURNAL</div><h2>放送日誌</h2><p class="muted">放送で伝えた言葉と、そこから知ることのできた出来事を記録しています。内部数値は表示されません。</p>${nights.map(n=>{let a=s.logs.filter(x=>x.night===n),b=s.events.filter(x=>x.night===n&&x.public===true);return `<div class="timeline"><h3>第${n}夜 — ${dayTitles[n]}</h3>${a.length?a.map(x=>`<div class="timeline-item"><div class="tag">${esc(x.type)}</div>${esc(x.message)}</div>`).join(''):'<p class="small">まだ放送の記録はありません。</p>'}${b.length?`<div class="subtle">翌日へ向かう出来事の記録（試作版のみ）</div>${b.map(x=>`<div class="timeline-item small">${esc(x.message)}</div>`).join('')}`:''}</div>`}).join('')}<h3>あなたが届けた言葉</h3>${s.played.length?s.played.map(x=>`<div class="letter"><div class="small">第${x.night}夜 · ${esc(NAMES[x.who])}</div><b>${esc(x.subject)}</b><div class="quote">${fmt(x.response)}</div></div>`).join(''):'<p class="muted">まだ返答の記録はありません。</p>'}</section>`}
function listeners(){let bios={cat:'会社員。仕事と創作への気持ちの間で揺れている。',clock:'元時計修理職人。古い時計と日々の思い出を大切にしている。',bread:'パン屋で働く。新しいパン作りに挑戦している。',moon:'少し変わった空想を投稿するリスナー。',driver:'夜間配送ドライバー。駐車場の猫を「主任」と呼んでいる。',fish:'大学生。友人との関係で、自分の気持ちを伝えられずにいる。',terminal:'木曜日、終点のひとつ前の駅を訪れる。待つ理由はまだわからない。',anon:'以前から番組を聴いている静かなリスナー。'};return `<section class="panel"><div class="overline">LISTENER ARCHIVE</div><h2>リスナーの記録</h2><p class="muted">放送やお便りでわかったことだけが記録されます。</p>${Object.keys(bios).map(id=>{let o=s.listeners[id],seen=s.played.some(x=>x.who===id)||o.known;return `<div class="listener"><b>${seen?esc(NAMES[id]):'まだよく知らないリスナー'}</b><div class="small">${seen?esc(bios[id]):'これからお便りが届くかもしれません。'}</div>${seen&&o.memories.length?`<hr class="divider"><div class="small">これまでにわかったこと</div>${o.memories.map(m=>`<div class="small">・${esc(m)}</div>`).join('')}`:''}</div>`}).join('')}</section>`}
function settings(){return `<section class="panel"><div class="overline">SETTINGS</div><h2>設定・セーブデータ</h2><p>進行状況は、この端末のブラウザ内に自動保存されます。別の端末に引き継ぐ場合は、バックアップを書き出してください。</p><div class="actions"><button class="btn" onclick="downloadSave()">バックアップを保存</button><label class="btn secondary" style="cursor:pointer">バックアップを読み込む<input class="screen-reader" type="file" accept=".json,application/json" onchange="importSave(this)"></label></div><hr class="divider"><h3>最初から遊ぶ</h3><p class="small">現在のセーブデータを消して、第1夜からやり直します。必要なら先にバックアップしてください。</p><button class="btn secondary" onclick="resetGame()">進行状況をリセット</button><hr class="divider"><p class="small">バージョン 1.2 · 第1〜7夜プロトタイプ。音楽は文章演出のみで、音声は再生されません。画像・外部ライブラリを使用せず、オフラインで遊べます。</p></section>`}
let lastViewKey=null;
function render(){
  if(!['studio','letters','journal','listeners','settings'].includes(s.tab))s.tab='studio';
  const content=s.tab==='letters'?lettersTab():s.tab==='journal'?journal():s.tab==='listeners'?listeners():s.tab==='settings'?settings():
    s.phase==='intro'?intro():s.phase==='prepare'?prepare():s.phase==='broadcast'?broadcast():s.phase==='reply'?reply():s.phase==='after'?after():complete();
  const key=`${s.tab}:${s.tab==='studio'?s.phase:''}:${s.phase==='broadcast'?s.cursor:''}:${s.phase==='reply'?s.replyStep:''}`;
  const y=window.scrollY;
  const changed=lastViewKey!==null&&lastViewKey!==key;
  document.getElementById('app').innerHTML=shell(content);
  lastViewKey=key;
  // 同じ画面内の選択は位置維持。新しい場面では本文冒頭だけを表示する。
  const maxY=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  if(changed){
    const main=document.getElementById('main');
    const target=Math.max(0,main.getBoundingClientRect().top+window.scrollY-12);
    window.scrollTo(0,Math.min(target,maxY));
  }else{
    window.scrollTo(0,Math.min(y,maxY));
  }
}

nightLetters(s.night);render();
