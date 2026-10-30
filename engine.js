import {randomId} from './identity.js';
/**
 * CIBE browser-local scenario engine.
 * Original implementation for CIBE, not MiroFish model output.
 * Deterministic narrative rules explore choices; they do not predict real outcomes.
 */

const NODE_IDS = ['start', 'education', 'career', 'city', 'turning', 'ending'];
const STAGES = {
  secondary: { label: '求学与升学', start: '在学习中寻找方向', offsets: [0, 2, 5, 7, 10, 15] },
  university: { label: '大学与毕业', start: '站在毕业前的路口', offsets: [0, 1, 3, 5, 8, 12] },
  working: { label: '工作与成长', start: '从当下的工作出发', offsets: [0, 1, 2, 4, 7, 10] },
  transition: { label: '转型与探索', start: '为下一段生活留白', offsets: [0, 1, 2, 4, 7, 10] },
};
const PRIORITIES = {
  freedom: '自主与自由', stability: '稳定与安全感',
  growth: '成长与成就', connection: '关系与陪伴',
};
const OPTION_SETS = {
  education: [
    { id: 'study', label: '继续学习', description: '为系统学习留出时间，延后部分全职工作安排。' },
    { id: 'work', label: '进入实践', description: '从工作或实践项目中积累经验，再决定学习方向。' },
    { id: 'explore', label: '先探索再决定', description: '用短期课程、体验或小项目了解不同的可能。' },
  ],
  career: [
    { id: 'team', label: '加入成熟团队', description: '在明确的分工和协作中积累职业经验。' },
    { id: 'independent', label: '尝试独立工作', description: '自行寻找项目，也为收入和节奏的变化做准备。' },
    { id: 'creative', label: '投入创作与项目', description: '以作品和实际项目探索自己认可的工作方向。' },
  ],
  city: [
    { id: 'stay', label: '留在熟悉的城市', description: '沿用已有的生活支持与人际网络。' },
    { id: 'move', label: '去新的城市', description: '接触新的机会，同时重新建立生活和关系。' },
    { id: 'flexible', label: '尝试灵活居住', description: '根据工作条件安排居住地，并留出调整空间。' },
  ],
  turning: [
    { id: 'deepen', label: '继续深耕', description: '把更多时间投入已经积累的领域。' },
    { id: 'pivot', label: '开启新方向', description: '通过小规模尝试，逐步检验转向的可行性。' },
    { id: 'balance', label: '调整生活节奏', description: '重新安排工作、休息和与重要的人相处的时间。' },
  ],
  ending: [
    { id: 'focus', label: '保留一个长期方向', description: '让主要投入围绕一个愿意长期实践的目标展开。' },
    { id: 'open', label: '为未来保留弹性', description: '保留调整路径的资源，让生活可以继续变化。' },
    { id: 'together', label: '让关系成为重心', description: '把共同生活和持续陪伴放进下一阶段安排。' },
  ],
};

