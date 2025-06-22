import React from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import { motion } from "framer-motion";
  import {
    ThumbsUp,
    ThumbsDown,
    ShieldCheck,
    Clock,
    Headset,
    Star,
  } from "lucide-react";
  
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

  const FAQ_DATA: FAQItem[] = [
    {
      id: "item-1",
      question: "What services does MutSyncHub offer?",
      answer:
        "We provide end-to-end digital transformation solutions including cloud computing, data automation, AI integration, and custom software development tailored to your business needs.",
      icon: <ShieldCheck className="text-blue-300 w-5 h-5" />,
    },
    {
      id: "item-2",
      question: "How long does implementation typically take?",
      answer:
        "Project timelines vary based on complexity, but most implementations range from 4–12 weeks. We provide a detailed roadmap after our initial consultation.",
      icon: <Clock className="text-blue-300 w-5 h-5" />,
    },
    {
      id: "item-3",
      question: "Do you offer ongoing support?",
      answer:
        "Yes, we provide comprehensive maintenance and support packages with 24/7 monitoring, regular updates, and dedicated account managers.",
      icon: <Headset className="text-blue-300 w-5 h-5" />,
    },
    {
      id: "item-4",
      question: "What makes MutSyncHub different?",
      answer:
        "Our unique Synchronized Technology Framework ensures all your systems work in harmony, eliminating data silos and creating seamless workflows across your organization.",
      icon: <Star className="text-blue-300 w-5 h-5" />,
    },
  ];
  
  export const FAQSection: React.FC = () => {
    const container = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };
  
    const item = {
      hidden: { y: 20, opacity: 0 },
      show: { y: 0, opacity: 1 },
    };
  
    // Divide into two columns
    const leftColumn = FAQ_DATA.slice(0, Math.ceil(FAQ_DATA.length / 2));
    const rightColumn = FAQ_DATA.slice(Math.ceil(FAQ_DATA.length / 2));
  
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-24 px-6 text-white">
        {/* Background accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 h-1/3 w-full bg-gradient-to-b from-white/10 to-transparent" />
          <div className="absolute top-16 right-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-16 left-24 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
  
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-7xl"
        >
          <motion.div variants={item} className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-blue-300">Questions</span>
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-3xl mx-auto">
              Everything you need to know about our services, timelines, and support.
            </p>
          </motion.div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[leftColumn, rightColumn].map((column, colIdx) => (
              <Accordion
                key={colIdx}
                type="single"
                collapsible
                className="space-y-4"
              >
                {column.map((faq) => (
                  <motion.div
                    key={faq.id}
                    variants={item}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    <AccordionItem
                      value={faq.id}
                      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 hover:bg-white/10 transition duration-300"
                    >
                      <AccordionTrigger className="text-left text-lg font-semibold text-white flex items-start gap-3">
                        <span className="mt-1">{faq.icon}</span>
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-100 mt-2">
                        <p className="mb-4">{faq.answer}</p>
                        <div className="flex items-center gap-2 text-blue-300 text-sm">
                          <span>Was this helpful?</span>
                          <button className="hover:text-white transition">
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button className="hover:text-white transition">
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            ))}
          </div>
        </motion.div>
      </section>
    );
  };
  