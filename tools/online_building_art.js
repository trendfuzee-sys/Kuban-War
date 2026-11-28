/* Keep the remastered building set available in network matches, including 2D fallback. */
(function(){
 const previous=drawB,images=new Map(),types=['h','b','s','t','w','l'];
 for(const race of ['kaz','nov','mon','bog'])for(const ty of types){const img=new Image();img.src='campaign-art/buildings/'+race+'_'+ty+'.webp';images.set(race+'_'+ty,img)}
 drawB=function(c,e,x,y,k,P){if(!window.kubanOnlineAlpha?.currentMatch||!types.includes(e.ty))return previous(c,e,x,y,k,P);const img=images.get(e.race+'_'+e.ty);if(!img?.complete||!img.naturalWidth)return previous(c,e,x,y,k,P);const r=e.r||28,w=r*3.0,h=w*img.naturalHeight/img.naturalWidth,pg=Math.max(0,Math.min(1,e.pg??1));c.save();c.translate(x,y);c.scale(k,k);c.globalAlpha*=.35+.65*pg;c.drawImage(img,-w/2,r*.65-h,w,h);c.restore()};
})();