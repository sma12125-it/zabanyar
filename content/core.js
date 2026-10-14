const LESSONS=[];
function L(level,icon,title,scene,partner,dlg,chunks,notes,sounds,quiz){
 const sp=s=>s.trim().split("\n").map(x=>x.split("|").map(y=>y.trim()));
 LESSONS.push({id:LESSONS.length+1,level,icon,title,scene,partner,
  dialogue:sp(dlg).map(([s,en,fa])=>({me:s=="B",en,fa})),
  chunks:sp(chunks).map(([en,fa])=>({en,fa})),
  notes:sp(notes).map(([book,casual,fa])=>({book,casual,fa})),
  sounds:sp(sounds).map(([w,how,fa])=>({w,how,fa})),
  quiz:sp(quiz).map(([q,o,a])=>({q,o:o.split(";").filter(Boolean),a:+a}))});
}
