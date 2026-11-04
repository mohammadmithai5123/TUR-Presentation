// Observe the existing presentation state; no independent slide controller.
const activityObserver=new MutationObserver(()=>{
 document.querySelectorAll('.activity.active').forEach(slide=>{
  const details=[...slide.querySelectorAll('.detail')], shown=details.filter(e=>e.classList.contains('shown'));
  details.forEach(e=>{const on=e===shown.at(-1);if(e.classList.contains('current-step')!==on)e.classList.toggle('current-step',on);});
  const p=slide.querySelector('.activity-progress');
  if(p)p.textContent=shown.length ? `${shown.length} / ${details.length} steps` : 'Next to begin';
 });
});
activityObserver.observe(document.querySelector('#deck'),{subtree:true,attributes:true,attributeFilter:['class']});
