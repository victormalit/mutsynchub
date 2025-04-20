import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { X } from "lucide-react";

// Type definitions
type Testimonial = {
  name: string;
  feedback: string;
  company: string;
  avatar: string;
};

type Solution = {
  title: string;
  description: string;
  services: string[];
  deliverables: string[];
  benefits: string[];
};

type CaseStudy = {
  title: string;
  client: string;
  challenge: string;
  solution: string;
  results: string[];
  technologies: string[];
  testimonial: string;
};

// Testimonials data
const testimonials: Testimonial[] = [
  {
    name: "Alice Johnson",
    feedback: "MutSyncHub transformed our online presence with their exceptional web development services. Their team delivered beyond our expectations, creating a platform that not only looks stunning but performs flawlessly under heavy traffic.",
    company: "TechCorp Inc.",
    avatar: "AJ",
  },
  {
    name: "Michael Lee",
    feedback: "Their SaaS solutions streamlined our operations and boosted productivity by 40%. The intuitive interface and robust backend have made our daily workflows significantly more efficient.",
    company: "Innovatech Solutions",
    avatar: "ML",
  },
  {
    name: "Sophia Martinez",
    feedback: "The chatbot they developed reduced our customer response time from hours to minutes while maintaining 98% accuracy in query resolution. This has dramatically improved our customer satisfaction scores.",
    company: "ChatEase Ltd.",
    avatar: "SM",
  },
];

// Solutions data with expanded details
const SOLUTIONS: Solution[] = [
  {
    title: "Full-Stack Web Development",
    description: "Build robust and scalable web applications tailored to your business needs with our end-to-end development services.",
    services: [
      "Custom Website Development",
      "Responsive & Mobile-First Design",
      "CMS Integration",
      "E-commerce Platforms",
      "Progressive Web Apps (PWAs)",
    ],
    deliverables: [
      "Fully functional web application",
      "Responsive design documentation",
      "SEO-optimized structure",
      "Performance audit report",
      "Maintenance guidelines"
    ],
    benefits: [
      "Increased customer engagement",
      "Higher conversion rates",
      "Improved brand perception",
      "Scalable infrastructure",
      "Reduced maintenance costs"
    ]
  },
  {
    title: "SaaS Applications",
    description: "End-to-end SaaS product development for performance and scale with our specialized expertise.",
    services: [
      "Multi-Tenant Architecture",
      "User Auth & Subscription",
      "Admin Dashboards",
      "API Integration",
      "Analytics & Reporting",
    ],
    deliverables: [
      "Scalable SaaS application",
      "Subscription management system",
      "Admin control panel",
      "API documentation",
      "Deployment pipeline"
    ],
    benefits: [
      "Recurring revenue model",
      "Cloud-native architecture",
      "Easy feature updates",
      "Multi-platform access",
      "Usage analytics"
    ]
  },
  {
    title: "Dynamic Systems Integration",
    description: "Connect systems, automate processes, and unify your tech stack with our integration solutions.",
    services: [
      "Workflow Automation",
      "3rd-Party API Integration",
      "Real-time Event Handling",
      "Webhook Architecture",
      "Microservices",
    ],
    deliverables: [
      "Integrated system architecture",
      "Automation workflows",
      "API connection documentation",
      "Error handling protocols",
      "Monitoring dashboard"
    ],
    benefits: [
      "Eliminated data silos",
      "Reduced manual work",
      "Improved data accuracy",
      "Faster decision making",
      "Enhanced system reliability"
    ]
  },
  {
    title: "Cloud Solutions",
    description: "Scale reliably with cloud infrastructure designed for speed and security by our certified experts.",
    services: [
      "AWS / Azure / GCP Deployment",
      "CI/CD Pipelines",
      "Serverless Architecture",
      "Cloud Migration",
      "Monitoring & Scaling",
    ],
    deliverables: [
      "Cloud infrastructure setup",
      "Deployment automation",
      "Security configuration",
      "Cost optimization report",
      "Disaster recovery plan"
    ],
    benefits: [
      "Reduced infrastructure costs",
      "Improved scalability",
      "Enhanced security",
      "Higher availability",
      "Better performance"
    ]
  },
  {
    title: "AI & Chatbot Creation",
    description: "Enhance user interaction with intelligent, custom chatbots powered by cutting-edge AI.",
    services: [
      "AI-Powered Assistants",
      "NLP Chatbot Training",
      "Customer Support Automation",
      "WhatsApp/Messenger Bots",
      "Internal Tooling Bots",
    ],
    deliverables: [
      "Trained AI chatbot",
      "Integration with platforms",
      "Conversation flow diagrams",
      "Training dataset",
      "Analytics dashboard"
    ],
    benefits: [
      "24/7 customer support",
      "Reduced response times",
      "Lower support costs",
      "Consistent responses",
      "Valuable customer insights"
    ]
  },
  {
    title: "Cloud Data Engineering",
    description: "Unlock your data's potential with robust pipelines and analytics from our data experts.",
    services: [
      "ETL/ELT Pipelines",
      "Data Lakes & Warehousing",
      "Real-time Streaming",
      "BI Integration",
      "Predictive Data Modeling",
    ],
    deliverables: [
      "Data pipeline architecture",
      "ETL process documentation",
      "Data warehouse setup",
      "Dashboard templates",
      "Data governance policy"
    ],
    benefits: [
      "Single source of truth",
      "Faster reporting",
      "Improved data quality",
      "Advanced analytics",
      "Data-driven decisions"
    ]
  },
];