const clone = value => JSON.parse(JSON.stringify(value));
const text = (value, fallback, limit = 240) => {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, limit) || fallback;
};
function identifier(prefix) { return `${prefix}-${randomId()}`; }
function normalizeProfile(input = {}) {
  const profile = input && typeof input === 'object' ? input : {};
  const parsedAge = Number(profile.age);
  return {
    name: text(profile.name, '探索者', 40),
    age: Number.isFinite(parsedAge) && parsedAge >= 16 && parsedAge <= 80 ? Math.floor(parsedAge) : 22,
    stage: Object.hasOwn(STAGES, profile.stage) ? profile.stage : 'university',
    vision: text(profile.vision, '拥有能够自主选择、持续成长的生活'),
    education: ['study', 'work', 'explore'].includes(profile.education) ? profile.education : 'work',
    work: text(profile.work, '自己感兴趣的领域', 100),
    priority: Object.hasOwn(PRIORITIES, profile.priority) ? profile.priority : 'growth',
    question: text(profile.question, '哪一种选择更接近我期待的生活？'),
  };
}
function defaults(profile) {
  return {
    education: profile.education,
    career: profile.priority === 'freedom' ? 'independent' : profile.priority === 'growth' ? 'creative' : 'team',
    city: profile.priority === 'connection' || profile.priority === 'stability' ? 'stay' : profile.priority === 'freedom' ? 'flexible' : 'move',
    turning: profile.priority === 'connection' ? 'balance' : profile.priority === 'freedom' ? 'pivot' : 'deepen',
    ending: profile.priority === 'connection' ? 'together' : profile.priority === 'freedom' ? 'open' : 'focus',
  };
}
function optionFor(id, selection) {
  const source = OPTION_SETS[id] || [];
  if (selection && typeof selection === 'object' && selection.id === 'custom') {
    const label = text(selection.label, '', 240);
    if (!label) throw new Error('请先写下你希望作出的改变。');
    return { id: 'custom', label, description: text(selection.description, '按照你提出的条件，重新组织后续生活安排。') };
  }
  const selectedId = typeof selection === 'object' ? selection?.id : selection;
  const option = source.find(item => item.id === selectedId);
  if (!option) throw new Error('请选择当前节点提供的选项，或输入自己的选择。');
  return clone(option);
}
function selectedOptions(profile, overrides = {}) {
  const base = defaults(profile);
  return Object.fromEntries(Object.keys(base).map(id => [id, optionFor(id, overrides[id] || base[id])]));
}

