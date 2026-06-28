const STORAGE_KEY = 'streakify_habits_v1';
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const START_YEAR = 2024;
const END_YEAR = 2030;

const sampleHabits = [
  { name: '30 min Exercise', days: [true, true, true, true, true, false, false], streak: 12 },
  { name: 'Read 10 pages', days: [false, true, true, false, true, false, false], streak: 5 },
  { name: 'Meditate 10 mins', days: [true, true, false, true, false, false, false], streak: 5 },
  { name: 'Drink 2L Water', days: [true, false, true, true, true, false, false], streak: 3 },
  { name: 'Complete 2 minutes', days: [true, false, false, false, true, false, false], streak: 2 }
];

let activeDate = new Date();
let activeWeekStart = getStartOfCurrentWeek(activeDate);

function getStartOfCurrentWeek(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function loadHabits() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return sampleHabits;

  try {
    const habits = JSON.parse(stored);
    return habits.map(habit => ({
      name: habit.name,
      days: Array.isArray(habit.days) && habit.days.length === 7 ? habit.days : [false, false, false, false, false, false, false],
      streak: typeof habit.streak === 'number' ? habit.streak : habit.days.filter(Boolean).length
    }));
  } catch (err) {
    console.error('Unable to parse stored habits:', err);
    return sampleHabits;
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function populatePickers() {
  const monthPicker = document.getElementById('month-picker');
  const yearPicker = document.getElementById('year-picker');

  MONTH_NAMES.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = month;
    monthPicker.appendChild(option);
  });

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearPicker.appendChild(option);
  }

  monthPicker.value = activeDate.getMonth();
  yearPicker.value = activeDate.getFullYear();

  monthPicker.addEventListener('change', updateSelectedMonthYear);
  yearPicker.addEventListener('change', updateSelectedMonthYear);
}

function updateSelectedMonthYear() {
  const monthPicker = document.getElementById('month-picker');
  const yearPicker = document.getElementById('year-picker');
  activeDate = new Date(Number(yearPicker.value), Number(monthPicker.value), 1);
  activeWeekStart = getStartOfCurrentWeek(activeDate);
  renderWeekHeader();
  renderCalendar();
  renderHabitTable();
}

function initExportButton() {
  const exportButton = document.getElementById('export-csv');
  exportButton.addEventListener('click', exportCurrentDataToCsv);
}

