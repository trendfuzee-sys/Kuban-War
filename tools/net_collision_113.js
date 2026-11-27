// Spatial broad-phase. Preserve original ordered pair resolution.
function kwNetCollide(us,W,H,valid){
  const maxR=us.reduce((m,u)=>Number.isFinite(u.r)?Math.max(m,u.r):m,0);
  const cell=Math.max(32,Math.min(96,maxR*2||32)),margin=24,buckets=new Map(),keys=new Array(us.length);
  const key=(x,y)=>Math.floor(x/cell)+','+Math.floor(y/cell);
  const update=i=>{const u=us[i],k=key(u.x,u.y);if(keys[i]===k)return;const old=buckets.get(keys[i]);if(old){old.delete(i);if(!old.size)buckets.delete(keys[i])}if(!buckets.has(k))buckets.set(k,new Set());buckets.get(k).add(i);keys[i]=k};
  for(let i=0;i<us.length;i++)update(i);
  for(let i=0;i<us.length;i++){
    const a=us[i];let last=i;
    if(Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.r)){
      for(;;){
        const ax=a.x,ay=a.y,r=a.r+maxR+margin,near=[];
        for(let x=Math.floor((ax-r)/cell);x<=Math.floor((ax+r)/cell);x++)for(let y=Math.floor((ay-r)/cell);y<=Math.floor((ay+r)/cell);y++){
          const set=buckets.get(x+','+y);if(set)for(const j of set)if(j>last)near.push(j);
        }
        near.sort((a,b)=>a-b);let redo=false;
        for(const j of near){
          last=j;const b=us[j],dx=a.x-b.x,dy=a.y-b.y,m=a.r+b.r;
          if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
          const d=Math.hypot(dx,dy);
          if(d<m){
            const ang=d>.01?Math.atan2(dy,dx):((a.id*13+b.id*7)%360)*Math.PI/180,push=(m-d)*.25,px=Math.cos(ang)*push,py=Math.sin(ang)*push;
            if(valid(a.x+px,a.y+py)){a.x+=px;a.y+=py}
            if(valid(b.x-px,b.y-py)){b.x-=px;b.y-=py;update(j)}
            if(Math.abs(a.x-ax)>margin||Math.abs(a.y-ay)>margin){redo=true;break}
          }
        }
        if(!redo)break;
      }
    }
    a.x=Math.max(5,Math.min(W-5,a.x));a.y=Math.max(5,Math.min(H-5,a.y));update(i);
  }
}
