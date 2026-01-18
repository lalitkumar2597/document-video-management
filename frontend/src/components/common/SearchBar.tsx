import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useUIStore } from '../../stores/ui.store';

export const SearchBar: React.FC = () => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const { searchTerm, setSearchTerm } = useUIStore();
  
  const debouncedSearchTerm = useDebounce(localSearchTerm, 500);

  // Initialize local state from store
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Update store when debounced value changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setSearchTerm(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchTerm, setSearchTerm]);

  const handleClear = useCallback(() => {
    setLocalSearchTerm('');
    setSearchTerm('');
  }, [setSearchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={localSearchTerm}
          onChange={handleChange}
          placeholder="Search files by name..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
        
        {localSearchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>
      
      {localSearchTerm && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg dark:bg-gray-800">
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
            Searching for: <span className="font-medium text-gray-900 dark:text-white">{localSearchTerm}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;