import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import EUFLogo from './EUFLogo';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card border-b border-border shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <EUFLogo size={40} />
            <div>
              <h1 className="text-xl font-bold text-foreground">EUF BondDesk Pro</h1>
              <p className="text-sm text-muted-foreground">專業債券資訊查詢與分析平台</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {false && (
              <Link 
                to="/search" 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                債券查詢
              </Link>
            )}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{user?.username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>登出</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;