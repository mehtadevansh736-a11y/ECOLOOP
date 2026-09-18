import Link from 'next/link';
import { 
  Camera, 
  Repeat, 
  Sparkles, 
  ArrowRight, 
  Recycle, 
  Wrench, 
  HeartHandshake, 
  Coins, 
  Trash2, 
  ShieldCheck, 
  Leaf, 
  TrendingUp, 
  Users, 
  CheckCircle2,
  Sprout 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero-bg border border-brand-100 p-8 md:p-14 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>AI-Powered Waste & Circular Economy Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Give Every Item a <span className="text-brand-600 underline decoration-brand-300 decoration-wavy">Second Life.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 font-normal leading-relaxed">
            EcoLoop uses AI to identify unwanted items and recommend whether they should be reused, repaired, donated, resold, recycled, or responsibly disposed.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <Link href="/scanner">
              <Button size="lg" className="shadow-md shadow-brand-600/20">
                <Camera className="w-5 h-5" />
                <span>Scan an Item</span>
              </Button>
            </Link>

            <Link href="/marketplace">
              <Button variant="outline" size="lg">
                <Repeat className="w-5 h-5 text-slate-500" />
                <span>Explore Marketplace</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-6 text-xs text-slate-500 font-medium pt-4 border-t border-slate-200/60">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600" /> 100% Free for Citizens</span>
            <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-brand-600" /> Transparent CO₂ Engine</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand-600" /> Instant AI Vision</span>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="w-full md:w-96 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live AI Item Analysis</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">98% Match</span>
          </div>
          <div className="relative aspect-video rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80" 
              alt="Wooden Chair Example" 
              className="object-cover w-full h-full"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md p-2 rounded-lg text-xs font-medium text-slate-800 shadow-sm flex items-center justify-between">
              <span>Vintage Wooden Chair</span>
              <span className="font-bold text-brand-600">87 Score</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="block font-bold text-emerald-700">Action</span>
              <span className="text-emerald-900 font-medium">🔧 Repair</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block font-bold text-slate-500">Material</span>
              <span className="text-slate-800 font-medium">Solid Wood</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="block font-bold text-slate-500">CO₂ Saved</span>
              <span className="text-slate-800 font-medium">27.2 kg</span>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Workflow Process */}
      <section className="space-y-8 text-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">The EcoLoop Circular Workflow</h2>
          <p className="text-slate-500 text-sm mt-1">From unwanted waste to a sustainable second life in 5 simple steps.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'SCAN', desc: 'Upload photo of item', icon: Camera, color: 'bg-emerald-500' },
            { step: '02', title: 'UNDERSTAND', desc: 'AI identifies material & score', icon: Sparkles, color: 'bg-teal-500' },
            { step: '03', title: 'ACT', desc: 'Get custom circular path', icon: Wrench, color: 'bg-cyan-500' },
            { step: '04', title: 'REUSE', desc: 'List, donate, or repair', icon: Repeat, color: 'bg-blue-500' },
            { step: '05', title: 'IMPACT', desc: 'Earn points & track CO₂', icon: Sprout, color: 'bg-green-600' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} variant="flat" className="p-5 text-center flex flex-col items-center hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{item.step}</span>
                <div className={`w-12 h-12 rounded-2xl ${item.color} text-white flex items-center justify-center my-3 shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="grid md:grid-cols-2 gap-8">
        <Card className="p-8 border-rose-100 bg-rose-50/30">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">The Linear Waste Problem</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Over 2 billion tons of municipal solid waste is generated globally every year. Millions of repairable or reusable items are sent straight to landfills simply because people don’t know how or where to recycle, donate, or repair them.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-2 text-rose-700">❌ 80% of items in landfills could be reused or recycled</li>
            <li className="flex items-center gap-2 text-rose-700">❌ High carbon emissions from manufacturing unnecessary replacements</li>
          </ul>
        </Card>

        <Card className="p-8 border-emerald-100 bg-emerald-50/30">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <Recycle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">The EcoLoop AI Solution</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            EcoLoop empowers individuals with multimodal vision AI to instantly audit items, uncover their true materials and reusability, and connect them with local repair centers, thrift networks, or peer-to-peer marketplaces.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-2 text-emerald-700">✅ Instant AI vision recognition & condition assessment</li>
            <li className="flex items-center gap-2 text-emerald-700">✅ Verified CO₂ lifecycle engine and gamified eco rewards</li>
          </ul>
        </Card>
      </section>

      {/* Recommended Actions Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">6 Paths for Every Unwanted Item</h2>
          <p className="text-xs text-slate-500 mt-1">EcoLoop evaluates items against 6 circular economy destinations.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { action: 'Reuse', icon: Repeat, color: 'text-emerald-600 bg-emerald-50' },
            { action: 'Repair', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
            { action: 'Donate', icon: HeartHandshake, color: 'text-rose-600 bg-rose-50' },
            { action: 'Resell', icon: Coins, color: 'text-indigo-600 bg-indigo-50' },
            { action: 'Recycle', icon: Recycle, color: 'text-blue-600 bg-blue-50' },
            { action: 'Dispose', icon: Trash2, color: 'text-slate-600 bg-slate-100' },
          ].map((act, i) => {
            const Icon = act.icon;
            return (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white text-center flex flex-col items-center hover:shadow-xs transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${act.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-slate-900">{act.action}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 md:p-12 text-center space-y-6 shadow-xl">
        <h2 className="text-3xl md:text-4xl font-black">Ready to Give Your Items a Second Life?</h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          Snap a photo with your mobile or desktop camera now. EcoLoop’s AI will analyze it in seconds.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/scanner">
            <Button size="lg" className="bg-brand-500 hover:bg-brand-600 text-white border-0">
              <Camera className="w-5 h-5" />
              <span>Start Scanning Now</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
