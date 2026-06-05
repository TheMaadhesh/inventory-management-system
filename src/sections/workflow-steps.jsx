import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SectionTitle from "../components/home/section-title";
import { useTheme } from "../context/HomeThemeContext";

function ImportIllustration() {
    return (
        <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <rect width="480" height="300" rx="14" fill="#0f1829"/>
            <rect x="28" y="24" width="424" height="34" rx="6" fill="#162035"/>
            {["ID","Product Name","Category","Qty","QR Status"].map((h,i)=>(
                <text key={h} x={46+i*86} y="46" fill="#5a7fa0" fontSize="10.5" fontFamily="Inter,sans-serif" fontWeight="600">{h}</text>
            ))}
            {[["ITM-001","Laptop Stand","Electronics","842","✓ Ready"],
              ["ITM-002","Office Chair","Furniture","360","✓ Ready"],
              ["ITM-003","Webcam HD","Electronics","12","✓ Ready"],
              ["ITM-004","Whiteboard","Stationery","290","⟳ Pending"],
              ["ITM-005","USB Hub","Electronics","18","⟳ Pending"]
            ].map(([sku,name,cat,qty,loc],r)=>(
                <g key={sku}>
                    <rect x="28" y={64+r*38} width="424" height="34" rx="4" fill={r%2===0?"#111b2e":"#0f1829"}/>
                    <text x="46" y={86+r*38} fill="#3b82f6" fontSize="10.5" fontFamily="Inter,sans-serif">{sku}</text>
                    <text x="132" y={86+r*38} fill="#dde6f0" fontSize="10.5" fontFamily="Inter,sans-serif">{name}</text>
                    <text x="218" y={86+r*38} fill="#7a95b0" fontSize="10.5" fontFamily="Inter,sans-serif">{cat}</text>
                    <text x="304" y={86+r*38} fill="#34d399" fontSize="10.5" fontFamily="Inter,sans-serif" fontWeight="600">{qty}</text>
                    <text x="390" y={86+r*38} fill="#7a95b0" fontSize="10.5" fontFamily="Inter,sans-serif">{loc}</text>
                </g>
            ))}
            <rect x="28" y="258" width="424" height="8" rx="4" fill="#1e2d45"/>
            <rect x="28" y="258" width="318" height="8" rx="4" fill="#3b82f6"/>
            <text x="28" y="284" fill="#5a7fa0" fontSize="10" fontFamily="Inter,sans-serif">Syncing catalog… 75% — 5 of 1,240 items processed</text>
            <circle cx="447" cy="40" r="12" fill="#22c55e" opacity="0.15"/>
            <circle cx="447" cy="40" r="12" stroke="#22c55e" strokeWidth="1.4"/>
            <path d="M441 40l4 4 7-8" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function ReorderIllustration() {
    return (
        <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <rect width="480" height="300" rx="14" fill="#0f1829"/>
            <text x="28" y="48" fill="#dde6f0" fontSize="13" fontFamily="Inter,sans-serif" fontWeight="700">QR Scan — Item Details</text>
            {[{name:"Bubble Wrap Roll",cur:38,min:100,st:"TRIGGERED",c:"#ef4444"},
              {name:"Cardboard Boxes",cur:210,min:150,st:"HEALTHY",  c:"#22c55e"},
              {name:"Pallet Wrapping", cur:42,min:120,st:"TRIGGERED",c:"#ef4444"},
              {name:"Hand Scanner",   cur:18,min:10, st:"HEALTHY",  c:"#22c55e"},
            ].map((r,i)=>{
                const pct=Math.min((r.cur/(r.min*2))*100,100);
                const y=64+i*54;
                return(
                    <g key={r.name}>
                        <rect x="28" y={y} width="424" height="44" rx="8" fill="#162035" stroke="#1e2d45" strokeWidth="1"/>
                        <text x="46" y={y+18} fill="#dde6f0" fontSize="11" fontFamily="Inter,sans-serif" fontWeight="600">{r.name}</text>
                        <rect x={320} y={y+8} width={r.st==="TRIGGERED"?72:60} height="16" rx="8" fill={r.st==="TRIGGERED"?"#7f1d1d":"#14532d"}/>
                        <text x={r.st==="TRIGGERED"?328:330} y={y+20} fill={r.c} fontSize="8.5" fontFamily="Inter,sans-serif" fontWeight="700">{r.st}</text>
                        <text x="46" y={y+32} fill="#5a7fa0" fontSize="9.5" fontFamily="Inter,sans-serif">Stock: {r.cur}  ·  Min: {r.min}</text>
                        <rect x="200" y={y+34} width="210" height="5" rx="2.5" fill="#1e2d45"/>
                        <rect x="200" y={y+34} width={2.1*pct} height="5" rx="2.5" fill={r.c}/>
                    </g>
                );
            })}
            <rect x="28" y="278" width="424" height="16" rx="4" fill="#0d2137" opacity="0.9"/>
            <text x="42" y="290" fill="#93c5fd" fontSize="9.5" fontFamily="Inter,sans-serif">✓  2 purchase orders auto-generated and sent to suppliers</text>
        </svg>
    );
}

function GoodsReceivingIllustration() {
    return (
        <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <rect width="480" height="300" rx="14" fill="#0f1829"/>
            <text x="28" y="36" fill="#dde6f0" fontSize="13" fontFamily="Inter,sans-serif" fontWeight="700">Goods Receiving — PO #GR-2024-0187</text>
            <text x="28" y="52" fill="#5a7fa0" fontSize="10" fontFamily="Inter,sans-serif">Supplier: PackCo Supplies  ·  Received: Today 09:42</text>
            <rect x="28" y="60" width="424" height="26" rx="5" fill="#162035"/>
            {["Item","Ordered","Received","Variance","Status"].map((h,i)=>(
                <text key={h} x={44+i*86} y="77" fill="#5a7fa0" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="600">{h}</text>
            ))}
            {[
                ["Cardboard Boxes","200","200","0","✓ OK"],
                ["Bubble Wrap Roll","100","98","-2","⚠ Short"],
                ["Packing Tape","500","500","0","✓ OK"],
                ["Foam Peanuts","300","300","0","✓ OK"],
            ].map(([item,ord,rec,var_,st],r)=>{
                const varColor = var_==="0"?"#34d399":"#f59e0b";
                const stColor  = st.includes("OK")?"#22c55e":"#f59e0b";
                return(
                    <g key={item}>
                        <rect x="28" y={90+r*38} width="424" height="34" rx="4" fill={r%2===0?"#111b2e":"#0f1829"}/>
                        <text x="44" y={112+r*38} fill="#dde6f0" fontSize="10.5" fontFamily="Inter,sans-serif">{item}</text>
                        <text x="130" y={112+r*38} fill="#7a95b0" fontSize="10.5" fontFamily="Inter,sans-serif">{ord}</text>
                        <text x="216" y={112+r*38} fill="#7a95b0" fontSize="10.5" fontFamily="Inter,sans-serif">{rec}</text>
                        <text x="302" y={112+r*38} fill={varColor} fontSize="10.5" fontFamily="Inter,sans-serif" fontWeight="600">{var_}</text>
                        <text x="388" y={112+r*38} fill={stColor} fontSize="10.5" fontFamily="Inter,sans-serif" fontWeight="600">{st}</text>
                    </g>
                );
            })}
            <rect x="28" y="248" width="424" height="42" rx="10" fill="#0d2137" stroke="#1e3a5f" strokeWidth="1"/>
            <text x="44" y="265" fill="#94a3b8" fontSize="10" fontFamily="Inter,sans-serif">Total items received</text>
            <text x="44" y="281" fill="#e2e8f0" fontSize="12" fontFamily="Inter,sans-serif" fontWeight="700">1,098 / 1,100 units  —  99.8% fulfilment</text>
            <rect x="380" y="254" width="56" height="28" rx="6" fill="#14532d"/>
            <text x="395" y="272" fill="#22c55e" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">Confirmed</text>
        </svg>
    );
}

const steps = [
    { id:"01", title:"Admin Sets Up Products & Categories", description:"Admins log in securely and add inventory items with details like name, category, and quantity. A unique QR code is automatically generated for each product and can be downloaded for printing — ready to be attached to items in the warehouse.", badge:"One-time setup", Illustration: ImportIllustration },
    { id:"02", title:"Staff Scans QR Code to Access Item Details", description:"Staff members scan a product's QR code using a webcam or mobile camera. The system instantly fetches the item's name, category, current quantity, and stock status — no manual searching required, no data entry errors.", badge:"Instant access", Illustration: ReorderIllustration },
    { id:"03", title:"Log Stock In / Stock Out & Track History", description:"Staff record stock-in or stock-out movements directly from the item detail view. Every operation is saved to the stock history log in real time — giving admins and staff a full, traceable record of all inventory changes.", badge:"Full traceability", Illustration: GoodsReceivingIllustration },
];

function StepRow({ step, index }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.88", "start 0.3"] });
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [hovered, setHovered] = useState(false);

    const isEven = index % 2 === 0;
    const imgX    = useTransform(scrollYProgress, [0, 1], [isEven ? -70 : 70, 0]);
    const textX   = useTransform(scrollYProgress, [0, 1], [isEven ? 60 : -60, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [0, 1]);
    const scale   = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

    // Light theme: dark grey by default, orange on hover; Dark theme: use border color as before
    const stepIdColor = isLight
        ? (hovered ? "#e85d1a" : "#4b3a2a")
        : "var(--border)";
    const stepLineColor = isLight
        ? (hovered ? "rgba(232,93,26,0.4)" : "rgba(75,58,42,0.2)")
        : "var(--border)";

    return (
        <div
            ref={ref}
            className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${!isEven ? "lg:flex-row-reverse" : ""}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div style={{ x: imgX, opacity, scale }} className="w-full lg:flex-1 max-w-sm sm:max-w-md lg:max-w-none mx-auto lg:mx-0 will-change-transform">
                <div className="relative rounded-2xl overflow-hidden border shadow-2xl shadow-black/40" style={{ borderColor: "var(--border)" }}>
                    <step.Illustration/>
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full backdrop-blur-sm text-xs font-semibold text-white border transition-colors duration-300 ${isLight ? "bg-orange-500/85 border-orange-400/30" : "bg-blue-600/85 border-blue-400/30"}`}>
                        {step.badge}
                    </div>
                </div>
            </motion.div>
            <motion.div style={{ x: textX, opacity }} className="w-full lg:flex-1 flex flex-col gap-4 text-center lg:text-left will-change-transform">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <span
                        className="text-5xl font-black leading-none select-none transition-colors duration-300"
                        style={{ color: stepIdColor }}
                    >{step.id}</span>
                    <div
                        className="h-px flex-1 hidden lg:block transition-colors duration-300"
                        style={{ background: stepLineColor }}
                    />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
            </motion.div>
        </div>
    );
}

export default function WorkflowSteps() {
    return (
        <section id="how-it-works" className="mt-28 sm:mt-32 scroll-mt-20">
            <SectionTitle
                title="How IIM works — three simple steps"
                description="From admin setup to QR scanning and stock tracking — IIM keeps your internal inventory accurate and fully auditable."
            />
            <div className="relative mt-16 sm:mt-20 space-y-20 sm:space-y-28">
                <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-500/15 to-transparent pointer-events-none"/>
                {steps.map((step, index) => (
                    <StepRow key={index} step={step} index={index} />
                ))}
            </div>
        </section>
    );
}
