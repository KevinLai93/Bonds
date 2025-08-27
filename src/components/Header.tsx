import { Link } from 'react-router-dom';
import EUFLogo from './EUFLogo';

const Header = () => {
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
            <Link 
              to="/search" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              債券查詢
            </Link>
            <Link 
              to="/help" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              使用說明
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;