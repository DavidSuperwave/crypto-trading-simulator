import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LiveTradingData {
  liveTotalPL: number;
  unrealizedPL: number;
  dailyTarget: number;
}

interface LiveTradingContextType {
  liveTradingData: LiveTradingData;
  updateLiveTradingData: (data: LiveTradingData) => void;
}

const LiveTradingContext = createContext<LiveTradingContextType | undefined>(undefined);

// Export the context for direct use
export { LiveTradingContext };

export const useLiveTradingData = (): LiveTradingContextType => {
  const context = useContext(LiveTradingContext);
  if (context === undefined) {
    throw new Error('useLiveTradingData must be used within a LiveTradingProvider');
  }
  return context;
};

interface LiveTradingProviderProps {
  children: ReactNode;
}

export const LiveTradingProvider: React.FC<LiveTradingProviderProps> = ({ children }) => {
  const [liveTradingData, setLiveTradingData] = useState<LiveTradingData>({
    liveTotalPL: 0,
    unrealizedPL: 0,
    dailyTarget: 0
  });

  const updateLiveTradingData = (data: LiveTradingData) => {
    // Prevent unnecessary updates that could cause loops
    setLiveTradingData(prevData => {
      const hasChanged = 
        Math.abs(prevData.liveTotalPL - data.liveTotalPL) > 0.01 ||
        Math.abs(prevData.unrealizedPL - data.unrealizedPL) > 0.01 ||
        Math.abs(prevData.dailyTarget - data.dailyTarget) > 0.01;
      
      return hasChanged ? data : prevData;
    });
  };

  const value = {
    liveTradingData,
    updateLiveTradingData
  };

  return (
    <LiveTradingContext.Provider value={value}>
      {children}
    </LiveTradingContext.Provider>
  );
};