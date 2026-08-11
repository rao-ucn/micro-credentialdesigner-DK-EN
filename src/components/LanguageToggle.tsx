import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-md border border-border bg-background overflow-hidden"
      role="group"
      aria-label="Sprog / Language"
    >
      {(['da', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            language === lang
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
