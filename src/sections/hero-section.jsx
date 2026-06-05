import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

function parseStat(value) {
    const match = value.match(/^([^\d]*)(\d+(?:\.\d+)?)([^\d]*)$/);
    if (!match) return { prefix: "", target: 0, suffix: value, isDecimal: false };
    return {
        prefix: match[1],
        target: parseFloat(match[2]),
        suffix: match[3],
        isDecimal: match[2].includes(".")
    };
}

function AnimatedCounter({ value, delay = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-40px" });
    const [display, setDisplay] = useState("0");
    const { prefix, target, suffix, isDecimal } = parseStat(value);

    useEffect(() => {
        if (!isInView) return;
        let raf;
        let startTime = null;
        const DURATION = 1600;
        const DELAY_MS = delay * 1000;
        const ease = (t) => 1 - Math.pow(1 - t, 3);

        const tick = (ts) => {
            if (startTime === null) startTime = ts;
            const elapsed = ts - startTime - DELAY_MS;
            if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
            const t = Math.min(elapsed / DURATION, 1);
            const current = ease(t) * target;
            if (isDecimal) {
                setDisplay(current.toFixed(1));
            } else {
                setDisplay(Math.floor(current).toLocaleString());
            }
            if (t < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setDisplay(isDecimal ? target.toFixed(1) : target.toLocaleString());
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isInView, target, delay, isDecimal]);

    return (
        <span ref={ref} className="inline-block tabular-nums">
            {prefix}{display}{suffix}
        </span>
    );
}

const stats = [
    { value: "99.9%", label: "Platform Uptime" },
    { value: "50K+",  label: "Businesses Served" },
    { value: "100%",  label: "QR Code Coverage" },
    { value: "35%",   label: "Avg. Error Reduction" },
];

export default function HeroSection() {
    const navigate = useNavigate();
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const titleY      = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
    const statsY      = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
    const opacity     = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
    const scale       = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
    const springTitle = useSpring(titleY, { stiffness: 80, damping: 20 });
    const springStats = useSpring(statsY, { stiffness: 60, damping: 18 });

    return (
        <section ref={ref} id="home" className="flex flex-col items-center text-center px-4 overflow-hidden">

            {/* Title + subtitle */}
            <motion.div style={{ y: springTitle, opacity, scale }} className="will-change-transform">
                <motion.h1
                    className="mt-20 sm:mt-24 text-[2.4rem] leading-[1.15] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl"
                    initial={{ y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 60 }}
                >
                    <span style={{ color: "var(--text-primary)" }}>Internal Inventory{" "}</span>
                    <span className="text-transparent bg-clip-text"
                        style={{ backgroundImage: "linear-gradient(135deg, var(--accent) 0%, #f97316 50%, #fb923c 100%)" }}>
                        Management System
                    </span>
                </motion.h1>

                <motion.p
                    className="mt-6 text-base sm:text-lg max-w-xl leading-relaxed mx-auto"
                    style={{ color: "var(--text-secondary)" }}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 60 }}
                >
                    Streamline stock control with QR code scanning, manage stock-in and stock-out operations, and gain full visibility across your organization — all from one secure, role-based platform.
                </motion.p>

                {/* CTA — Get Started */}
                <motion.div
                    className="mt-10 flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 60 }}
                >
                    <button
                        onClick={() => navigate("/get-started")}
                        className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-full text-sm sm:text-base active:scale-95 hover:brightness-110 transition-all shadow-lg"
                        style={{ background: "var(--accent)", boxShadow: "0 6px 20px rgba(232,93,26,0.4)" }}
                    >
                        Get Started <ArrowRightIcon className="size-4" />
                    </button>
                </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div style={{ y: springStats, opacity }} className="will-change-transform w-full max-w-3xl">
                <motion.div
                    className="flex flex-wrap justify-center gap-x-8 gap-y-6 sm:gap-x-14 mt-14 pt-10 border-t"
                    style={{ borderColor: "var(--border)" }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.55 }}
                >
                    {stats.map((stat, i) => (
                        <motion.div key={i} className="text-center min-w-[80px]"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.32 + i * 0.06, type: "spring", stiffness: 220, damping: 55 }}
                        >
                            <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                                <AnimatedCounter value={stat.value} delay={0.5 + i * 0.12} />
                            </p>
                            <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}
