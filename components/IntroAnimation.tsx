
import React from 'react';
import { Rocket, GraduationCap } from 'lucide-react';

export const IntroAnimation: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background abstract elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center animate-zoomInSlow">
        {/* App Title */}
        <div className="relative mb-6">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-shine text-center leading-tight">
                SOẠN GIẢNG<br/>
                <span className="text-8xl md:text-[10rem]">4.0</span>
            </h1>
            <div className="absolute -top-10 -right-10 text-yellow-400 animate-bounce">
                <Rocket size={48} />
            </div>
        </div>

        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-8"></div>

        {/* Author Info */}
        <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
                 <GraduationCap className="text-slate-400" size={24}/>
                 <p className="text-2xl md:text-3xl font-bold text-shine-white">
                    Tác giả: Vũ Tiến Lực
                 </p>
            </div>
            <p className="text-xl md:text-2xl font-medium text-slate-400 tracking-widest">
                0969.068.849
            </p>
            <p className="text-lg md:text-xl text-indigo-400 font-bold uppercase tracking-widest mt-2">
                Trường THPT Nguyễn Hữu Cảnh
            </p>
        </div>
      </div>
      
      <div className="absolute bottom-10 text-slate-600 text-xs tracking-[0.5em] font-light animate-pulse">
          POWERED BY AI TECHNOLOGY
      </div>
    </div>
  );
};
