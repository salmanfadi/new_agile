
import React from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRightIcon, LogIn, LogOut, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Field Operator Home" 
        description="Quick access to core actions"
      />
      
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full h-20 text-lg flex justify-between"
              onClick={() => navigate('/operator/stock-in')}
            >
              <div className="flex items-center">
                <LogIn className="mr-4 h-6 w-6" />
                <span>Stock In</span>
              </div>
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full h-20 text-lg flex justify-between"
              onClick={() => navigate('/operator/stock-out')}
            >
              <div className="flex items-center">
                <LogOut className="mr-4 h-6 w-6" />
                <span>Stock Out</span>
              </div>
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-16 flex justify-between"
              onClick={() => navigate('/operator/submissions')}
            >
              <div className="flex items-center">
                <ClipboardList className="mr-4 h-5 w-5" />
                <span>My Submissions</span>
              </div>
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperatorDashboard;
