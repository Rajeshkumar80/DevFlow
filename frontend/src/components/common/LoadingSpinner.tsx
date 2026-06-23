import { motion } from 'framer-motion';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-primary-500/20 border-t-primary-400 rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary-400" />
      </div>
    </div>
  </div>
);