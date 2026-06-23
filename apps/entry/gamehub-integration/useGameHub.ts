import { useContext } from 'react';
import { GameHubContextType } from './types';
import { GameHubProvider } from './GameHubProvider';

// Re-export the hook from GameHubProvider for convenience
export { useGameHub } from './GameHubProvider';

// Additional utility hooks
export const useGameHubUser = () => {
  const { user, isAuthenticated } = useGameHub();
  return { user, isAuthenticated };
};

export const useGameHubChips = () => {
  const { chips, updateChips } = useGameHub();
  return { chips, updateChips };
};

export const useGameHubReporting = () => {
  const { reportGameResult, syncWithGameHub } = useGameHub();
  return { reportGameResult, syncWithGameHub };
};