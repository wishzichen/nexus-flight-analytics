import React, { useState } from 'react';
import { Plane, AlertTriangle, ArrowLeft, Clock, Map, Zap, Layers, ServerCrash, Building, GitBranch, PieChart, Table, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TabNav from '../components/layout/TabNav';
import Module1Dashboard from '../modules/Module1Dashboard';
import Module2TimeAnalysis from '../modules/Module2TimeAnalysis';
import Module3RouteAnalysis from '../modules/Module3RouteAnalysis';
import Module4AirRecovery from '../modules/Module4AirRecovery';
import Module5AirlineAnalysis from '../modules/Module5AirlineAnalysis';
import Module6DelayPropagation from '../modules/Module6DelayPropagation';
import Module7Attribution from '../modules/Module7Attribution';
import Module8DataExplorer from '../modules/Module8DataExplorer';

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // 渲染当前模块
    const renderModule = () => {
        switch (activeTab) {
            case 'overview': return <Module1Dashboard />;
            case 'time': return <Module2TimeAnalysis />;
            case 'routes': return <Module3RouteAnalysis />;
            case 'recovery': return <Module4AirRecovery />;
            case 'airlines': return <Module5AirlineAnalysis />;
            case 'propagation': return <Module6DelayPropagation />;
            case 'attribution': return <Module7Attribution />;
            case 'explorer': return <Module8DataExplorer />;
            default: return <Module1Dashboard />;
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] bg-grid text-[#f1f5f9] font-sans">
            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                <Plane className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-lg font-bold tracking-tight text-white">航班延误分析系统</span>
                                <span className="hidden md:inline text-slate-500 text-sm ml-2">| Nexus Flight Analytics</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs text-cyan-400 font-medium">nycflights13 数据集</span>
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1.5 rounded-lg">
                            纽约 2013
                        </div>
                    </div>
                </div>

                {/* Tab 导航 */}
                <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
            </header>

            {/* 模块内容 */}
            <main className="p-6 md:p-8">
                {renderModule()}
            </main>

            {/* 页脚 */}
            <footer className="py-8 text-center text-xs text-slate-600 border-t border-white/5">
                <p>基于 nycflights13 数据集 · R 语言分析 · React + ECharts 可视化</p>
            </footer>
        </div>
    );
}