function educationContent(p, option) {
  const returning = ['working', 'transition'].includes(p.stage);
  const direction = p.work;
  if (option.id === 'study') return {
    title: returning ? '为下一步重新学习' : '给学习一段完整的时间',
    summary: `围绕${direction}继续学习，为下一次实践补充基础。`,
    detail: `你把一段时间留给系统学习。${returning ? '已有经历帮助你识别需要补充的能力，也需要重新协调学习与工作的安排。' : '课程和研究为你提供更多了解方向的机会，进入全职工作的时间则相应后移。'}学习能否帮助你接近“${p.vision}”，需要通过后续实践检验。`,
    effects: ['时间优先投入学习与练习', '提前安排学习期间的支出与生活支持', '在进入下一阶段前积累可展示的成果'],
  };
  if (option.id === 'explore') return {
    title: '先试一试不同的方向',
    summary: `用短期课程和小项目了解${direction}，再作更长期的决定。`,
    detail: `面对“${p.question}”，你先安排低成本的体验。每次尝试记录喜欢的工作内容、需要的能力和不适合自己的条件，然后选择是否加深投入。这段探索时间需要设置一个回顾节点。`,
    effects: ['先收集具体体验，再作长期选择', '为探索设置时间和支出边界', '把尝试结果整理为下一步的依据'],
  };
  return {
    title: returning ? '从现有经验迈出下一步' : '走进真实的工作现场',
    summary: `以${direction}相关的实践为起点，在行动中寻找适合自己的位置。`,
    detail: `你优先参与实际工作或项目，通过具体任务了解${direction}的日常。${returning ? '过去的工作经验成为新阶段的基础。' : '这一安排让你更早接触协作和交付，也需要主动补充理论与方法。'}你会依据实际体验继续调整方向。`,
    effects: ['较早接触真实任务和协作', '把学习安排嵌入日常实践', '定期回顾工作内容是否符合期待'],
  };
}
function careerContent(p, option, choices) {
  const preparation = choices.education.id === 'study' ? '带着学习阶段整理的成果' : choices.education.id === 'explore' ? '带着探索阶段形成的判断' : '带着此前积累的实践经验';
  if (option.id === 'independent') return {
    title: '尝试独立安排自己的工作',
    summary: `${preparation}，开始承接${p.work}相关项目。`,
    detail: `你选择更自主的工作方式，自行寻找合作、安排进度并完成交付。工作的自由度与经营事务同时增加；是否能够持续，需要以实际项目来源和生活支出作为依据。`,
    effects: ['自行安排项目和工作时间', '额外投入沟通与寻找合作的时间', '为项目间隔保留生活缓冲'],
  };
  if (option.id === 'creative') return {
    title: '让作品成为下一步的入口',
    summary: `${preparation}，在${p.work}中完成一项能够展示自己的作品。`,
    detail: `你围绕感兴趣的问题开展项目，用作品接触同行和潜在合作方。投入应从可完成的小范围开始，并通过反馈修正方向；作品得到回应的时间与方式仍然存在不确定性。`,
    effects: ['持续积累可以展示的作品', '为创作留出明确的时间', '通过真实反馈决定是否扩大投入'],
  };
  return {
    title: '在一个团队里积累经验',
    summary: `${preparation}，寻找${p.work}相关的团队协作机会。`,
    detail: `你选择在团队中了解行业流程和工作分工。稳定的安排仍取决于具体岗位与组织情况；你需要观察团队节奏、学习机会和个人需求是否匹配。`,
    effects: ['在协作中熟悉行业与工作方法', '工作安排需要兼顾团队节奏', '通过实际岗位了解长期发展空间'],
  };
}
function cityContent(p, option, choices) {
  const workCondition = choices.career.id === 'independent' ? '确认合作是否支持异地交付' : choices.career.id === 'creative' ? '了解作品和项目所需的协作条件' : '确认岗位对到岗地点的要求';
  if (option.id === 'move') return {
    title: '在新的城市重新安顿',
    summary: `为${p.work}寻找新的环境，也重新建立日常生活。`,
    detail: `迁居前，你需要${workCondition}，并了解住房、通勤和生活支出。新的城市提供不同的接触面，但关系与生活习惯需要重新积累。是否留下，将依据实际体验决定。`,
    effects: ['重新安排住房与日常支出', '主动建立新的支持关系', '把城市体验纳入后续选择'],
  };
  if (option.id === 'flexible') return {
    title: '为居住地保留一点弹性',
    summary: '让居住安排跟随真实的工作条件逐步调整。',
    detail: `你先${workCondition}，再尝试短期居住或阶段性移动。灵活居住需要稳定的工作衔接和生活基础，并不意味着可以随时移动；你会在体验后判断这种节奏是否适合自己。`,
    effects: ['居住计划与工作安排保持同步', '预留搬迁与衔接的成本', '主动维系跨地点的人际联系'],
  };
  return {
    title: '在熟悉的地方继续生长',
    summary: '留在已有生活网络中，为长期安排积累基础。',
    detail: `你沿用熟悉的生活环境与支持关系，同时${workCondition}。本地机会是否符合${p.work}方向，需要进一步了解；也可以通过短期交流接触其他城市的经验。`,
    effects: ['延续已有的生活与关系支持', '优先了解本地的具体机会', '为外部交流保留时间和预算'],
  };
}
function turningContent(p, option, choices) {
  const place = choices.city.id === 'move' ? '新城市的生活逐渐形成' : choices.city.id === 'flexible' ? '不同地点的体验逐渐积累' : '熟悉环境中的日常逐渐稳定';
  if (option.id === 'pivot') return {
    title: '给新的方向一次小规模尝试',
    summary: `${place}后，重新回应“${p.question}”。`,
    detail: `你把积累的能力用于一个新方向，先安排能够承受的小项目或学习计划。新尝试与既有工作如何衔接，需要明确时间、支出和退出条件，再根据反馈决定下一步。`,
    effects: ['将旧经验转化为新尝试的起点', '同时安排已有责任与新的投入', '用阶段性反馈决定是否继续转向'],
  };
  if (option.id === 'balance') return {
    title: '重新分配生活里的时间',
    summary: `${place}后，为重要的人和自己的节奏腾出空间。`,
    detail: `你回顾工作之外的需要，调整项目数量、通勤和日常安排，让生活更接近“${p.vision}”。减少某些投入也可能放缓相关进展，需要明确自己愿意接受的取舍。`,
    effects: ['重新划分工作和生活的边界', '减少一部分同时推进的事项', '把相处与休息纳入具体日程'],
  };
  return {
    title: '把积累变成一个长期方向',
    summary: `${place}后，继续深耕${p.work}。`,
    detail: `你决定把更多时间留给已经验证有兴趣的领域，逐步加深能力或承担新的任务。长期投入需要持续反馈，也应保留定期检视方向是否仍然适合自己的机会。`,
    effects: ['将时间集中到少数长期事项', '减少频繁切换方向的消耗', '定期检视投入与生活期待的关系'],
  };
}
function endingContent(p, option, choices) {
  const route = choices.turning.id === 'pivot' ? '经历一次新的尝试' : choices.turning.id === 'balance' ? '重新调整生活节奏' : '经过一段持续积累';
  if (option.id === 'open') return {
    title: '一段仍然可以改变的生活',
    summary: `${route}，你为下一次选择保留空间。`,
    detail: `这一条路径围绕“${p.vision}”展开。你把技能、时间和生活安排中的弹性看作继续探索的条件，接下来仍可以重新选择。当前节点只是本次模拟的阶段性落点。`,
    effects: ['保留继续学习与尝试的时间', '避免同时作出过多长期承诺', '根据真实处境继续调整下一步'],
  };
  if (option.id === 'together') return {
    title: '让重要的关系留在日常里',
    summary: `${route}，把共同生活与持续陪伴放到更靠前的位置。`,
    detail: `你用具体的时间安排回应“${p.vision}”。工作和居住选择需要与重要的人共同协商，关系的变化也会继续影响计划。这是本次情景中的一种生活安排。`,
    effects: ['为相处设置持续而具体的时间', '在关键安排上进行共同协商', '保持个人发展与关系需求的对话'],
  };
  return {
    title: '慢慢走出自己的长期方向',
    summary: `${route}，在${p.work}与个人生活之间形成自己的安排。`,
    detail: `你将“${p.vision}”作为回顾选择的参照，保留值得继续的投入，调整不再适合的部分。此处呈现的是这一组选择下的阶段性情景，现实中的机会和条件仍会变化。`,
    effects: ['围绕长期方向安排主要投入', '持续检查目标与日常是否一致', '为现实变化保留修正计划的机会'],
  };
}
const BUILDERS = { education: educationContent, career: careerContent, city: cityContent, turning: turningContent, ending: endingContent };
const CATEGORIES = { start: '当下', education: '学习与起步', career: '职业选择', city: '生活地点', turning: '关键转折', ending: '阶段结局' };
const CONNECTIONS = {
  education: '这会改变进入下一阶段前的时间安排与准备方式',
  career: '这会影响后续协作方式、生活节奏和所需支持',
  city: '这会改变后续生活成本、关系维护和日常安排',
  turning: '这会重新分配下一阶段的时间与注意力',
  ending: '这成为下一阶段安排的重点',
};

