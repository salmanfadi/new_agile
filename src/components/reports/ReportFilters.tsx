
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  productId: z.string().optional(),
  status: z.string().optional(),
  batchId: z.string().optional(),
  userId: z.string().optional(),
});

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFiltersType) => void;
  showWarehouse?: boolean;
  showLocation?: boolean;
  showProduct?: boolean;
  showStatus?: boolean;
  showBatch?: boolean;
  showUser?: boolean;
  statusOptions?: { label: string, value: string }[];
  defaultFilters?: Partial<ReportFiltersType>;
}

export function ReportFilters({
  onFilterChange,
  showWarehouse = true,
  showLocation = false,
  showProduct = false,
  showStatus = false,
  showBatch = false,
  showUser = false,
  statusOptions = [],
  defaultFilters = {},
}: ReportFiltersProps) {
  const { warehouses } = useWarehouses();
  const { locations, isLoading: locationsLoading } = useLocations(
    showLocation ? defaultFilters?.warehouseId || '' : ''
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateFrom: defaultFilters?.dateRange?.from || undefined,
      dateTo: defaultFilters?.dateRange?.to || undefined,
      warehouseId: defaultFilters?.warehouseId || '',
      locationId: defaultFilters?.locationId || '',
      productId: defaultFilters?.productId || '',
      status: defaultFilters?.status || '',
      batchId: defaultFilters?.batchId || '',
      userId: defaultFilters?.userId || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onFilterChange({
      dateRange: {
        from: values.dateFrom || null,
        to: values.dateTo || null,
      },
      warehouseId: values.warehouseId,
      locationId: values.locationId,
      productId: values.productId,
      status: values.status,
      batchId: values.batchId,
      userId: values.userId,
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Date From Field */}
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              {/* Date To Field */}
              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date To</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              {/* Warehouse Field */}
              {showWarehouse && (
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Warehouses</SelectItem>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              {/* Location Field */}
              {showLocation && (
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={locationsLoading || locations.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Locations</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              Floor {location.floor}, Zone {location.zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}

              {/* Status Field */}
              {showStatus && statusOptions.length > 0 && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Statuses</SelectItem>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
