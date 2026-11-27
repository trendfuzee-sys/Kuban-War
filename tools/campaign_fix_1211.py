from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
# Lift hero level text above both the 2D sprite and 3D model.
s=s.replace("g.strokeText('ур.'+e.lv,e.x,e.y-r*2.3)","g.strokeText('ур.'+e.lv,e.x,e.y-Math.max(58,r*3.8))").replace("g.fillText('ур.'+e.lv,e.x,e.y-r*2.3)","g.fillText('ур.'+e.lv,e.x,e.y-Math.max(58,r*3.8))")
if 'KW_CAMPAIGN_1211' in s:
    import re
    module=Path(__file__).with_name('campaign_1211.js').read_text(encoding='utf-8')
    matches=list(re.finditer(r'<script>\s*/\* KW_CAMPAIGN_1211 \*/.*?</script>',s,re.S))
    if len(matches)!=1:raise RuntimeError('Unexpected campaign module')
    m=matches[0]
    p.write_text(s[:m.start()]+'<script>/* KW_CAMPAIGN_1211 */\n'+module+'\n</script>'+s[m.end():],encoding='utf-8')
    sys.exit(0)
changes=[["var dinoEnabled=false;","var dinoEnabled=false;try{dinoEnabled=localStorage.getItem('kw.unlock.campaign')==='1'}catch(_){}"],["Открывает кампании на текущий сеанс без отметки о прохождении.","Открывает все главы до повторного ввода кода, не отмечая их пройденными."],["u.cr*(u.team==1?mis.inc:1)*(u.race==='kaz'&&mis.ci!==4?.85:1)","u.cr*(window.kubanOnlineAlpha?.currentMatch?((u.team==1?mis.inc:1)*(u.race==='kaz'&&mis.ci!==4?.85:1)):(mis.ci>=0?(u.team===0?1:mis.inc):(u.team===0?1.55:mis.inc)))"],["(u.cr||0)*(u.team===1?mis.inc:1)*(u.race==='kaz'?.85:1)+(u.fishCargo||0)*(u.team===1?mis.inc:1)","window.kubanOnlineAlpha?.currentMatch?((u.cr||0)*(u.team===1?mis.inc:1)*(u.race==='kaz'?.85:1)+(u.fishCargo||0)*(u.team===1?mis.inc:1)):((u.cr||0)+(u.fishCargo||0))*(mis.ci>=0?(u.team===0?1:mis.inc):(u.team===0?1.45:mis.inc))"],["gold[1]+=120;mis.inc*=1.18;","gold[1]+=0;"],["if(militaryAI())gold[1]+=250;","if(militaryAI())gold[1]+=0;"],["gold[1]+=[45,75,105][mis.d]||75","gold[1]+=[0,5,12][mis.d]||0"],["gold[1]+=seq<7?90:160;","gold[1]+=0;"],["u.team===1&&militaryAI()?1.30:1","u.team===1&&militaryAI()?1.0:1"],["b.team===1&&militaryAI()?1.90:1","b.team===1&&militaryAI()?1.0:1"],["f.spyAt=t+9;","f.spyAt=t+25;"],["f.raidAt=t+65;","f.raidAt=t+100;"],["case'kop':gold[0]+=75;","case'kop':gold[0]+=window.kubanOnlineAlpha?.currentMatch?75:115;"],["gold[T]+=gv;T==0&&ft(u,'+'+gv+' золота')","const reward=T===0&&!window.kubanOnlineAlpha?.currentMatch?Math.round(gv*1.5):gv;gold[T]+=reward;T==0&&ft(u,'+'+reward+' золота')"]]
for a,b in changes:
    if s.count(a)!=1:raise RuntimeError('Unexpected campaign anchor: '+a)
    s=s.replace(a,b,1)
module=Path(__file__).with_name('campaign_1211.js').read_text(encoding='utf-8')
anchor='</body>'
if s.count(anchor)!=1:raise RuntimeError('Missing body')
s=s.replace(anchor,'<script>/* KW_CAMPAIGN_1211 */\n'+module+'\n</script>'+anchor,1)
p.write_text(s,encoding='utf-8')
