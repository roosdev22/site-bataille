"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import aboutData from "@/data/data.json";

const Icons = {
  ArrowUpRight: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  ),

  ArrowRight: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),

  Clock: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" />
    </svg>
  ),

  Quote: () => (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.4 6C4.97 6 3 7.97 3 10.4s1.97 4.4 4.4 4.4c.27 0 .53-.02.78-.07-.47 1.45-1.48 2.66-3 3.52l.75 1.3c2.86-1.38 4.45-3.81 4.45-7.15v-2C10.38 7.97 9.48 6 7.4 6Zm9.2 0c-2.43 0-4.4 1.97-4.4 4.4s1.97 4.4 4.4 4.4c.27 0 .53-.02.78-.07-.47 1.45-1.48 2.66-3 3.52l.75 1.3c2.86-1.38 4.45-3.81 4.45-7.15v-2C19.58 7.97 18.68 6 16.6 6Z" />
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
      className="relative overflow-hidden bg-[#f7f6f2] py-20 sm:py-24 lg:py-32"
    >
      {/* Décoration éditoriale */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full border border-[#b79a59]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full border border-[#b79a59]/10"
      />

      <Container>
        {/* =====================================================
            HEADER
        ===================================================== */}

        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-[#b39450]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#927840]">
              Portrait
            </span>
          </div>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end lg:gap-16">
            <div>
              <h2 className="font-serif text-[clamp(3rem,8vw,7rem)] font-medium leading-[0.9] tracking-[-0.045em] text-[#20212a]">
                {firstName}
                <br />
                <span className="text-[#a68745]">{lastName}</span>

                {credentials && (
                  <sup className="ml-2 align-super font-sans text-sm font-semibold tracking-normal text-[#a68745] sm:text-base">
                    {credentials}
                  </sup>
                )}
              </h2>
            </div>

            <div className="border-l border-[#d5d0c5] pl-6">
              <p className="text-sm font-medium leading-7 text-[#34343c] sm:text-base">
                {title}
              </p>

              {tagline && (
                <p className="mt-4 font-serif text-sm italic leading-6 text-[#77736b] sm:text-[15px]">
                  {tagline}
                </p>
              )}
            </div>
          </div>
        </motion.header>

        <div className="my-12 h-px bg-[#dcd8ce] sm:my-16 lg:my-20" />

        {/* =====================================================
            INTRO + BIO
        ===================================================== */}

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:gap-24">
          <motion.main
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.7 }}
          >
            {/* EXPERIENCE */}

            <div className="flex items-start justify-between border-b border-[#dcd8ce] pb-7">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a68745]">
                  Expérience
                </span>

                <h3 className="mt-3 font-serif text-2xl text-[#22232d] sm:text-3xl">
                  {experience}
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-[#77736b]">
                  {experienceSub}
                </p>
              </div>

              <div className="hidden text-[#a68745] sm:block">
                <Icons.Clock />
              </div>
            </div>

            {/* BIOGRAPHIE */}

            <div className="mt-10 max-w-3xl space-y-6">
              {bio.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-[15px] leading-[1.95] text-[#56545a] sm:text-base ${
                    index === 0
                      ? "first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:text-[#a68745]"
                      : ""
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: paragraph,
                  }}
                />
              ))}
            </div>

            {/* CITATION */}

            {quote && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative my-14 border-y border-[#dcd8ce] py-9 sm:my-16 sm:py-11"
              >
                <div className="mb-5 text-[#a68745]/50">
                  <Icons.Quote />
                </div>

                <blockquote className="max-w-3xl font-serif text-xl italic leading-[1.65] text-[#292a34] sm:text-2xl lg:text-[26px]">
                  {quote}
                </blockquote>
              </motion.div>
            )}

            {/* DOMAINES */}

            {specializations && specializations.length > 0 && (
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <span className="text-[#a68745]">
                    <Icons.Compass />
                  </span>

                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#55525a]">
                    Domaines d'activité
                  </h3>
                </div>

                <div className="grid border-t border-[#dcd8ce] sm:grid-cols-3">
                  {specializations.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                      }}
                      className={`py-7 sm:px-5 ${
                        index > 0
                          ? "border-t border-[#dcd8ce] sm:border-l sm:border-t-0"
                          : ""
                      }`}
                    >
                      <span className="text-[10px] font-semibold tracking-[0.2em] text-[#b29453]">
                        0{index + 1}
                      </span>

                      <h4 className="mt-4 font-serif text-lg text-[#282933]">
                        {item.title}
                      </h4>

                      <p className="mt-3 text-xs leading-6 text-[#77736b]">
                        {item.desc}
                      </p>

                      <div className="mt-5 text-[#b29453]">
                        <Icons.ArrowRight />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* STATISTIQUES */}

            <div className="mt-12 grid border-y border-[#dcd8ce] sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`py-7 ${
                    index > 0
                      ? "border-t border-[#dcd8ce] sm:border-l sm:border-t-0 sm:pl-6"
                      : ""
                  }`}
                >
                  <div className="font-serif text-4xl tracking-[-0.03em] text-[#a68745]">
                    {stat.number}
                  </div>

                  <p className="mt-2 max-w-[150px] text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#77736b]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.main>

          {/* =====================================================
              SIDEBAR
          ===================================================== */}

          <motion.aside
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            {/* CHRONOLOGIE */}

            <div>
              <div className="flex items-center justify-between border-b border-[#dcd8ce] pb-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#55525a]">
                  Parcours
                </h3>

                <span className="text-[#a68745]">
                  <Icons.Clock />
                </span>
              </div>

              <div className="relative mt-8">
                <div className="absolute bottom-2 left-[4px] top-2 w-px bg-[#d5d0c5]" />

                <div className="space-y-8">
                  {timeline.map((item, index) => (
                    <motion.div
                      key={`${item.year}-${item.title}`}
                      initial={{ opacity: 0, x: 15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.08,
                      }}
                      className="relative pl-7"
                    >
                      <span
                        className={`absolute left-0 top-[5px] h-[9px] w-[9px] rounded-full border-2 ${
                          index === timeline.length - 1
                            ? "border-[#a68745] bg-[#a68745]"
                            : "border-[#b29453] bg-[#f7f6f2]"
                        }`}
                      />

                      <span className="text-[10px] font-bold tracking-[0.18em] text-[#a68745]">
                        {item.year}
                      </span>

                      <h4 className="mt-1.5 font-serif text-[17px] leading-snug text-[#292a34]">
                        {item.title}
                      </h4>

                      <p className="mt-2 text-xs leading-6 text-[#77736b]">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPERTISE */}

            <div className="mt-14 border-t border-[#dcd8ce] pt-7">
              <h3 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#55525a]">
                Expertise
              </h3>

              <div className="flex flex-wrap gap-2">
                {expertise.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#d6d1c6] px-3 py-2 text-[10px] font-medium text-[#625f65] transition-all duration-200 hover:border-[#a68745] hover:bg-[#a68745]/5 hover:text-[#8c7139]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* LANGUES */}

            {languages && languages.length > 0 && (
              <div className="mt-12 border-t border-[#dcd8ce] pt-7">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#55525a]">
                  Langues
                </h3>

                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                  {languages.map((language) => (
                    <span
                      key={language}
                      className="text-sm text-[#55525d]"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LINKEDIN */}

            {social?.linkedin && (
              <div className="mt-10 border-t border-[#dcd8ce] pt-6">
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Voir le profil LinkedIn du Dr Frantz Maria Izanne Bataille"
                  className="group inline-flex items-center gap-2 text-xs font-semibold text-[#4e4b52] transition-colors hover:text-[#a68745]"
                >
                  <Icons.Linkedin />

                  <span>Profil professionnel</span>

                  <span className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1">
                    <Icons.ArrowUpRight />
                  </span>
                </a>
              </div>
            )}
          </motion.aside>
        </div>

        {/* =====================================================
            SIGNATURE
        ===================================================== */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-20 flex items-center gap-5 sm:mt-24"
        >
          <span className="h-px flex-1 bg-[#dcd8ce]" />

          <span className="font-serif text-sm italic tracking-wide text-[#a68745]">
            Médecine · Écriture · Monde
          </span>

          <span className="h-px flex-1 bg-[#dcd8ce]" />
        </motion.div>
      </Container>
    </section>
  );
}
