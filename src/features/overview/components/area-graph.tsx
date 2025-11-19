'use client';

import { IconTrendingUp, IconCalendarEvent } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

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

// Generate sample appointment data for the last 6 months
const chartData = [
  { month: 'July', scheduled: 186, completed: 156 },
  { month: 'August', scheduled: 305, completed: 278 },
  { month: 'September', scheduled: 237, completed: 215 },
  { month: 'October', scheduled: 273, completed: 248 },
  { month: 'November', scheduled: 309, completed: 285 },
  { month: 'December', scheduled: 334, completed: 302 }
];

const chartConfig = {
  appointments: {
    label: 'Appointments'
  },
  scheduled: {
    label: 'Scheduled',
    color: 'var(--primary)'
  },
  completed: {
    label: 'Completed',
    color: 'hsl(var(--primary) / 0.7)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const totalScheduled = chartData.reduce((acc, curr) => acc + curr.scheduled, 0);
  const totalCompleted = chartData.reduce((acc, curr) => acc + curr.completed, 0);
  const completionRate = ((totalCompleted / totalScheduled) * 100).toFixed(1);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconCalendarEvent className='size-5' />
          Appointment Trends
        </CardTitle>
        <CardDescription>
          Scheduled vs completed appointments for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillScheduled' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-scheduled)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-scheduled)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillCompleted' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-completed)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-completed)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='completed'
              type='natural'
              fill='url(#fillCompleted)'
              stroke='var(--color-completed)'
              stackId='a'
            />
            <Area
              dataKey='scheduled'
              type='natural'
              fill='url(#fillScheduled)'
              stroke='var(--color-scheduled)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {completionRate}% completion rate{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              July - December 2024 • {totalCompleted.toLocaleString()} completed appointments
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
