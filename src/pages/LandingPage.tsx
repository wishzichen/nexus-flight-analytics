import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plane, Activity, BarChart2, ShieldAlert, Clock, Map, Building, GitBranch, PieChart, Table } from 'lucide-react';

const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
            <div className="radar-circle" style={{width: 600, height: 600, top: 100, left: -100}}></div>
            <div className="radar-circle" style={{width: 400, height: 400, top: 200, left: 0}}></div>
            <div className="radar-circle" style={{width: 200, height: 200, top: 300, left: 100}}></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
        </div>
    );
}

const modules = [
    { name: '总览仪表板', icon: BarChart2, color: 'cyan' },
    { name: '时间规律', icon: Clock, color: 'purple' },
    { name: '航线分析', icon: Map, color: 'orange' },
    { name: '空中追回', icon: Plane, color: 'green' },
    { name: '航司表现', icon: Building, color: 'blue' },
    { name: '延误传导', icon: GitBranch, color: 'red' },
    { name: '延误归因', icon: PieChart, color: 'pink' },
    { name: '数据探索', icon: Table, color: 'indigo' },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

    return (
        <div ref={containerRef} className="bg-[#020617] bg-grid min-h-screen text-[#f1f5f9] overflow-x-hidden font-sans relative selection:bg-cyan-500/30">
            <ParticleBackground />

            {/* 导航栏 */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 py-4 px-8 flex justify-between items-center bg-slate-950/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Plane className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="font-bold tracking-tight text-white">航班延误分析系统</span>
                        <span className="hidden md:inline text-slate-500 text-sm ml-2">| Nexus Flight Analytics</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
                >
                    进入系统 <ArrowRight className="w-4 h-4" />
                </button>
            </nav>

            {/* 主视觉区域 */}
            <motion.section
                style={{ opacity: heroOpacity, y: heroY }}
                className="relative h-screen flex flex-col items-center justify-center text-center px-4 z-10"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#020617] to-[#020617] -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        nycflights13 数据集 · 336,776 条航班记录
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter leading-none mb-8">
                        DELAY IS A <span className="font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">SYSTEM</span>,<br/>
                        <span className="text-slate-400">NOT AN ACCIDENT.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        解码时间、天气与运营压力的连锁反应。通过沉浸式数据视角，探索航班延误背后的隐藏机制。
                    </p>

                    {/* 功能模块展示 */}
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-12 max-w-3xl mx-auto">
                        {modules.map((mod, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                            >
                                <mod.icon className={`w-5 h-5 text-${mod.color}-400 group-hover:scale-110 transition-transform`} />
                                <span className="text-[10px] text-slate-500 group-hover:text-slate-300">{mod.name}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                        >
                            启动分析
                        </button>
                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-3.5 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                        >
                            了解更多
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 flex flex-col items-center gap-2 text-slate-500 text-sm"
                >
                    <span className="text-xs tracking-widest uppercase">向下滚动探索</span>
                    <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
                        <div className="w-1.5 h-3 bg-cyan-400 rounded-full animate-bounce" />
                    </div>
                </motion.div>
            </motion.section>

            {/* 数据概览区域 */}
            <section id="features" className="py-24 relative z-10 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            时间损失的<span className="text-cyan-400">解剖学</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            航班不是孤立事件，而是高度敏感网络中的节点。我们解构纽约 2013 年数据，揭示运营压力如何传播。
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                        {[
                            { title: "分析航班总数", value: "336,776", icon: BarChart2, color: "cyan" },
                            { title: "延误航班比例", value: "39.1%", icon: ShieldAlert, color: "orange" },
                            { title: "平均起飞延误", value: "12.6分钟", icon: Activity, color: "purple" },
                            { title: "数据维度", value: "19个字段", icon: Plane, color: "green" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel p-6 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 border-l-4 border-l-cyan-500/50 hover:border-l-cyan-400"
                            >
                                <stat.icon className={`w-8 h-8 text-${stat.color}-400 mb-4`} />
                                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-slate-500">{stat.title}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 航班案例卡片 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative max-w-2xl mx-auto rounded-3xl glass-panel overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                                    <span className="font-mono text-cyan-400">航班 UA1545</span>
                                </div>
                                <div className="text-xs text-slate-500">纽约 → 洛杉矶</div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 font-mono text-sm">
                                <div>
                                    <div className="text-slate-500 mb-1">计划起飞</div>
                                    <div className="text-white text-lg">05:15</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">实际起飞</div>
                                    <div className="text-orange-400 text-lg">05:54 <span className="text-xs">(+39分钟)</span></div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">计划到达</div>
                                    <div className="text-white text-lg">08:19</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 mb-1">实际到达</div>
                                    <div className="text-green-400 text-lg">08:12 <span className="text-xs">(-7分钟)</span></div>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                <div className="text-cyan-400 text-sm">
                                    ✈️ 空中追回成功，弥补 46 分钟延误
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 功能模块详情 */}
            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-4">八大分析模块</h2>
                    <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        从宏观概览到微观明细，全方位解析航班延误规律
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: '总览仪表板', desc: '整体延误概况、关键指标、时间热力图', icon: BarChart2, color: 'cyan' },
                            { name: '时间规律', desc: '24小时/月份/星期延误趋势分析', icon: Clock, color: 'purple' },
                            { name: '航线分析', desc: '目的地延误排名、航线风险评估', icon: Map, color: 'orange' },
                            { name: '空中追回', desc: '高延误航班的追回能力分析', icon: Plane, color: 'green' },
                            { name: '航司表现', desc: '航司准点率、机队规模对比', icon: Building, color: 'blue' },
                            { name: '延误传导', desc: '同机延误传导效应分析', icon: GitBranch, color: 'red' },
                            { name: '延误归因', desc: '机龄vs天气因素影响分析', icon: PieChart, color: 'pink' },
                            { name: '数据探索', desc: '航班明细数据查询与导出', icon: Table, color: 'indigo' },
                        ].map((mod, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="group p-6 rounded-2xl bg-slate-800/30 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                            >
                                <mod.icon className={`w-10 h-10 text-${mod.color}-400 mb-4 group-hover:scale-110 transition-transform`} />
                                <h3 className="text-lg font-semibold text-white mb-2">{mod.name}</h3>
                                <p className="text-sm text-slate-500">{mod.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 技术栈 */}
            <section className="py-24 relative z-10 bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-8">技术架构</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'ECharts', 'Express.js', 'R 语言', 'nycflights13'].map((tech, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-800 rounded-full text-sm text-slate-300 border border-white/5">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 行动召唤 */}
            <section className="py-32 relative z-10">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        准备好深入探索了吗？
                    </h2>
                    <p className="text-slate-400 text-lg mb-10">
                        进入控制室，探索交互式仪表板，按小时、目的地、航司和气象因素切分数据。
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
                    >
                        进入航班仪表板
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="py-8 border-t border-white/5 text-center text-sm text-slate-600">
                <p>基于 nycflights13 数据集 · R 语言分析 · React + ECharts 可视化</p>
            </footer>
        </div>
    );
}