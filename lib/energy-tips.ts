// lib/energy-tips.ts - 基于《不要浪费精力》的科学精力与注意力管理知识库及启动就绪规范

export interface EnergyTip {
  id: number;
  category: 'working' | 'mindset' | 'sleep' | 'emotion' | 'social';
  categoryLabel: string;
  title: string;
  oneLiner: string;
  actionableGuide: string;
  scientificEvidence: string;
  source: string;
  evidenceGrade: 'A' | 'B' | 'C';
}

export interface CardoStep {
  stepNumber: number;
  category: string;
  title: string;
  subtitle: string;
  items: {
    id: string;
    action: string;
    target: string; // 拿开什么 / 关掉什么 / 戴上什么 / 锁定什么
    why: string;    // 科学原理
    tag: '拿开' | '关掉' | '准备' | '锁定' | '心态';
  }[];
}

// 别名兼容
export type FocusStep = CardoStep;

// 规范化的 Cardo 启动 4 步仪式指引
export const CARDO_PREFLIGHT_STEPS: CardoStep[] = [
  {
    stepNumber: 1,
    category: '物理空间净化',
    title: '拿开干扰源与物理隔离',
    subtitle: '让大脑可用的认知带宽达到最大',
    items: [
      {
        id: 'step-phone-away',
        tag: '拿开',
        target: '把手机拿开并放到视线之外',
        action: '将手机静音并放入抽屉、背包或身后桌上，不要留在视线范围内。',
        why: '即使忍住不看，手机搁在桌上也会让大脑可用的认知余量变少，手机依赖越强掉得越多 (Ward et al., 2017)。',
      },
      {
        id: 'step-wear-earplugs',
        tag: '准备',
        target: '戴上降噪耳机 / 耳塞，或关闭房门',
        action: '在开放环境使用降噪耳机播放白噪音/无词音乐，隔绝人声交谈。',
        why: '背景噪音从 39dB 升至 51dB 会显著削弱记忆力并加剧疲劳，最碍事的是能听清内容的交谈声 (Jahncke et al., 2011)。',
      },
    ],
  },
  {
    stepNumber: 2,
    category: '数字窗口清理',
    title: '关掉打断通道与多余窗口',
    subtitle: '挡住哪怕几秒钟的打断，保护心流',
    items: [
      {
        id: 'step-close-notifications',
        tag: '关掉',
        target: '关掉非必要弹窗通知与即时通讯',
        action: '退出微信/钉钉/QQ或开启免打扰，关闭电脑系统的弹窗通知。',
        why: '平均 2.8 秒的微小打断就会让后续步骤出错率翻倍，被打断后平均需要 25 分钟才能重新回到主线上 (Altmann et al., 2014; Mark et al., 2005)。',
      },
      {
        id: 'step-clean-tabs',
        tag: '关掉',
        target: '关闭无关浏览器标签页与后台无关软件',
        action: '只保留当前任务所需的 1~2 个工作窗口，其余标签页暂存或关闭。',
        why: '频繁在多媒体/多窗口间切换会削弱认知控制力，重度多任务者在切换测试上表现更差 (Ophir et al., 2009)。',
      },
    ],
  },
  {
    stepNumber: 3,
    category: '任务聚焦锁定',
    title: '一次只做一件事，明确第一步动作',
    subtitle: '杜绝多任务并行，建立清晰执行路径',
    items: [
      {
        id: 'step-single-task',
        tag: '锁定',
        target: '锁定当前唯一的子任务与时间盒',
        action: '确认当前只推进第一项子任务，不要在开会或写代码时边回邮件。',
        why: '任务切换后反应明显更慢、错误率更高；专注单任务能显著降低挫败感与感知压力 (Monsell, 2003)。',
      },
      {
        id: 'step-first-action',
        tag: '锁定',
        target: '明确动手的第一个具体动作（打开哪个文件/写哪行代码）',
        action: '把抽象任务具象化为立即能动手的微小动作，快速越过启动阻力。',
        why: '具象化动作能够绕过前额叶的决策耗竭，使人迅速进入执行状态。',
      },
    ],
  },
  {
    stepNumber: 4,
    category: '心理调适与兜底',
    title: '设立兜底任务，破除反刍内耗',
    subtitle: '卡壳时不空转，遇到阻碍快速切换动手动向',
    items: [
      {
        id: 'step-fallback-ready',
        tag: '准备',
        target: '就绪兜底任务（Fallback Task）',
        action: '明确遇到编译等待、他人回复等待或思路卡壳时，立刻做兜底任务。',
        why: '反复回想糟心事或在原地空转会加重焦虑，换个需要动手的低认知活能有效阻断反刍 (Nolen-Hoeksema et al., 2008)。',
      },
      {
        id: 'step-mindset-check',
        tag: '心态',
        target: '把「必须完美」当症状看，不当事实看',
        action: '允许第一版粗糙，按时间盒推进，杜绝过度推敲导致的拖延。',
        why: '社会规定型完美主义会显著增加心理内耗；专注完成比盲目苛求完美更能保护长期精力 (Smith et al., 2018)。',
      },
    ],
  },
];

