import SectionTitle from '../components/home/section-title';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";

const data = [
    { question:"Who can access the IIM system?", answer:"IIM is designed exclusively for internal use by two types of users: Admins and Staff. Admins have full access to manage inventory, categories, reports, and user accounts. Staff have limited access — they can scan QR codes, perform stock-in/stock-out, view inventory, and check stock history, but cannot delete items or export data." },
    { question:"How do I add a new product to the inventory?", answer:"Only Admin users can add new products. Go to the Inventory section and use the Add Item form, filling in the product name, category, and opening quantity. Once saved, the system automatically generates a unique QR code for that product, which can be downloaded and printed for physical labeling." },
    { question:"How does QR code scanning work for staff?", answer:"Staff members can scan a product's QR code using a webcam or mobile camera directly within the IIM interface. The system instantly retrieves and displays the item's name, category, current quantity, and stock status — no manual search required. From this view, staff can also perform stock-in or stock-out operations." },
    { question:"What is the difference between Stock In and Stock Out?", answer:"Stock In records the addition of items to inventory — for example, when new stock arrives or items are returned. Stock Out records the removal of items from inventory — for example, when items are issued or consumed. Both operations are logged with timestamps and contribute to the full stock history." },
    { question:"Can staff delete inventory items or export data?", answer:"No. Staff users have read-only access to inventory browsing and are restricted to scanning QR codes, logging stock movements, and viewing stock history. Only Admin users can delete inventory items, manage categories, generate reports, and export data." },
    { question:"How do I view the stock history for an item?", answer:"Both Admins and Staff can view the stock history. Navigate to the item — either by scanning its QR code or searching in the inventory list — and open the Stock History section. All stock-in, stock-out, and manual adjustment records are displayed with dates and user details." },
    { question:"How does the Admin manage staff accounts?", answer:"Admins can create, update, and manage staff user accounts through the system's user management section. Each staff member is given login credentials with the Staff role, which automatically restricts their access to Staff-level features only." },
    { question:"Is there a plan to add customer tracking in the future?", answer:"Yes. The current system is built for internal Admin and Staff use. If time allows, a future customer tracking module may be added — enabling customers to track product status using QR code scanning. This is planned as an optional extension to the core system." },
];

export default function FaqSection() {
    const [isOpen,setIsOpen] = useState(null);
    return (
        <section id="faq" className="mt-28 sm:mt-32 scroll-mt-20">
            <SectionTitle title="Frequently Asked Questions"
                description="Common questions about using IIM. Contact your system administrator if you need further assistance."/>
            <div className="mx-auto mt-10 sm:mt-12 space-y-2.5 w-full max-w-2xl">
                {data.map((item,index)=>(
                    <motion.div key={index} className="rounded-xl border overflow-hidden"
                        style={{background:"transparent",borderColor:"var(--border)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",boxShadow:"var(--shadow-card)"}}
                        initial={{y:30,opacity:0}} whileInView={{y:0,opacity:1}} viewport={{once:true,margin:"-20px"}}
                        transition={{delay:index*0.04,type:"spring",stiffness:280,damping:65}}>
                        <button className="flex w-full cursor-pointer items-start justify-between gap-4 px-5 py-4 text-left transition-colors"
                            style={{color:"var(--text-primary)"}}
                            onClick={()=>setIsOpen(isOpen===index?null:index)}>
                            <span className="text-sm font-medium leading-relaxed">{item.question}</span>
                            <ChevronDownIcon className={`size-5 shrink-0 mt-0.5 transition-transform duration-300 ${isOpen===index?'rotate-180':''}`}
                                style={{color:isOpen===index?"#3b82f6":"var(--text-muted)"}}/>
                        </button>
                        <AnimatePresence initial={false}>
                            {isOpen===index && (
                                <motion.div key="content"
                                    initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                                    transition={{duration:0.28,ease:"easeInOut"}}>
                                    <p className="px-5 pb-5 pt-1 text-sm leading-relaxed border-t" style={{color:"var(--text-secondary)",borderColor:"var(--border)"}}>
                                        {item.answer}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
