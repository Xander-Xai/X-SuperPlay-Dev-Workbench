import {TYPES,STACKS,AGENTS,ADDONS,SKILLS,STAGES,SOURCE} from "./catalog.mjs";
import {assemble,xengDryRun,toMarkdown,toManifest} from "./engine.mjs";
import {skillKitCommand,skillsForStage} from "./install-contract.mjs";
import {starterMarkdown} from "./starter.mjs";

const one=(selector)=>document.querySelector(selector);
const all=(selector)=>[...document.querySelectorAll(selector)];
const newElement=(tag,cls,text)=>{
  const el=document.createElement(tag);
  if(cls) el.className=cls;
  if(text!==undefined) el.textContent=text;
  return el;
};
let kind="mini-program", activeStage=0, activeView="planner";
let generatedAt=""; let toastTimeout;
const names={saas:"SaaS 应用",enterprise:"企业内部系统","mini-program":"微信预约服务小程序",app:"移动端应用"};

function toast(message) {
  const el=one("#toast");el.textContent=message;el.classList.add("show");
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove("show"),3000);
}
function readConfig() {
  return {
    type:kind,stack:one("#project-stack").value,agent:one("#project-agent").value,
    addons:all("#addon-list input:checked").map(x=>x.value),
    name:one("#project-name").value,description:one("#project-description").value,
    tier:one("#project-tier").value,mode:one("#project-mode").value
  };
}
function plan() {return assemble(readConfig());}