export function lifetimeAges(age){
  const end=Math.max(90,age+25);
  return [age,...[.18,.38,.58,.79,1].map(f=>Math.round((age+(end-age)*f)/5)*5)];
}
const lifetimeCategories=['当下','下一段人生','事业与关系','生活重心','退休与新节奏','晚年与回望'];
function makeNodes(profile, choices, lifetime=false) {
  const stage = STAGES[profile.stage];
  return NODE_IDS.map((id, index) => {
    if (id === 'start') return {
      id, age: profile.age, title: stage.start, category: CATEGORIES[id],
      summary: `${profile.name}，从${stage.label}这一阶段开始探索。`,
      detail: `你希望“${profile.vision}”，对${profile.work}感兴趣，并更看重${PRIORITIES[profile.priority]}。这次探索从你的问题开始：${profile.question}`,
      effects: ['以你填写的情况作为起点', '比较选择带来的不同安排', '保留对未来继续提问的空间'], options: [],
    };
    const option = choices[id];
    let content = BUILDERS[id](profile, option, choices);
    if (option.id === 'custom') content = {
      title: option.label,
      summary: `在${CATEGORIES[id]}这一阶段，尝试你提出的新安排。`,
      detail: `你把此处的选择改为“${option.label}”。本地演示将这个条件保留在后续节点中，并列出需要重新安排的事项。自由输入的具体可行性尚未由模型推算，需要结合现实条件进一步核实。`,
      effects: ['确认这个改变需要的时间与资源', '梳理与现有责任的衔接方式', '通过具体尝试验证这个设想'],
    };
    // An explicit chain of earlier decisions lets later branches retain context.
    // Every downstream node incorporates the changed decision, including custom text.
    const earlier = NODE_IDS.slice(1, index).map(previousId => ({ id: previousId, option: choices[previousId] }));
    if (earlier.length) {
      const chain = earlier.map(({ option: item }) => item.label).join(' → ');
      const nearest = earlier[earlier.length - 1];
      content.summary += ` 此前的选择：${chain}。`;
      content.detail += ` 这一节点延续了“${chain}”的前序安排；其中“${nearest.option.label}”${CONNECTIONS[nearest.id]}。`;
      content.effects.push(`与前序选择衔接：${chain}`);
    }
    return { id, age: lifetime?lifetimeAges(profile.age)[index]:profile.age + stage.offsets[index], category: lifetime?lifetimeCategories[index]:CATEGORIES[id], ...content, options: clone(OPTION_SETS[id]), selectedOption: clone(option) };
  });
}

