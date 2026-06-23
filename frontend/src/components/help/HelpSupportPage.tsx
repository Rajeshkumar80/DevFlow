import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ExternalLink, Github, Linkedin, MessageCircle, BookOpen, Bug, Lightbulb, ArrowRight, Copy, Check, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    value: 'rajesh752791@gmail.com',
    description: 'For direct inquiries, collaborations, or support',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    action: 'mailto:rajesh752791@gmail.com',
  },
  {
    icon: Linkedin,
    title: 'LinkedIn',
    value: 'linkedin.com/in/rajesh3005',
    description: 'Connect professionally and view my work history',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    action: 'https://www.linkedin.com/in/rajesh3005/',
  },
  {
    icon: Github,
    title: 'GitHub',
    value: 'github.com/Rajeshkumar80',
    description: 'Check out open source projects and contributions',
    color: 'text-gray-700 dark:text-gray-300',
    bg: 'bg-gray-100 dark:bg-gray-500/10',
    action: 'https://github.com/Rajeshkumar80',
  },
];

const supportTopics = [
  { icon: Bug, title: 'Bug Report', description: 'Found a bug? Report it and we will fix it ASAP', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
  { icon: Lightbulb, title: 'Feature Request', description: 'Have an idea? We would love to hear it', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { icon: BookOpen, title: 'Documentation', description: 'Read the full documentation and guides', color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-500/10' },
  { icon: MessageCircle, title: 'General Inquiry', description: 'Any questions? Feel free to reach out', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];

const faqs = [
  { q: 'How do I start a code review?', a: 'Go to Reviews and click "New Review". You can paste code directly or upload files (any code file — no zip needed). The AI will analyze it automatically and show issues inline.' },
  { q: 'How does pair programming work?', a: 'Go to Pair Programming, click "Start New Session", and share the session ID with your teammate. You get a shared code editor, terminal, file tree, and built-in chat — all in real-time.' },
  { q: 'How do I export analytics?', a: 'Go to the Analytics page. Each chart has an export button in the top-right corner. Click it to download the data as CSV or PNG image.' },
  { q: 'How do I invite team members?', a: 'Go to Settings, click the "Team" tab, and hit "Invite Member". Enter their email address — they will receive an invitation link to join your workspace.' },
];

const aboutInfo = [
  { icon: Zap, label: 'Version', value: '1.0.0' },
  { icon: Clock, label: 'Last Updated', value: 'June 2026' },
];

export const HelpSupportPage = () => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const copyEmail = () => {
    navigator.clipboard.writeText('rajesh752791@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get in touch, browse FAQs, or report an issue</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactMethods.map((method, i) => (
          <motion.a
            key={i}
            href={method.action}
            target={method.action.startsWith('http') ? '_blank' : undefined}
            rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${method.bg} ${method.color} group-hover:scale-110 transition-transform`}>
                <method.icon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{method.title}</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{method.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-primary-600 dark:text-primary-400 truncate">{method.value}</span>
              <ExternalLink size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors flex-shrink-0" />
            </div>
          </motion.a>
        ))}
      </div>

      {/* Quick Copy */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-500/5 dark:to-violet-500/5 rounded-card border border-primary-100 dark:border-primary-500/10 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Need quick help?</p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">Copy my email and reach out directly</p>
            </div>
          </div>
          <button onClick={copyEmail} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[12px] font-medium transition-all">
            {copiedEmail ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Email</>}
          </button>
        </div>
      </motion.div>

      {/* Support Topics */}
      <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">How can we help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supportTopics.map((topic, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-hover hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-left group"
            >
              <div className={`p-2 rounded-lg ${topic.bg} ${topic.color} group-hover:scale-110 transition-transform`}>
                <topic.icon size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{topic.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{topic.description}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
              className="border border-gray-100 dark:border-dark-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
              >
                <span className="text-[13px] font-medium text-gray-900 dark:text-white pr-2">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openFaq === i ? 90 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex-shrink-0"
                >
                  <ArrowRight size={14} className="text-gray-400 dark:text-gray-500" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0">
                      <div className="h-px bg-gray-100 dark:bg-dark-border mb-3" />
                      <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border p-5 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">About DevFlow</h2>
        <div className="flex items-center gap-6">
          {aboutInfo.map((info, i) => (
            <div key={i} className="flex items-center gap-2">
              <info.icon size={14} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{info.label}:</span>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{info.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
          DevFlow is an AI-powered code review platform designed to help development teams ship better code faster. Built with React, TypeScript, and Node.js.
        </p>
      </div>
    </div>
  );
};
