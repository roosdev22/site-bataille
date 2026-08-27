"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import aboutData from "@/data/data.json";

const Icons = {
  ArrowUpRight: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  ),

  Clock: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),

  Compass: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
    </svg>
  ),

  Quote: () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.5 6C5.01 6 3 8.01 3 10.5S5.01 15 7.5 15c.26 0 .52-.02.77-.07-.46 1.45-1.46 2.65-2.93 3.52l.78 1.3c2.83-1.4 4.38-3.8 4.38-7.15v-2.1C10.5 8.01 9.16 6 7.5 6Zm9 0C14.01 6 12 8.01 12 10.5s2.01 4.5 4.5 4.5c.26 0 .52-.02.77-.07-.46 1.45-1.46 2.65-2.93 3.52l.78 1.3c2.83-1.4 4.38-3.8 4.38-7.15v-2.1C19.5 8.01 18.16 6 16.5 6Z" />
    </svg>
  ),

  Linkedin: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.5 8.5H3V21h3.5V8.5ZM4.75 3A2.05 2.05 0 1 0 4.75 7.1 2.05 2.05 0 0 0 4.75 3ZM21 13.87c0-3.76-2-5.51-4.68-5.51-2.15 0-3.11 1.18-3.65 2.01V8.5H9.17V21h3.5v-6.19c0-1.63.31-3.2 2.32-3.2 1.98 0 2.01 1.86 2.01 3.31V21H21v-7.13Z" />
    </svg>
  ),
};

type Specialization = {
  title: string;
  desc: string;
};

type TimelineItem = {
  year: string;
  title: string;
  desc: string;
};

type Stat = {
  number: string;
  label: string;
};

