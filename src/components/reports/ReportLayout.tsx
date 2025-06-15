
import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, BarChart2, RefreshCcw, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
  loading?: boolean;
  error?: any;
  backLink?: string;
  onRefresh?: () => void;
}

export function ReportLayout({
  title,
  description,
  children,
  onExportCsv,
  onExportPdf,
  loading = false,
  error = null,
  backLink = '/reports',
  onRefresh,
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title={title} description={description} />

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          
          {(onExportCsv || onExportPdf) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap" disabled={loading || !!error}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onExportCsv && (
                  <DropdownMenuItem onClick={onExportCsv}>
                    Export to CSV
                  </DropdownMenuItem>
                )}
                {onExportPdf && (
                  <DropdownMenuItem onClick={onExportPdf}>
                    Export to PDF
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="outline" asChild>
            <Link to={backLink}>
              <BarChart2 className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="shadow-apple-sm">
          <CardContent className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-4">Loading report data...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive bg-destructive/5 shadow-apple-sm">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
              <div className="text-destructive font-medium">Error loading report data</div>
              <div className="text-sm mt-2 max-w-md mx-auto">{error.message || "An unknown error occurred while loading the report data. Please try again later."}</div>
              {onRefresh && (
                <Button onClick={onRefresh} variant="outline" className="mt-4">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : children}
    </div>
  );
}