function exportCurrentDataToCsv() {
  const habits = loadHabits();
  if (!habits.length) {
    alert('No habits to export.');
    return;
  }

  const month = MONTH_NAMES[activeDate.getMonth()];
  const year = activeDate.getFullYear();
  const weekDates = getWeekDates().map(date => formatDateLabel(date));
  const headers = ['Habit', ...weekDates, 'Streak', 'Month', 'Year'];
  const rows = habits.map(habit => [
    `"${habit.name.replace(/"/g, '""')}"`,
    ...habit.days.map(done => (done ? 'Completed' : 'Pending')),
    habit.streak,
    month,
    year
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `habit-tracker-${month}-${year}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function renderWeekHeader() {
  const weekBegin = new Date(activeWeekStart);
  const weekEnd = new Date(activeWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  document.getElementById('week-range').textContent = `Week of ${formatDateLabel(weekBegin)} - ${formatDateLabel(weekEnd)}`;
}

function changeWeek(offset) {
  activeWeekStart = new Date(activeWeekStart);
  activeWeekStart.setDate(activeWeekStart.getDate() + offset * 7);
  activeDate = new Date(activeWeekStart);
  syncPickersToActiveDate();
  renderWeekHeader();
  renderCalendar();
  renderHabitTable();
}

function syncPickersToActiveDate() {
  document.getElementById('month-picker').value = activeDate.getMonth();
  document.getElementById('year-picker').value = activeDate.getFullYear();
}

function getWeekDates() {
  return WEEK_DAYS.map((_, index) => {
    const date = new Date(activeWeekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
}

function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarMonth = document.getElementById('calendar-month');
  const now = new Date(activeDate);
  const monthName = MONTH_NAMES[now.getMonth()];
  calendarMonth.textContent = `${monthName} ${now.getFullYear()}`;

  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  calendarGrid.innerHTML = '';
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  labels.forEach(day => {
    const labelCell = document.createElement('div');
    labelCell.className = 'calendar-cell calendar-header-cell';
    labelCell.textContent = day;
    calendarGrid.appendChild(labelCell);
  });

  for (let i = 0; i < startDayIndex; i += 1) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-cell';
    calendarGrid.appendChild(emptyCell);
  }

  for (let date = 1; date <= daysInMonth; date += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    const currentDate = new Date(now.getFullYear(), now.getMonth(), date);
    const habitIndexDay = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
    const streakCount = getDailyCompletionCount(habitIndexDay);
    const isToday = date === new Date().getDate() && now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear();
    if (isToday) cell.classList.add('active');
    cell.innerHTML = `
      <span class="calendar-day">${date}</span>
      <span class="calendar-streak">${streakCount} completed</span>
    `;
    calendarGrid.appendChild(cell);
  }
}

function getDailyCompletionCount(dayIndex) {
  const habits = loadHabits();
  return habits.reduce((count, habit) => count + (habit.days[dayIndex] ? 1 : 0), 0);
}

function renderHabitTable() {
  const habits = loadHabits();
  const headerRow = document.getElementById('habit-header-row');
  const body = document.getElementById('habit-table-body');
  headerRow.innerHTML = '';
  body.innerHTML = '';

  const weekDates = getWeekDates();
  const headers = ['Habit', ...weekDates.map(date => `${WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]} ${date.getDate()}`), 'Streaks'];
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });

  habits.forEach((habit, habitIndex) => {
    const row = document.createElement('tr');
    const titleCell = document.createElement('td');
    titleCell.textContent = habit.name;
    row.appendChild(titleCell);

    habit.days.forEach((completed, dayIndex) => {
      const cell = document.createElement('td');
      const dot = document.createElement('span');
      dot.className = `status-dot ${completed ? 'done' : 'pending'}`;
      dot.title = completed ? 'Completed' : 'Pending';
      dot.addEventListener('click', () => toggleDay(habitIndex, dayIndex));
      cell.appendChild(dot);
      row.appendChild(cell);
    });

    const streakCell = document.createElement('td');
    streakCell.innerHTML = `<span class="streak-badge">🔥 ${habit.streak} days</span>`;
    row.appendChild(streakCell);
    body.appendChild(row);
  });

  updateSummary(habits);
}

function updateSummary(habits) {
  const total = habits.length;
  const completedDays = habits.reduce((sum, habit) => sum + habit.days.filter(Boolean).length, 0);
  const totalDays = total * WEEK_DAYS.length;
  const success = totalDays ? Math.round((completedDays / totalDays) * 100) : 0;
  const hero = document.querySelector('.hero-card');
  if (!hero) return;
  hero.querySelector('p').textContent = `${total} Habits, ${success}% Success`;
}

function promptNewHabit() {
  const habitName = window.prompt('Enter the new habit name:');
  if (!habitName) return;
  const habits = loadHabits();
  habits.push({ name: habitName.trim(), days: [false, false, false, false, false, false, false], streak: 0 });
  saveHabits(habits);
  renderHabitTable();
}

function toggleDay(habitIndex, dayIndex) {
  const habits = loadHabits();
  const habit = habits[habitIndex];
  habit.days[dayIndex] = !habit.days[dayIndex];
  habit.streak = habit.days.filter(Boolean).length;
  saveHabits(habits);
  renderHabitTable();
}

function initializeApp() {
  populatePickers();
  initExportButton();
  renderWeekHeader();
  renderCalendar();
  renderHabitTable();
  document.getElementById('add-new-habit').addEventListener('click', promptNewHabit);
  document.getElementById('week-prev').addEventListener('click', () => changeWeek(-1));
  document.getElementById('week-next').addEventListener('click', () => changeWeek(1));
}

document.addEventListener('DOMContentLoaded', initializeApp);
