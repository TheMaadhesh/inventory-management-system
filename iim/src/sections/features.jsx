import SectionTitle from "../components/home/section-title";
import { BarChart2Icon, ClipboardListIcon, BoxIcon, ScanLineIcon, ShieldCheckIcon, TagIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const featuresData = [
    { icon:ScanLineIcon,     title:"QR Code Scanning",            description:"Each product has a unique QR code. Staff can scan it with any device to instantly access item name, category, quantity, and stock status — eliminating manual lookups and reducing errors.",     gradient:"from-purple-500/15 to-purple-600/5",  iconColor:"text-purple-400",  iconBg:"bg-purple-500/10 border-purple-500/20" },
    { icon:BoxIcon,          title:"Stock In & Stock Out",         description:"Quickly log incoming and outgoing stock through a simple interface. Track every movement in real time and maintain a complete audit trail for all stock operations within the organization.",   gradient:"from-blue-500/15 to-blue-600/5",    iconColor:"text-blue-400",    iconBg:"bg-blue-500/10 border-blue-500/20" },
    { icon:ShieldCheckIcon,  title:"Role-Based Access Control",    description:"Separate Admin and Staff modules with distinct permissions. Admins manage inventory and user accounts; Staff can scan QR codes, handle stock movements, and view inventory in read-only mode.",  gradient:"from-rose-500/15 to-rose-600/5",    iconColor:"text-rose-400",    iconBg:"bg-rose-500/10 border-rose-500/20" },
    { icon:TagIcon,          title:"Product Category Management",  description:"Admins can add, update, and delete product categories to keep inventory organized. Assign each item to the right category to enable fast filtering and accurate reporting across the system.",  gradient:"from-amber-500/15 to-amber-600/5",  iconColor:"text-amber-400",   iconBg:"bg-amber-500/10 border-amber-500/20" },
    { icon:ClipboardListIcon,title:"Stock History & Audit Trail",  description:"View a complete record of all stock-in, stock-out, and manual adjustment operations. Every transaction is timestamped and attributed, giving full traceability over all inventory changes.",  gradient:"from-green-500/15 to-green-600/5",  iconColor:"text-green-400",   iconBg:"bg-green-500/10 border-green-500/20" },
    { icon:BarChart2Icon,    title:"Reports & Dashboard",          description:"Admins can access comprehensive dashboards and generate reports on stock levels and movements. Search and filter inventory data quickly to find items and gain actionable insights.",             gradient:"from-cyan-500/15 to-cyan-600/5",    iconColor:"text-cyan-400",    iconBg:"bg-cyan-500/10 border-cyan-500/20" },
];

// Direction pattern: left, right, right — repeats per row
const getDirection = (index) => {
    const col = index % 3;
    if (col === 0) return { x: -60, y: 0 };
    if (col === 1) return { x:  60, y: 0 };
    return             { x:  60, y: 0 };
};

function FeatureCard({ feature, index }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.92", "start 0.45"],
    });

    const dir = getDirection(index);
    const x = useTransform(scrollYProgress, [0, 1], [dir.x, 0]);
    const y = useTransform(scrollYProgress, [0, 1], [dir.y, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
    const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);

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
            whileHover={{ y: -4, boxShadow: "var(--shadow-card-hover)", borderColor: "var(--border-hover)", transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 p-6 rounded-2xl will-change-transform"
        >
            <div className={`w-max p-3 rounded-xl border ${feature.iconBg} ${feature.iconColor}`}>
                <feature.icon className="size-6" strokeWidth={1.75}/>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold leading-snug" style={{color:"var(--text-primary)"}}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{color:"var(--text-secondary)"}}>{feature.description}</p>
            </div>
        </motion.div>
    );
}

export default function Features() {
    return (
        <section id="features" className="mt-28 sm:mt-32 scroll-mt-20">
            <SectionTitle
                title="Everything your team needs to manage inventory"
                description="From QR code scanning to role-based access, IIM gives Admin and Staff users full control over stock — reducing manual effort, errors, and data discrepancies."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-12 sm:mt-14">
                {featuresData.map((feature, index) => (
                    <FeatureCard key={index} feature={feature} index={index} />
                ))}
            </div>
        </section>
    );
}
