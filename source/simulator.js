/* Measured stage, proposed blocking, synchronized to the existing script clock. */
(()=>{
const NS='http://www.w3.org/2000/svg', W=4.8768,H=2.4384;
const geometry=JSON.parse(document.getElementById('layout-data').textContent);
const el=id=>document.getElementById(id), svg=el('venue-map');
const defaults={lineup:7,diameter:.8,speed:.8,group:2,crewPositions:{},standbySize:[2.8,2.6],zones:{sr:[5.18,.65],sl:[-.35,.65],standby:[6.2,.65],search:[6.5,3.8],arc:[.4,24.2]},marks:{},routes:{},origins:{},cueOffsets:{},personStyles:{},cameras:[{id:'camera1',name:'Camera 1',x:6.4,y:3.6,angle:220,fov:60},{id:'camera2',name:'Camera 2',x:-1.5,y:4,angle:300,fov:50}]};
let config=structuredClone(defaults);try{const p=JSON.parse(localStorage.getItem('topnatch-layout-v1'));if(p)config={...config,...p,zones:{...config.zones,...p.zones}}}catch{}
let actions=[],tracks={},roster={},selectedAction=null,selectedPerson='host',view=[-3.5,-2,13,7],logicalView=[-3.5,-2,13,7],lastUI='',drag=null,workspaceMode='presentation';
const names={host:'Host CJ',emil:'Emil',nora:'Nora',camille:'Camille',jessa:'Jessa',sarah:'Sarah',louie:'Louie',cena:'Cena',joyce:'Joyce',alyssa:'Alyssa',princes:'Princes',rey:'Pastor Rey',gan:'Pastor Gan',jhun:'Pastor Jhun'};
const seniorIds=['jessa','sarah','louie','cena','camille'],juniorIds=['joyce','alyssa','princes'];
function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));if(text!==undefined)n.textContent=text;return n}
function label(g,x,y,s,size=.16,color='#E1E6DE'){g.append(node('text',{x,y,'font-size':size,'text-anchor':'middle',class:'map-label',fill:color},s))}
function save(){localStorage.setItem('topnatch-layout-v1',JSON.stringify(config));el('edit-status').textContent='Saved on this device. Export the plan to share it.'}
function actor(id,name,color='#E1E6DE',crew=false){const role=crew?'crew':id.startsWith('award-')?'awardee':id.startsWith('finalist')?'finalist':id==='host'?'host':'presenter';roster[id]={id,name,color,crew,role};return id}
const roleStyle={host:['#e08a54','star'],presenter:['#8caad2','diamond'],finalist:['#e6c46b','triangle'],awardee:['#a9c98b','initials'],crew:['#d1b3dd','square']};
function appearance(a){return {...{color:roleStyle[a.role][0],shape:roleStyle[a.role][1]},...config.personStyles?.[a.id]}}
function symbol(g,p,r,style,name){
 if(style.photo){const clipId='clip-'+Math.random().toString(36).slice(2),clip=node('clipPath',{id:clipId});clip.append(node('circle',{cx:p[0],cy:p[1],r:r*.78}));g.append(clip,node('image',{href:style.photo,x:p[0]-r*.78,y:p[1]-r*.78,width:r*1.56,height:r*1.56,'clip-path':`url(#${clipId})`,preserveAspectRatio:'xMidYMid slice'}));return}
 const cx=p[0],cy=p[1],s=r*.57;
 if(style.shape==='initials'){label(g,cx,cy+.035,name.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase(),.18);return}
 const pts=style.shape==='diamond'?[[cx,cy-s],[cx+s,cy],[cx,cy+s],[cx-s,cy]]:style.shape==='triangle'?[[cx,cy-s],[cx+s,cy+s],[cx-s,cy+s]]:style.shape==='star'?Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,rr=i%2?s*.45:s;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]}):[[cx-s,cy-s],[cx+s,cy-s],[cx+s,cy+s],[cx-s,cy+s]];
 g.append(node('polygon',{points:pts.map(x=>x.join(',')).join(' '),fill:style.color,stroke:'none'}));
}
Object.entries(names).forEach(([id,n])=>actor(id,n,id==='host'?'#E1E6DE':'#E1E6DE'));
['Male 1','Male 2','Female 1','Female 2'].forEach((n,i)=>actor('finalist'+i,n,'#E1E6DE'));
function fixtureRect(f){return {x:f.x,y:f.y,w:f.w,h:f.h}}
function intersects(p,f,r=config.diameter/2){return p[0]+r>f.x&&p[0]-r<f.x+f.w&&p[1]+r>f.y&&p[1]-r<f.y+f.h}
function stage(p){return p[0]>=0&&p[0]<=W&&p[1]>=0&&p[1]<=H}
function length(points){return points.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0)}
function along(points,frac){const total=length(points);let d=Math.max(0,Math.min(1,frac))*total;for(let i=1;i<points.length;i++){const s=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);if(d<=s)return [points[i-1][0]+(points[i][0]-points[i-1][0])*d/(s||1),points[i-1][1]+(points[i][1]-points[i-1][1])*d/(s||1)];d-=s}return points.at(-1)}
function route(from,to,kind,custom){
 if(custom?.length)return [from,...custom,to];
 if(kind==='enter')return [from,config.zones.sr,[W-.42,.65],[to[0],.65],to];
 if(kind==='exit')return [from,[from[0],.65],[.4,.65],config.zones.sl];
 return [from,to];
}
const booth=[[-3.14,-1.22],[-1.07,-1.22],[-1.07,.6],[-.55,.6],[-.55,2.83],[-2.15,2.83],[-2.15,1.58],[-3.14,1.58]];
const rear=i=>[.5+i*.81,.45], winner=i=>[.85+i*.86,1.32];
function standby(i){const p=config.zones.standby;return [p[0]+(i%3)*.86,p[1]+Math.floor(i/3)*.86]}
function arcSpot(i){const p=config.zones.arc;return [p[0]+(i%2)*.85,p[1]+Math.floor(i/2)*.85]}
function add(time,name,changes=[],opts={}){const id=opts.id||`${opts.entry?.index??'s'}-${name}`;actions.push({id,time:Math.max(0,time+(config.cueOffsets?.[id]||0)),name,changes,source:opts.source||'Proposed blocking · script cue',note:opts.note||'',entry:opts.entry,hold:opts.hold,...opts});}
function change(id,to,kind='move',delay=0){return {id,to,kind,delay}}
function resetScene(s,keep=[]){const changes=Object.keys(roster).filter(k=>!roster[k].crew&&!keep.includes(k)).map(id=>change(id,null,'hide'));add(s.start,sections.indexOf(s)+1+'. '+s.title,changes,{id:'section-'+s.id,source:'Tech script section',note:'FD at SR checks the next entrance. FM1 escorts; FM2 sets positions; FM3 keeps the queue ready.'});}
function awardName(e){const prior=entries.slice(Math.max(0,e.index-4),e.index).filter(z=>z.type==='spoken').at(-1)?.text||'Award recipient';let text=prior.split(/Our first recipient is\.\.\.|Congratulations!|Our .* is\.\.\./i).at(-1).trim();return text.length<85?text:'Award recipient · row '+e.row}
function addAward(e,group=1,queue={}){
 const ids=Array.from({length:group},(_,i)=>actor('award-'+e.index+'-'+i,group>1?`Group winner ${i+1}`:awardName(e),'#E1E6DE'));
 const searchAt=queue.findTime??Math.max(sections[e.section].start,e.start-110),readyAt=queue.readyTime??Math.max(sections[e.section].start,e.start-55);
 add(searchAt,'Locate: '+(group>1?'360 group':awardName(e)),[],{entry:e,id:'locate-'+e.index,source:'Proposed floor call · actual seating unknown',note:'FM3 identifies the awardee at their seat. Enter a starting point when the seating plan is known.'});
 add(readyAt,'Escort to SR: '+(group>1?'360 group':awardName(e)),ids.map((id,i)=>change(id,standby((queue.slot??0)+i),'escort',i*2)),{entry:e,id:'standby-'+e.index,source:'Proposed rolling SR queue',note:'FM1 escorts; FD confirms readiness. Three awardees may be called ahead, subject to a physical SR space check.'});
 add(e.start,'Enter / award / photo',ids.map((id,i)=>change(id,[.55+i*.85,1.35],'enter',i*3)),{entry:e,id:'award-'+e.index,hold:e.duration,note:'Emil and Nora present. Allow travel, handoff and photo inside this hold.'});
 const exitTime=e.end-Math.max(8,group*3+7);
 add(Math.max(e.start+2,exitTime),'Awardees exit through SL',ids.map((id,i)=>change(id,config.zones.sl,'exit',i*3)),{entry:e,id:'award-exit-'+e.index,note:'FM1 cues one-way exit at SL. Next awardee stays at SR until clear.'});
 add(e.end,'Award transition',ids.map(id=>change(id,null,'hide')),{entry:e,id:'award-hide-'+e.index,quiet:true});
}
function build(){
 actions=[];tracks={};
 for(const [id,key] of [['lineup','lineup'],['person-size','diameter'],['walk-speed','speed'],['group-size','group']])el(id).value=config[key];
 // Remove dynamically created recipient roles before rebuilding.
 Object.keys(roster).filter(k=>k.startsWith('award-')).forEach(k=>delete roster[k]);
 const crew=[['joe','Joe · Director/AD',[-2.65,-.5]],['kenneth','Kenneth · Director/AD',[-1.65,-.5]],['fm-booth','FM / PA · booth',[-1.5,1.85]],['fd','Floor Director',[5.7,-.65]],['fm1','FM1 / PA · escort',[5.8,2.55]],['fm2','FM2 / PA · positions',[6.7,2.55]],['fm3','FM3 / PA · queue',[7.6,2.55]]];
 for(let i=0;i<4;i++)crew.push(['reg'+i,'Registration '+(i+1),[config.zones.arc[0]-1.3+i*.8,config.zones.arc[1]+2]]);
 crew.forEach(([id,n,p])=>{actor(id,n,'#E1E6DE',true);add(0,n,[change(id,config.crewPositions[id]||p,'place')],{id:'crew-'+id,quiet:true,source:'Joe confirmed assignment · exact spot proposed'})});
 sections.forEach((s,si)=>{
 const es=entries.slice(s.startIndex,s.endIndex),id=s.id;
 resetScene(s,['35','36','37'].includes(id)?['emil','nora']:[]);
 if(id!=='4')add(s.start,'Host ready',[change('host',[1.8,1.1],'place')],{id:'host-'+id,note:'Host position is a rehearsal mark; adjust to sightlines.'});
 if(['35','36','37'].includes(id))add(s.start,'Presenters stay onstage',[change('emil',rear(1),'place'),change('nora',rear(2),'place')],{id:'presenters-'+id,source:'Script: Emil and Nora remain / present prizes'});
 if(id==='37')add(s.start,'Employee raffle draw onstage',[],{id:'employee-draw-setup',source:'Joe confirmed onstage · Camille confirmed random without wheel',note:'Stage position for the draw device and operator needs a floor mark. Emil and Nora present the prizes.'});
 if(id==='4'){add(s.start,'Registration open',[],{id:'registration',note:'Four registration staff near the entrance arc. Exact arc and desk positions require placement.'});return}
 if(id==='13')add(s.start,'Spin-the-Wheel · 20 winners',[],{id:'wheel',note:'Winners stand at their tables and claim at the prize area. Table and prize-area positions are not supplied; no stage entrance is assumed.'});
 if(id==='16'){
  add(Math.max(programStart,s.start-30),'Best-Dressed finalists gather at arc',Array.from({length:4},(_,i)=>change('finalist'+i,arcSpot(i),'place')),{id:'bd-standby',note:'Camille supplies Emil and Nora’s four names. Proposed gathering cue: FM3 coordinates with registration at the arc.',source:'Camille confirmed arc walk · standby lead proposed'});
  add(s.start,'Finalists waiting at arc',Array.from({length:4},(_,i)=>change('finalist'+i,arcSpot(i),'place')),{id:'bd-ready'});
 }
 let surprise=false,prizeCount=0,awardQueueIndex=0;
 const awardEntries=id==='18'?es.filter(e=>e.type==='cue'&&/award recipient walks|award presentation.*photo/i.test(e.text)):[];
 for(const e of es){const t=e.text;
  if(e.type==='spoken')continue;
  if(/^Stage entry via SR:/.test(t)){
   const who=t.split(': ')[1],key={Emil:'emil',Camille:'camille','Pastor Rey':'rey','Pastor Jhun':'jhun'}[who];
   add(Math.max(s.start,e.start-20),'Standby: '+who,[change(key,standby(0),'place')],{entry:e,id:'speaker-standby-'+e.index,source:'Proposed standby · before speech'});
   add(e.start,who+' enters via SR',[change('host',config.zones.sl,'exit'),change(key,[3.78,.79],'enter')],{entry:e,id:'speaker-in-'+e.index,hold:e.duration,note:'FM1 escorts speaker to the podium. Host clears the stage via SL.'});
  }else if(/^Stage exit via SL:/.test(t)){
   const key={Emil:'emil',Camille:'camille','Pastor Rey':'rey','Pastor Jhun':'jhun'}[t.split(': ')[1]];
   add(e.start,t,[change(key,config.zones.sl,'exit')],{entry:e,id:'speaker-out-'+e.index,hold:e.duration});
  }else if(t==='Prayer'){
   add(Math.max(s.start,e.start-20),'Pastor Gan standby',[change('gan',standby(0),'place')],{entry:e,id:'gan-ready'});
   add(e.start,'Meal prayer',[change('host',config.zones.sl,'exit'),change('gan',[3.78,.79],'enter')],{entry:e,id:'gan-in',hold:e.duration,note:'Meal prayer hold includes entrance and prayer; adjust during rehearsal.'});
   add(e.end-10,'Pastor Gan exits SL',[change('gan',config.zones.sl,'exit')],{entry:e,id:'gan-out'});
  }else if(id==='16'&&/Finalist [12] (walks onstage|enters via SR)/i.test(t)){
   const i=(/Female/.test(t)?2:0)+(/Finalist 2/.test(t)?1:0);
   add(e.start,`${roster['finalist'+i].name}: solo fashion walk`,[change('finalist'+i,rear(i),'enter')],{entry:e,id:'finalist-'+i,hold:e.duration,note:'One at a time: arc → SR → runway pose → brief question → lineup. Clear the walk lane before the next entrant.',source:'Camille confirmed walk · exact path and finalist names pending'});
  }else if(id==='16'&&/Winner steps forward/.test(t)){
   const i=prizeCount++===0?0:2;add(e.start,'Demo winner moves to photo mark',[change('finalist'+i,winner(i===0?0:1))],{entry:e,id:'bd-winner-'+i,note:'Demo uses Male 1 and Female 1. Actual winners are unknown.'});
  }else if(id==='16'&&/Jessa Regal joins/.test(t)){
   add(Math.max(s.start,e.start-20),'Jessa on standby',[change('jessa',standby(0),'place')],{entry:e,id:'jessa-ready'});
   add(e.start,'Jessa presents Best-Dressed prizes',[change('jessa',rear(3),'enter')],{entry:e,id:'jessa-award',hold:e.duration,source:'Camille confirmed Jessa awarding',note:'Two prizes; winning positions are placeholders.'});
  }else if(id==='16'&&/Non-winning finalists clear/.test(t))add(e.start,'Non-winners exit SL',[change('finalist1',config.zones.sl,'exit'),change('finalist3',config.zones.sl,'exit',3)],{entry:e,id:'bd-nonwinners'});
  else if(id==='16'&&/Presenters and winners clear/.test(t))add(e.start,'Best-Dressed clears stage',['jessa','finalist0','finalist2'].map((x,i)=>change(x,config.zones.sl,'exit',i*3)),{entry:e,id:'bd-clear',hold:e.duration});
  else if(id==='18'&&/Calangi.*Villanueva proceed/.test(t)){
   add(Math.max(s.start,e.start-20),'Emil and Nora standby',[change('emil',standby(0),'place'),change('nora',standby(1),'place')],{entry:e,id:'aw-presenters-ready'});
   add(e.start,'Emil and Nora enter',[change('emil',rear(1),'enter'),change('nora',rear(2),'enter',3),change('host',config.zones.sl,'exit')],{entry:e,id:'aw-presenters',hold:e.duration});
  }else if(/Five senior managers walk/.test(t)){
   surprise=true;const group=[...seniorIds,...(config.lineup===10?juniorIds:[])];
   add(Math.max(s.start,e.start-35),'Surprise award: managers standby',group.map((x,i)=>change(x,standby(i),'place')),{entry:e,id:'surprise-ready',source:'Camille: 5 seniors; juniors conditional · standby lead proposed',note:'FD gathers discreetly at SR. Keep entry clear; names from company presentation pages 32–34.'});
   add(e.start,'Surprise award: '+config.lineup+' person lineup',[change('host',config.zones.sl,'exit'),change('emil',winner(0)),change('nora',winner(1)),...group.map((x,i)=>change(x,i<5?rear(i):[2.6+(i-5)*.78,1.05],'enter',i*5))],{entry:e,id:'surprise-lineup',hold:e.duration,source:'Confirmed senior roster · stage marks proposed · juniors test only',note:'FM1 escorts; FM2 directs marks; FM3 advances queue. Check overlaps and SR access before accepting the lineup.'});
  }else if(id==='18'&&/award recipient walks|award presentation.*photo/i.test(t)){
   if(surprise)add(e.start,'30 Years of Leadership · presentation / photo',[],{entry:e,id:'surprise-photo',hold:e.duration,note:'Nora and the managers recognise Emil. Group blocking remains a proposal.'});
   else {const index=awardQueueIndex++,queue={slot:index%3,readyTime:index<3?s.start:awardEntries[index-3]?.start??e.start-55,findTime:index<5?s.start:awardEntries[index-5]?.start??e.start-110};addAward(e,1,queue)}
  }else if(['35','36','37'].includes(id)&&/prize presentation.*photo/i.test(t)){
   const group=id==='35'&&prizeCount++===1?config.group:1;addAward(e,group);
  }else if(/onstage random draw/i.test(t)&&id==='37')add(e.start,'Employee raffle: random draw onstage',[],{entry:e,id:'raffle-draw-'+e.index,source:'Joe confirmed onstage · Camille confirmed random without wheel',note:'Boss Emil and Ms. Nora onstage. Drawing device and operator still need confirmation.'});
  else if(/video.*GO|Same Day Edit playback/i.test(t))add(e.start,'Playback: clear sightline',[change('host',config.zones.sl,'exit')],{entry:e,id:'video-'+e.index,note:'Joe / Kenneth call video and audio GO from the tech booth. FM at booth relays readiness.'});
  else if(e.type==='external')add(e.start,e.text,[],{entry:e,id:'external-'+e.index,note:id==='11'?'Band remains offstage. Floor team prepares the next participants at SR.':'Tech booth follows the live speaker/playback; hold is adjustable.'});
 }
 if(id==='18'){
  const next=sections[si+1];add(s.end-12,'Managers exit SL; Emil and Nora remain',[...seniorIds,...juniorIds].map((x,i)=>change(x,config.zones.sl,'exit',i*2)),{id:'surprise-exit',note:'Proposed transition to 360 prizes. Check the remaining hold allows all managers to leave.'});
 }
 if(id==='39'||id==='45')add(s.start,'Host / audience interaction',[],{id:'audience-'+id,note:id==='45'?'Program adjournment, free time and second band set. Registration team release time is not specified.':'Audience ad-libs: no audience travel is assumed.'});
 });
 actions.sort((a,b)=>a.time-b.time);
 const events=actions.flatMap(a=>a.changes.map(c=>({a,c,time:a.time+(c.delay||0)}))).sort((x,y)=>x.time-y.time);
 for(const {a,c} of events){
  const arr=tracks[c.id]||(tracks[c.id]=[]),at=a.time+(c.delay||0),prev=position(c.id,at),dest=config.marks[a.id]?.[c.id]||c.to;
  if(!dest){arr.push({time:at,to:null,duration:0,points:[],action:a});continue}
  const start=prev||(config.origins?.[c.id])||(['enter','escort'].includes(c.kind)?config.zones.search:dest),points=route(start,dest,c.kind,config.routes[a.id]?.[c.id]);
  const duration=c.kind==='place'?0:length(points)/config.speed+(['enter','exit','escort'].includes(c.kind)?3:0);
  arr.push({time:at,to:dest,duration,points,action:a,kind:c.kind});
 }
 const visible=actions.filter(a=>!a.quiet);
 el('movement-select').replaceChildren(...visible.map(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=`${format(Math.max(0,a.time-programStart))} · ${a.name}`;return o}));
 el('selected-person').replaceChildren(...Object.values(roster).map(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;return o}),...config.cameras.map(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;return o}));
 el('selected-person').value=selectedPerson;
 drawStatic();renderLegend();syncInspector();el('standby-width').value=config.standbySize[0].toFixed(2);el('standby-depth').value=config.standbySize[1].toFixed(2);lastUI='';update(elapsed);syncCrewInputs();
}
function renderLegend(){const root=el('people-legend');root.replaceChildren();for(const a of Object.values(roster)){const style=appearance(a),b=document.createElement('button');b.type='button';b.className='legend-person';b.style.setProperty('--role-color',style.color);b.textContent=`${style.photo?'▣':{diamond:'◆',triangle:'▲',star:'★',square:'■',initials:'●'}[style.shape]||'●'} ${a.name}`;b.title=`${a.role} · select to edit`;b.onclick=()=>{selectedPerson=a.id;el('selected-person').value=a.id;syncInspector();syncCrewInputs();lastUI='';update(elapsed)};root.append(b)}}
function syncInspector(){const a=roster[selectedPerson],style=a?appearance(a):null;el('person-color').value=style?.color||'#e08a54';el('person-shape').value=style?.shape||'initials';el('cue-offset').value=selectedAction?config.cueOffsets?.[selectedAction.id]||0:0}
function position(id,t){const track=tracks[id];if(!track)return null;let k=track.length-1;while(k>=0&&track[k].time>t)k--;if(k<0)return null;const a=track[k];if(!a.to||(a.kind==='exit'&&t>=a.time+a.duration))return null;return a.duration?along(a.points,(t-a.time)/a.duration):a.to}
function activeTrack(id,t){return (tracks[id]||[]).findLast(a=>a.time<=t)}
function drawStatic(){
 const img=geometry.image;el('floor-layer').replaceChildren(node('image',{href:'assets/floorplan.webp',x:img.x,y:img.y,width:img.width,height:img.height,opacity:.82}));
 const g=el('static-layer');g.replaceChildren(node('rect',{x:0,y:0,width:W,height:H,fill:'#292931','fill-opacity':1,stroke:'#E1E6DE','stroke-width':.04}),node('rect',{x:0,y:0,width:W,height:H,fill:'url(#metre-grid)'}));
 geometry.fixtures.forEach(f=>{g.append(node('rect',{x:f.x,y:f.y,width:f.w,height:f.h,fill:'#292931','fill-opacity':1,stroke:'#E1E6DE','stroke-width':.022}));label(g,f.x+f.w/2,f.y+f.h/2+.04,f.id,.14)});
 g.append(node('polygon',{points:booth.map(p=>p.join(',')).join(' '),fill:'#292931','fill-opacity':1,stroke:'#E1E6DE','stroke-width':.025,'stroke-dasharray':'.1 .1'}));label(g,-2.1,-.85,'TECH BOOTH',.19);
 label(g,W/2,-.25,'STAGE · 4.88 × 2.44 m',.2);label(g,W/2,H+.3,'SF · STAGE FRONT',.18);
 const z=config.zones;
 g.append(node('rect',{x:z.standby[0]-.5,y:z.standby[1]-.45,width:config.standbySize[0],height:config.standbySize[1],'data-boundary':'move',fill:'none',stroke:'#E1E6DE','stroke-width':.025,'stroke-dasharray':'.1 .1'}));label(g,z.standby[0]+.8,z.standby[1]-.65,'SR STANDBY · proposed marks',.16);
 if(workspaceMode==='editing'&&el('edit-mode').value==='boundary'){for(const [key,x,y] of [['nw',z.standby[0]-.5,z.standby[1]-.45],['ne',z.standby[0]-.5+config.standbySize[0],z.standby[1]-.45],['sw',z.standby[0]-.5,z.standby[1]-.45+config.standbySize[1]],['se',z.standby[0]-.5+config.standbySize[0],z.standby[1]-.45+config.standbySize[1]]])g.append(node('rect',{x:x-.13,y:y-.13,width:.26,height:.26,fill:'#E1E6DE',stroke:'#E1E6DE','stroke-width':.03,'data-boundary':key}));}
 ['sr','sl','arc','standby','search'].forEach(k=>{const p=z[k];const handle=node('circle',{cx:p[0],cy:p[1],r:.12,fill:'#E1E6DE',class:'map-zone','data-zone':k});g.append(handle);label(g,p[0],p[1]-.2,k==='sr'?'SR IN':k==='sl'?'SL OUT':k==='arc'?'ENTRANCE ARC · place on plan':k==='search'?'GUEST ORIGIN TBD':'',.16)});
}
function cameraDraw(){const g=el('camera-layer');g.replaceChildren();if(!el('show-camera').checked)return;for(const c of config.cameras){const rad=a=>a*Math.PI/180,len=8,a=rad(c.angle-c.fov/2),b=rad(c.angle+c.fov/2);g.append(node('path',{d:`M${c.x} ${c.y} L${c.x+Math.cos(a)*len} ${c.y+Math.sin(a)*len} A${len} ${len} 0 0 1 ${c.x+Math.cos(b)*len} ${c.y+Math.sin(b)*len} Z`,fill:'none',stroke:'#E1E6DE','stroke-width':.02}));g.append(node('circle',{cx:c.x,cy:c.y,r:.18,fill:'#E1E6DE','data-camera':c.id}));label(g,c.x,c.y-.3,c.name+' · proposed',.16)}}
function update(t){
 document.querySelectorAll('.duration-editor input').forEach(i=>i.disabled=workspaceMode==='presentation');
 const current=actions.filter(a=>!a.quiet&&a.time<=t).at(-1)||actions[0];selectedAction=current;
 const actors=el('actor-layer'),routes=el('route-layer');actors.replaceChildren();routes.replaceChildren();
 const present=[];for(const a of Object.values(roster)){const p=position(a.id,t);if(!p)continue;present.push({...a,p});if(a.crew&&!el('show-crew').checked)continue;const tr=activeTrack(a.id,t),style=appearance(a),rad=config.diameter/2,g=node('g',{class:'actor-token','data-actor':a.id});g.append(node('circle',{cx:p[0],cy:p[1],r:rad,fill:'#292931','fill-opacity':1,style:`stroke:${style.color}`, 'stroke-width':.045,'stroke-dasharray':a.crew?'.08 .04':'none'}));symbol(g,p,rad,style,a.name);label(g,p[0],p[1]+rad+.16,a.name,.13);actors.append(g);
 if(el('show-routes').checked&&tr?.duration&&t<tr.time+tr.duration){routes.append(node('polyline',{points:tr.points.map(x=>x.join(',')).join(' '),class:'route-line','marker-end':'url(#route-arrow)'}));}
 }
 const mode=workspaceMode==='editing'?el('edit-mode').value:'none';
 if(mode==='mark'||mode==='route')for(const c of current?.changes||[]){if(!c.to||c.kind==='hide')continue;const p=config.marks[current.id]?.[c.id]||c.to;actors.append(node('circle',{cx:p[0],cy:p[1],r:config.diameter/2+.04,class:'mark-handle','data-mark':c.id}));if(c.id===selectedPerson){const custom=config.routes[current.id]?.[c.id]||[];custom.forEach((p,i)=>actors.append(node('circle',{cx:p[0],cy:p[1],r:.12,fill:'#E1E6DE','data-waypoint':i})));}}
 if(mode==='origin'&&config.origins?.[selectedPerson]){const p=config.origins[selectedPerson];actors.append(node('circle',{cx:p[0],cy:p[1],r:.18,fill:'#e08a54','data-origin':selectedPerson}));label(actors,p[0],p[1]-.3,'START · '+(roster[selectedPerson]?.name||''),.16)}
 cameraDraw();
 const key=`${current?.id}:${Math.floor(t*2)}:${config.lineup}`;if(lastUI===key)return;lastUI=key;
 const onstage=present.filter(a=>!a.crew&&stage(a.p));el('occupancy').textContent=`${onstage.length} onstage · ${config.diameter.toFixed(1)} m circles`;el('sim-phase').textContent=current?.name||'Standby';
 el('movement-select').value=current?.id||'';el('cue-offset').value=config.cueOffsets?.[current?.id]||0;
 el('stage-instruction').textContent=current?.note||'Follow the host script. FD controls SR entry; FM1–3 guide participants and keep access clear.';
 const next=actions.find(a=>a.time>t&&!a.quiet);el('standby-instruction').textContent=next?`Next in ${format(next.time-t)}: ${next.name}`:'End of rehearsal sequence.';
 renderStandbyBoard(t);
 el('cue-evidence').textContent=current?.source||'';
 const si=currentEntry()?.section||0,s=sections[si],start=parseTime(s.time),projected=18*3600+30*60+s.start-programStart,drift=Math.round((projected-start)/60);
 el('schedule-drift').textContent=si===0?'Registration before 6:30 start':`Section start ${clockTime(projected)} · ${drift>=0?'+':''}${drift} min vs sheet`;
 const warnings=[];for(const a of onstage){for(const f of geometry.fixtures)if(intersects(a.p,f))warnings.push(`${a.name} overlaps ${f.id}.`);if(a.p[0]<config.diameter/2||a.p[0]>W-config.diameter/2||a.p[1]<config.diameter/2||a.p[1]>H-config.diameter/2)warnings.push(`${a.name} circle crosses stage edge.`)}
 for(let i=0;i<onstage.length;i++)for(let j=i+1;j<onstage.length;j++)if(Math.hypot(onstage[i].p[0]-onstage[j].p[0],onstage[i].p[1]-onstage[j].p[1])<config.diameter-.015)warnings.push(`${onstage[i].name} / ${onstage[j].name}: spacing overlap.`);
 if(current?.hold){const moving=Object.values(tracks).flat().filter(x=>x.action.id===current.id);const required=Math.max(0,...moving.map(x=>x.time-current.time+x.duration));if(required>current.hold)warnings.push(`Travel needs ~${Math.ceil(required)}s; cue allows ${Math.round(current.hold)}s. Increase the hold.`)}
 if(config.lineup===10&&/surprise/i.test(current?.id||''))warnings.push('10-person scenario is a test; junior inclusion is not approved.');
 if(si===6)warnings.push('Arc route and final photo lineup require confirmation.');
 warnings.push('Missing map positions: second monitor and any additional flowers.');
 const ul=el('space-warnings');ul.replaceChildren(...[...new Set(warnings)].slice(0,7).map(s=>{const li=document.createElement('li');li.textContent=s;return li}));
}
function renderStandbyBoard(t){
 const root=el('standby-board');root.replaceChildren();const awards=currentEntry()?.section===7;
 if(awards){const calls=actions.filter(a=>a.id.startsWith('award-')&&a.entry?.section===7&&a.name==='Enter / award / photo');const active=calls.find(a=>a.time<=t&&a.entry.end>t),next=calls.filter(a=>a.time>t).slice(0,5),list=[...(active?[active]:[]),...next];for(const [i,a] of list.entries()){const item=document.createElement('div');item.className='standby-item';const name=document.createElement('strong');name.textContent=roster[a.changes[0]?.id]?.name||'Awardee';const state=document.createElement('span');const escort=actions.find(x=>x.id==='standby-'+a.entry.index);state.textContent=a===active?'ON STAGE':i-(active?1:0)>=3?'LOCATE NEXT':escort?.time<=t?'ESCORT / VERIFY SR':'PREP FOR SR';item.append(name,state);root.append(item)}el('origin-warning').textContent=next.some(a=>!config.origins?.[a.changes[0]?.id])?'Seat locations are unconfirmed. Place each awardee’s starting point in Edit layout before using paths for PA briefing.':'';return}
 const next=actions.filter(a=>a.time>=t&&/standby|gather|locate|escort/i.test(a.name)).slice(0,3);for(const a of next){const item=document.createElement('div');item.className='standby-item';const name=document.createElement('strong');name.textContent=a.name;const state=document.createElement('span');state.textContent=`IN ${format(a.time-t)}`;item.append(name,state);root.append(item)}el('origin-warning').textContent=next.length?'Positions are proposed until their floor locations are checked.':'No upcoming standby cue in this section.';
}
function parseTime(s){const [_,h,m,amp]=s.match(/(\d+):(\d+)\s*(AM|PM)/);return ((Number(h)%12)+(amp==='PM'?12:0))*3600+Number(m)*60}
function clockTime(s){s=((s%86400)+86400)%86400;const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
function setView(v,remember=true){if(remember)logicalView=[...v];const b=svg.getBoundingClientRect();if(b.width&&b.height){const ratio=b.width/b.height,cx=v[0]+v[2]/2,cy=v[1]+v[3]/2;let w=v[2],h=v[3];if(w/h>ratio)h=w/ratio;else w=h*ratio;v=[cx-w/2,cy-h/2,w,h]}view=v;svg.setAttribute('viewBox',v.join(' '))}
function point(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return [q.x,q.y]}
function zoom(f,c=[view[0]+view[2]/2,view[1]+view[3]/2]){const w=Math.max(5,Math.min(40,view[2]*f)),ratio=w/view[2];setView([c[0]+(view[0]-c[0])*ratio,c[1]+(view[1]-c[1])*ratio,w,view[3]*ratio])}
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.1:.9,point(e))},{passive:false});
const pointers=new Map();let pinch=null;
svg.addEventListener('pointerdown',e=>{
 const p=point(e);pointers.set(e.pointerId,[e.clientX,e.clientY]);svg.setPointerCapture(e.pointerId);if(pointers.size===2){const ps=[...pointers.values()];pinch=Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]);drag=null;return}
 const mode=workspaceMode==='editing'?el('edit-mode').value:'none',target=e.target.closest('[data-actor],[data-mark],[data-zone],[data-camera],[data-waypoint],[data-boundary],[data-origin]');
 if(target?.dataset.actor){selectedPerson=target.dataset.actor;el('selected-person').value=selectedPerson;syncCrewInputs()}
 if(mode!=='none')setRunning(false);
 if(mode==='origin'){if(!roster[selectedPerson]||roster[selectedPerson].crew){el('edit-status').textContent='Select a guest, finalist, speaker, or awardee first.';return}config.origins??={};config.origins[selectedPerson]=p;save();build();return}
 if(mode==='route'&&!target&&selectedAction){const c=selectedAction.changes.find(c=>c.id===selectedPerson&&c.to);if(c){config.routes[selectedAction.id]??={};config.routes[selectedAction.id][selectedPerson]??=[];config.routes[selectedAction.id][selectedPerson].push(p);save();build();return}else{el('edit-status').textContent='Choose a cue where this person moves, then click to add route points.';return}}
 if(mode==='crew'&&target?.dataset.actor&&roster[target.dataset.actor]?.crew)drag={type:'crew',id:target.dataset.actor};
 else if(mode==='boundary'&&target?.dataset.boundary)drag={type:'boundary',edge:target.dataset.boundary,start:p,origin:[...config.zones.standby],size:[...config.standbySize]};
 else if(mode==='mark'&&target?.dataset.mark)drag={type:'mark',id:target.dataset.mark,action:selectedAction.id};
 else if(mode==='route'&&target?.dataset.waypoint!==undefined)drag={type:'waypoint',i:Number(target.dataset.waypoint),action:selectedAction.id,id:selectedPerson};
 else if(mode==='zones'&&target?.dataset.zone)drag={type:'zone',id:target.dataset.zone};
 else if(mode==='camera'&&target?.dataset.camera){drag={type:'camera',id:target.dataset.camera};selectedPerson=drag.id;el('selected-person').value=drag.id}
 else drag={type:'pan',start:p,view:[...view]};
});
svg.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const ps=[...pointers.values()],d=Math.hypot(ps[0][0]-ps[1][0],ps[0][1]-ps[1][1]);if(pinch)zoom(pinch/d);pinch=d;return}
 if(!drag)return;const p=point(e);
 if(drag.type==='pan'){setView([view[0]+drag.start[0]-p[0],view[1]+drag.start[1]-p[1],view[2],view[3]]);return}
 if(drag.type==='crew')config.crewPositions[drag.id]=p;
 if(drag.type==='boundary'){const dx=p[0]-drag.start[0],dy=p[1]-drag.start[1],e=drag.edge;let x=drag.origin[0],y=drag.origin[1],w=drag.size[0],h=drag.size[1];if(e==='move'){x+=dx;y+=dy}else{if(e.includes('w')){const d=Math.min(dx,w-.5);x+=d;w-=d}if(e.includes('e'))w=Math.max(.5,w+dx);if(e.includes('n')){const d=Math.min(dy,h-.5);y+=d;h-=d}if(e.includes('s'))h=Math.max(.5,h+dy)}config.zones.standby=[x,y];config.standbySize=[w,h];}
 if(drag.type==='mark'){config.marks[drag.action]??={};config.marks[drag.action][drag.id]=p}
 if(drag.type==='waypoint')config.routes[drag.action][drag.id][drag.i]=p;
 if(drag.type==='zone')config.zones[drag.id]=p;
 if(drag.type==='camera'){const c=config.cameras.find(c=>c.id===drag.id);c.x=p[0];c.y=p[1]}
 build();
});
function release(e){pointers.delete(e.pointerId);if(drag&&drag.type!=='pan')save();drag=null;pinch=null}
svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release);
el('view-stage').onclick=()=>setView([-3.5,-2,13,7]);el('view-venue').onclick=()=>setView([geometry.image.x,geometry.image.y,geometry.image.width,geometry.image.height]);el('zoom-in').onclick=()=>zoom(.8);el('zoom-out').onclick=()=>zoom(1.25);
['show-crew','show-routes','show-camera','edit-mode'].forEach(id=>el(id).onchange=()=>{lastUI='';drawStatic();update(elapsed)});
for(const [id,key] of [['lineup','lineup'],['person-size','diameter'],['walk-speed','speed'],['group-size','group']]){el(id).value=config[key];el(id).onchange=()=>{const v=Number(el(id).value);if(!Number.isFinite(v)||v<=0)return;config[key]=key==='group'?Math.min(10,Math.max(2,Math.round(v))):v;save();build()}}
el('playback-speed').onchange=()=>{playbackRate=Number(el('playback-speed').value);lastFrame=0};
el('movement-select').onchange=()=>{setRunning(false);const a=actions.find(a=>a.id===el('movement-select').value);if(a)seekTo(a.time+.001)};
function step(dir){const list=actions.filter(a=>!a.quiet),a=dir>0?list.find(a=>a.time>elapsed+.01):list.findLast(a=>a.time<elapsed-.01);if(a){setRunning(false);seekTo(a.time+.001)}}
el('prev-move').onclick=()=>step(-1);el('next-move').onclick=()=>step(1);
el('selected-person').onchange=()=>{selectedPerson=el('selected-person').value;syncCrewInputs();syncInspector();const c=config.cameras.find(c=>c.id===selectedPerson);if(c){el('camera-angle').value=c.angle;el('camera-fov').value=c.fov;el('show-camera').checked=true}lastUI='';update(elapsed)};
el('cue-offset').onchange=()=>{if(!selectedAction)return;const n=Number(el('cue-offset').value);if(!Number.isFinite(n)||n<-300||n>300)return;config.cueOffsets??={};config.cueOffsets[selectedAction.id]=n;save();build()};
for(const [id,key] of [['person-color','color'],['person-shape','shape']])el(id).onchange=()=>{if(!roster[selectedPerson])return;config.personStyles??={};config.personStyles[selectedPerson]??={};config.personStyles[selectedPerson][key]=el(id).value;save();renderLegend();lastUI='';update(elapsed)};
el('person-photo').onchange=async()=>{const file=el('person-photo').files[0];if(!file||!roster[selectedPerson])return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>250000){el('edit-status').textContent='Use a PNG, JPEG, or WebP under 250 KB.';return}const target=selectedPerson;const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});config.personStyles??={};config.personStyles[target]??={};config.personStyles[target].photo=data;save();renderLegend();lastUI='';update(elapsed);el('person-photo').value=''};
el('clear-person-photo').onclick=()=>{if(config.personStyles?.[selectedPerson])delete config.personStyles[selectedPerson].photo;save();renderLegend();lastUI='';update(elapsed)};
el('clear-origin').onclick=()=>{if(config.origins?.[selectedPerson])delete config.origins[selectedPerson];save();build()};
for(const [id,key] of [['camera-angle','angle'],['camera-fov','fov']])el(id).oninput=()=>{const c=config.cameras.find(c=>c.id===selectedPerson);if(!c){el('edit-status').textContent='Select Camera 1 or Camera 2 first.';return}c[key]=Number(el(id).value);save();cameraDraw()};
el('clear-route').onclick=()=>{if(selectedAction&&config.routes[selectedAction.id])delete config.routes[selectedAction.id][selectedPerson];save();build()};
el('reset-layout').onclick=()=>{if(!confirm('Reset your local positions and routes? Export first if you want to keep them.'))return;config=structuredClone(defaults);save();build()};
el('export-plan').onclick=()=>{const holds={};entries.filter(e=>e.editable).forEach(e=>holds[e.storageKey]=e.seconds);const blob=new Blob([JSON.stringify({version:1,event:'Topnatch',config,pace,breathPause,holds},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Topnatch-rehearsal-plan.json';a.click();URL.revokeObjectURL(url)};
el('import-plan').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(p.version!==1||p.event!=='Topnatch'||!p.config)throw Error('Use an exported Topnatch plan.');const c=p.config;const validPoint=v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<100);if(!Object.values(c.zones||{}).every(validPoint)||![7,10].includes(c.lineup)||![.8,.9,1].includes(c.diameter)||![.6,.8,1].includes(c.speed))throw Error('Invalid plan coordinates or settings.');if(!Array.isArray(c.cameras)||c.cameras.length>4||!c.cameras.every(v=>validPoint([v.x,v.y])&&Number.isFinite(v.angle)&&v.angle>=0&&v.angle<=359&&Number.isFinite(v.fov)&&v.fov>=20&&v.fov<=120&&typeof v.id==='string'&&typeof v.name==='string')||!Number.isInteger(c.group)||c.group<2||c.group>10)throw Error('Invalid camera or group settings.');if(c.crewPositions&&!Object.values(c.crewPositions).every(validPoint))throw Error('Invalid crew positions.');if(c.standbySize&&(!validPoint(c.standbySize)||c.standbySize.some(v=>v<.5)))throw Error('Invalid standby dimensions.');if(c.origins&&!Object.values(c.origins).every(validPoint))throw Error('Invalid starting points.');if(c.cueOffsets&&!Object.values(c.cueOffsets).every(v=>Number.isFinite(v)&&v>=-300&&v<=300))throw Error('Invalid cue offsets.');if(c.personStyles&&!Object.values(c.personStyles).every(v=>/^#[0-9a-f]{6}$/i.test(v.color||'#e08a54')&&['initials','diamond','square','triangle','star'].includes(v.shape||'initials')&&(!v.photo||(/^data:image\/(png|jpeg|webp);base64,/.test(v.photo)&&v.photo.length<350000))))throw Error('Invalid person styling.');for(const m of Object.values(c.marks||{}))if(!Object.values(m).every(validPoint))throw Error('Invalid arrival marks.');for(const r of Object.values(c.routes||{}))if(!Object.values(r).every(ps=>Array.isArray(ps)&&ps.length<200&&ps.every(validPoint)))throw Error('Invalid route.');config={...structuredClone(defaults),...c,zones:{...defaults.zones,...c.zones}};for(const [k,v]of Object.entries(p.holds||{}))if(k.startsWith('topnatch-hold-')&&Number.isFinite(v)&&v>=0&&v<=7200)localStorage.setItem(k,String(v));if(p.pace>=90&&p.pace<=190){pace=p.pace;localStorage.setItem('topnatch-pace',pace);ui.pace.value=pace;ui['pace-value'].textContent=pace}if(p.breathPause>=0&&p.breathPause<=4){breathPause=p.breathPause;localStorage.setItem('topnatch-breath',breathPause);ui.breath.value=breathPause;ui['breath-value'].textContent=breathPause}setRunning(false);save();assemble();build();el('edit-status').textContent='Plan imported on this device.'}catch(err){el('edit-status').textContent='Import failed: '+err.message}};
function syncCrewInputs(){const p=position(selectedPerson,elapsed);if(roster[selectedPerson]?.crew&&p){el('crew-x').value=p[0].toFixed(2);el('crew-y').value=p[1].toFixed(2)}}
function setWorkspaceMode(mode){workspaceMode=mode;document.body.dataset.mode=mode;el('presentation-mode').setAttribute('aria-pressed',String(mode==='presentation'));el('editing-mode').setAttribute('aria-pressed',String(mode==='editing'));if(mode==='editing'){setRunning(false);el('edit-mode').value='crew';el('show-crew').checked=true;document.querySelector('.plan-editor').open=true;}else el('edit-mode').value='none';el('workspace-mode-help').textContent=mode==='editing'?'Editing paused · drag crew or choose a boundary / route tool below.':'Presentation · follow the current cue and standby instructions.';drawStatic();lastUI='';update(elapsed)}
el('presentation-mode').onclick=()=>setWorkspaceMode('presentation');el('editing-mode').onclick=()=>setWorkspaceMode('editing');
for(const [id,i]of [['standby-width',0],['standby-depth',1]])el(id).onchange=()=>{const n=Number(el(id).value);if(!Number.isFinite(n)||n<.5||n>20){el(id).value=config.standbySize[i].toFixed(2);return}config.standbySize[i]=n;save();build()};
el('reset-crew-position').onclick=()=>{if(!roster[selectedPerson]?.crew){el('edit-status').textContent='Select a crew member first.';return}delete config.crewPositions[selectedPerson];save();build()};
el('place-crew').onclick=()=>{if(!roster[selectedPerson]?.crew){el('edit-status').textContent='Select a crew member first.';return}const x=Number(el('crew-x').value),y=Number(el('crew-y').value);if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>100||Math.abs(y)>100)return;config.crewPositions[selectedPerson]=[x,y];save();build()};
window.updateSimulation=update;window.rebuildSimulation=build;build();setWorkspaceMode('presentation');setView(logicalView);if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>setView(logicalView,false)).observe(svg);
})();