/** Create a baseline. Same inputs create the same narrative (IDs/timestamps vary). */
export function createLife(input = {}) {
  const profile = normalizeProfile(input);
  const choices = selectedOptions(profile);
  return {
    id: identifier('life'), label: '初始人生', createdAt: new Date().toISOString(),
    parentId: null, changedNodeId: null, change: null, profile,
    choices, changes: [], timelineVersion:1, nodes: makeNodes(profile, choices,true), mode: 'local-demo',
  };
}

/** Fork without mutating the parent; the earlier nodes remain byte-for-byte equal. */
export function branchLife(life, nodeId, choice) {
  const index = NODE_IDS.indexOf(nodeId);
  if (index <= 0) throw new Error('起点来自你填写的资料，请选择后续节点进行修改。');
  if (!life || !Array.isArray(life.nodes) || life.nodes.length !== NODE_IDS.length) throw new Error('人生档案不完整，请重新创建。');
  const profile = normalizeProfile(life.profile);
  const choices = selectedOptions(profile, life.choices);
  const before = choices[nodeId];
  const after = optionFor(nodeId, choice);
  if (before.id === after.id && (after.id !== 'custom' || before.label === after.label)) {
    throw new Error('选择没有变化，请尝试另一个方向。');
  }
  choices[nodeId] = after;
  const change = {
    nodeId, before: before.label, after: after.label, choice: clone(after),
    beforeTitle: life.nodes[index].title,
    at: new Date().toISOString(),
  };
  const nodes = makeNodes(profile, choices,life.timelineVersion===1);
  for (let i = 0; i < index; i++) nodes[i] = clone(life.nodes[i]);
  return {
    id: identifier('life'), label: after.label.length > 20 ? `${after.label.slice(0, 20)}…` : after.label,
    createdAt: change.at, parentId: life.id, changedNodeId: nodeId, change,
    ...(life.timelineVersion===1?{timelineVersion:1}:{}), profile, choices, changes: [...clone(life.changes || []), change], nodes, mode: 'local-demo',
  };
}

const PROFILE_KEYS = ['name', 'age', 'stage', 'vision', 'education', 'work', 'priority', 'question'];
const LIFE_KEYS = ['id', 'label', 'createdAt', 'parentId', 'changedNodeId', 'change', 'profile', 'choices', 'changes', 'nodes', 'mode'];
const CHANGE_KEYS = ['nodeId', 'before', 'after', 'choice', 'beforeTitle', 'at'];
const CHOICE_KEYS = NODE_IDS.slice(1);
const NODE_KEYS = ['id', 'age', 'title', 'category', 'summary', 'detail', 'effects', 'options'];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const hasKeys = (value, keys) => isRecord(value) && Object.keys(value).length === keys.length
  && keys.every(key => Object.hasOwn(value, key));
const validString = (value, limit) => typeof value === 'string' && value.length > 0
  && value.length <= limit && value.trim() === value && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
const validDate = value => typeof value === 'string' && value.length === 24
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

