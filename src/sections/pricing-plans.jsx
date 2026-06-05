import SectionTitle from "../components/home/section-title";
import { CheckIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function RoleCard({ item, index }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "start 0.35"] });
    const y       = useTransform(scrollYProgress, [0, 1], [80, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);
    const scale   = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

    return (
        <motion.div
            ref={ref}
            style={{ y, opacity, scale, transitionDelay: `${index * 0.08}s` }}
            className={`group w-full max-w-80 glass p-6 rounded-xl hover:-translate-y-1 transition-transform duration-300`}
        >
            <div className="flex items-center w-max ml-auto text-xs gap-2 glass rounded-full px-3 py-1">
                <item.icon className="size-3.5"/>
                <span>{item.title}</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold">
                {item.role}
            </h3>
            <p className="mt-3" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
            <div className="mt-6 flex flex-col">
                {item.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 py-2">
                        <div className="rounded-full glass border-0 p-1">
                            <CheckIcon className="size-3" style={{ color: "var(--text-primary)" }} strokeWidth={3}/>
                        </div>
                        <p>{feature}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

export default function PricingPlans() {
    const data = [
        {
            icon: ShieldCheckIcon,
            title: "Admin",
            role: "Admin Module",
            description: "Full control over inventory, categories, staff accounts, and reporting.",
            features: [
                "Secure login & password management",
                "Add, update & delete inventory items",
                "Generate & download QR codes",
                "Scan QR codes to view product details",
                "Manage stock in, stock out & adjustments",
                "View complete stock history",
                "Manage product categories",
                "Search & filter inventory",
                "Generate reports & dashboards",
                "Create & manage staff accounts",
            ],
        },
        {
            icon: UserIcon,
            title: "Staff",
            role: "Staff Module",
            description: "Focused access for day-to-day stock operations — scan, move, and track.",
            mostPopular: true,
            features: [
                "Secure login & logout",
                "Scan QR codes to fetch item details",
                "Stock in & stock out operations",
                "View stock history",
                "View inventory (read-only)",
                "Search & filter items",
                "No delete or export access",
            ],
        },
    ];

    return (
        <section className="mt-32">
            <SectionTitle
                title="Two roles, one unified system"
                description="IIM is built exclusively for Admin and Staff users within an organization — each with tailored access rights to keep inventory secure and operations smooth."
            />
            <div className="mt-12 flex flex-wrap items-start justify-center gap-6">
                {data.map((item, index) => (
                    <RoleCard key={index} item={item} index={index}/>
                ))}
            </div>
        </section>
    );
}
