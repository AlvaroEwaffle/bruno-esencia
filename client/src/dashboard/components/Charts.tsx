import React from "react";
import { Typography, Box } from "@material-ui/core";
import { useDashboard } from "../../hooks/useDashboard";
import { PieChart } from "@mui/x-charts/PieChart";

const MetricChart = ({ metricName, value, colors }) => {
  const data = [
    { id: metricName, label: metricName, value, color: colors[0] },
    { id: "empty", label: "", value: 100 - value, color: colors[1] },
  ];

  return (
    <Box
      width='100%'
      maxWidth={280}
      margin={1}
      padding={0}
      display='flex'
      flexDirection='column'
      alignItems='center'
      className='relative sm:h-28  sm:w-20 md:h-44 md:min-w-full md:items-center md:justify-center  lg:w-full lg:h-full lg:right-3 lg:-space-y-4 md:-space-x-7 md:right-3  '
    >
      <Typography align='center' className='text-primary text-xl dark:text-xl dark:text-tertiary '>
        <span className='lg:text-sm md:text-sm md:whitespace-pre-wrap md:mr-2  text-primary font-poppins dark:text-tertiary sm:text-sm'>{metricName}</span>
      </Typography>
      <PieChart
        series={[
          {
            data,
            color: colors[0],
            innerRadius: 38,
            outerRadius: 60,
            paddingAngle: 8,
            cornerRadius: 4,
            startAngle: -360,
            endAngle: 180,
            cx: 86,
            cy: 80,
          },
        ]}
        slotProps={{
          legend: { hidden: true },
        }}
        height={200}
        width={150}
      />
    </Box>
  );
};

export const Charts = () => {
  const { metricsForToday } = useDashboard();

  return (
    <section>
      <Box className='h-auto sm:flex lg:flex-row md:flex-row sm:flex-wrap md:flex-nowrap justify-center lg:-mt-6 md:-mt-12 sm:-mt-20'>
        <div className='sm:w-1/2 lg:w-auto  md:w-auto'>
          <MetricChart metricName='Satisfacción personal' value={Math.round(metricsForToday.self_satisfaction * 100)} colors={["#FF6384", "#8b8a9d"]} />
        </div>
        <div className='sm:w-1/2 lg:w-auto md:w-auto'>
          <MetricChart metricName='Colaboración en equipo' value={Math.round(metricsForToday.team_collaboration * 100)} colors={["#36A2EB", "#8b8a9d"]} />
        </div>
        <div className='sm:w-1/2 lg:w-auto md:w-auto'>
          <MetricChart metricName='Compromiso laboral' value={Math.round(metricsForToday.work_engagement * 100)} colors={["#FFCE56", "#8b8a9d"]} />
        </div>
        <div className='sm:w-1/2 lg:w-auto md:w-auto'>
          <MetricChart
            metricName='Bienestar en el espacio de trabajo'
            value={Math.round(metricsForToday.workspace_wellbeing * 100)}
            colors={["#2f8032", "#8b8a9d"]}
          />
        </div>
      </Box>
      <Box display='flex' justifyContent='center' alignItems='center' p={1} m={-1}>
        <span className='text-primary dark:text-tertiary sm:relative sm:bottom-4 font-poppins  font-normal lg:text-lg md:-mt-2 md:text-base sm:text-sm'>
          Satisfacción General -{" "}
          <span className=' font-bold  dark:text-white text-primary font-poppins'>{Math.round(metricsForToday.general_satisfaction * 100)}%</span>
          <div className='relative  bg-gray-400/60  rounded-full md:h-4 md:mt-4 lg:h-4 lg:mt-4 sm:mt-2'>
            <div className='bg-orange-600 h-4 rounded-full' style={{ width: `${Math.round(metricsForToday.general_satisfaction * 100)}%` }}>
              <div className='absolute inset-0 flex items-center cursor-pointer justify-center group'>
                <span className='hidden group-hover:block lg:text-lg md:text-lg sm:text-normal text-primary group-hover:duration-700 animate-pulse dark:text-tertiary'>
                  {Math.round(metricsForToday.general_satisfaction * 100)}%
                </span>
              </div>
            </div>
          </div>
        </span>
      </Box>
    </section>
  );
};
