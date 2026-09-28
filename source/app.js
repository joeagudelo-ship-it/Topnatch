const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['section-list','section-count','clock','cue-clock','session-label','play','reset','back','forward','seek','total-time','pace','pace-value','breath','breath-value','section-time','section-title','section-position','section-progress','script-lines','previous-section','next-section','error'].map(id => [id,$(id)]));
const external = {
  '5': {label:'Opening prayer · Pastor Rey',seconds:180},
  '7': {label:'Opening remarks · Boss Emil',seconds:480},
  '9': {label:'Company presentation · Camille',seconds:420},
  '11': {label:'Dinner and live performances',seconds:2400},
  '40': {label:'Same Day Edit playback',seconds:420},
  '41': {label:'Closing remarks · Boss Emil',seconds:420},
  '43': {label:'Closing prayer · Pastor Jhun',seconds:180}
};
let sections=[], entries=[], elapsed=0, running=false, lastFrame=0, currentSection=-1, pace=130, follow=true;
let breathPause=2;
let programStart=0;
let playbackRate=1;
const savedPace=Number(localStorage.getItem('topnatch-pace'));
if(savedPace>=90&&savedPace<=190){pace=savedPace;ui.pace.value=String(pace)}
ui['pace-value'].textContent=pace;
const savedBreath=Number(localStorage.getItem('topnatch-breath'));
if(savedBreath>=0&&savedBreath<=4&&localStorage.getItem('topnatch-breath')!==null){breathPause=savedBreath;ui.breath.value=String(breathPause)}
ui['breath-value'].textContent=breathPause;
function format(sec){const s=Math.max(0,Math.floor(sec));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function words(s){return (s.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length}
function cueSeconds(s,section){
  if(/five senior managers walk onstage/i.test(s))return 45;
  if(/finalist [12] walks onstage/i.test(s))return 50;
  if(/Jessa Regal joins/i.test(s))return 30;
  if(/asks each finalist/i.test(s))return 60;
  if(/^Prayer$/i.test(s.replace(/[\[\]]/g,'')))return 180;
  if(/Senior managers on presentation pages|Camille relays|Stage Manager stages|Photo lineup.*confirmed/i.test(s))return 0;
  if(section===7&&/Boss Emil award photo/i.test(s))return 120;
  if(section===7&&/award recipient walks|award presentation.*photo/i.test(s))return 90;
  if(/brief 1.minute message/i.test(s))return 60;
  if(/video|playback/i.test(s))return 30;
  if(/10.second|winner stands/i.test(s))return 10;
  if(/onstage random draw/i.test(s))return 12;
  if(/spin the|spin again|company wheel/i.test(s))return 8;
  if(/randomize prize/i.test(s))return 4;
  if(/photo|award presentation|prize presentation/i.test(s))return 15;
  if(/walk|proceed|join.*stage|clear the stage/i.test(s))return 10;
  if(/applause|reaction/i.test(s))return 4;
  if(/pause|ad.lib/i.test(s))return 3;
  return 4;
}
function addText(section,row,text){
  text=text.replace(/\[REPEAT THIS SPIEL[^\n]*[)\]]/gi,'');
  if(/^\([^)]*\)$/.test(text.trim()))return;
  const spokenPlaceholders=text.replace(/\[((?:MALE|FEMALE) (?:FINALIST [12]|WINNER)|Winner Name|WINNER NAME|PRIZE VALUE|INDIVIDUAL WINNER NAME|GROUP WINNER NAME \/ GROUP NAME|WINNING COMPANY NAME)\]/g,'⟨$1⟩');
  const chunks=spokenPlaceholders.split(/(\[[^\]]*\])/g).filter(Boolean);
  chunks.forEach(chunk=>{
    if(chunk.startsWith('[')&&chunk.endsWith(']')){
      if(/continue in sequence|repeat for winners/i.test(chunk))return;
      entries.push({section,row,type:'cue',text:chunk.slice(1,-1),seconds:cueSeconds(chunk,section)});
    }else{
      const prose=chunk.replace(/•/g,'\n•').replace(/\s+/g,' ').trim();
      if(!prose)return;
      const sentences=prose.split(/(?<=[.!?])\s+(?=[A-Z•\[])/u);
      let line='';
      sentences.forEach(sentence=>{
        if(line&&words(line+' '+sentence)>30){entries.push({section,row,type:'spoken',text:line});line=''}
        line+=(line?' ':'')+sentence;
      });
      if(line)entries.push({section,row,type:'spoken',text:line});
    }
  });
}
function assemble(){
  entries=[];
  sections.forEach((section,si)=>{
    section.startIndex=entries.length;
    for(const block of section.blocks){
      if(block.row===14&&block.text.includes('WINNERS 3–19:')){
        const [lead,tail]=block.text.split('WINNERS 3–19:');
        entries.push({section:si,row:14,type:'cue',text:'Winner 2 of 20',seconds:0});
        addText(si,block.row,lead.replace(/^\s*WINNER 2:\s*/,''));
        const template=tail.split('[Repeat for Winners 3–19]')[0].replace(/^\s*Repeat the following prize-first sequence for each numbered winner\.\s*/,'');
        for(let n=3;n<=19;n++){
          entries.push({section:si,row:14,type:'cue',text:`Winner ${n} of 20`,seconds:0});
          addText(si,14,template);
        }
      }else{
        let content=block.text;
        if(si===7){
          if([18,28,31].includes(block.row))content=content.replace('[Continue in sequence of names]','[Award recipient walks / plaque / official photo] [Continue in sequence of names]');
          if([19,20,22,23,24,25,26,27,29,32,33].includes(block.row))content+=' [Award recipient walks / plaque / official photo]';
        }
        addText(si,block.row,content);
      }
    }
    if(external[section.id]){
      const x=external[section.id];
      const speaker={'5':'Pastor Rey','7':'Emil','9':'Camille','41':'Emil','43':'Pastor Jhun'}[section.id];
      if(speaker)entries.push({section:si,row:null,type:'cue',text:`Stage entry via SR: ${speaker}`,seconds:15});
      entries.push({section:si,row:null,type:'external',text:x.label,seconds:x.seconds});
      if(speaker)entries.push({section:si,row:null,type:'cue',text:`Stage exit via SL: ${speaker}`,seconds:15});
    }
    section.endIndex=entries.length;
  });
  entries.forEach(e=>{
    if(e.type!=='spoken'&&e.seconds>0){
      e.editable=true;e.storageKey=`topnatch-hold-${e.section}-${e.row}-${e.text}`;
      const saved=Number(localStorage.getItem(e.storageKey));
      if(saved>=0&&saved<=7200&&localStorage.getItem(e.storageKey)!==null)e.seconds=saved;
    }
  });
  recompute();
  programStart=sections[1].start;
}
function recompute(){
  let time=0;
  entries.forEach((e,i)=>{
    e.index=i;e.start=time;
    if(e.type==='spoken'){
      e.speechDuration=Math.max(1,words(e.text)*60/pace);
      e.breathDuration=entries[i+1]?.type==='spoken'&&entries[i+1].section===e.section?breathPause:0;
      e.duration=e.speechDuration+e.breathDuration;
    }else e.duration=e.seconds;
    time+=e.duration;e.end=time;
  });
  sections.forEach(s=>{s.start=entries[s.startIndex]?.start??0;s.end=entries[s.endIndex-1]?.end??s.start});
  programStart=sections[1]?.start||0;
  ui.seek.max=String(Math.ceil(time));
  ui['total-time'].textContent=`PROJECTED SCRIPT ${format(time)}`;
  elapsed=Math.min(elapsed,time);
  currentSection=-1;
  window.rebuildSimulation?.();
  render();
}
function currentEntry(){
  let low=0,high=entries.length-1;
  while(low<high){let mid=(low+high)>>1;if(entries[mid].end<=elapsed)low=mid+1;else high=mid}
  return entries[Math.min(low,entries.length-1)];
}
function setRunning(value){running=value;lastFrame=0;ui.play.innerHTML=value?'Ⅱ <span>Pause</span>':'▶ <span>Start</span>';ui.play.setAttribute('aria-label',value?'Pause rehearsal':'Start rehearsal');ui['session-label'].textContent=value?'RUNNING':elapsed>programStart?'PAUSED':'READY';ui['session-label'].classList.toggle('running',value);if(value)requestAnimationFrame(tick)}
function tick(ts){if(!running)return;if(lastFrame)elapsed+=(ts-lastFrame)/1000*playbackRate;lastFrame=ts;if(elapsed>=Number(ui.seek.max)){elapsed=Number(ui.seek.max);setRunning(false)}render();if(running)requestAnimationFrame(tick)}
function seekTo(n){elapsed=Math.max(0,Math.min(Number(ui.seek.max),n));lastFrame=0;render()}
function jumpSection(i){if(i<0||i>=sections.length)return;follow=true;seekTo(sections[i].start)}
function makeLine(e){
  const div=document.createElement('div');div.className=`line ${e.type==='spoken'?'spoken':'cue'}`;div.dataset.index=e.index;
  if(e.type==='spoken'){
    const ref=document.createElement('span');ref.className='row-ref';ref.textContent=`REHEARSAL COPY · SOURCE ROW ${e.row}`;div.append(ref);
    const fill=document.createElement('span');fill.className='fill';fill.textContent=e.text;div.append(fill);
  }else{
    const tag=document.createElement('span');tag.className='tag';tag.textContent=e.type==='external'?'LIVE / PLAYBACK':'CUE';div.append(tag);
    div.append(document.createTextNode(e.text));
    if(e.editable){
      const label=document.createElement('label');label.className='duration-editor';label.textContent='Hold';
      const input=document.createElement('input');input.type='number';input.min='0';input.max='7200';input.step='1';input.value=String(e.seconds);input.setAttribute('aria-label',`Hold seconds for ${e.text}`);input.dataset.durationIndex=e.index;
      label.append(input,document.createTextNode('sec'));div.append(label);
    }else{
      const dur=document.createElement('span');dur.className='cue-duration';dur.textContent=` · ${e.seconds}s estimate`;div.append(dur);
    }
  }
  return div;
}
function renderSection(si){
  const s=sections[si];currentSection=si;
  ui['section-time'].textContent=`${s.time} · REHEARSAL COPY`;
  ui['section-title'].textContent=s.title;
  ui['section-position'].textContent=`${si+1} / ${sections.length}`;
  ui['script-lines'].replaceChildren(...entries.slice(s.startIndex,s.endIndex).map(makeLine));
  ui['script-lines'].scrollTop=0;
  ui['previous-section'].disabled=si===0;
  ui['next-section'].disabled=si===sections.length-1;
  ui['section-list'].querySelectorAll('.section-link').forEach((node,i)=>{node.classList.toggle('active',i===si);if(i===si)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current')});
}
function render(){
  if(!entries.length)return;
  const e=currentEntry(),s=sections[e.section];
  if(currentSection!==e.section)renderSection(e.section);
  ui.clock.textContent=format(Math.max(0,elapsed-programStart));
  ui['cue-clock'].textContent=`${s.time} · ${format(Math.max(0,elapsed-s.start))} in this section${e.type==='spoken'&&elapsed>=e.start+e.speechDuration&&e.breathDuration?' · breathing pause':''}`;
  ui.seek.value=String(Math.floor(elapsed));
  ui['section-progress'].style.width=`${Math.max(0,Math.min(100,(elapsed-s.start)/(s.end-s.start)*100))}%`;
  ui['script-lines'].querySelectorAll('.line').forEach(node=>{
    const x=entries[Number(node.dataset.index)];
    node.classList.toggle('active',x.index===e.index);
    node.classList.toggle('done',x.end<=elapsed);
    if(x.type==='spoken')node.style.setProperty('--fill',`${x.end<=elapsed?100:x.index===e.index?Math.max(0,Math.min(100,(elapsed-x.start)/x.speechDuration*100)):0}%`);
  });
  window.updateSimulation?.(elapsed);
  const active=ui['script-lines'].querySelector('.line.active');
  if(active&&follow&&active!==render.lastActive){ui['script-lines'].scrollTo({top:active.offsetTop-ui['script-lines'].offsetTop-ui['script-lines'].clientHeight/2+active.clientHeight/2,behavior:'smooth'});render.lastActive=active}
}
ui.play.addEventListener('click',()=>setRunning(!running));
ui.reset.addEventListener('click',()=>{seekTo(programStart);setRunning(false)});
ui.back.addEventListener('click',()=>seekTo(elapsed-5));
ui.forward.addEventListener('click',()=>seekTo(elapsed+5));
ui.seek.addEventListener('input',()=>{follow=true;seekTo(Number(ui.seek.value))});
ui.pace.addEventListener('input',()=>{const old=currentEntry(),fraction=(elapsed-old.start)/old.duration;pace=Number(ui.pace.value);localStorage.setItem('topnatch-pace',String(pace));ui['pace-value'].textContent=pace;recompute();const updated=entries[old.index];seekTo(updated.start+fraction*updated.duration)});
ui.breath.addEventListener('input',()=>{const old=currentEntry(),fraction=(elapsed-old.start)/old.duration;breathPause=Number(ui.breath.value);localStorage.setItem('topnatch-breath',String(breathPause));ui['breath-value'].textContent=breathPause;recompute();const updated=entries[old.index];seekTo(updated.start+fraction*updated.duration)});
ui['previous-section'].addEventListener('click',()=>jumpSection(currentSection-1));
ui['next-section'].addEventListener('click',()=>jumpSection(currentSection+1));
ui['script-lines'].addEventListener('wheel',()=>{follow=false},{passive:true});
ui['script-lines'].addEventListener('change',event=>{
  const input=event.target;
  if(!(input instanceof HTMLInputElement)||!input.dataset.durationIndex)return;
  const target=entries[Number(input.dataset.durationIndex)];
  const seconds=Number(input.value);
  if(!Number.isFinite(seconds)||seconds<0||seconds>7200){input.value=String(target.seconds);return}
  const offset=elapsed-target.start;
  target.seconds=seconds;localStorage.setItem(target.storageKey,String(seconds));
  recompute();seekTo(target.start+Math.max(0,Math.min(seconds,offset)));
});
document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLElement&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.code==='Space'){e.preventDefault();if(e.shiftKey){seekTo(programStart);setRunning(false)}else setRunning(!running)}
  else if(e.key==='ArrowLeft'){e.preventDefault();seekTo(elapsed-5)}
  else if(e.key==='ArrowRight'){e.preventDefault();seekTo(elapsed+5)}
});
try{
  const data=JSON.parse($('script-data').textContent);
  sections=data;ui['section-count'].textContent=String(data.length);
  const nav=ui['section-list'];
  data.forEach((s,i)=>{const b=document.createElement('button');b.className='section-link';b.type='button';const t=document.createElement('span');t.className='time';t.textContent=s.time;const n=document.createElement('span');n.className='name';n.textContent=s.title;b.append(t,n);b.addEventListener('click',()=>jumpSection(i));nav.append(b)});
  assemble();jumpSection(1);
}catch(err){ui.error.hidden=false;ui.error.textContent=`Unable to load the script: ${err.message}`}
