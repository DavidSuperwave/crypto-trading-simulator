import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LiveTradingData {
  liveTotalPL?: number;
  unrealizedPL?: number;
  dailyTarget?: number;
  dailyPL?: number;
  openPositions?: number;
}

interface LiveTradingContextType {
  liveTradingData: LiveTradingData;
  updateLiveTradingData: (data: Partial<LiveTradingData>) => void;
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
    dailyTarget: 0,
    dailyPL: 0,
    openPositions: 0
  });

  const updateLiveTradingData = (data: Partial<LiveTradingData>) => {
    // Prevent unnecessary updates that could cause loops
    setLiveTradingData(prevData => {
      const newData = { ...prevData, ...data };
      const hasChanged = 
        Math.abs((prevData.liveTotalPL || 0) - (newData.liveTotalPL || 0)) > 0.01 ||
        Math.abs((prevData.unrealizedPL || 0) - (newData.unrealizedPL || 0)) > 0.01 ||
        Math.abs((prevData.dailyTarget || 0) - (newData.dailyTarget || 0)) > 0.01 ||
        Math.abs((prevData.dailyPL || 0) - (newData.dailyPL || 0)) > 0.01 ||
        (prevData.openPositions || 0) !== (newData.openPositions || 0);
      
      return hasChanged ? newData : prevData;
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