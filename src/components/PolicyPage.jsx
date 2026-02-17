import { Link } from 'react-router-dom';

export default function PolicyPage({ darkMode, title, subtitle, sections }) {
  const themeBg = darkMode ? 'bg-[#050505]' : 'bg-[#f8f9fa]';
  const themeCard = darkMode ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200';
  const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
  const themeTextSub = darkMode ? 'text-zinc-400' : 'text-gray-600';

  return (
    <div className={`min-h-screen ${themeBg} ${themeTextMain} p-6 md:p-12`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/" className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] ${themeTextSub} hover:text-orange-600 transition-colors`}>
          <span>&larr;</span>
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mt-6 mb-3">{title}</h1>
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 mb-10 ${themeTextSub}`}>{subtitle}</p>

        <div className={`${themeCard} border rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6`}>
          {sections.map((section, idx) => (
            <section key={`${section.heading}-${idx}`}>
              <h2 className="text-lg md:text-xl font-black uppercase mb-2">{section.heading}</h2>
              <p className={`${themeTextSub} text-sm leading-relaxed`}>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
