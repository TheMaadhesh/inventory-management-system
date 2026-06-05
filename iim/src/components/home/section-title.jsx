import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function SectionTitle({ title, description }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "start 0.45"] });
    const y = useTransform(scrollYProgress, [0, 1], [36, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.65], [0, 1]);

    return (
        <div ref={ref} className="text-center px-2">
            <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-bold max-w-2xl mx-auto leading-snug"
                style={{ color: "var(--text-primary)", y, opacity }}
            >
                {title}
            </motion.h2>
            <motion.p
                className="mt-3 sm:mt-4 text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
                initial={{ y: 24, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08, type: "spring", stiffness: 220, damping: 60 }}
            >
                {description}
            </motion.p>
        </div>
    );
}