// Case studies data
const CASE_STUDIES: CaseStudy[] = [
  {
    title: "E-commerce Platform Transformation",
    client: "FashionForward Retail",
    challenge: "The client's outdated platform couldn't handle holiday traffic spikes and had a 70% cart abandonment rate on mobile devices, costing them millions in lost revenue.",
    solution: "We rebuilt their platform with a modern React frontend, Node.js microservices backend, and implemented advanced caching and CDN solutions. The new architecture included progressive loading, optimized checkout flow, and AI-powered product recommendations.",
    results: [
      "Reduced cart abandonment by 60%",
      "Handled 5x peak traffic without downtime",
      "Improved mobile conversion by 45%",
      "Reduced page load time from 8s to 1.2s",
      "Increased average order value by 22%"
    ],
    technologies: ["React", "Node.js", "MongoDB", "Redis", "AWS", "Next.js"],
    testimonial: "The new platform transformed our online sales. Black Friday traffic was handled seamlessly, and our mobile revenue tripled within 3 months. MutSyncHub's solution future-proofed our business."
  },
  {
    title: "Healthcare SaaS Platform",
    client: "MediCare Solutions",
    challenge: "A healthcare startup needed a HIPAA-compliant patient management system that could scale to thousands of providers while maintaining strict security and reliability standards.",
    solution: "We developed a secure multi-tenant SaaS platform with end-to-end encryption, audit logging, and role-based access control. Implemented automated compliance reporting and real-time data synchronization across devices.",
    results: [
      "Achieved HIPAA compliance certification",
      "Onboarded 500+ providers in first 6 months",
      "Maintained 99.99% uptime",
      "Reduced administrative workload by 35%",
      "Enabled seamless telehealth integrations"
    ],
    technologies: ["TypeScript", "PostgreSQL", "AWS GovCloud", "Kubernetes", "Terraform"],
    testimonial: "MutSyncHub delivered a platform that exceeded our security requirements while being incredibly user-friendly. Their expertise in healthcare tech was evident throughout the project."
  },
  {
    title: "AI-Powered Customer Support",
    client: "GlobalTech Solutions",
    challenge: "A multinational corporation was struggling with high support costs and inconsistent responses across regions, with average ticket resolution times of 48 hours.",
    solution: "We implemented an AI chatbot trained on their knowledge base with natural language processing in 12 languages. Integrated with their CRM and ticketing system for seamless handoff to human agents when needed.",
    results: [
      "Reduced response time to under 2 minutes",
      "Handled 85% of queries without human intervention",
      "Achieved 98% customer satisfaction with bot interactions",
      "Saved $1.2M annually in support costs",
      "Enabled 24/7 multilingual support"
    ],
    technologies: ["Python", "TensorFlow", "Dialogflow", "AWS Lambda", "Webhooks"],
    testimonial: "The AI solution transformed our support operations. We maintained quality while dramatically reducing costs and response times - a game changer for our global customer base."
  }
];

