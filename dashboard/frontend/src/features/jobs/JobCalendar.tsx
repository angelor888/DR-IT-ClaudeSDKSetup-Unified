import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  CalendarViewMonth as MonthIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { 
  useGetJobsForCalendarQuery,
  useRescheduleJobMutation,
  useUpdateJobStatusMutation,
} from '@services/api/jobApi';
import { useGetCustomerListQuery } from '@services/api/customerApi';
import {
  getJobStatusColor,
  getPriorityColor,
  getJobDisplayName,
  isJobOverdue,
} from '@/types/job.types';
import type { Job, JobCalendarEvent } from '@/types/job.types';
import { getCustomerName } from '@/types/customer.types';

// Import React Big Calendar CSS
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export const JobCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<JobCalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [filterCustomerId, setFilterCustomerId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Calculate date range for API query
  const { startDate, endDate } = useMemo(() => {
    const start = moment(currentDate).startOf(currentView === Views.MONTH ? 'month' : 'week').subtract(7, 'days');
    const end = moment(currentDate).endOf(currentView === Views.MONTH ? 'month' : 'week').add(7, 'days');
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [currentDate, currentView]);

  const { data: jobs, isLoading, refetch } = useGetJobsForCalendarQuery({
    start: startDate,
    end: endDate,
    filters: {
      ...(filterCustomerId && { customerId: filterCustomerId }),
      ...(filterStatus && { status: [filterStatus as Job['status']] }),
    },
  });

  const { data: customers } = useGetCustomerListQuery({ limit: 100 });
  const [rescheduleJob] = useRescheduleJobMutation();
  const [updateJobStatus] = useUpdateJobStatusMutation();

  // Convert jobs to calendar events
  const events: JobCalendarEvent[] = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      start: new Date(job.startAt || job.createdAt),
      end: new Date(job.endAt || job.startAt || job.createdAt),
      allDay: job.allDay || false,
      resource: {
        jobId: job.id,
        customerId: job.customerId,
        status: job.status,
        priority: job.priority,
        customer: job.customer,
      },
    }));
  }, [jobs]);

  const handleSelectEvent = useCallback((event: JobCalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    // Navigate to new job form with pre-filled start date
    const startDate = moment(start).format('YYYY-MM-DDTHH:mm');
    navigate(`/jobs/new?startDate=${startDate}`);
  }, [navigate]);

  const handleEventDrop = useCallback(async ({ event, start, end }: { event: JobCalendarEvent; start: Date; end: Date }) => {
    try {
      await rescheduleJob({
        id: event.resource.jobId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to reschedule job:', error);
    }
  }, [rescheduleJob, refetch]);

  const handleNavigate = useCallback((date: Date, view: View, action: string) => {
    setCurrentDate(date);
    if (view !== currentView) {
      setCurrentView(view);
    }
  }, [currentView]);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
  }, []);

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = moment(currentDate).subtract(1, currentView === Views.MONTH ? 'month' : currentView === Views.WEEK ? 'week' : 'day').toDate();
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = moment(currentDate).add(1, currentView === Views.MONTH ? 'month' : currentView === Views.WEEK ? 'week' : 'day').toDate();
    setCurrentDate(newDate);
  };

  const eventStyleGetter = useCallback((event: JobCalendarEvent) => {
    const { status, priority } = event.resource;
    const isOverdue = isJobOverdue({ 
      endAt: event.end.toISOString(), 
      status, 
      startAt: event.start.toISOString() 
    } as Job);

    let backgroundColor = getJobStatusColor(status);
    let borderColor = getPriorityColor(priority);

    if (isOverdue) {
      backgroundColor = '#f44336'; // Red for overdue
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        opacity: status === 'archived' || status === 'cancelled' ? 0.6 : 1,
      },
    };
  }, []);

  const handleQuickStatusUpdate = async (jobId: string, newStatus: Job['status']) => {
    try {
      await updateJobStatus({ id: jobId, status: newStatus }).unwrap();
      setEventDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case Views.MONTH:
        return moment(currentDate).format('MMMM YYYY');
      case Views.WEEK:
        return `Week of ${moment(currentDate).startOf('week').format('MMM D, YYYY')}`;
      case Views.DAY:
        return moment(currentDate).format('dddd, MMMM D, YYYY');
      default:
        return '';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          Job Calendar
        </Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Customer</InputLabel>
            <Select
              value={filterCustomerId}
              onChange={(e) => setFilterCustomerId(e.target.value)}
              label="Customer"
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers?.customers.map(customer => (
                <MenuItem key={customer.id} value={customer.id}>
                  {getCustomerName(customer)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton onClick={goToPrevious}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
              {getViewTitle()}
            </Typography>
            <IconButton onClick={goToNext}>
              <ChevronRightIcon />
            </IconButton>
            <Button
              startIcon={<TodayIcon />}
              variant="outlined"
              onClick={goToToday}
              size="small"
            >
              Today
            </Button>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<MonthIcon />}
              variant={currentView === Views.MONTH ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.MONTH)}
              size="small"
            >
              Month
            </Button>
            <Button
              startIcon={<WeekIcon />}
              variant={currentView === Views.WEEK ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.WEEK)}
              size="small"
            >
              Week
            </Button>
            <Button
              startIcon={<DayIcon />}
              variant={currentView === Views.DAY ? 'contained' : 'outlined'}
              onClick={() => setCurrentView(Views.DAY)}
              size="small"
            >
              Day
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ flex: 1, p: 2 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          eventPropGetter={eventStyleGetter}
          selectable
          resizable
          dragAndDrop
          popup
          showMultiDayTimes
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
          max={new Date(0, 0, 0, 19, 0, 0)} // 7 PM
          style={{ height: '100%', minHeight: 600 }}
          components={{
            toolbar: () => null, // Hide default toolbar, we have our own
          }}
        />
      </Paper>

      <Fab
        color="primary"
        aria-label="add job"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/jobs/new')}
      >
        <AddIcon />
      </Fab>

      {/* Event Detail Dialog */}
      <Dialog
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">{selectedEvent.title}</Typography>
                <Chip 
                  label={selectedEvent.resource.status.toUpperCase()} 
                  sx={{ backgroundColor: getJobStatusColor(selectedEvent.resource.status), color: 'white' }}
                  size="small"
                />
                <Chip 
                  label={selectedEvent.resource.priority.toUpperCase()} 
                  sx={{ backgroundColor: getPriorityColor(selectedEvent.resource.priority), color: 'white' }}
                  size="small"
                />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.resource.customer ? getCustomerName(selectedEvent.resource.customer) : 'No Customer'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Schedule
                  </Typography>
                  <Typography variant="body1">
                    {moment(selectedEvent.start).format('MMMM D, YYYY h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEventDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => navigate(`/jobs/${selectedEvent.resource.jobId}`)}
                variant="outlined"
              >
                View Details
              </Button>
              <Button
                onClick={() => navigate(`/jobs/${selectedEvent.resource.jobId}/edit`)}
                variant="outlined"
              >
                Edit Job
              </Button>
              {selectedEvent.resource.status === 'active' && (
                <Button
                  onClick={() => handleQuickStatusUpdate(selectedEvent.resource.jobId, 'completed')}
                  variant="contained"
                  color="success"
                >
                  Complete
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};