// 精力管理科学知识条目库
export const ENERGY_TIPS: EnergyTip[] = [
  {
    id: 1,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '工作时把手机放到视线之外',
    oneLiner: '手机响一下哪怕不看，成绩也会下降；搁在桌上忍住不看，大脑余量也会变少。',
    actionableGuide: '进入专注前，将手机调至静音并放到抽屉里或身后桌上。工作台面只留当前任务必要的工具。',
    scientificEvidence: 'Ward 等 (2017) 实验证实：即使克制住不看手机，手机在身边也会减少脑力可用余量。Stothart (2015) 发现收到通知不看，注意力下降幅度与接打电话相当。',
    source: 'Ward et al. (2017) JACR / Stothart et al. (2015) JEP:HPP',
    evidenceGrade: 'B',
  },
  {
    id: 6,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '挡住哪怕几秒钟的微小打断',
    oneLiner: '一次 2.8 秒的打断会让错误率翻倍，被打断后平均需要 25 分钟才能回得来。',
    actionableGuide: '做需要深度思考的活时，戴上耳机、挂上免打扰，把门关好。绝不在写核心逻辑时切出去回消息。',
    scientificEvidence: 'Altmann 等 (2014) 实验：2.8 秒打断使序列任务错误率翻倍，4.4 秒翻三倍。Mark 等 (2005) 现场跟踪：被打断的工作主题平均要 25 分 26 秒才回得来，中途插进 2.26 件事。',
    source: 'Altmann et al. (2014) JEP:Gen / Mark et al. (2005) CHI',
    evidenceGrade: 'B',
  },
  {
    id: 7,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '一次只做一件事，拒绝多任务并行',
    oneLiner: '任务一切换反应就更慢，经常多任务的人并没有练出分心能力，反而控制力更差。',
    actionableGuide: '开会时别回邮件，写代码时别刷社交平台。保持单线程工作，做完一个再切下一个。',
    scientificEvidence: 'Monsell (2003) 综述表明任务切换导致显著的时间惩罚与错误增加。Ophir 等 (2009) PNAS 研究显示重度媒体多任务者在认知控制与抗干扰测试中表现反而更差。',
    source: 'Monsell (2003) TiCS / Ophir et al. (2009) PNAS',
    evidenceGrade: 'B',
  },
  {
    id: 5,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '把邮件与消息改成每天固定 3 次批量处理',
    oneLiner: '限制为每天查 3 次邮件的人日常压力显著更低，而收发邮件的总量完全一样。',
    actionableGuide: '给即时通讯工具设定固定查看窗口（如 11:30、15:30、17:30），非处理时段彻底退出或静音。',
    scientificEvidence: 'Kushlev & Dunn (2015) 成人对照试验：将查邮件限制为每天 3 次时，日常压力显著下降 (d = 0.37)，收发邮件总量并无变化。',
    source: 'Kushlev & Dunn (2015) Comput. Human Behav.',
    evidenceGrade: 'B',
  },
  {
    id: 12,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '开放办公室用耳塞或去安静空间',
    oneLiner: '背景噪音从 39dB 升到 51dB 时，记忆力下降，人更疲劳且更不想干活。',
    actionableGuide: '做需要记忆和推理的重度活时，使用主动降噪耳机配合白噪音，或者借用安静会议室。',
    scientificEvidence: 'Jahncke 等 (2011) 模拟开放办公室实验：噪音由 39dB 升至 51dB 时，受试者记忆词汇减少、自评疲劳上升、工作动机下降。',
    source: 'Jahncke et al. (2011) J. Environ. Psychol.',
    evidenceGrade: 'B',
  },
  {
    id: 13,
    category: 'working',
    categoryLabel: '工作注意力',
    title: '工时别一味往上加：超过阈值多干等于白干',
    oneLiner: '一周干 70 小时和干 56 小时出的活几乎一样，多干的 14 小时基本是白干。',
    actionableGuide: '合理规划每周 40~48 小时的深度高产时间，别靠疲劳战术假装努力，精力透支后产出边际收益归零。',
    scientificEvidence: 'Pencavel (2015) 生产力经济学分析：每周超过 49 小时后单位工时边际产出急剧衰减，70 小时总产出与 56 小时几乎无差别。',
    source: 'Pencavel (2015) Economic Journal',
    evidenceGrade: 'B',
  },
  {
    id: 14,
    category: 'mindset',
    categoryLabel: '念头与内耗',
    title: '反复回想同一件糟心事时，换个动手的活',
    oneLiner: '原地空转思考（反刍）只会加重内耗；察觉到自己在原地绕，立刻去干点动手的活。',
    actionableGuide: '当发现自己因为某个错误或等待卡壳反复焦虑时，立刻切换到兜底任务、整理桌面、做简单重构或散步。',
    scientificEvidence: 'Nolen-Hoeksema 等 (2008) 综述：反刍思维会强化负面信念、削弱问题解决能力并阻碍实际行动；转移注意至实体行动优于沉溺思绪。',
    source: 'Nolen-Hoeksema et al. (2008) Perspect. Psychol. Sci.',
    evidenceGrade: 'B',
  },
  {
    id: 15,
    category: 'mindset',
    categoryLabel: '念头与内耗',
    title: '把「事情肯定会更糟」当症状看，不当事实看',
    oneLiner: '悲观预期是大脑疲劳或应激时的情绪症状，并非对未来发展的准确预测。',
    actionableGuide: '觉察到脑海里的灾难化念头时，告诉自己：“这只是大脑在发警报，不是既定事实”，然后看眼前下一步。',
    scientificEvidence: 'Whitfield 等 (2020) 20 年随访研究：悲观得分与心血管及全因死亡风险显著相关；处理悲观预期的认知偏差能有效减少心理能量耗竭。',
    source: 'Whitfield et al. (2020) Sci. Rep.',
    evidenceGrade: 'B',
  },
  {
    id: 22,
    category: 'mindset',
    categoryLabel: '念头与内耗',
    title: '把「别人要求我完美」当症状看，不当事实看',
    oneLiner: '总觉得“别人要求我必须完美”会带来巨大内耗，分清自己的标准与想象中他人的期待。',
    actionableGuide: '工作时实行“小步迭代、先完成再完美”。不要因为害怕评价而迟迟不敢交付初稿。',
    scientificEvidence: 'Smith 等 (2018) 荟萃分析 (45 项研究，N=11747)：社会规定型完美主义（认为他人要求自己完美）与心理内耗及严重心理危机高度正相关。',
    source: 'Smith et al. (2018) J. Pers.',
    evidenceGrade: 'B',
  },
  {
    id: 21,
    category: 'mindset',
    categoryLabel: '念头与内耗',
    title: '觉得「所有人都看见我出丑了」时，把估计除以二',
    oneLiner: '聚光灯效应会让人大幅高估外界对自己的关注度；别人根本没你想象中那么注意你。',
    actionableGuide: '在会议上说错一句话或提交有小 bug 时，不要反复自责内耗，实际注意到的可能不到你估计的一半。',
    scientificEvidence: 'Gilovich 等 (2000) 经典聚光灯效应实验：当事人估计有 46% 的人注意到自己的尴尬 T 恤，实际只有 23%，平均高估一倍以上。',
    source: 'Gilovich et al. (2000) JPSP',
    evidenceGrade: 'B',
  },
  {
    id: 11,
    category: 'sleep',
    categoryLabel: '睡眠与充能',
    title: '下午困了就小睡 10 分钟，不要睡半小时',
    oneLiner: '10 分钟小睡当场提神并能维持 2.5 小时；睡 30 分钟会有睡眠惰性，刚醒时更懵。',
    actionableGuide: '午后犯困时，定一个 10~15 分钟的闹钟闭目养神。避免睡过长进入深睡眠导致醒后头沉。',
    scientificEvidence: 'Brooks & Lack (2006) 实验：10 分钟小睡能立刻改善困倦并维持脑力表现至 155 分钟；30 分钟小睡会引发明显的睡眠惰性。',
    source: 'Brooks & Lack (2006) Sleep',
    evidenceGrade: 'B',
  },
  {
    id: 4,
    category: 'sleep',
    categoryLabel: '睡眠与充能',
    title: '下午两点以后不碰咖啡因',
    oneLiner: '睡前 6 小时喝咖啡用仪器测出少睡 1 小时以上，一杯普通咖啡需 8.8 小时才代谢完。',
    actionableGuide: '想要晚上 11 点入睡，下午 2 点后不再喝咖啡、奶茶或能量饮料，改喝白开水或无咖啡因茶。',
    scientificEvidence: 'Gardiner 等 (2023) 荟萃分析与 Drake (2013) 实验：咖啡因平均让总睡眠时间减少 45~70 分钟，普通咖啡需 8.8 小时以上才不影响睡眠质量。',
    source: 'Gardiner et al. (2023) Sleep Med. Rev.',
    evidenceGrade: 'A',
  },
  {
    id: 3,
    category: 'sleep',
    categoryLabel: '睡眠与充能',
    title: '每晚睡够 7 到 8 小时，别把 6 小时当够用',
    oneLiner: '连着两周每晚睡 6 小时，脑力表现等同于两天两夜没合眼，且自己感觉不到。',
    actionableGuide: '保证规律作息与 7~8 小时整夜睡眠。「觉得自己习惯了 6 小时」往往是缺觉的适应性假象。',
    scientificEvidence: 'Van Dongen 等 (2003) RCT 试验：连续 14 天睡 6 小时组的认知测试表现累积下跌至相当于连续 2 晚剥夺睡眠水平，但自评困倦感在几天后不再上升。',
    source: 'Van Dongen et al. (2003) Sleep',
    evidenceGrade: 'A',
  },
  {
    id: 23,
    category: 'emotion',
    categoryLabel: '情绪降温',
    title: '生气烦躁时别靠发泄，先让身体慢下来',
    oneLiner: '砸东西、打沙袋等兴奋式发泄整体消不了气；深呼吸、正念冥想能迅速压下怒气。',
    actionableGuide: '工作中遇到挫折或沟通冲突时，离场 3 分钟，做几次缓慢深长的呼吸（吸气4秒-呼气6秒），让心跳平复。',
    scientificEvidence: 'Kjærvik & Bushman (2024) 荟萃分析 (154 项研究，N=10189)：降低生理唤醒的活动（深呼吸、正念）能有效降低怒气 (g = -0.63)；提升唤醒的发泄活动整体无效 (g = -0.02)。',
    source: 'Kjærvik & Bushman (2024) Clin. Psychol. Rev.',
    evidenceGrade: 'A',
  },
  {
    id: 18,
    category: 'emotion',
    categoryLabel: '情绪管理',
    title: '情绪低落时先做性价比最高的事：动起来与晒太阳',
    oneLiner: '快走和慢跑对改善低落情绪效果显著；白天多见自然光能强效校准生物节律与情绪。',
    actionableGuide: '感觉心累不想动时，去户外快走 10 分钟晒晒太阳，比坐在工位上硬撑更能快速恢复心理能量。',
    scientificEvidence: 'Noetel 等 (2024) BMJ 网络荟萃分析 (218 项 RCT)：步行与慢跑对情绪改善效应量达 g = -0.62；光照治疗对情绪调节有确切疗效 (Golden 2005)。',
    source: 'Noetel et al. (2024) BMJ / Golden et al. (2005) AJP',
    evidenceGrade: 'A',
  },
];

// 保持别名兼容
export const FOCUS_PREFLIGHT_STEPS = CARDO_PREFLIGHT_STEPS;