const SolutionsPage = () => {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [visibleSolutions, setVisibleSolutions] = useState(6);
  const [expandedTestimonials, setExpandedTestimonials] = useState<Record<number, boolean>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadMoreSolutions = () => {
    setVisibleSolutions(prev => prev + 3);
  };

  const openCaseStudy = (study: CaseStudy) => {
    setSelectedCaseStudy(study);
    document.body.style.overflow = 'hidden';
  };

  const closeCaseStudy = () => {
    setSelectedCaseStudy(null);
    document.body.style.overflow = 'auto';
  };

  const toggleTestimonialExpand = (index: number) => {
    setExpandedTestimonials(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <section className="bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white pb-20">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto pt-24 px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
        >
          Empower Your Digital Transformation
        </motion.h1>
        <p className="text-blue-100 text-lg sm:text-xl leading-relaxed mb-8">
          Explore deep, flexible, and powerful solutions that drive automation, intelligence, and growth.
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button className="bg-white text-blue-900 hover:bg-gray-100 rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:scale-105 transition-transform">
            Talk to Our Experts
          </Button>
        </motion.div>
      </div>

      {/* Solutions Grid */}
      <div id="solutions" className="mt-20 max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {SOLUTIONS.slice(0, visibleSolutions).map((solution, idx) => (
          <motion.div
            key={`solution-${idx}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-6 hover:shadow-2xl transition-all hover:border-white/20"
          >
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-3">{solution.title}</h3>
              <p className="text-blue-100 text-sm mb-4">{solution.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Key Services:</h4>
                <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
                  {solution.services.map((service, i) => (
                    <li key={`service-${i}`}>{service}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Deliverables:</h4>
                <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
                  {solution.deliverables.map((item, i) => (
                    <li key={`deliverable-${i}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Business Benefits:</h4>
                <ul className="text-sm text-white/80 space-y-1 list-disc list-inside">
                  {solution.benefits.map((benefit, i) => (
                    <li key={`benefit-${i}`}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <Button 
                variant="ghost" 
                className="mt-auto w-full text-white hover:bg-white/10"
              >
                Learn More About This Service →
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More Solutions Button */}
      {visibleSolutions < SOLUTIONS.length && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMoreSolutions}
            variant="outline"
            className="text-white border-white hover:bg-white/10 px-8 py-4"
          >
            View More Solutions
          </Button>
        </div>
      )}

      {/* Case Studies Section - Now always visible below solutions */}
      <div id="case-studies" className="mt-32 max-w-6xl mx-auto px-6">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-16"
        >
          Our Case Studies
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CASE_STUDIES.map((study, idx) => (
            <motion.div
              key={`study-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all cursor-pointer group"
              onClick={() => openCaseStudy(study)}
            >
              <div className="h-full flex flex-col">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-300 transition-colors">{study.title}</h3>
                <p className="text-blue-200 mb-4">{study.client}</p>
                <p className="text-white/80 mb-4 line-clamp-3">{study.challenge}</p>
                <div className="mt-auto">
                  <Button variant="link" className="text-blue-300 p-0 hover:underline">
                    Read Full Case Study →
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Case Study Modal */}
      <AnimatePresence>
        {selectedCaseStudy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeCaseStudy}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={closeCaseStudy}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-2">{selectedCaseStudy.title}</h2>
                  <p className="text-blue-300 text-lg">{selectedCaseStudy.client}</p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-300">The Challenge</h3>
                    <p className="text-white/90">{selectedCaseStudy.challenge}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-300">Our Solution</h3>
                    <p className="text-white/90">{selectedCaseStudy.solution}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-300">Key Results</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      {selectedCaseStudy.results.map((result, i) => (
                        <li key={i} className="text-white/90">{result}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-300">Technologies Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCaseStudy.technologies.map((tech, i) => (
                        <span key={i} className="bg-white/10 px-3 py-1 rounded-full text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="italic text-white/80 mb-2">"{selectedCaseStudy.testimonial}"</p>
                    <p className="text-blue-300 font-medium">— Client Representative</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={closeCaseStudy}
                    className="bg-white text-blue-900 hover:bg-gray-100 px-6 py-3"
                  >
                    Close Case Study
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section - Simplified with only one button */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mt-32 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl mx-6 p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="relative max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Let's discuss how we can help you achieve your digital goals with our tailored solutions.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-800 hover:bg-gray-100 font-semibold rounded-full px-8 py-6 text-lg shadow-lg hover:scale-105 transition-transform"
          >
            Schedule Free Consultation
          </Button>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <div id="testimonials" className="mt-32 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted By Industry Leaders</h2>
          <p className="text-blue-200 max-w-2xl mx-auto">
            Don't just take our word for it - hear what our clients say about working with us
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={`testimonial-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-blue-200 text-sm">{testimonial.company}</p>
                </div>
              </div>
              <p className="text-blue-100 italic">
                {expandedTestimonials[idx] 
                  ? `"${testimonial.feedback}"` 
                  : `"${testimonial.feedback.slice(0, 100)}${testimonial.feedback.length > 100 ? '...' : ''}"`}
              </p>
              {testimonial.feedback.length > 100 && (
                <button 
                  onClick={() => toggleTestimonialExpand(idx)}
                  className="text-sm text-blue-300 hover:text-white mt-2"
                >
                  {expandedTestimonials[idx] ? 'Show less' : 'Read more'}
                </button>
              )}
              <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={`star-${i}`}>★</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-20 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: "100%", label: "Client Satisfaction", icon: "😊" },
            { value: "24/7", label: "Support Available", icon: "🛡️" },
            { value: "50+", label: "Projects Delivered", icon: "🚀" },
            { value: "5★", label: "Average Rating", icon: "⭐" },
          ].map((item, index) => (
            <div key={`badge-${index}`} className="p-6 bg-white/5 rounded-xl">
              <div className="text-4xl mb-2">{item.icon}</div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-blue-200">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionsPage;