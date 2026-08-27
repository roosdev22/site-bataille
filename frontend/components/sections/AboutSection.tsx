"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import aboutData from "@/data/data.json";

const Icons = {
  User: () => (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1c1c2e"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  Clock: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),

  ArrowDown: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M8 10l4 4 4-4" />
    </svg>
  ),

  Quote: () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.5 6C6.5 6 4 8.5 4 11.5S6.5 17 9.5 17c.3 0 .6 0 .9-.1-.6 1.8-2.1 3.3-4.1 3.9l.6 1.6c3.4-1 5.9-4.1 5.9-7.8V11c0-2.8-1.4-5-3.3-5zm10 0c-3 0-5.5 2.5-5.5 5.5S16.5 17 19.5 17c.3 0 .6 0 .9-.1-.6 1.8-2.1 3.3-4.1 3.9l.6 1.6c3.4-1 5.9-4.1 5.9-7.8V11c0-2.8-1.4-5-3.3-5z" />
    </svg>
  ),

  Compass: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c9a84c"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),

  Linkedin: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  ),
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
    quote?: string;
    specializations?: {
      title: string;
      desc: string;
    }[];
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
      className="overflow-hidden bg-gradient-to-b from-[#fafaf8] to-white py-16 sm:py-20 md:py-28 lg:py-32"
    >
      <Container>
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 px-2 text-center sm:mb-12 md:mb-16"
        >
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full
            bg-[#c9a84c]/10 px-3 py-1.5 text-[10px] font-bold
            uppercase tracking-[0.15em] text-[#c9a84c]
            sm:mb-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-[11px]"
          >
            <Icons.ArrowDown />
            À propos de l'auteur
          </div>

          <h2
            className="mb-1 text-2xl font-extrabold tracking-[-0.5px]
            text-[#1c1c2e] sm:mb-2 sm:text-3xl md:text-4xl
            lg:text-5xl sm:tracking-[-1px]"
          >
            {firstName}{" "}
            <span className="text-[#c9a84c]">{lastName}</span>

            {credentials && (
              <sup
                className="ml-1 align-super text-xs font-bold
                text-[#c9a84c] sm:ml-1.5 sm:text-sm md:text-base"
              >
                {credentials}
              </sup>
            )}
          </h2>

          <p className="mx-auto max-w-md px-4 text-sm text-gray-500 sm:text-base md:text-lg">
            {title}
          </p>

          {tagline && (
            <p
              className="mx-auto mt-2 max-w-lg px-4 text-xs italic
              text-gray-400 sm:mt-3 sm:text-sm"
            >
              {tagline}
            </p>
          )}
        </motion.div>

        {/* CONTENU PRINCIPAL */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-12 lg:grid-cols-5 lg:gap-16">
          {/* COLONNE GAUCHE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
            className="space-y-6 lg:col-span-3 sm:space-y-8"
          >
            {/* EXPÉRIENCE */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center
                rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#e0c86e]
                shadow-xl shadow-[#c9a84c]/20
                sm:h-20 sm:w-20 sm:rounded-3xl md:h-24 md:w-24"
              >
                <div className="scale-75 sm:scale-100">
                  <Icons.User />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1c1c2e] sm:text-lg md:text-xl">
                  {experience}
                </h3>

                <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm md:text-base">
                  {experienceSub}
                </p>
              </div>
            </div>

            {/* BIOGRAPHIE */}
            <div className="space-y-3 text-sm leading-relaxed text-gray-600 sm:space-y-4 sm:text-[15px]">
              {bio.map((paragraph, index) => (
                <p
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: paragraph,
                  }}
                />
              ))}
            </div>

            {/* CITATION */}
            {quote && (
              <div className="relative border-l-2 border-[#c9a84c]/30 pl-5 sm:pl-6">
                <div className="mb-1 text-[#c9a84c]/40">
                  <Icons.Quote />
                </div>

                <p className="text-sm font-medium italic leading-relaxed text-[#1c1c2e] sm:text-base">
                  {quote}
                </p>
              </div>
            )}

            {/* SPÉCIALISATIONS */}
            {specializations && specializations.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                {specializations.map((spec) => (
                  <div
                    key={spec.title}
                    className="rounded-2xl border border-gray-100
                    bg-white p-3 shadow-sm sm:p-4"
                  >
                    <div className="mb-1.5 sm:mb-2">
                      <Icons.Compass />
                    </div>

                    <h4 className="text-xs font-bold leading-snug text-[#1c1c2e] sm:text-sm">
                      {spec.title}
                    </h4>

                    <p className="mt-1 text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                      {spec.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* STATISTIQUES */}
            <div
              className="grid grid-cols-1 divide-y divide-gray-100
              overflow-hidden rounded-2xl border border-gray-100
              bg-gradient-to-r from-gray-50 to-white
              sm:grid-cols-3 sm:divide-x sm:divide-y-0
              sm:rounded-3xl"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-4 text-center sm:py-6 md:py-8"
                >
                  <div className="text-xl font-black tracking-tight text-[#c9a84c] sm:text-2xl md:text-3xl">
                    {stat.number}
                  </div>

                  <div
                    className="mt-1 text-[10px] font-semibold uppercase
                    tracking-wider text-gray-500 sm:mt-2 sm:text-[11px]"
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* COLONNE DROITE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
              delay: 0.1,
            }}
            className="space-y-6 lg:col-span-2 sm:space-y-8"
          >
            {/* PARCOURS */}
            <div
              className="rounded-2xl border border-gray-100
              bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8"
            >
              <h3
                className="mb-5 flex items-center gap-2 text-sm
                font-bold text-[#1c1c2e] sm:mb-6 sm:text-base md:mb-8 md:text-lg"
              >
                <Icons.Clock />
                Parcours
              </h3>

              <div className="relative">
                <div
                  className="absolute bottom-2 left-[17px] top-2 w-px bg-gray-100
                  sm:left-[22px] md:left-[27px]"
                />

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {timeline.map((item, index) => (
                    <motion.div
                      key={`${item.year}-${item.title}`}
                      initial={{
                        opacity: 0,
                        x: 20,
                      }}
                      whileInView={{
                        opacity: 1,
                        x: 0,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        delay: index * 0.1,
                      }}
                      className="relative flex gap-3 sm:gap-4 md:gap-5"
                    >
                      <div
                        className={`relative z-10 mt-0.5 h-[11px] w-[11px]
                        shrink-0 rounded-full border-[3px]
                        sm:h-[13px] sm:w-[13px] sm:border-4
                        md:h-[15px] md:w-[15px]
                        ${
                          index === timeline.length - 1
                            ? "border-[#c9a84c]/20 bg-[#c9a84c]"
                            : "border-gray-200 bg-white"
                        }`}
                      />

                      <div className="min-w-0">
                        <span
                          className="text-[10px] font-bold tracking-wider
                          text-[#c9a84c] sm:text-[11px] md:text-xs"
                        >
                          {item.year}
                        </span>

                        <h4
                          className="mt-0.5 text-[11px] font-semibold
                          leading-snug text-[#1c1c2e]
                          sm:text-xs md:text-sm"
                        >
                          {item.title}
                        </h4>

                        <p
                          className="mt-0.5 text-[10px] leading-relaxed
                          text-gray-500 sm:mt-1 sm:text-[11px] md:text-xs"
                        >
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* EXPERTISE */}
            <div className="rounded-2xl bg-[#1c1c2e] p-4 text-white sm:rounded-3xl sm:p-6 md:p-8">
              <h3
                className="mb-3 text-[11px] font-bold uppercase
                tracking-wider text-[#c9a84c]
                sm:mb-4 sm:text-xs md:mb-5 md:text-sm"
              >
                Expertise
              </h3>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {expertise.map((tag) => (
                  <span
                    key={tag}
                    className="cursor-default rounded-xl border
                    border-white/10 bg-white/5 px-2.5 py-1
                    text-[10px] font-semibold text-white/70
                    transition-all duration-300
                    hover:border-white/20 hover:bg-white/10
                    hover:text-white sm:rounded-2xl sm:px-3
                    sm:py-1.5 sm:text-[11px] md:px-4 md:py-2 md:text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* LANGUES + LINKEDIN */}
              {(languages?.length || social?.linkedin) ? (
                <div
                  className="mt-5 flex flex-col gap-3 border-t
                  border-white/10 pt-4
                  sm:mt-6 sm:flex-row sm:items-center
                  sm:justify-between sm:gap-2 sm:pt-5"
                >
                  {languages && languages.length > 0 && (
                    <p className="text-[10px] text-white/50 sm:text-[11px]">
                      {languages.join(" · ")}
                    </p>
                  )}

                  {social?.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Voir le profil LinkedIn"
                      className="inline-flex items-center gap-1.5
                      text-[10px] font-semibold text-white/70
                      transition-colors duration-300
                      hover:text-[#c9a84c]
                      sm:text-[11px]"
                    >
                      <Icons.Linkedin />
                      LinkedIn
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
