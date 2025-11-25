import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4 md:p-8">
      {/* Phone Device */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Phone Frame - scaled to fit viewport */}
        <div className="relative w-[375px] h-[700px] bg-black rounded-[50px] p-[12px] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_100px_rgba(0,0,0,0.5)]">
          
          {/* Side Buttons - Left */}
          <div className="absolute -left-[2px] top-[120px] w-[3px] h-[30px] bg-gray-800 rounded-l-sm" />
          <div className="absolute -left-[2px] top-[170px] w-[3px] h-[55px] bg-gray-800 rounded-l-sm" />
          <div className="absolute -left-[2px] top-[235px] w-[3px] h-[55px] bg-gray-800 rounded-l-sm" />
          
          {/* Side Button - Right */}
          <div className="absolute -right-[2px] top-[180px] w-[3px] h-[80px] bg-gray-800 rounded-r-sm" />
          
          {/* Inner Frame */}
          <div id="phone-screen" className="relative w-full h-full bg-black rounded-[38px] overflow-hidden border border-gray-800/50 flex flex-col">
            
            {/* Status Bar Area with Dynamic Island */}
            <div className="relative h-[50px] flex-shrink-0 flex items-center justify-center z-50">
              {/* Dynamic Island */}
              <div className="w-[120px] h-[34px] bg-black rounded-full flex items-center justify-center border border-gray-800/50">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />
              </div>
            </div>
            
            <Toaster 
              theme="dark" 
              position="top-center"
              expand={false}
              richColors
              toastOptions={{
                className: 'phone-toast',
                style: {
                  background: 'rgba(23,23,23,0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '13px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                },
              }}
            />
            
            {/* Screen Content */}
            <div className="relative flex-1 overflow-y-auto overflow-x-hidden bg-black scrollbar-hide">
              {children}
            </div>
            
            {/* Home Indicator */}
            <div className="h-[34px] flex-shrink-0 flex items-center justify-center">
              <div className="w-[134px] h-[5px] bg-white/20 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      </motion.div>
      
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}
