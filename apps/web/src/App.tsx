

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10"></div>

      <div className="glass-panel rounded-3xl p-10 max-w-2xl w-full text-center shadow-2xl flex flex-col items-center">
        
        {/* Logo / Illustration */}
        <div className="mb-8 w-64 h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-lg relative group">
          <img 
            src="/ludo-hero.png" 
            alt="Web Ludo Illustration" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          WEB LUDO
        </h1>
        <p className="text-slate-300 text-lg mb-10 max-w-md mx-auto">
          Experience the classic game beautifully remastered for the modern web. 
          Play locally or challenge friends online.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          
          <button 
            disabled
            className="px-8 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-not-allowed opacity-60 flex-1 max-w-[200px]"
          >
            Join Lobby
          </button>
          
          <button 
            className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30 transform hover:-translate-y-1 transition-all flex-1 max-w-[250px] text-lg border border-blue-400/30"
          >
            Local Match
          </button>

          <button 
            disabled
            className="px-8 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all cursor-not-allowed opacity-60 flex-1 max-w-[200px]"
          >
            Create Lobby
          </button>

        </div>
      </div>
      
      <div className="mt-12 text-slate-500 text-sm font-medium tracking-wider uppercase">
        Multiplayer Coming Soon
      </div>
    </div>
  );
}

export default App;