function renderRoutes(){
  const grid=one("#route-grid");grid.replaceChildren();
  for(const [id,item] of Object.entries(TYPES)){
    const btn=newElement("button","route-card"+(id===kind?" selected":""));
    btn.type="button";btn.setAttribute("aria-pressed",String(id===kind));
    btn.append(newElement("span","route-icon",item.icon));
    btn.append(newElement("strong","route-title",item.name));
    btn.append(newElement("span","route-subtitle",item.tagline));
    btn.append(newElement("span","route-selection",id===kind?"已选择 ●":"选择路线 ↗"));
    btn.addEventListener("click",()=>{
      const oldName=one("#project-name").value;
      if(Object.values(names).includes(oldName)) one("#project-name").value=names[id];
      kind=id;activeStage=0;render();
    });
    grid.append(btn);
  }
}
function renderSelects(){
  for(const [selector,options] of [["#project-agent",AGENTS],["#project-stack",STACKS]]){
    const select=one(selector);select.replaceChildren();
    for(const option of options){
      const node=document.createElement("option");
      node.value=option.id;node.textContent=option.name;select.append(node);
    }
  }
  one("#project-agent").value="claude-code";
  one("#project-stack").value="flutter";
}
function renderAddons(){
  const root=one("#addon-list");root.replaceChildren();
  for(const addon of ADDONS){
    const label=newElement("label","addon");
    const cb=document.createElement("input");cb.type="checkbox";cb.value=addon.id;
    const content=newElement("span","addon-text");
    content.append(newElement("strong","",addon.name),newElement("small","",addon.note));
    label.append(cb,content);
    cb.addEventListener("change",render);
    root.append(label);
  }
}
function renderSummary(p){
  one("#summary-type").textContent=p.type.name+" · "+p.profiles.length+" Profiles";
  one("#summary-acceptance").textContent=p.type.acceptance;
  const chipRoot=one("#profile-chips");chipRoot.replaceChildren();
  p.profiles.forEach(id=>chipRoot.append(newElement("span","chip",id)));
  const checks=one("#type-checks");checks.replaceChildren();
  p.type.checks.forEach(x=>{
    const li=newElement("li");li.append(newElement("span","check-marker","○"),newElement("span","",x));checks.append(li);
  });
  one("#app-stack-field").hidden=kind!=="app";
}
function renderStages(p){
  const list=one("#stage-list");list.replaceChildren();
  p.stages.forEach((stage,i)=>{
    const btn=newElement("button","stage-row"+(i===activeStage?" active":""));
    btn.type="button";btn.setAttribute("aria-pressed",String(i===activeStage));
    btn.append(newElement("span","stage-n",String(i+1).padStart(2,"0")));
    const mid=newElement("span","stage-main");
    mid.append(newElement("strong","",stage.name),newElement("small","",stage.en));
    btn.append(mid,newElement("span","stage-chevron","↗"));
    btn.addEventListener("click",()=>{activeStage=i;const current=plan();renderStages(current);renderOutput(current);});
    list.append(btn);
  });
  const s=p.stages[activeStage], ins=one("#stage-inspector");
  ins.replaceChildren();
  const eyebrow=newElement("div","inspector-eyebrow","STAGE "+String(s.index).padStart(2,"0")+" / "+s.en.toUpperCase());
  const heading=newElement("h3","",s.name);
  const status=newElement("span","pending-label","NOT_RUN");
  ins.append(eyebrow,heading,status,newElement("p","inspector-goal",s.goal));
  const sections=[
    {title:"预期交付物",value:s.deliverable},
    {title:"阶段验收 Gate",value:s.gate}
  ];
  for(const field of sections){
    const block=newElement("div","inspector-block");
    block.append(newElement("small","",field.title),newElement("p","",field.value));ins.append(block);
  }
  if(["architecture","verification","release"].includes(s.id)){
    const block=newElement("div","inspector-block");
    block.append(newElement("small","","本项目特别关注"));
    const ul=newElement("ul","inline-points");
    p.type.checks.forEach(v=>ul.append(newElement("li","",v)));
    block.append(ul);ins.append(block);
  }
  const skillArea=newElement("div","inspector-skillarea");
  skillArea.append(newElement("small","","关联候选 Skills"));
  const row=newElement("div","chips");
  if(!s.skills.length)row.append(newElement("span","muted","本阶段不强制调用 Skill"));
  s.skills.forEach(skill=>row.append(newElement("span","chip muted-chip",skill.id)));
  skillArea.append(row);ins.append(skillArea);
  const note=newElement("div","inspector-note","阶段只有在目标项目产生真实测试与验收证据后，才能标为完成。");
  ins.append(note);
}
function renderOutput(p) {
  one("#init-command").textContent=xengDryRun(p);
  const stage=p.stages[activeStage];
  one("#selected-install-stage").textContent="当前阶段："+stage.name;
  one("#selected-install-skills").textContent="按需候选："+skillsForStage(p,stage.id).join(", ");
  one("#install-command").textContent=skillKitCommand(p,stage.id);
  one("#export-state").textContent=generatedAt?"当前页面展示最新装配预览；上次生成："+generatedAt:"尚未导出。所有结果默认为 NOT_RUN。";
}
function render(){
  const p=plan();
  renderRoutes();renderSummary(p);renderStages(p);renderOutput(p);
}
function download(name,body,mime) {
  const blob=new Blob([body],{type:mime});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportArtifact(format){
  const p=plan(),str=format==="md"?toMarkdown(p):JSON.stringify(toManifest(p),null,2)+"\n";
  download(p.slug+(format==="md"?"-engineering-plan.md":"-manifest.json"),str,
    format==="md"?"text/markdown;charset=utf-8":"application/json;charset=utf-8");
  generatedAt=new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
  renderOutput(p);toast("已生成本地方案文件。未执行任何安装或部署。");
}
function renderSkills(){
  const q=one("#skill-search").value.trim().toLowerCase();
  const grid=one("#skills-grid");grid.replaceChildren();
  const items=SKILLS.filter(s=>[s.id,s.name,s.description,...s.stages].join(" ").toLowerCase().includes(q));
  for(const skill of items){
    const card=newElement("article","skill-card");
    const header=newElement("div","skill-head");
    header.append(newElement("span","skill-logo","◇"),newElement("span","candidate-label","CANDIDATE"));
    card.append(header,newElement("strong","skill-name",skill.id),
      newElement("p","",skill.description));
    card.append(newElement("div","skill-stage","用于："+skill.stages.map(x=>STAGES.find(s=>s.id===x).name).join(" / ")));
    const link=document.createElement("a");link.className="skill-link";
    link.href=SOURCE.url+"/blob/"+SOURCE.commit+"/05-skills/"+skill.id+"/SKILL.md";
    link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="查看权威源（需权限） ↗";card.append(link);
    grid.append(card);
  }
  if(!items.length)grid.append(newElement("p","muted","没有匹配结果"));
}
function renderQuality(){
  const root=one("#quality-body");
  const levels=[
    ["NOT_RUN","未执行","仅有模板、计划、任务描述或待执行命令。"],
    ["LOCAL_TESTED","本地已测","对最终代码真实执行测试，有命令、环境和结果。"],
    ["CI_VERIFIED","CI 已验证","目标 SHA 对应的远端必需检查结束且成功。"],
    ["RELEASED","已发布","实际部署或应用商店发布有环境与平台回执。"],
    ["ACCEPTED","已验收","真实消费者/客户按约定 AC 完成验证。"]
  ];
  root.replaceChildren();
  const intro=newElement("div","info-panel");intro.append(newElement("strong","", "证据阶梯：越往下要求越高"),newElement("p","", "不同状态不能互相替代；任何无法验证的步骤应保持 UNKNOWN / NOT_RUN。"));root.append(intro);
  const ladder=newElement("div","quality-ladder");
  levels.forEach((l,i)=>{
    const card=newElement("div","quality-step");
    card.append(newElement("span","quality-number",String(i+1).padStart(2,"0")));
    const middle=newElement("div");middle.append(newElement("strong","",l[1]),newElement("p","",l[2]));
    card.append(middle,newElement("code","",l[0]));ladder.append(card);
  });root.append(ladder);
  const legal=newElement("div","info-panel");legal.append(newElement("strong","","上线前的不可跳过项"),
    newElement("p","", "生产凭证、密钥、商户交易、用户数据及任何不可逆的外部动作，均需要授权和适用安全审查。浏览器计划生成器不会替你进行这些操作。"));
  root.append(legal);
}
function renderFeedback(){
  const root=one("#feedback-body");root.replaceChildren();
  const steps=[
    ["01","在项目仓库记录真实问题","保留输入、复现命令、代码 SHA、期望/实际结果和已授权范围。"],
    ["02","诊断重复失效模式","判断是需求、代码、测试、权限、文档还是平台约束。"],
    ["03","提出可复用的最小修复","优先补测试或 CI Gate；仅重复出现的通用过程考虑提炼为 Skill。"],
    ["04","在第二个真实场景验证","观察能否减少同类错误，记录负例和维护成本。"],
    ["05","向 Engineering OS 发起改进 PR","权威仓审核通过后更新 Registry；本网站随后采用新固定版本。"]
  ];
  for(const [num,title,detail] of steps){
    const card=newElement("article","feedback-step");
    card.append(newElement("span","feedback-number",num));
    const c=newElement("div");c.append(newElement("strong","",title),newElement("p","",detail));card.append(c);root.append(card);
  }
  const note=newElement("div","info-panel");
  note.append(newElement("strong","","双仓职责，避免第二份真相"),
    newElement("p","", "产品代码、运行回执和客户数据保留在各项目仓或受控环境。Engineering OS 负责规范与候选 Skills 的晋级；Workbench 只负责入口、组合及生成。"));
  root.append(note);
}
function switchView(view){
  if(!["planner","skills","quality","feedback"].includes(view))view="planner";
  activeView=view;
  all(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  all(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+view));
  one("#breadcrumb").textContent=view.toUpperCase();
  if(view==="skills")renderSkills();
  window.scrollTo({top:0,behavior:"smooth"});
}
function init() {
  renderSelects();renderAddons();renderQuality();renderFeedback();
  all("[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
    switchView(btn.dataset.view);location.hash=btn.dataset.view;
  }));
  one("#project-name").addEventListener("input",render);
  one("#project-description").addEventListener("input",render);
  for(const id of ["#project-mode","#project-agent","#project-tier","#project-stack"])
    one(id).addEventListener("change",render);
  one("#generate").addEventListener("click",()=>{
    generatedAt=new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
    render();one(".pipeline-heading").scrollIntoView({behavior:"smooth",block:"start"});
    toast("方案已装配。下一步可查看每阶段门禁并导出。");
  });
  one("#download-starter").addEventListener("click",()=>{
    const p=plan();
    download(p.slug+"-spec-and-tickets-draft.md",starterMarkdown(p),"text/markdown;charset=utf-8");
    toast("已导出 Spec + 3 张待审批任务卡；尚未执行或验收。");
  });
  one("#download-json").addEventListener("click",()=>exportArtifact("json"));
  one("#download-md").addEventListener("click",()=>exportArtifact("md"));
  one("#copy-install").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(one("#install-command").textContent);toast("已复制本地 Skills 只读预览命令。");}
    catch{toast("请手动选择并复制安装预览命令。");}
  });
  one("#copy-command").addEventListener("click",async()=>{
    const text=one("#init-command").textContent;
    try{await navigator.clipboard.writeText(text);toast("已复制只读初始化预览命令。");}
    catch{toast("浏览器无法复制，请选中命令手动复制。");}
  });
  one("#skill-search").addEventListener("input",renderSkills);
  window.addEventListener("hashchange",()=>switchView(location.hash.slice(1)));
  render();switchView(location.hash.slice(1)||"planner");
}
init();