// Compare using the expected object's bounded shape, independent of JSON key order.
function sameData(actual, expected) {
  if (actual === expected) return true;
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length
    && expected.every((item, index) => sameData(actual[index], item));
  if (isRecord(expected)) return hasKeys(actual, Object.keys(expected))
    && Object.keys(expected).every(key => sameData(actual[key], expected[key]));
  return false;
}
function validProfile(profile) {
  return hasKeys(profile, PROFILE_KEYS)
    && validString(profile.name, 40)
    && Number.isInteger(profile.age) && profile.age >= 16 && profile.age <= 80
    && typeof profile.stage === 'string' && Object.hasOwn(STAGES, profile.stage)
    && validString(profile.vision, 240)
    && typeof profile.education === 'string' && ['study', 'work', 'explore'].includes(profile.education)
    && validString(profile.work, 100)
    && typeof profile.priority === 'string' && Object.hasOwn(PRIORITIES, profile.priority)
    && validString(profile.question, 240);
}
function validChoice(nodeId, choice) {
  if (!Object.hasOwn(OPTION_SETS, nodeId) || !hasKeys(choice, ['id', 'label', 'description'])
    || !validString(choice.id, 32) || !validString(choice.label, 240) || !validString(choice.description, 240)) return false;
  if (choice.id === 'custom') return true;
  const expected = OPTION_SETS[nodeId].find(item => item.id === choice.id);
  return !!expected && sameData(choice, expected);
}
function validChange(change) {
  return hasKeys(change, CHANGE_KEYS) && CHOICE_KEYS.includes(change.nodeId)
    && validString(change.before, 240) && validString(change.after, 240)
    && validString(change.beforeTitle, 240) && validDate(change.at)
    && validChoice(change.nodeId, change.choice) && change.after === change.choice.label;
}
function validNodes(nodes, profile, choices, ai = false, lifetime = false) {
  if (!Array.isArray(nodes) || nodes.length !== NODE_IDS.length) return false;
  if (!nodes.every((node, index) => hasKeys(node, index ? [...NODE_KEYS, 'selectedOption'] : NODE_KEYS)
    && node.id === NODE_IDS[index] && Number.isInteger(node.age)
    && validString(node.title, 240) && validString(node.category, 40)
    && validString(node.summary, 5000) && validString(node.detail, 6000)
    && Array.isArray(node.effects) && node.effects.length <= 10
    && node.effects.every(effect => validString(effect, 1500))
    && Array.isArray(node.options) && node.options.length <= 3
    && node.options.every(option => validChoice(node.id, option))
    && (!index || validChoice(node.id, node.selectedOption)))) return false;
  const skeleton = makeNodes(profile, choices,lifetime);
  if (ai) return nodes.every((node,i) => node.age === skeleton[i].age && node.category === skeleton[i].category
    && sameData(node.options,skeleton[i].options) && (!i || sameData(node.selectedOption,choices[node.id])));
  return sameData(nodes, skeleton);
}

export const modelName=model=>({'gpt-6-astra':'GPT-6 Astra','gpt-6.1-terra':'GPT-6.1 Terra'}[model]||'AI');
const validModel=model=>['gpt-6-astra','gpt-6.1-terra'].includes(model);
function validAIReport(report) {
  const keys=['summary','causalChain','tradeoffs','questions','assumptions'];
  return isRecord(report) && hasKeys(report,Object.hasOwn(report,'model')?[...keys,'model']:keys)
    && (!Object.hasOwn(report,'model')||validModel(report.model))
    && validString(report.summary,1600)
    && ['causalChain','tradeoffs','questions','assumptions'].every(key=>Array.isArray(report[key])
      && report[key].length>=1 && report[key].length<=6 && report[key].every(item=>validString(item,800)));
}

/** Apply model prose only after validating all output; structural decisions stay in CIBE. */
export function validateAINodeBatch(nodes, expected) {
  return Array.isArray(nodes) && nodes.length===expected.length
    && nodes.every((n,i)=>hasKeys(n,['id','title','summary','detail','effects']) && n.id===expected[i]
      && validString(n.title,240) && validString(n.summary,5000) && validString(n.detail,6000)
      && Array.isArray(n.effects) && n.effects.length>=1 && n.effects.length<=6 && n.effects.every(x=>validString(x,1500)));
}

