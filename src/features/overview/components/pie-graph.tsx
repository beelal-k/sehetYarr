'use client';

import * as React from 'react';
import { IconTrendingUp, IconUsers } from '@tabler/icons-react';
import { Label, Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface PieGraphProps {
  data?: Array<{ demographic: string; patients: number }>;
  role?: string;
}

const chartConfig = {
  patients: {
    label: 'Patients'
  },
  male: {
    label: 'Male',
    color: 'var(--primary)'
  },
  female: {
    label: 'Female',
    color: 'var(--primary)'
  },
  pediatric: {
    label: 'Pediatric (<18)',
    color: 'var(--primary)'
  },
  elderly: {
    label: 'Elderly (65+)',
    color: 'var(--primary)'
  },
  other: {
    label: 'Other',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function PieGraph({ data = [], role = 'guest' }: PieGraphProps) {
  const chartData = data.length > 0 ? data : [];

  const totalPatients = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.patients, 0);
  }, [chartData]);

  const leadingDemographic = React.useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, current) => 
      current.patients > max.patients ? current : max
    );
  }, [chartData]);

  const getTitle = () => {
    switch (role) {
      case 'hospital':
        return 'Facility Patient Demographics';
      case 'doctor':
        return 'Your Patient Demographics';
      default:
        return 'Patient Demographics';
    }
  };

  const getDescription = () => {
    switch (role) {
      case 'hospital':
        return 'Distribution of patients at your facility';
      case 'doctor':
        return 'Distribution of patients under your care';
      default:
        return 'Distribution of patients by demographics';
    }
  };

  if (chartData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <IconUsers className='size-5' />
            {getTitle()}
          </CardTitle>
          <CardDescription>No patient demographic data available</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[250px]'>
          <p className='text-muted-foreground text-sm'>No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconUsers className='size-5' />
          {getTitle()}
        </CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            {getDescription()}
          </span>
          <span className='@[540px]/card:hidden'>Patient breakdown</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[250px]'
        >
          <PieChart>
            <defs>
              {['male', 'female', 'pediatric', 'elderly', 'other'].map(
                (demographic, index) => (
                  <linearGradient
                    key={demographic}
                    id={`fill${demographic}`}
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop
                      offset='0%'
                      stopColor='var(--primary)'
                      stopOpacity={1 - index * 0.15}
                    />
                    <stop
                      offset='100%'
                      stopColor='var(--primary)'
                      stopOpacity={0.8 - index * 0.15}
                    />
                  </linearGradient>
                )
              )}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData.map((item) => ({
                ...item,
                fill: `url(#fill${item.demographic})`
              }))}
              dataKey='patients'
              nameKey='demographic'
              innerRadius={60}
              strokeWidth={2}
              stroke='var(--background)'
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor='middle'
                        dominantBaseline='middle'
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className='fill-foreground text-3xl font-bold'
                        >
                          {totalPatients.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className='fill-muted-foreground text-sm'
                        >
                          Total Patients
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        {leadingDemographic && (
          <>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {chartConfig[leadingDemographic.demographic as keyof typeof chartConfig]?.label} leads with{' '}
              {((leadingDemographic.patients / totalPatients) * 100).toFixed(1)}%{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground leading-none'>
              Based on current patient registrations
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
