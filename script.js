const STORAGE_KEY = 'streakify_habits_v1';
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const sampleHabits = [
  { name: '30 min Exercise', days: [true, true, true, true, true, false, false], streak: 12 },
  { name: 'Read 10 pages', days: [false, true, true, false, true, false, false], streak: 5 },
  { name: 'Meditate 10 mins', days: [true, true, false, true, false, false, false], streak: 5 },
  { name: 'Drink 2L Water', days: [true, false, true, true, true, false, false], streak: 3 },
  { name: 'Complete 2 minutes', days: [true, false, false, false, true, false, false], streak: 2 }
];

let activeDate = new Date();
let activeWeekStart = getStartOfCurrentWeek(activeDate);
let activeHabits = [];

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
  if (!stored) return sampleHabits.map(habit => ({ ...habit, days: [...habit.days] }));

  try {
    const habits = JSON.parse(stored);
    return habits.map(habit => ({
      name: habit.name,
      days: Array.isArray(habit.days) && habit.days.length === 7 ? habit.days : Array(7).fill(false),
      streak: typeof habit.streak === 'number' ? habit.streak : habit.days.filter(Boolean).length
    }));
  } catch (err) {
    console.error('Unable to parse stored habits:', err);
    return sampleHabits.map(habit => ({ ...habit, days: [...habit.days] }));
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function getCurrentWeekStart() {
  return getStartOfCurrentWeek(new Date());
}

function isCurrentWeek(startDate) {
  return new Date(startDate).getTime() === getCurrentWeekStart().getTime();
}

function setActiveWeek(startDate) {
  activeWeekStart = getStartOfCurrentWeek(startDate);
  activeDate = new Date(activeWeekStart);
  const storedHabits = loadHabits();

  if (isCurrentWeek(activeWeekStart)) {
    activeHabits = storedHabits.map(habit => ({ ...habit, days: [...habit.days], streak: habit.streak }));
  } else {
    activeHabits = storedHabits.map(habit => ({ ...habit, days: Array(7).fill(false), streak: 0 }));
  }

  updateGoToCurrentWeekButton();
  renderWeekHeader();
  renderCalendar();
  renderHabitTable();
}

function updateGoToCurrentWeekButton() {
  const button = document.getElementById('go-current-week');
  if (!button) return;
  if (isCurrentWeek(activeWeekStart)) {
    button.classList.add('hidden');
  } else {
    button.classList.remove('hidden');
  }
}

function initExportButton() {
  const exportButton = document.getElementById('export-csv');
  exportButton.addEventListener('click', exportCurrentDataToCsv);
}

function exportCurrentDataToCsv() {
  const habits = activeHabits;
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

function getStoredHabits() {
  return loadHabits();
}

function renderHabitsList() {
  const habits = getStoredHabits();
  const body = document.getElementById('habits-list-body');
  body.innerHTML = '';

  habits.forEach((habit, index) => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = habit.name;
    row.appendChild(nameCell);

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'secondary-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteHabit(index));
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    body.appendChild(row);
  });
}

function addHabitFromManager() {
  const input = document.getElementById('new-habit-name');
  const habitName = input.value.trim();
  if (!habitName) return;

  const habits = loadHabits();
  habits.push({ name: habitName, days: Array(7).fill(false), streak: 0 });
  saveHabits(habits);
  input.value = '';

  if (isCurrentWeek(activeWeekStart)) {
    activeHabits = loadHabits();
  } else {
    activeHabits = loadHabits().map(habit => ({ ...habit, days: Array(7).fill(false), streak: 0 }));
  }

  renderHabitsList();
  renderHabitTable();
  updateSummary(activeHabits);
}

function deleteHabit(index) {
  const habits = loadHabits();
  habits.splice(index, 1);
  saveHabits(habits);

  if (isCurrentWeek(activeWeekStart)) {
    activeHabits = loadHabits();
  } else {
    activeHabits = loadHabits().map(habit => ({ ...habit, days: Array(7).fill(false), streak: 0 }));
  }

  renderHabitsList();
  renderHabitTable();
  updateSummary(activeHabits);
}

function switchTab(tab) {
  const homePage = document.getElementById('home-page');
  const habitsPage = document.getElementById('habits-page');
  const navHome = document.getElementById('nav-home');
  const navHabits = document.getElementById('nav-habits');
  const heroCard = document.querySelector('.hero-card');
  const pickerPanel = document.querySelector('.picker-panel');
  const weekControls = document.querySelector('.week-controls');
  const currentWeekAction = document.querySelector('.current-week-action');
  const monthCalendar = document.querySelector('.month-calendar-card');

  if (tab === 'habits') {
    homePage.classList.add('hidden');
    habitsPage.classList.remove('hidden');
    navHome.classList.remove('active');
    navHabits.classList.add('active');
    if (heroCard) heroCard.classList.add('hidden');
    if (pickerPanel) pickerPanel.classList.add('hidden');
    if (weekControls) weekControls.classList.add('hidden');
    if (currentWeekAction) currentWeekAction.classList.add('hidden');
    if (monthCalendar) monthCalendar.classList.add('hidden');
    renderHabitsList();
  } else {
    homePage.classList.remove('hidden');
    habitsPage.classList.add('hidden');
    navHome.classList.add('active');
    navHabits.classList.remove('active');
    if (heroCard) heroCard.classList.remove('hidden');
    if (pickerPanel) pickerPanel.classList.remove('hidden');
    if (weekControls) weekControls.classList.remove('hidden');
    if (currentWeekAction) currentWeekAction.classList.remove('hidden');
    if (monthCalendar) monthCalendar.classList.remove('hidden');
  }
}

function renderWeekHeader() {
  const weekBegin = new Date(activeWeekStart);
  const weekEnd = new Date(activeWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  document.getElementById('week-range').textContent = `Week of ${formatDateLabel(weekBegin)} - ${formatDateLabel(weekEnd)}`;
}

function changeWeek(offset) {
  const nextWeek = new Date(activeWeekStart);
  nextWeek.setDate(nextWeek.getDate() + offset * 7);
  setActiveWeek(nextWeek);
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
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  calendarGrid.innerHTML = '';
  WEEK_DAYS.forEach(day => {
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

  const weekStart = new Date(activeWeekStart);
  const weekEnd = new Date(activeWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  for (let date = 1; date <= daysInMonth; date += 1) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    const currentDate = new Date(now.getFullYear(), now.getMonth(), date);
    const isInActiveWeek = currentDate >= weekStart && currentDate <= weekEnd;
    const habitIndexDay = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
    const percentComplete = isInActiveWeek ? getDailyCompletionPercent(habitIndexDay) : 0;
    const isToday = date === new Date().getDate() && now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear();
    if (isToday) cell.classList.add('active');
    cell.innerHTML = `
      <span class="calendar-day">${date}</span>
      <span class="calendar-streak">${percentComplete}% complete</span>
    `;
    calendarGrid.appendChild(cell);
  }
}

function getDailyCompletionCount(dayIndex, habits = activeHabits) {
  return habits.reduce((count, habit) => count + (habit.days[dayIndex] ? 1 : 0), 0);
}

function getDailyCompletionPercent(dayIndex) {
  const habits = activeHabits;
  const total = habits.length;
  if (!total) return 0;
  const completed = getDailyCompletionCount(dayIndex);
  return Math.round((completed / total) * 100);
}

function renderHabitTable() {
  const habits = activeHabits;
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
  const maxStreak = habits.reduce((max, habit) => Math.max(max, habit.streak || 0), 0);
  const hero = document.querySelector('.hero-card');
  if (!hero) return;
  hero.querySelector('p').textContent = `${completedDays} of ${totalDays} habit checks completed this week`;

  const streakCountElem = document.getElementById('hero-streak-count');
  if (streakCountElem) streakCountElem.textContent = maxStreak;

  const successRateElem = document.getElementById('hero-success-rate');
  if (successRateElem) successRateElem.textContent = `${success}%`;
}

function promptNewHabit() {
  const habitName = window.prompt('Enter the new habit name:');
  if (!habitName) return;

  const storedHabits = loadHabits();
  const newHabit = { name: habitName.trim(), days: Array(7).fill(false), streak: 0 };
  storedHabits.push(newHabit);
  saveHabits(storedHabits);

  activeHabits.push({ ...newHabit });
  renderHabitTable();
}

function toggleDay(habitIndex, dayIndex) {
  const habit = activeHabits[habitIndex];
  habit.days[dayIndex] = !habit.days[dayIndex];
  habit.streak = habit.days.filter(Boolean).length;

  if (isCurrentWeek(activeWeekStart)) {
    saveHabits(activeHabits);
  }

  renderHabitTable();
}

function initializeApp() {
  initExportButton();
  setActiveWeek(getCurrentWeekStart());
  document.getElementById('nav-home').addEventListener('click', (event) => { event.preventDefault(); switchTab('home'); });
  document.getElementById('nav-habits').addEventListener('click', (event) => { event.preventDefault(); switchTab('habits'); });
  document.getElementById('add-habit-btn').addEventListener('click', addHabitFromManager);
  document.getElementById('new-habit-name').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      addHabitFromManager();
    }
  });
  document.getElementById('week-prev').addEventListener('click', () => changeWeek(-1));
  document.getElementById('week-next').addEventListener('click', () => changeWeek(1));
  document.getElementById('go-current-week').addEventListener('click', () => setActiveWeek(getCurrentWeekStart()));
}

document.addEventListener('DOMContentLoaded', initializeApp);