export function applyAINodes(life, nodes, model='gpt-6-astra') {
  const begin=life.changedNodeId ? NODE_IDS.indexOf(life.changedNodeId) : 1;
  const expected=NODE_IDS.slice(begin);
  if (!validateAINodeBatch(nodes,expected)) {
    throw new Error('AI 返回的内容不完整，本次没有保存，请重试。');
  }
  const result=clone(life);
  nodes.forEach((patch,i)=>Object.assign(result.nodes[begin+i],clone(patch)));
  result.mode='ai';
  result.generation={model,generatedAt:new Date().toISOString()};
  result.aiReport=null;
  return result;
}

export function applyAIReport(life, report, model=life.generation?.model) {
  if(life.mode!=='ai'||!validAIReport(report)||!validModel(model))throw new Error('报告未通过检查，请重试。');
  const result=clone(life);result.aiReport={...clone(report),model};return result;
}

// Compatibility for previously generated combined responses and archives.
export function applyAIResult(life, output, model='gpt-6-astra') {
  if(!hasKeys(output,['nodes','report']))throw new Error('AI 返回的内容不完整，本次没有保存，请重试。');
  return applyAIReport(applyAINodes(life,output.nodes,model),output.report);
}

/** Validate imported/local-storage archives without generating IDs or mutating data. */
export function validateSession(session) {
  try {
    if (!isRecord(session) || session.schemaVersion !== 1
      || typeof session.code !== 'string' || !/^CIBE-[A-Z0-9]{4,12}$/.test(session.code)
      || !validProfile(session.profile)
      || !Array.isArray(session.lives) || session.lives.length < 1 || session.lives.length > 100
      || !validString(session.activeLifeId, 100)
      || (Object.hasOwn(session, 'isDemo') && typeof session.isDemo !== 'boolean')
      || (Object.hasOwn(session, 'exportedAt') && !validDate(session.exportedAt))) return false;
    const allowedSessionKeys = ['schemaVersion', 'code', 'profile', 'lives', 'activeLifeId', 'isDemo', 'exportedAt'];
    if (Object.keys(session).some(key => !allowedSessionKeys.includes(key))) return false;
    const seen = new Map();
    for (const [index, life] of session.lives.entries()) {
      const ai=life.mode==='ai';
      if (!hasKeys(life, [...(ai ? [...LIFE_KEYS,'generation','aiReport'] : LIFE_KEYS),...(Object.hasOwn(life,'timelineVersion')?['timelineVersion']:[])]) || !validString(life.id, 100) || seen.has(life.id)
        || !validString(life.label, 240) || !validDate(life.createdAt) || !['local-demo','ai'].includes(life.mode)
        || (ai && (!hasKeys(life.generation,['model','generatedAt']) || !validModel(life.generation.model)
          || !validDate(life.generation.generatedAt) || (life.aiReport!==null && !validAIReport(life.aiReport))))
        || (Object.hasOwn(life,'timelineVersion')&&life.timelineVersion!==1)
        || !validProfile(life.profile) || !sameData(life.profile, session.profile)
        || !hasKeys(life.choices, CHOICE_KEYS)
        || !CHOICE_KEYS.every(id => validChoice(id, life.choices[id]))
        || !Array.isArray(life.changes) || life.changes.length > 99
        || !life.changes.every(validChange)
        || !validNodes(life.nodes, life.profile, life.choices, ai,life.timelineVersion===1)) return false;
      if (index === 0) {
        if (life.parentId !== null || life.changedNodeId !== null || life.change !== null
          || life.changes.length !== 0 || life.label !== '初始人生'
          || !sameData(life.choices, selectedOptions(session.profile))) return false;
      } else {
        if (!validString(life.parentId, 100) || !seen.has(life.parentId)
          || !CHOICE_KEYS.includes(life.changedNodeId) || !validChange(life.change)) return false;
        const parent = seen.get(life.parentId);
        if(life.timelineVersion!==parent.timelineVersion)return false;
        if (!life.nodes.slice(0,NODE_IDS.indexOf(life.changedNodeId)).every((n,i)=>sameData(n,parent.nodes[i]))) return false;
        const change = life.change;
        const previous = parent.choices[life.changedNodeId];
        const current = life.choices[life.changedNodeId];
        const expectedChoices = { ...parent.choices, [life.changedNodeId]: change.choice };
        const expectedLabel = change.after.length > 20 ? `${change.after.slice(0, 20)}…` : change.after;
        if (change.nodeId !== life.changedNodeId || change.at !== life.createdAt
          || change.before !== previous.label || change.after !== current.label
          || change.beforeTitle !== parent.nodes[NODE_IDS.indexOf(life.changedNodeId)].title
          || life.label !== expectedLabel
          || (previous.id === current.id && (current.id !== 'custom' || previous.label === current.label))
          || !sameData(life.choices, expectedChoices)
          || !sameData(life.changes, [...parent.changes, change])) return false;
      }
      seen.set(life.id, life);
    }
    return seen.has(session.activeLifeId);
  } catch {
    return false;
  }
}

