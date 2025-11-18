import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { SearchFilters } from '../hooks/useSearch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
  showAdvanced?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  filters,
  onFiltersChange,
  onClearFilters,
  showAdvanced = true,
  placeholder = "Search...",
  className = "",
}: SearchFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query') return value && value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={filters.query || ''}
              onChange={(e) => onFiltersChange({ query: e.target.value })}
              className="pl-10 pr-4"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showAdvanced && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border">
                  {/* Approval Status */}
                  <div className="space-y-2">
                    <Label>Approval Status</Label>
                    <Select
                      value={filters.approved === undefined ? 'all' : filters.approved.toString()}
                      onValueChange={(value) => 
                        onFiltersChange({ 
                          approved: value === 'all' ? undefined : value === 'true' 
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All NGOs</SelectItem>
                        <SelectItem value="true">Approved</SelectItem>
                        <SelectItem value="false">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <Label>Min Amount (MATIC)</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={filters.minAmount || ''}
                      onChange={(e) => 
                        onFiltersChange({ 
                          minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Amount (MATIC)</Label>
                    <Input
                      type="number"
                      placeholder="100.0"
                      value={filters.maxAmount || ''}
                      onChange={(e) => 
                        onFiltersChange({ 
                          maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                        })
                      }
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? (
                            format(filters.dateFrom, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => onFiltersChange({ dateFrom: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? (
                            format(filters.dateTo, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => onFiltersChange({ dateTo: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* NGO Wallet Filter */}
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label>NGO Wallet Address</Label>
                    <Input
                      placeholder="0x..."
                      value={filters.ngoWallet || ''}
                      onChange={(e) => onFiltersChange({ ngoWallet: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {filters.query && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="gap-1">
                    Search: "{filters.query}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => onFiltersChange({ query: '' })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}

              {filters.approved !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="gap-1">
                    {filters.approved ? 'Approved' : 'Pending'}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => onFiltersChange({ approved: undefined })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}

              {(filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="gap-1">
                    Amount: {filters.minAmount || 0} - {filters.maxAmount || '∞'} MATIC
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => onFiltersChange({ minAmount: undefined, maxAmount: undefined })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}

              {(filters.dateFrom || filters.dateTo) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="gap-1">
                    Date: {filters.dateFrom ? format(filters.dateFrom, 'MMM dd') : '∞'} - {filters.dateTo ? format(filters.dateTo, 'MMM dd') : '∞'}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                      onClick={() => onFiltersChange({ dateFrom: undefined, dateTo: undefined })}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}