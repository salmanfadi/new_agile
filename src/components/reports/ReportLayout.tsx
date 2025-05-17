
import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartLineUp, FileDown } from 'lucide-react';
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
}: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title={title} description={description} />

        <div className="flex items-center gap-2">
          {(onExportCsv || onExportPdf) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
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
              <ChartLineUp className="mr-2 h-4 w-4" />
              Back to Reports
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-6">
            <div className="text-red-500 font-medium">Error loading report data:</div>
            <div className="text-sm mt-1">{error.message || "An unknown error occurred"}</div>
          </CardContent>
        </Card>
      ) : children}
    </div>
  );
}
