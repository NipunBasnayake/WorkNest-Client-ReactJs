import { VALUE_HIGHLIGHTS } from "@/constants/features";

export function ValueHighlights() {
  return (
    <section
      className="py-5 border-y"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          {VALUE_HIGHLIGHTS.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors duration-200 hover:border-primary-300 dark:hover:border-primary-700 cursor-default"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #9332EA 0%, #a855f7 100%)",
                }}
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M1.5 4L3.2 5.8L6.5 2"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
