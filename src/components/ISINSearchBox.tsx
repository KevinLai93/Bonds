import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBondSearch } from '@/contexts/BondSearchContext';

interface ISINSearchBoxProps {
  placeholder?: string;
  className?: string;
}

const ISINSearchBox: React.FC<ISINSearchBoxProps> = ({ 
  placeholder = "輸入 ISIN 或關鍵字，例如 US037833DY36",
  className = ""
}) => {
  const { searchByISIN, loading, error, isin, setISIN } = useBondSearch();
  const [inputValue, setInputValue] = useState(isin);

  const handleSearch = () => {
    if (inputValue.trim()) {
      setISIN(inputValue.trim().toUpperCase());
      searchByISIN(inputValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setISIN(value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="pl-10 h-12 text-base"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleSearch}
          disabled={loading || !inputValue.trim()}
          size="lg"
          className="px-6"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          查詢
        </Button>
      </div>
      
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
};

export default ISINSearchBox;