/** Plain-text report; the caller decides whether to show, print or download it. */
export function buildReport(session = {}) {
  const lives = Array.isArray(session.lives) ? session.lives : [];
  if (!lives.length) throw new Error('请先创建一份人生档案。');
  const profile = normalizeProfile(session.profile || lives[0].profile);
  const baseline = lives.find(life => !life.parentId) || lives[0];
  const active = lives.find(life => life.id === session.activeLifeId) || baseline;
  const lines = [
    'branch 人生探索报告 · parallax', `${profile.name} · ${profile.age} 岁`,
    active.mode==='ai' ? 'branch · '+modelName(active.generation.model)+' AI 情景推演' : 'branch · 本地情景演示', '',
    '我的起点与期待',
    `当前阶段：${STAGES[profile.stage].label}`,
    `未来意象：${profile.vision}`,
    `工作方向：${profile.work}`,
    `更看重：${PRIORITIES[profile.priority]}`,
    `正在思考：${profile.question}`, '',
    '初始人生路径',
  ];
  for (const node of baseline.nodes) lines.push(`${node.age} 岁 · ${node.title}`, node.summary);
  lines.push('', '我尝试过的改变');
  const branches = lives.filter(life => life.parentId);
  if (!branches.length) lines.push('本次尚未修改节点，以下保留初始路径供回顾。');
  branches.forEach((life, index) => {
    const change = life.change;
    const parent = lives.find(item => item.id === life.parentId);
    lines.push('', `分支 ${index + 1} · ${life.label}`, `基于：${parent?.label || '上一条路径'}`);
    if (change) lines.push(`修改节点：${CATEGORIES[change.nodeId] || change.nodeId}`, `原选择：${change.before}`, `新选择：${change.after}`);
    const begin = Math.max(0, NODE_IDS.indexOf(life.changedNodeId));
    for (const node of life.nodes.slice(begin)) lines.push(`${node.age} 岁 · ${node.title}`, node.summary);
    lines.push(`阶段结局：${life.nodes.at(-1).detail}`);
  });
  lines.push('', '当前保留的路径', active.label);
  for (const node of active.nodes) lines.push(`${node.age} 岁 · ${node.title}`);
  if (active.aiReport) {
    lines.push('', 'AI 人生报告 · '+modelName(active.aiReport.model||active.generation.model),active.aiReport.summary);
    for (const [key,label] of [['causalChain','选择如何影响后来'],['tradeoffs','得到与付出'],['assumptions','本次推演的假设'],['questions','带回现实的问题']])
      lines.push('',label,...active.aiReport[key].map(x=>'· '+x));
  }
  lines.push('', '这次探索留下的问题',
    `这些安排是否更接近你希望的“${profile.vision}”？`,
    `在现实中尝试下一步之前，你还需要了解哪些与“${profile.question}”有关的信息？`,
    '', '关于这份报告',
    active.mode==='ai' ? '本路径由 '+modelName(active.generation.model)+' 根据填写的信息和选择生成。内容是可能的情景，不代表未来事实；节点年龄是叙事时间线。早先的演示路径会保留各自的来源。' : '本路径使用预设情景规则生成，用于流程体验；内容不代表未来事实。');
  return lines.join('\n');
}

