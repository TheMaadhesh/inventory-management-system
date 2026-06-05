import SectionTitle from "../components/home/section-title";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const data = [
    { review: "This system transformed our warehouse operations completely. We cut stockouts by 80% in the first month. The real-time visibility alone is worth every penny.", name: "Marcus Thompson", about: "Operations Manager", company: "RetailCo", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" },
    { review: "Automated reorder alerts saved us thousands in emergency procurement costs. Our supply chain runs like clockwork now — I can't imagine going back.", name: "Priya Nair", about: "Supply Chain Lead", company: "FreshFoods", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" },
    { review: "We manage 12 warehouse locations. The unified dashboard handles them all seamlessly. The multi-location stock visibility is genuinely unmatched.", name: "James Whitfield", about: "Logistics Director", company: "GlobalDist", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200" },
    { review: "Barcode scanning onboarded our entire warehouse team in under an hour. Stock counts that used to take a full day now take just two hours.", name: "Sophie Laurent", about: "Warehouse Supervisor", company: "EuroParts", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200" },
    { review: "The analytics dashboard gives us demand forecasts we actually trust. We reduced overstock by 35% in a single quarter acting on the insights.", name: "Derek Chan", about: "Chief Executive Officer", company: "Momentum Apparel", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200" },
    { review: "Selling across 4 platforms used to mean constant inventory sync headaches. The integrations fixed everything in an afternoon. Absolutely game-changing.", name: "Amara Osei", about: "Founder & Director", company: "CraftedByAmara", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200" },
];

/* ── Shared card body ─────────────────────────────────────────── */
function CardContent({ item }) {
    return (
        <>
            <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, j) => (
                    <StarIcon key={j} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
            </div>
            <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                "{item.review}"
            </p>
            <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <img
                    className="size-10 rounded-full object-cover border-2 shrink-0"
                    style={{ borderColor: "var(--border-hover)" }}
                    src={item.image} alt={item.name} loading="lazy"
                />
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{item.about} · {item.company}</p>
                </div>
            </div>
        </>
    );
}

/* ── Desktop: scroll-reveal grid ─────────────────────────────── */
const getDir = (i) => (i % 3 === 0 ? { x: -55, y: 0 } : { x: 55, y: 0 });

function DesktopCard({ item, index }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "start 0.4"] });
    const dir     = getDir(index);
    const x       = useTransform(scrollYProgress, [0, 1], [dir.x, 0]);
    const y       = useTransform(scrollYProgress, [0, 1], [dir.y, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.55], [0, 1]);
    const scale   = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

    return (
        <motion.div
            ref={ref}
            style={{
                x, y, opacity, scale,
                background: "transparent",
                border: "1px solid var(--border)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "var(--shadow-card)",
            }}
            whileHover={{ y: -5, boxShadow: "var(--shadow-card-hover)", borderColor: "var(--border-hover)", transition: { duration: 0.2 } }}
            className="flex flex-col justify-between gap-5 rounded-2xl p-6 will-change-transform"
        >
            <CardContent item={item} />
        </motion.div>
    );
}

/* ── Mobile/Tablet: swipe gallery with peek ──────────────────── */
function MobileGallery() {
    const [active, setActive]   = useState(0);
    const [direction, setDirection] = useState(0); // -1 prev, 1 next
    const dragStartX = useRef(0);
    const total = data.length;

    const go = (dir) => {
        const next = active + dir;
        if (next < 0 || next >= total) return;
        setDirection(dir);
        setActive(next);
    };

    /* Swipe handlers */
    const onDragStart = (_, info) => { dragStartX.current = info.point.x; };
    const onDragEnd   = (_, info) => {
        const delta = dragStartX.current - info.point.x;
        if (delta > 45) go(1);
        else if (delta < -45) go(-1);
    };

    /* Card animation variants */
    const variants = {
        enter:  (d) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0, scale: 0.94 }),
        center: { x: 0, opacity: 1, scale: 1 },
        exit:   (d) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, scale: 0.94 }),
    };

    return (
        <div className="mt-10 sm:mt-12">
            {/* Card area */}
            <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                <AnimatePresence custom={direction} mode="popLayout">
                    <motion.div
                        key={active}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.85 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.12}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        className="flex flex-col justify-between gap-5 rounded-2xl p-5 sm:p-7 cursor-grab active:cursor-grabbing select-none will-change-transform"
                        style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            boxShadow: "var(--shadow-card)",
                        }}
                    >
                        <CardContent item={data[active]} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6 px-0.5">
                {/* Pill dots */}
                <div className="flex items-center gap-1.5">
                    {data.map((_, i) => (
                        <motion.button
                            key={i}
                            onClick={() => { setDirection(i > active ? 1 : -1); setActive(i); }}
                            aria-label={`Testimonial ${i + 1}`}
                            animate={{
                                width: i === active ? 22 : 8,
                                opacity: i === active ? 1 : 0.4,
                                background: i === active ? "var(--accent)" : "var(--text-muted)",
                            }}
                            transition={{ duration: 0.25 }}
                            style={{ height: 8, borderRadius: 9999, flexShrink: 0 }}
                        />
                    ))}
                </div>

                {/* Arrows + counter */}
                <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {active + 1}&thinsp;/&thinsp;{total}
                    </span>
                    <div className="flex gap-1.5">
                        <motion.button
                            onClick={() => go(-1)}
                            disabled={active === 0}
                            whileTap={active > 0 ? { scale: 0.88 } : {}}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-25"
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </motion.button>
                        <motion.button
                            onClick={() => go(1)}
                            disabled={active === total - 1}
                            whileTap={active < total - 1 ? { scale: 0.88 } : {}}
                            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-25"
                            style={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            <ChevronRightIcon className="size-4" />
                        </motion.button>
                    </div>
                </div>
            </div>


        </div>
    );
}

/* ── Section ─────────────────────────────────────────────────── */
export default function Testimonials() {
    return (
        <section id="testimonials" className="mt-28 sm:mt-32 scroll-mt-20">
            <SectionTitle
                title="Trusted by warehouse teams worldwide"
                description="Companies of all sizes rely on IIM to keep their inventory accurate, automated, and always under control."
            />

            {/* Mobile + Tablet: swipe gallery */}
            <div className="lg:hidden">
                <MobileGallery />
            </div>

            {/* Desktop: scroll-animated 3-col grid */}
            <div className="hidden lg:grid grid-cols-3 gap-6 mt-14">
                {data.map((item, i) => (
                    <DesktopCard key={i} item={item} index={i} />
                ))}
            </div>
        </section>
    );
}
