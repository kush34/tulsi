"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i8n/config";
import type { Dictionary } from "@/i8n/dictionaries";

type WelcomeScreenProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export default function WelcomeScreen({
  locale,
  dictionary,
}: WelcomeScreenProps) {
  const router = useRouter();

  function handleLanguageChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const nextLocale = event.target.value as Locale;

    router.push(`/${nextLocale}`);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#172033]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-7 sm:px-10 lg:px-12">
        {/* Header */}
        <header className="flex items-start justify-between">
          <Link
            href={`/${locale}`}
            className="flex flex-col leading-none"
            aria-label="MediKiosk home"
          >
            <span className="text-[20px] font-bold tracking-[-0.6px] text-[#1768d5]">
              MediKiosk
            </span>

            <span className="mt-1 text-[9px] font-medium tracking-[0.2px] text-[#8290a5]">
              Clinical Intake
            </span>
          </Link>

          {/* Language selector */}
          <div className="flex items-center gap-2 text-[12px] text-[#667085]">
            <label htmlFor="language" className="sr-only">
              {dictionary.language.label}
            </label>

            <select
              id="language"
              value={locale}
              onChange={handleLanguageChange}
              className="
                cursor-pointer
                appearance-none
                border-0
                bg-transparent
                p-0
                text-[12px]
                text-[#667085]
                outline-none
              "
            >
              {locales.map((item) => (
                <option key={item} value={item}>
                  {localeNames[item]}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Main */}
        <section className="flex flex-1 items-center justify-center pb-20 pt-16">
          <div className="grid w-full max-w-[780px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_192px] lg:gap-16">
            {/* Welcome content */}
            <div className="text-center">
              <h1 className="text-[30px] font-bold leading-tight tracking-[-1px] text-[#172033] sm:text-[32px]">
                {dictionary.welcome.title}
              </h1>

              <p className="mt-2.5 text-[14px] leading-6 text-[#8290a5]">
                {dictionary.welcome.subtitle}
              </p>

              <div className="mt-7">
                <Link
                  href={`/${locale}/assessment`}
                  className="
                    inline-flex
                    h-[49px]
                    w-full
                    max-w-[268px]
                    items-center
                    justify-center
                    rounded-[10px]
                    bg-[#1768d5]
                    px-6
                    text-[14px]
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-[#125bbb]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#1768d5]
                    focus:ring-offset-2
                    active:scale-[0.99]
                  "
                >
                  {dictionary.welcome.startAssessment}
                </Link>
              </div>

              <p className="mt-2 text-[11px] text-[#8a96a8]">
                {dictionary.welcome.audioGuidance}
              </p>
            </div>

            {/* Feature card */}
            <aside
              className="
                flex
                min-h-[274px]
                flex-col
                justify-start
                rounded-[15px]
                bg-[#e7f1ff]
                px-10
                py-10
              "
              aria-label={dictionary.voiceTouch.title}
            >
              <h2 className="text-[20px] font-semibold tracking-[-0.4px] text-[#1768d5]">
                {dictionary.voiceTouch.title}
              </h2>

              <p className="mt-2 text-[14px] font-medium leading-[18px] text-[#263447]">
                {dictionary.voiceTouch.description}
              </p>

              <p className="mt-6 text-[12px] leading-[17px] text-[#7b8798]">
                {dictionary.voiceTouch.instruction}
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}