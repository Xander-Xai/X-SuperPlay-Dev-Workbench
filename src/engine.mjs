import {SOURCE,TYPES,STACKS,AGENTS,ADDONS,SKILLS,STAGES} from "./catalog.mjs";

const hasId=(arr,id)=>arr.some(x=>x.id===id);
const clean=(value,max)=>String(value ?? "").replace(/\0/g,"").trim().slice(0,max);

export function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFKC")
    .replace(/[^a-z0-9\u4e00-\u9fff -]/g,"").trim()
    .replace(/\s+/g,"-").replace(/-+/g,"-").slice(0,64) || "new-project";
}
export function normalizeConfig(config={}) {
  return {
    type: Object.hasOwn(TYPES,config.type)?config.type:"mini-program",
    stack: hasId(STACKS,config.stack)?config.stack:"flutter",
    agent: hasId(AGENTS,config.agent)?config.agent:"claude-code",
    addons:[...new Set((Array.isArray(config.addons)?config.addons:[]).filter(x=>hasId(ADDONS,x)))],
    tier:["A","B","C"].includes(config.tier)?config.tier:"B",
    mode:config.mode==="existing"?"existing":"new",
    name:clean(config.name,100)||"我的新项目",
    description:clean(config.description,2000)
  };
}
export function assemble(input={}) {
  const config=normalizeConfig(input), type=TYPES[config.type];
  const base=config.type==="app" ? STACKS.find(s=>s.id===config.stack).profiles:type.profiles;
  const profiles=[...new Set([...base,...config.addons.flatMap(id=>ADDONS.find(x=>x.id===id).profiles)])];
  const stages=STAGES.map((s,i)=>({...s,index:i+1,skills:SKILLS.filter(x=>x.stages.includes(s.id)),state:"NOT_RUN"}));
  return {
    schemaVersion:1,kind:"WORKBENCH_PLAN",source:SOURCE,config,slug:slugify(config.name),
    type,profiles,stages,skills:SKILLS,status:"GENERATED_NOT_EXECUTED"
  };
}
export function xengDryRun(plan) {
  if(!plan?.profiles?.every(x=>/^[a-z][a-z-]*$/.test(x))) throw new Error("Invalid profile");
  return "python tools/xeng.py init ../"+slugify(plan.config.name)+" --profile "+
    plan.profiles.join(",")+" --tier "+plan.config.tier+" --dry-run";
}
const quote=s=>(s||"尚未填写；请先完成需求发现")
  .replace(/\r\n/g,"\n").split("\n").map(line=>"> "+line.replace(/\x60/g,"'")).join("\n");

export function toMarkdown(plan) {
  const {config,type,profiles,stages}=plan;
  const lines=[
    "# "+config.name+" · 开发方案","",
    "> 状态：GENERATED / NOT_RUN。方案不代表已安装、已测试、已部署或已验收。",
    "> 来源："+SOURCE.repository+" @ "+SOURCE.commit,
    "> 私有源仓库为方法论权威；此文件只含公开摘要和生成建议。","",
    "## 项目需求","",quote(config.description),"",
    "- 类型："+type.name,
    "- 模式："+(config.mode==="new"?"从零开发":"已有工程迭代"),
    "- Agent："+config.agent,
    "- Tier："+config.tier,
    "- Profiles："+profiles.join(", "),
    "- AI 扩展："+(config.addons.join(", ")||"无"),"",
    "## 工程初始化（先预览）","",
    "在已授权的 Engineering OS 克隆目录执行：","",
    "~~~bash",xengDryRun(plan),"~~~","",
    "仅在确认目标目录和文件差异后，手动移除 --dry-run 执行。","",
    "## 开发阶段与证据门禁",""
  ];
  for(const s of stages){
    lines.push("### "+String(s.index).padStart(2,"0")+" "+s.name,"",
      "- 目标："+s.goal,"- 交付："+s.deliverable,"- Gate："+s.gate,
      "- 相关 Skills："+(s.skills.map(x=>x.id+" [candidate, 未安装]").join(", ")||"无"),
      "- 证据：NOT_RUN","");
  }
  lines.push("## 平台专属检查","",
    ...type.checks.map(x=>"- [ ] "+x),"",
    "**验收标准**："+type.acceptance,"",
    "## Skills 安装策略","",
    "私有候选 Skills 不会被公开网页直接下载或安装；应在本地授权环境审查来源 SHA、许可证、工具权限与版本后选择性安装。","",
    "## 迭代反馈","",
    "- [ ] 保存真实 PR / CI / 测试 / 设备 / 发布回执",
    "- [ ] 记录失败模式与当前阻碍，不把 UNKNOWN 作为 PASS",
    "- [ ] 经跨项目复用和实证验证后，再向工程权威源提出 Skill 或 Gate 改进",""
  );
  return lines.join("\n");
}
export function toManifest(plan) {
  const {config,slug,profiles,stages}=plan;
  return {
    schemaVersion:1,status:"GENERATED_NOT_EXECUTED",
    source:{repository:SOURCE.repository,commit:SOURCE.commit,registryVerified:SOURCE.registryVerified},
    project:{name:config.name,slug,type:config.type,mode:config.mode,tier:config.tier,
      description:config.description,stack:config.stack},
    agent:config.agent,addons:config.addons,profiles,
    stages:stages.map(s=>({id:s.id,deliverable:s.deliverable,gate:s.gate,
      skills:s.skills.map(x=>x.id),evidence:"NOT_RUN"})),
    skills:plan.skills.map(x=>({id:x.id,status:x.status,installed:false})),
    xengDryRun:xengDryRun(plan)
  };
}
export function validateCatalog() {
  const errors=[];
  const profileSet=new Set(["web","saas","backend","ai-application","rag","agent","mini-program","android","ios","react-native","flutter","desktop","cli","infrastructure"]);
  for(const [id,type] of Object.entries(TYPES)){
    if(!type.profiles.every(p=>profileSet.has(p))) errors.push("unknown profile in "+id);
    if(!type.checks?.length) errors.push("empty checks in "+id);
  }
  for(const item of [...STACKS,...ADDONS]){
    if(!item.profiles.every(p=>profileSet.has(p))) errors.push("unknown profile in "+item.id);
  }
  const stageSet=new Set(STAGES.map(x=>x.id));
  if(stageSet.size!==11) errors.push("lifecycle must contain 11 unique stages");
  if(new Set(SKILLS.map(x=>x.id)).size!==8) errors.push("skills must contain 8 unique candidates");
  for(const skill of SKILLS) if(!skill.stages.every(x=>stageSet.has(x))) errors.push("unknown stage in "+skill.id);
  return errors;
}
