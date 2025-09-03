import { useParams, Navigate } from 'react-router-dom';
import { useBondSearch } from '@/contexts/BondSearchContext';
import { sampleBond, type Bond } from '@/types/bond';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { BondDM } from '@/components/bond-dm/BondDM';

const DMPage = () => {
  const { isin } = useParams<{ isin: string }>();
  const navigate = useNavigate();
  const { bond } = useBondSearch();

  if (!isin) return <Navigate to="/search" replace />;

  // Use context bond if ISIN matches, otherwise use sample data
  const displayBond = bond && bond.isin === isin ? bond : sampleBond;
  
  if (!displayBond) return <Navigate to="/search" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                債券 DM - {displayBond.name}
              </h1>
              <p className="text-muted-foreground">
                專業債券投資資訊一覽表
              </p>
            </div>
          </div>
        </div>

        {/* DM Content */}
        <BondDM bond={displayBond} isPreview={false} />
      </main>
    </div>
  );
};

export default DMPage;