export default function AboutSection() {
  const {
    name,
    credentials,
    title,
    tagline,
    experience,
    experienceSub,
    quote,
    bio,
    stats,
    specializations,
    timeline,
    expertise,
    languages,
    social,
  } = aboutData as typeof aboutData & {
    credentials?: string;
    tagline?: string;
    experience?: string;
    experienceSub?: string;
    quote?: string;
    bio: string[];
    stats: Stat[];
    specializations?: Specialization[];
    timeline: TimelineItem[];
    expertise: string[];
    languages?: string[];
    social?: {
      linkedin?: string;
    };
  };

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ");

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#f8f7f3] py-20 sm:py-24 lg:py-32"
    >
      {/* Décoration très discrète */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full border border-[#b99a52]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-220px] left-[-180px] h-[420px] w-[420px] rounded-full border border-[#b99a52]/10"
      />

      <Container>
        {/* =====================================================
            INTRODUCTION
        ===================================================== */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl"
        >
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-[#b99a52]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8b7440] sm:text-[11px]">
              À propos
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h2 className="font-serif text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-[#20202b] sm:text-5xl md:text-6xl lg:text-[72px]">
                {firstName}
                <br />

                <span className="text-[#a88942]">{lastName}</span>

                {credentials && (
                  <sup className="ml-2 align-super font-sans text-sm font-semibold tracking-normal text-[#a88942] sm:text-base">
                    {credentials}
                  </sup>
                )}
              </h2>
            </div>

            <div className="border-l border-[#d9d4c8] pl-5 lg:mb-1">
              <p className="text-sm font-medium leading-relaxed text-[#34343e] sm:text-base">
                {title}
              </p>

              {tagline && (
                <p className="mt-3 text-xs italic leading-relaxed text-[#77736b] sm:text-sm">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </motion.header>

        <div className="my-12 h-px bg-[#dedbd3] sm:my-16 lg:my-20" />

        {/* =====================================================
            CONTENU PRINCIPAL
        ===================================================== */}
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] lg:gap-20 xl:gap-28">
          {/* =================================================
              COLONNE PRINCIPALE
          ================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.7 }}
          >
            {/* EXPÉRIENCE */}
            <div className="mb-10 flex items-start justify-between gap-6 border-b border-[#dedbd3] pb-7">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a88942]">
                  Parcours professionnel
                </p>

                <h3 className="font-serif text-2xl text-[#20202b] sm:text-3xl">
                  {experience}
                </h3>

                <p className="mt-2 max-w-xl text-sm text-[#77736b]">
                  {experienceSub}
                </p>
              </div>

              <div className="hidden shrink-0 text-[#a88942] sm:block">
                <Icons.Clock />
              </div>
            </div>

            {/* BIOGRAPHIE */}
            <div className="max-w-3xl space-y-6">
              {bio.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-[15px] leading-[1.9] text-[#57555a] sm:text-base ${
                    index === 0
                      ? "first-letter:font-serif first-letter:text-3xl first-letter:font-medium first-letter:text-[#a88942]"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: paragraph }}
                />
              ))}
            </div>

            {/* CITATION */}
            {quote && (
              <div className="my-12 border-y border-[#dedbd3] py-8 sm:my-14 sm:py-10">
                <div className="mb-4 text-[#b99a52]/60">
                  <Icons.Quote />
                </div>

                <blockquote className="max-w-3xl font-serif text-xl italic leading-[1.6] text-[#292934] sm:text-2xl">
                  {quote}
                </blockquote>
              </div>
            )}

            {/* SPÉCIALISATIONS */}
            {specializations && specializations.length > 0 && (
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <Icons.Compass />

                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b4850]">
                    Domaines d'activité
                  </h3>
                </div>

                <div className="grid border-t border-[#dedbd3] sm:grid-cols-3">
                  {specializations.map((spec, index) => (
                    <div
                      key={spec.title}
                      className={`py-6 sm:px-5 ${
                        index !== 0
                          ? "border-t border-[#dedbd3] sm:border-l sm:border-t-0"
                          : ""
                      }`}
                    >
                      <span className="mb-4 block text-[10px] font-semibold tracking-[0.18em] text-[#b99a52]">
                        0{index + 1}
                      </span>

                      <h4 className="font-serif text-lg text-[#25252f]">
                        {spec.title}
                      </h4>

                      <p className="mt-2 text-xs leading-relaxed text-[#77736b]">
                        {spec.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATISTIQUES */}
            <div className="mt-12 grid border-y border-[#dedbd3] sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`py-7 sm:px-6 ${
                    index !== 0
                      ? "border-t border-[#dedbd3] sm:border-l sm:border-t-0"
                      : ""
                  }`}
                >
                  <div className="font-serif text-3xl text-[#a88942] sm:text-4xl">
                    {stat.number}
                  </div>

                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#77736b]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* =================================================
              SIDEBAR
          ================================================= */}
          <motion.aside
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {/* PARCOURS */}
            <div>
              <div className="mb-7 flex items-center justify-between border-b border-[#dedbd3] pb-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4b4850]">
                  Chronologie
                </h3>

                <Icons.Clock />
              </div>

              <div className="relative">
                <div className="absolute bottom-2 left-[4px] top-2 w-px bg-[#d9d4c8]" />

                <div className="space-y-7">
                  {timeline.map((item, index) => (
                    <motion.div
                      key={`${item.year}-${item.title}`}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.06,
                      }}
                      className="relative pl-7"
                    >
                      <span
                        className={`absolute left-0 top-1.5 h-[9px] w-[9px] rounded-full border-2 ${
                          index === timeline.length - 1
                            ? "border-[#a88942] bg-[#a88942]"
                            : "border-[#b99a52] bg-[#f8f7f3]"
                        }`}
                      />

                      <span className="text-[10px] font-bold tracking-[0.16em] text-[#a88942]">
                        {item.year}
                      </span>

                      <h4 className="mt-1 font-serif text-base leading-snug text-[#292934]">
                        {item.title}
                      </h4>

                      <p className="mt-1.5 text-xs leading-relaxed text-[#77736b]">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPERTISE */}
            <div className="mt-14 border-t border-[#dedbd3] pt-7">
              <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#4b4850]">
                Expertise
              </h3>

              <div className="flex flex-wrap gap-x-2 gap-y-2">
                {expertise.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#d9d4c8] bg-[#f8f7f3] px-3 py-1.5 text-[10px] font-medium text-[#626067] transition-colors duration-200 hover:border-[#b99a52] hover:text-[#8b7440]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* LANGUES + LINKEDIN */}
            <div className="mt-10 border-t border-[#dedbd3] pt-6">
              {languages && languages.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99948a]">
                    Langues
                  </p>

                  <p className="text-sm text-[#4e4b52]">
                    {languages.join(" · ")}
                  </p>
                </div>
              )}

              {social?.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Voir le profil LinkedIn du Dr Frantz Maria Izanne Bataille"
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-[#4e4b52] transition-colors duration-200 hover:text-[#a88942]"
                >
                  <Icons.Linkedin />
                  LinkedIn
                  <Icons.ArrowUpRight />
                </a>
              )}
            </div>
          </motion.aside>
        </div>

        {/* =====================================================
            SIGNATURE VISUELLE
        ===================================================== */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-16 flex items-center gap-4 sm:mt-20"
        >
          <span className="h-px flex-1 bg-[#dedbd3]" />

          <span className="font-serif text-sm italic text-[#a88942]">
            Médecine · Écriture · Monde
          </span>

          <span className="h-px flex-1 bg-[#dedbd3]" />
        </motion.div>
      </Container>
    </section>
  );
}

