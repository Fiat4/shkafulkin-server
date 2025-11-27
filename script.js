// Хранение заказов в localStorage
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null;

// Переменная для предотвращения циклов синхронизации
let isSyncing = false;

// Состояние календаря
let calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    startDate: null,
    endDate: null,
    startMonth: null,
    endMonth: null,
    startYear: null,
    endYear: null,
    view: 'days' // 'days', 'months', 'years'
};

// Элементы DOM
const orderForm = document.getElementById('orderForm');
const ordersList = document.getElementById('ordersList');
const searchInput = document.getElementById('searchInput');

// Форматирование даты для отображения
function formatDate(dateString) {
    if (!dateString) return '';
    // Если дата в формате YYYY-MM-DD (из input type="date")
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    }
    // Если дата в формате ISO или другом
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Если невалидная дата, вернуть как есть
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Отображение текущей даты
function updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('ru-RU', options);
        currentDateElement.textContent = dateString;
    }
}

// Установка текущей даты по умолчанию
function setDefaultDate() {
    const orderDateInput = document.getElementById('orderDate');
    if (orderDateInput && !orderDateInput.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        orderDateInput.value = `${year}-${month}-${day}`;
    }
}

// Расчет статистики
function calculateStatistics(filteredOrders) {
    let totalShpon = 0;
    let totalPlyonka = 0;
    let totalPaint = 0;
    
    // Учитываем квадраты только для заказов со статусом "готов"
    filteredOrders.forEach(order => {
        if (order.status === 'готов' && order.squares) {
            if (order.squares.shpon) totalShpon += order.squares.shpon;
            if (order.squares.plyonka) totalPlyonka += order.squares.plyonka;
            if (order.squares.paint) totalPaint += order.squares.paint;
        }
    });
    
    const totalSquares = totalShpon + totalPlyonka + totalPaint;
    
    return {
        count: filteredOrders.length,
        totalSquares: totalSquares.toFixed(2),
        totalShpon: totalShpon.toFixed(2),
        totalPlyonka: totalPlyonka.toFixed(2),
        totalPaint: totalPaint.toFixed(2)
    };
}

// Отображение статистики
function displayStatistics(stats) {
    document.getElementById('ordersCount').textContent = stats.count;
    document.getElementById('totalSquares').textContent = stats.totalSquares;
    document.getElementById('totalShpon').textContent = stats.totalShpon;
    document.getElementById('totalPlyonka').textContent = stats.totalPlyonka;
    document.getElementById('totalPaint').textContent = stats.totalPaint;
}

// Фильтрация заказов по интервалу дат
function filterOrdersByDateRange(fromDate, toDate) {
    if (!fromDate || !toDate) return orders;
    return orders.filter(order => {
        if (!order.orderDate) return false;
        return order.orderDate >= fromDate && order.orderDate <= toDate;
    });
}

// Фильтрация заказов по интервалу месяцев
function filterOrdersByMonthRange(fromMonth, toMonth) {
    if (!fromMonth || !toMonth) return orders;
    return orders.filter(order => {
        if (!order.orderDate) return false;
        const orderMonth = order.orderDate.substring(0, 7); // YYYY-MM
        return orderMonth >= fromMonth && orderMonth <= toMonth;
    });
}

// Форматирование даты в YYYY-MM-DD
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Получение названия месяца
function getMonthName(month) {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[month];
}

// Отрисовка календаря
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');
    const calendarContainer = document.getElementById('calendarContainer');
    const monthPicker = document.getElementById('monthPicker');
    const yearPicker = document.getElementById('yearPicker');
    
    if (!calendarDays) return;
    
    // Показываем нужный вид
    if (calendarState.view === 'days') {
        if (calendarContainer) calendarContainer.style.display = 'block';
        if (monthPicker) monthPicker.style.display = 'none';
        if (yearPicker) yearPicker.style.display = 'none';
        
        if (calendarMonth) calendarMonth.textContent = getMonthName(calendarState.currentMonth);
        if (calendarYear) calendarYear.textContent = calendarState.currentYear;
        
        renderDays();
    } else if (calendarState.view === 'months') {
        if (calendarContainer) calendarContainer.style.display = 'none';
        if (monthPicker) monthPicker.style.display = 'block';
        if (yearPicker) yearPicker.style.display = 'none';
        
        renderMonths();
    } else if (calendarState.view === 'years') {
        if (calendarContainer) calendarContainer.style.display = 'none';
        if (monthPicker) monthPicker.style.display = 'none';
        if (yearPicker) yearPicker.style.display = 'block';
        
        renderYears();
    }
}

// Отрисовка дней
function renderDays() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Понедельник = 0
    
    calendarDays.innerHTML = '';
    
    // Пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(calendarState.currentYear, calendarState.currentMonth, day);
        const dateString = formatDateForInput(currentDate);
        
        // Проверка, находится ли дата в выбранном диапазоне
        if (calendarState.startDate && calendarState.endDate) {
            if (dateString >= calendarState.startDate && dateString <= calendarState.endDate) {
                dayElement.classList.add('in-range');
            }
            if (dateString === calendarState.startDate) {
                dayElement.classList.add('start-date');
            }
            if (dateString === calendarState.endDate) {
                dayElement.classList.add('end-date');
            }
        } else if (calendarState.startDate && dateString === calendarState.startDate) {
            dayElement.classList.add('start-date');
        }
        
        dayElement.addEventListener('click', () => selectDate(dateString));
        calendarDays.appendChild(dayElement);
    }
    
    updateSelectedRangeDisplay();
}

// Выбор даты
function selectDate(dateString) {
    if (!calendarState.startDate || (calendarState.startDate && calendarState.endDate)) {
        // Начинаем новый выбор
        calendarState.startDate = dateString;
        calendarState.endDate = null;
    } else {
        // Завершаем выбор диапазона
        if (dateString < calendarState.startDate) {
            calendarState.endDate = calendarState.startDate;
            calendarState.startDate = dateString;
        } else {
            calendarState.endDate = dateString;
        }
        updateStatistics();
    }
    renderDays();
}

// Отрисовка месяцев
function renderMonths() {
    const monthPickerGrid = document.getElementById('monthPickerGrid');
    const pickerYear = document.getElementById('pickerYear');
    
    if (!monthPickerGrid || !pickerYear) return;
    
    pickerYear.textContent = calendarState.currentYear;
    monthPickerGrid.innerHTML = '';
    
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
                        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    monthNames.forEach((monthName, index) => {
        const monthElement = document.createElement('div');
        monthElement.className = 'picker-item';
        monthElement.textContent = monthName;
        
        const monthString = `${calendarState.currentYear}-${String(index + 1).padStart(2, '0')}`;
        
        // Проверка, находится ли месяц в выбранном диапазоне
        if (calendarState.startMonth && calendarState.endMonth) {
            if (monthString >= calendarState.startMonth && monthString <= calendarState.endMonth) {
                monthElement.classList.add('in-range');
            }
            if (monthString === calendarState.startMonth) {
                monthElement.classList.add('start-date');
            }
            if (monthString === calendarState.endMonth) {
                monthElement.classList.add('end-date');
            }
        } else if (calendarState.startMonth && monthString === calendarState.startMonth) {
            monthElement.classList.add('start-date');
        }
        
        monthElement.addEventListener('click', () => selectMonth(monthString));
        monthPickerGrid.appendChild(monthElement);
    });
    
    updateMonthSelectedRangeDisplay();
}

// Выбор месяца
function selectMonth(monthString) {
    if (!calendarState.startMonth || (calendarState.startMonth && calendarState.endMonth)) {
        calendarState.startMonth = monthString;
        calendarState.endMonth = null;
    } else {
        if (monthString < calendarState.startMonth) {
            calendarState.endMonth = calendarState.startMonth;
            calendarState.startMonth = monthString;
        } else {
            calendarState.endMonth = monthString;
        }
        updateStatistics();
    }
    renderMonths();
}

// Отрисовка годов
function renderYears() {
    const yearPickerGrid = document.getElementById('yearPickerGrid');
    const yearRangeTitle = document.getElementById('yearRangeTitle');
    
    if (!yearPickerGrid || !yearRangeTitle) return;
    
    const startYear = Math.floor(calendarState.currentYear / 10) * 10;
    const endYear = startYear + 9;
    yearRangeTitle.textContent = `${startYear}-${endYear}`;
    
    yearPickerGrid.innerHTML = '';
    
    for (let year = startYear; year <= endYear; year++) {
        const yearElement = document.createElement('div');
        yearElement.className = 'picker-item';
        yearElement.textContent = year;
        
        const yearString = String(year);
        
        // Проверка, находится ли год в выбранном диапазоне
        if (calendarState.startYear && calendarState.endYear) {
            if (yearString >= calendarState.startYear && yearString <= calendarState.endYear) {
                yearElement.classList.add('in-range');
            }
            if (yearString === calendarState.startYear) {
                yearElement.classList.add('start-date');
            }
            if (yearString === calendarState.endYear) {
                yearElement.classList.add('end-date');
            }
        } else if (calendarState.startYear && yearString === calendarState.startYear) {
            yearElement.classList.add('start-date');
        }
        
        yearElement.addEventListener('click', () => selectYear(yearString));
        yearPickerGrid.appendChild(yearElement);
    }
    
    updateYearSelectedRangeDisplay();
}

// Выбор года
function selectYear(yearString) {
    if (!calendarState.startYear || (calendarState.startYear && calendarState.endYear)) {
        calendarState.startYear = yearString;
        calendarState.endYear = null;
    } else {
        if (yearString < calendarState.startYear) {
            calendarState.endYear = calendarState.startYear;
            calendarState.startYear = yearString;
        } else {
            calendarState.endYear = yearString;
        }
        updateStatistics();
    }
    renderYears();
}

// Обновление отображения выбранного диапазона
function updateSelectedRangeDisplay() {
    const selectedRange = document.getElementById('selectedRange');
    if (!selectedRange) return;
    
    if (calendarState.startDate && calendarState.endDate) {
        const startFormatted = formatDate(calendarState.startDate);
        const endFormatted = formatDate(calendarState.endDate);
        selectedRange.textContent = `Выбрано: ${startFormatted} - ${endFormatted}`;
        selectedRange.style.display = 'block';
    } else if (calendarState.startDate) {
        const startFormatted = formatDate(calendarState.startDate);
        selectedRange.textContent = `Выберите конечную дату`;
        selectedRange.style.display = 'block';
    } else {
        selectedRange.style.display = 'none';
    }
}

// Обновление отображения выбранного диапазона месяцев
function updateMonthSelectedRangeDisplay() {
    const monthSelectedRange = document.getElementById('monthSelectedRange');
    if (!monthSelectedRange) return;
    
    if (calendarState.startMonth && calendarState.endMonth) {
        const startMonth = formatMonth(calendarState.startMonth);
        const endMonth = formatMonth(calendarState.endMonth);
        monthSelectedRange.textContent = `Выбрано: ${startMonth} - ${endMonth}`;
        monthSelectedRange.style.display = 'block';
    } else if (calendarState.startMonth) {
        const startMonth = formatMonth(calendarState.startMonth);
        monthSelectedRange.textContent = `Выберите конечный месяц`;
        monthSelectedRange.style.display = 'block';
    } else {
        monthSelectedRange.style.display = 'none';
    }
}

// Обновление отображения выбранного диапазона годов
function updateYearSelectedRangeDisplay() {
    const yearSelectedRange = document.getElementById('yearSelectedRange');
    if (!yearSelectedRange) return;
    
    if (calendarState.startYear && calendarState.endYear) {
        yearSelectedRange.textContent = `Выбрано: ${calendarState.startYear} - ${calendarState.endYear}`;
        yearSelectedRange.style.display = 'block';
    } else if (calendarState.startYear) {
        yearSelectedRange.textContent = `Выберите конечный год`;
        yearSelectedRange.style.display = 'block';
    } else {
        yearSelectedRange.style.display = 'none';
    }
}

// Форматирование месяца для отображения
function formatMonth(monthString) {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Переключение месяца
function changeMonth(direction) {
    if (calendarState.view === 'days') {
        calendarState.currentMonth += direction;
        if (calendarState.currentMonth < 0) {
            calendarState.currentMonth = 11;
            calendarState.currentYear--;
        } else if (calendarState.currentMonth > 11) {
            calendarState.currentMonth = 0;
            calendarState.currentYear++;
        }
        renderDays();
    } else if (calendarState.view === 'months') {
        calendarState.currentYear += direction;
        renderMonths();
    } else if (calendarState.view === 'years') {
        calendarState.currentYear += direction * 10;
        renderYears();
    }
}

// Переключение года
function changeYear(direction) {
    calendarState.currentYear += direction;
    renderMonths();
}

// Переключение диапазона годов
function changeYearRange(direction) {
    calendarState.currentYear += direction * 10;
    renderYears();
}


// Обновление статистики
function updateStatistics() {
    let filteredOrders = orders;
    
    // Проверяем выбранные диапазоны
    if (calendarState.startDate && calendarState.endDate) {
        filteredOrders = filterOrdersByDateRange(calendarState.startDate, calendarState.endDate);
    } else if (calendarState.startMonth && calendarState.endMonth) {
        filteredOrders = filterOrdersByMonthRange(calendarState.startMonth, calendarState.endMonth);
    } else if (calendarState.startYear && calendarState.endYear) {
        // Фильтрация по годам
        filteredOrders = orders.filter(order => {
            if (!order.orderDate) return false;
            const orderYear = order.orderDate.substring(0, 4);
            return orderYear >= calendarState.startYear && orderYear <= calendarState.endYear;
        });
    }
    
    const stats = calculateStatistics(filteredOrders);
    displayStatistics(stats);
}

// Инициализация
// Настройки аутентификации
const AUTH_PASSWORD = 'Shkafulkin2005';
// ВАЖНО: При изменении пароля все активные сессии будут сброшены!
const AUTH_STORAGE_KEY = 'orderPlatformAuth';
const AUTH_VERSION_KEY = 'orderPlatformAuthVersion';

// Получаем хеш пароля для проверки версии (простая защита от изменения пароля)
function getPasswordHash(password) {
    // Простой хеш для определения изменения пароля
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Проверка аутентификации
function checkAuth() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedVersion = localStorage.getItem(AUTH_VERSION_KEY);
    const currentVersion = getPasswordHash(AUTH_PASSWORD);
    
    // Если версия пароля изменилась, сбрасываем все сессии
    if (savedVersion && savedVersion !== currentVersion) {
        console.log('Пароль был изменен, сбрасываем все сессии');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.setItem(AUTH_VERSION_KEY, currentVersion);
        return false;
    }
    
    if (authData) {
        try {
            const { password, timestamp } = JSON.parse(authData);
            // Проверяем, что пароль правильный и сессия не истекла (24 часа)
            const sessionDuration = 24 * 60 * 60 * 1000; // 24 часа
            if (password === AUTH_PASSWORD && Date.now() - timestamp < sessionDuration) {
                // Обновляем версию пароля при успешной проверке
                if (!savedVersion || savedVersion !== currentVersion) {
                    localStorage.setItem(AUTH_VERSION_KEY, currentVersion);
                }
                return true;
            }
        } catch (e) {
            // Невалидные данные
        }
    }
    return false;
}

// Сохранение аутентификации
function saveAuth() {
    const authData = {
        password: AUTH_PASSWORD,
        timestamp: Date.now()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    // Сохраняем версию пароля для отслеживания изменений
    localStorage.setItem(AUTH_VERSION_KEY, getPasswordHash(AUTH_PASSWORD));
}

// Инициализация аутентификации
function initAuth() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    const authPassword = document.getElementById('authPassword');
    const authSubmit = document.getElementById('authSubmit');
    const authError = document.getElementById('authError');

    if (checkAuth()) {
        // Пользователь уже авторизован
        authModal.style.display = 'none';
        mainContainer.style.display = 'block';
        // Инициализируем данные, так как пользователь уже авторизован
        // Небольшая задержка, чтобы DOM был готов
        setTimeout(() => {
            initializeAppData();
        }, 100);
        return true;
    } else {
        // Показываем модальное окно
        authModal.style.display = 'flex';
        mainContainer.style.display = 'none';
        
        // Обработчик входа
        const handleAuth = () => {
            const password = authPassword.value.trim();
            if (password === AUTH_PASSWORD) {
                saveAuth();
                authModal.style.display = 'none';
                mainContainer.style.display = 'block';
                authError.style.display = 'none';
                authPassword.value = '';
                
                // Инициализируем данные после успешной авторизации
                initializeAppData();
            } else {
                authError.textContent = 'Неверный пароль';
                authError.style.display = 'block';
                authPassword.value = '';
            }
        };

        authSubmit.addEventListener('click', handleAuth);
        authPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAuth();
            }
        });
        
        return false;
    }
}

// Функция для блокировки редактирования
function isAuthorized() {
    return checkAuth();
}

// Функция для инициализации данных приложения
function initializeAppData() {
    // Функция для загрузки данных после инициализации Firebase
    const initializeData = () => {
        if (window.firebaseDatabase) {
            console.log('Firebase готов, загружаем данные...');
            loadOrdersFromFirebase();
        } else {
            console.warn('Firebase не доступен, используем localStorage');
            orders = JSON.parse(localStorage.getItem('orders')) || [];
            fixDuplicateIds();
            renderOrders();
            updateStatistics();
        }
    };
    
    // Ждем события готовности Firebase или проверяем каждые 100мс
    if (window.firebaseDatabase) {
        // Firebase уже загружен
        initializeData();
    } else {
        // Ждем события или проверяем каждые 100мс
        window.addEventListener('firebaseReady', initializeData, { once: true });
        
        const waitForFirebase = setInterval(() => {
            if (window.firebaseDatabase) {
                clearInterval(waitForFirebase);
                initializeData();
            }
        }, 100);
        
        // Таймаут на случай, если Firebase не загрузится
        setTimeout(() => {
            clearInterval(waitForFirebase);
            if (!window.firebaseDatabase) {
                console.warn('Firebase не загрузился за 5 секунд, используем localStorage');
                initializeData();
            }
        }, 5000);
    }
    
    updateCurrentDate();
    setDefaultDate();
    
    // Инициализация календаря и других элементов
    initializeCalendarAndHandlers();
}

// Функция для инициализации календаря и обработчиков событий
function initializeCalendarAndHandlers() {
    // Обработчик формы
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            if (!isAuthorized()) {
                e.preventDefault();
                alert('Для добавления заказов необходимо авторизоваться');
                initAuth();
                return;
            }
            handleFormSubmit(e);
        });
    }
    
    // Обработчик поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Обработчики статистики и календаря
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');
    const prevYear = document.getElementById('prevYear');
    const nextYear = document.getElementById('nextYear');
    const prevYearRange = document.getElementById('prevYearRange');
    const nextYearRange = document.getElementById('nextYearRange');
    
    // Инициализация календаря
    if (calendarState) {
        calendarState.view = 'days';
        renderCalendar();
    }
    
    // Клик на месяц - открыть выбор месяцев
    if (calendarMonth) {
        calendarMonth.addEventListener('click', () => {
            calendarState.view = 'months';
            renderCalendar();
        });
    }
    
    // Клик на год - открыть выбор годов
    if (calendarYear) {
        calendarYear.addEventListener('click', () => {
            calendarState.view = 'years';
            renderCalendar();
        });
    }
    
    // Навигация по месяцам
    if (prevMonth) {
        prevMonth.addEventListener('click', goToPrevMonth);
    }
    if (nextMonth) {
        nextMonth.addEventListener('click', goToNextMonth);
    }
    
    // Навигация по годам в выборе месяцев
    if (prevYear) {
        prevYear.addEventListener('click', () => changeYear(-1));
    }
    if (nextYear) {
        nextYear.addEventListener('click', () => changeYear(1));
    }
    
    // Навигация по диапазонам годов
    if (prevYearRange) {
        prevYearRange.addEventListener('click', () => changeYearRange(-10));
    }
    if (nextYearRange) {
        nextYearRange.addEventListener('click', () => changeYearRange(10));
    }
    
    // Кнопки "Назад"
    const backToDaysFromMonths = document.getElementById('backToDaysFromMonths');
    const backToMonthsFromYears = document.getElementById('backToMonthsFromYears');
    const pickerYear = document.getElementById('pickerYear');
    const yearRangeTitle = document.getElementById('yearRangeTitle');
    
    if (backToDaysFromMonths) {
        backToDaysFromMonths.addEventListener('click', () => {
            calendarState.view = 'days';
            renderCalendar();
        });
    }
    
    if (backToMonthsFromYears) {
        backToMonthsFromYears.addEventListener('click', () => {
            calendarState.view = 'months';
            renderCalendar();
        });
    }
    
    if (pickerYear) {
        pickerYear.addEventListener('click', () => {
            calendarState.view = 'years';
            renderCalendar();
        });
    }
    
    if (yearRangeTitle) {
        yearRangeTitle.addEventListener('click', () => {
            calendarState.view = 'years';
            renderCalendar();
        });
    }
    
    // Обработчик импорта из Excel
    const importExcelBtn = document.getElementById('importExcelBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    
    if (importExcelBtn && excelFileInput) {
        importExcelBtn.addEventListener('click', () => {
            if (!isAuthorized()) {
                alert('Для импорта заказов необходимо авторизоваться');
                initAuth();
                return;
            }
            // Проверяем, загружена ли библиотека XLSX
            if (typeof XLSX === 'undefined') {
                alert('Библиотека для чтения Excel файлов не загружена. Пожалуйста, обновите страницу.');
                console.error('XLSX library not loaded');
                return;
            }
            excelFileInput.click();
        });
        
        excelFileInput.addEventListener('change', (e) => {
            if (!isAuthorized()) {
                alert('Для импорта заказов необходимо авторизоваться');
                initAuth();
                excelFileInput.value = '';
                return;
            }
            handleExcelImport(e);
        });
    } else {
        console.error('Не найдены элементы для импорта Excel:', { importExcelBtn, excelFileInput });
    }
    
    // Обработчик очистки всех заказов
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllOrders);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем аутентификацию
    if (!initAuth()) {
        return; // Не продолжаем, если пользователь не авторизован
    }
    
    // Инициализируем данные приложения (включая календарь и все обработчики)
    initializeAppData();
});

// Обработка отправки формы
function handleFormSubmit(e) {
    e.preventDefault();
    
    const orderNumber = document.getElementById('orderNumber').value;
    const customerName = document.getElementById('customerName').value;
    const orderDate = document.getElementById('orderDate').value;
    let orderStatus = document.getElementById('orderStatus').value;
    const squareShpon = document.getElementById('squareShpon').value;
    const squarePlyonka = document.getElementById('squarePlyonka').value;
    const squarePaint = document.getElementById('squarePaint').value;
    
    // Если статус не выбран, устанавливаем "в работе" по умолчанию
    if (!orderStatus || orderStatus === '') {
        orderStatus = 'в работе';
    }
    
    // Формируем объект с квадратами
    const squares = {
        shpon: squareShpon ? parseFloat(squareShpon) : null,
        plyonka: squarePlyonka ? parseFloat(squarePlyonka) : null,
        paint: squarePaint ? parseFloat(squarePaint) : null
    };
    
    if (editingOrderId !== null) {
        // Редактирование существующего заказа
        const orderIndex = orders.findIndex(order => order.id === editingOrderId);
        if (orderIndex !== -1) {
            // Проверяем, не используется ли этот номер другим заказом
            const existingOrder = orders.find(order => 
                order.orderNumber === parseInt(orderNumber) && order.id !== editingOrderId
            );
            if (existingOrder) {
                alert(`Заказ с номером ${orderNumber} уже существует!`);
                return;
            }
            
            orders[orderIndex] = {
                ...orders[orderIndex],
                orderNumber: parseInt(orderNumber),
                customerName: customerName,
                orderDate: orderDate || null,
                status: orderStatus,
                squares: squares
            };
        }
        editingOrderId = null;
    } else {
        // Проверяем, существует ли уже заказ с таким номером
        const existingOrder = orders.find(order => order.orderNumber === parseInt(orderNumber));
        if (existingOrder) {
            alert(`Заказ с номером ${orderNumber} уже существует!`);
            return;
        }
        
        // Добавление нового заказа
        const newOrder = {
            id: Date.now(),
            orderNumber: parseInt(orderNumber),
            customerName: customerName,
            orderDate: orderDate || null,
            status: orderStatus,
            squares: squares,
            createdAt: new Date().toISOString()
        };
        orders.push(newOrder);
    }
    
    saveOrders();
    renderOrders();
    updateStatistics(); // Обновляем статистику после изменения заказов
    orderForm.reset();
    setDefaultDate(); // Устанавливаем текущую дату после сброса формы
}

// Сохранение заказов в localStorage и Firebase
function saveOrders() {
    // Проверяем и исправляем дубликаты ID перед сохранением
    fixDuplicateIds();
    
    // Сохраняем локально
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Сохраняем в Firebase (если доступен)
    if (window.firebaseDatabase && !isSyncing) {
        isSyncing = true;
        try {
            const ordersRef = window.firebaseRef(window.firebaseDatabase, 'orders');
            const ordersObject = {};
            orders.forEach(order => {
                ordersObject[order.id] = order;
            });
            window.firebaseSet(ordersRef, ordersObject)
                .then(() => {
                    console.log('✓ Данные синхронизированы с Firebase');
                    isSyncing = false;
                })
                .catch((error) => {
                    console.error('✗ Ошибка синхронизации:', error);
                    isSyncing = false;
                });
        } catch (error) {
            console.error('✗ Ошибка Firebase:', error);
            isSyncing = false;
        }
    }
}

// Загрузка заказов из Firebase
function loadOrdersFromFirebase() {
    if (!window.firebaseDatabase) {
        // Если Firebase не доступен, загружаем из localStorage
        console.log('Firebase не доступен, загружаем из localStorage');
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        fixDuplicateIds();
        renderOrders();
        updateStatistics();
        return;
    }
    
    const ordersRef = window.firebaseRef(window.firebaseDatabase, 'orders');
    
    // Слушаем изменения в реальном времени
    window.firebaseOnValue(ordersRef, (snapshot) => {
        if (isSyncing) {
            console.log('Пропускаем синхронизацию (предотвращение цикла)');
            return;
        }
        
        const firebaseOrders = snapshot.val();
        if (firebaseOrders) {
            console.log('Загружаем заказы из Firebase...');
            orders = Object.values(firebaseOrders);
            fixDuplicateIds();
            renderOrders();
            updateStatistics();
            // Сохраняем локально как резервную копию
            localStorage.setItem('orders', JSON.stringify(orders));
        } else {
            // Если в Firebase нет данных, загружаем из localStorage
            console.log('В Firebase нет данных, загружаем из localStorage');
            orders = JSON.parse(localStorage.getItem('orders')) || [];
            fixDuplicateIds();
            renderOrders();
            updateStatistics();
        }
    }, (error) => {
        console.error('Ошибка загрузки из Firebase:', error);
        // В случае ошибки загружаем из localStorage
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        fixDuplicateIds();
        renderOrders();
        updateStatistics();
    });
}

// Исправление дубликатов ID
function fixDuplicateIds() {
    const idMap = new Map();
    let hasDuplicates = false;
    
    orders.forEach((order, index) => {
        if (idMap.has(order.id)) {
            // Найден дубликат - создаем новый уникальный ID
            const newId = Date.now() + index * 1000 + Math.random() * 1000;
            console.warn(`Дубликат ID найден для заказа ${order.orderNumber}. Старый ID: ${order.id}, новый ID: ${newId}`);
            order.id = newId;
            hasDuplicates = true;
        }
        idMap.set(order.id, order);
    });
    
    if (hasDuplicates) {
        console.log('Исправлены дубликаты ID в заказах');
    }
}

// Очистка всех заказов
function clearAllOrders() {
    if (!isAuthorized()) {
        alert('Для очистки заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    const orderCount = orders.length;
    
    if (orderCount === 0) {
        alert('Нет заказов для удаления.');
        return;
    }
    
    const confirmMessage = `Вы уверены, что хотите удалить все заказы (${orderCount} шт.)?\n\nЭто действие нельзя отменить!`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Дополнительное подтверждение
    if (!confirm('Последнее предупреждение! Все заказы будут удалены безвозвратно. Продолжить?')) {
        return;
    }
    
    // Очищаем массив заказов
    orders = [];
    
    // Очищаем localStorage
    localStorage.removeItem('orders');
    
    // Обновляем отображение
    renderOrders();
    updateStatistics();
    
    alert(`Все заказы (${orderCount} шт.) успешно удалены.`);
}

// Отображение заказов
function renderOrders(filteredOrders = null) {
    const ordersToRender = filteredOrders || orders;
    
    if (ordersToRender.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <p>Нет заказов</p>
                <p>Добавьте первый заказ, используя форму выше</p>
            </div>
        `;
        return;
    }
    
    // Сортировка по номеру заказа
    const sortedOrders = [...ordersToRender].sort((a, b) => a.orderNumber - b.orderNumber);
    
    ordersList.innerHTML = sortedOrders.map(order => `
        <div class="order-card">
            <div class="order-info">
                <div class="order-header">
                    <div class="order-number">
                        <span class="order-number-text">Заказ №${order.orderNumber}</span>
                        <div class="order-status status-${order.status}">${order.status}</div>
                    </div>
                </div>
                <div class="order-details">
                    ${order.orderDate ? `
                    <div class="order-detail-item">
                        <strong>Дата заказа:</strong>
                        <span>${formatDate(order.orderDate)}</span>
                    </div>
                    ` : ''}
                    <div class="order-detail-item">
                        <strong>Исполнитель:</strong>
                        <span>${order.customerName}</span>
                    </div>
                    ${order.squares ? `
                    ${order.squares.paint !== null && order.squares.paint !== undefined ? `
                    <div class="order-detail-item">
                        <strong>Краска:</strong>
                        <span>${order.squares.paint} м²</span>
                    </div>
                    ` : ''}
                    ${order.squares.shpon !== null && order.squares.shpon !== undefined ? `
                    <div class="order-detail-item">
                        <strong>Шпон:</strong>
                        <span>${order.squares.shpon} м²</span>
                    </div>
                    ` : ''}
                    ${order.squares.plyonka !== null && order.squares.plyonka !== undefined ? `
                    <div class="order-detail-item">
                        <strong>Плёнка:</strong>
                        <span>${order.squares.plyonka} м²</span>
                    </div>
                    ` : ''}
                    ` : ''}
                    ${order.squareCount !== null && order.squareCount !== undefined ? `
                    <div class="order-detail-item">
                        <strong>Количество квадратов:</strong>
                        <span>${order.squareCount} м²</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="order-actions">
                ${order.status !== 'готов' ? `<button class="btn btn-ready" onclick="markAsReady('${order.id}', ${order.orderNumber})">Готов</button>` : ''}
                <button class="btn btn-edit" onclick="editOrder('${order.id}', ${order.orderNumber})">Редактировать</button>
                <button class="btn btn-delete" onclick="deleteOrder('${order.id}', ${order.orderNumber})">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Редактирование заказа
function editOrder(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для редактирования заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    console.log('editOrder вызвана с id:', id, 'тип:', typeof id, 'orderNumber:', orderNumber);
    
    // Пробуем найти заказ разными способами
    let order = orders.find(o => o.id === id);
    if (!order) {
        order = orders.find(o => Number(o.id) === Number(id));
    }
    if (!order) {
        order = orders.find(o => String(o.id) === String(id));
    }
    if (!order) {
        order = orders.find(o => o.id == id);
    }
    
    // Если не нашли по ID, пробуем найти по номеру заказа
    if (!order && orderNumber !== null) {
        order = orders.find(o => o.orderNumber === orderNumber || o.orderNumber == orderNumber);
    }
    
    if (!order) {
        console.error('Заказ с id', id, 'не найден для редактирования');
        console.log('Все заказы:', orders.map(o => ({ id: o.id, orderNumber: o.orderNumber })));
        alert('Ошибка: заказ не найден. Проверьте консоль браузера (F12) для подробностей.');
        return;
    }
    
    console.log('Найден заказ для редактирования:', order.orderNumber, 'ID:', order.id);
    
    document.getElementById('orderNumber').value = order.orderNumber;
    document.getElementById('customerName').value = order.customerName;
    document.getElementById('orderDate').value = order.orderDate || '';
    document.getElementById('orderStatus').value = order.status;
    
    // Заполняем поля квадратов
    if (order.squares) {
        document.getElementById('squareShpon').value = order.squares.shpon || '';
        document.getElementById('squarePlyonka').value = order.squares.plyonka || '';
        document.getElementById('squarePaint').value = order.squares.paint || '';
    } else {
        // Для старых заказов с squareCount
        document.getElementById('squareShpon').value = '';
        document.getElementById('squarePlyonka').value = '';
        document.getElementById('squarePaint').value = '';
    }
    
    // Сохраняем ID заказа для последующего обновления
    editingOrderId = order.id; // Используем ID найденного заказа, а не переданный параметр
    
    // Прокрутка к форме
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // Изменение текста кнопки
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Сохранить изменения';
}

// Быстрое изменение статуса на "готов"
function markAsReady(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для изменения статуса заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    console.log('markAsReady вызвана с id:', id, 'тип:', typeof id, 'orderNumber:', orderNumber);
    
    // Нормализуем ID - приводим к строке для сравнения
    const normalizedId = String(id);
    
    console.log('Нормализованный ID:', normalizedId);
    console.log('Все заказы:', orders.map(o => ({ 
        id: o.id, 
        idType: typeof o.id, 
        idString: String(o.id),
        orderNumber: o.orderNumber, 
        status: o.status 
    })));
    
    // Пробуем найти заказ разными способами
    let orderIndex = -1;
    
    // 1. Точное совпадение ID
    orderIndex = orders.findIndex(order => order.id === id);
    
    // 2. Сравнение как строки
    if (orderIndex === -1) {
        orderIndex = orders.findIndex(order => String(order.id) === normalizedId);
    }
    
    // 3. Сравнение как числа (если оба можно преобразовать в числа)
    if (orderIndex === -1 && !isNaN(Number(id))) {
        orderIndex = orders.findIndex(order => {
            const orderIdNum = Number(order.id);
            const searchIdNum = Number(id);
            return !isNaN(orderIdNum) && orderIdNum === searchIdNum;
        });
    }
    
    // 4. Сравнение через == (нестрогое)
    if (orderIndex === -1) {
        orderIndex = orders.findIndex(order => order.id == id);
    }
    
    // 5. Если передан номер заказа, ищем по нему
    if (orderIndex === -1 && orderNumber !== null) {
        orderIndex = orders.findIndex(order => order.orderNumber === orderNumber || order.orderNumber == orderNumber);
    }
    
    console.log('Найденный индекс:', orderIndex);
    
    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        console.log('Найден заказ:', order.orderNumber, 'текущий статус:', order.status);
        
        // Проверяем, что статус действительно изменится
        if (order.status === 'готов') {
            console.warn('Заказ уже имеет статус "готов"');
            return;
        }
        
        order.status = 'готов';
        saveOrders();
        renderOrders();
        updateStatistics();
        
        console.log('Статус изменен на "готов" для заказа:', order.orderNumber);
    } else {
        console.error('Заказ с id', id, 'не найден');
        console.error('Попробовали найти:', {
            'id === id': false,
            'String(id) === String(id)': false,
            'Number(id) === Number(id)': !isNaN(Number(id)),
            'id == id': false,
            'orderNumber': orderNumber
        });
        alert('Ошибка: заказ не найден. Проверьте консоль браузера (F12) для подробностей.');
    }
}

// Удаление заказа
function deleteOrder(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для удаления заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
        // Находим заказ ДО удаления, чтобы получить его ID для Firebase
        let orderToDelete = null;
        let orderIndex = -1;
        
        // Пробуем найти заказ разными способами
        orderIndex = orders.findIndex(order => order.id === id);
        if (orderIndex === -1) {
            orderIndex = orders.findIndex(order => Number(order.id) === Number(id));
        }
        if (orderIndex === -1) {
            orderIndex = orders.findIndex(order => String(order.id) === String(id));
        }
        if (orderIndex === -1 && orderNumber !== null) {
            orderIndex = orders.findIndex(order => order.orderNumber === orderNumber || order.orderNumber == orderNumber);
        }
        
        if (orderIndex === -1) {
            console.error('Заказ с id', id, 'не найден для удаления');
            alert('Ошибка: заказ не найден. Проверьте консоль браузера (F12) для подробностей.');
            return;
        }
        
        // Сохраняем ID заказа перед удалением
        orderToDelete = orders[orderIndex];
        const orderIdToDelete = orderToDelete.id;
        
        // Удаляем из массива
        orders.splice(orderIndex, 1);
        saveOrders();
        
        // Удаляем из Firebase
        if (window.firebaseDatabase) {
            const orderRef = window.firebaseRef(window.firebaseDatabase, `orders/${orderIdToDelete}`);
            window.firebaseRemove(orderRef).catch(error => {
                console.error('Ошибка удаления из Firebase:', error);
            });
        }
        
        renderOrders();
        updateStatistics();
        
        // Если удаляли редактируемый заказ, сбросить форму
        if (editingOrderId === id || Number(editingOrderId) === Number(id) || String(editingOrderId) === String(id)) {
            editingOrderId = null;
            orderForm.reset();
            const submitButton = orderForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Добавить заказ';
        }
    }
}

// Поиск заказов
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderOrders();
        return;
    }
    
    const filteredOrders = orders.filter(order => 
        order.orderNumber.toString().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchTerm)
    );
    
    renderOrders(filteredOrders);
}

// Сброс формы при отмене редактирования
orderForm.addEventListener('reset', () => {
    editingOrderId = null;
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Добавить заказ';
});

// Импорт данных из Excel
function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('Файл не выбран');
        return;
    }
    
    console.log('Начало импорта файла:', file.name);
    
    // Проверяем наличие библиотеки
    if (typeof XLSX === 'undefined') {
        alert('Библиотека для чтения Excel файлов не загружена. Пожалуйста, обновите страницу.');
        console.error('XLSX library not loaded');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onerror = function(error) {
        console.error('Ошибка при чтении файла:', error);
        alert('Ошибка при чтении файла. Попробуйте выбрать файл снова.');
    };
    
    reader.onload = function(e) {
        try {
            console.log('Файл прочитан, размер:', e.target.result.byteLength);
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            console.log('Workbook создан, листы:', workbook.SheetNames);
            
            // Читаем первый лист
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Конвертируем в JSON для анализа
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            console.log('Данные конвертированы, строк:', jsonData.length);
            
            // Парсим данные
            const importedOrders = parseExcelData(jsonData);
            console.log('Найдено заказов:', importedOrders.length);
            
            if (importedOrders.length === 0) {
                alert('Не удалось найти заказы в файле. Проверьте формат файла.\n\nУбедитесь, что в файле есть столбец "№ Заказа" и данные начинаются после этой ячейки.');
                return;
            }
            
            // Подтверждение импорта
            const confirmMessage = `Найдено заказов: ${importedOrders.length}\n\nИмпортировать их в платформу?`;
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Добавляем заказы
            let importedCount = 0;
            let skippedCount = 0;
            
            importedOrders.forEach(order => {
                // Проверяем, нет ли уже такого номера заказа
                const existingOrder = orders.find(o => o.orderNumber == order.orderNumber);
                if (existingOrder) {
                    skippedCount++;
                    return;
                }
                
                // Создаем новый заказ
                // Формируем объект squares только с непустыми значениями
                const squares = {};
                
                console.log(`Импорт заказа ${order.orderNumber}:`, {
                    paint: order.paint,
                    shpon: order.shpon,
                    plyonka: order.plyonka,
                    paintType: typeof order.paint,
                    shponType: typeof order.shpon,
                    plyonkaType: typeof order.plyonka
                });
                
                if (order.paint !== null && order.paint !== undefined && order.paint > 0) {
                    squares.paint = order.paint;
                    console.log(`  -> Краска добавлена: ${squares.paint}`);
                }
                if (order.shpon !== null && order.shpon !== undefined && order.shpon > 0) {
                    squares.shpon = order.shpon;
                    console.log(`  -> Шпон добавлен: ${squares.shpon}`);
                }
                if (order.plyonka !== null && order.plyonka !== undefined && order.plyonka > 0) {
                    squares.plyonka = order.plyonka;
                    console.log(`  -> Пленка добавлена: ${squares.plyonka}`);
                } else {
                    console.log(`  -> Пленка НЕ добавлена (значение: ${order.plyonka}, тип: ${typeof order.plyonka})`);
                }
                
                // Генерируем уникальный ID - используем timestamp + порядковый номер + случайное число
                const uniqueId = Date.now() + importedCount * 1000 + Math.random();
                
                const newOrder = {
                    id: uniqueId,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName || 'Не указан',
                    orderDate: order.orderDate,
                    status: 'в работе',
                    squares: Object.keys(squares).length > 0 ? squares : null
                };
                
                orders.push(newOrder);
                importedCount++;
            });
            
            saveOrders();
            renderOrders();
            updateStatistics();
            
            alert(`Импорт завершен!\n\nИмпортировано: ${importedCount}\nПропущено (дубликаты): ${skippedCount}`);
            
            // Очищаем input
            event.target.value = '';
            
        } catch (error) {
            console.error('Ошибка при импорте:', error);
            alert('Ошибка при чтении файла: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Парсинг данных из Excel
function parseExcelData(jsonData) {
    const orders = [];
    
    // Находим индексы столбцов
    let orderNumCol = null;
    let kvCol = null;
    let plenkaCol = null;
    let shponCol = null;
    let dateCol = null;
    let customerNameCol = null; // Ищем столбец с именем исполнителя
    
    // Текущая дата для группировки заказов
    let currentDate = null;
    
    // Ищем заголовки - ищем более тщательно
    console.log('Начинаем поиск заголовков...');
    for (let i = 0; i < Math.min(30, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim();
            
            // Ищем "№ Заказа" - точное совпадение или содержит
            if ((cellValue === '№ Заказа' || cellValue === '№ заказа' || cellValue.includes('№ Заказа')) && orderNumCol === null) {
                orderNumCol = j;
                console.log(`Найден столбец "№ Заказа" в строке ${i}, колонке ${j}`);
            }
            // Ищем "Кв" - только точное совпадение, ищем в той же строке что и "№ Заказа" или рядом
            if ((cellValue === 'Кв' || cellValue === 'кв') && kvCol === null) {
                kvCol = j;
                console.log(`Найден столбец "Кв" в строке ${i}, колонке ${j}`);
            }
            // Ищем "Пленка" или "Плёнка" - ТОЛЬКО начиная со столбца G (индекс 6) и далее
            // Столбцы: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, ...
            if ((cellValue.includes('Пленка') || cellValue.includes('Плёнка')) && j >= 6) {
                console.log(`Найдено совпадение с "Пленка" в строке ${i}, колонке ${j}: "${cellValue}"`);
                if (plenkaCol === null) {
                    plenkaCol = j;
                    console.log(`✓ Столбец "Пленка" УСТАНОВЛЕН в колонке ${j} (начиная с G)`);
                } else {
                    console.log(`⚠ ВНИМАНИЕ: Найдено еще одно совпадение "Пленка" в колонке ${j}, но уже используется колонка ${plenkaCol}`);
                }
            } else if ((cellValue.includes('Пленка') || cellValue.includes('Плёнка')) && j < 6) {
                // Логируем, но игнорируем совпадения до столбца G
                console.log(`⚠ Игнорируем "Пленка" в колонке ${j} (до столбца G), ищем только начиная с G`);
            }
            // Ищем "Шпон"
            if (cellValue.includes('Шпон') && shponCol === null) {
                shponCol = j;
                console.log(`Найден столбец "Шпон" в строке ${i}, колонке ${j}`);
            }
            // Ищем "Число"
            if (cellValue === 'Число' && dateCol === null) {
                dateCol = j;
                console.log(`Найден столбец "Число" в строке ${i}, колонке ${j}`);
            }
            // Ищем столбец с именем исполнителя - ищем "Прописан"
            if ((cellValue.includes('Прописан') || cellValue.includes('прописан')) && customerNameCol === null) {
                customerNameCol = j;
                console.log(`Найден столбец "Прописан" в строке ${i}, колонке ${j}`);
            }
        }
    }
    
    console.log('Итоговые найденные столбцы:', {
        orderNumCol,
        kvCol,
        plenkaCol,
        shponCol,
        dateCol,
        customerNameCol
    });
    
    if (orderNumCol === null) {
        console.error('Не найден столбец с номерами заказов');
        return orders;
    }
    
    // Находим строку начала данных (после заголовка "№ Заказа")
    let dataStartRow = null;
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        const cellValue = String(row[orderNumCol] || '').trim();
        if (cellValue.includes('№ Заказа') || cellValue.includes('№ заказа')) {
            dataStartRow = i + 1;
            break;
        }
    }
    
    if (dataStartRow === null) {
        console.error('Не найдена строка начала данных');
        return orders;
    }
    
    // Если не нашли "Кв" в заголовках, ищем в данных - это может быть столбец с числовыми значениями
    if (kvCol === null && orderNumCol !== null) {
        // Ищем столбец с числовыми значениями (квадраты) в строках с заказами
        // Проверяем несколько строк с заказами для надежности
        const candidateCols = {};
        
        for (let i = dataStartRow; i < Math.min(dataStartRow + 20, jsonData.length); i++) {
            const row = jsonData[i];
            if (!row) continue;
            
            // Проверяем, есть ли номер заказа в этой строке
            const orderNum = row[orderNumCol];
            if (!orderNum || isNaN(orderNum)) continue;
            
            // Проверяем все столбцы справа от номера заказа
            for (let j = orderNumCol + 1; j < Math.min(orderNumCol + 20, row.length); j++) {
                if (row[j] !== null && row[j] !== undefined && row[j] !== '') {
                    const value = parseFloat(row[j]);
                    // Если это число от 0.1 до 1000 (разумный диапазон для квадратов)
                    if (!isNaN(value) && value > 0.1 && value < 1000) {
                        if (!candidateCols[j]) {
                            candidateCols[j] = 0;
                        }
                        candidateCols[j]++;
                    }
                }
            }
        }
        
        // Выбираем столбец, который встречается чаще всего
        let maxCount = 0;
        for (const [col, count] of Object.entries(candidateCols)) {
            if (count > maxCount) {
                maxCount = count;
                kvCol = parseInt(col);
            }
        }
    }
    
    // Парсим данные
    for (let i = dataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        // Проверяем дату
        if (dateCol !== null && row[dateCol] !== null && row[dateCol] !== undefined && row[dateCol] !== '') {
            const dateValue = row[dateCol];
            let dateStr = null;
            
            // Если это объект Date
            if (dateValue instanceof Date) {
                const year = dateValue.getFullYear();
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } 
            // Если это строка с датой
            else if (typeof dateValue === 'string') {
                // Пробуем разные форматы
                const dateMatch1 = dateValue.match(/(\d{4})-(\d{2})-(\d{2})/);
                const dateMatch2 = dateValue.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                const dateMatch3 = dateValue.match(/(\d{4})\/(\d{2})\/(\d{2})/);
                
                if (dateMatch1) {
                    dateStr = dateValue.substring(0, 10);
                } else if (dateMatch2) {
                    dateStr = `${dateMatch2[3]}-${dateMatch2[2]}-${dateMatch2[1]}`;
                } else if (dateMatch3) {
                    dateStr = `${dateMatch3[1]}-${dateMatch3[2]}-${dateMatch3[3]}`;
                }
            }
            // Если это число (Excel дата как число дней с 1900-01-01)
            else if (typeof dateValue === 'number' && dateValue > 1 && dateValue < 100000) {
                // Конвертируем Excel дату в обычную дату
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            }
            
            if (dateStr) {
                currentDate = dateStr;
            }
        }
        
        // Проверяем номер заказа
        const orderNumber = row[orderNumCol];
        if (!orderNumber || orderNumber === '' || isNaN(orderNumber)) {
            continue; // Пропускаем строки без номера заказа
        }
        
        const orderNum = parseInt(orderNumber);
        if (isNaN(orderNum)) {
            continue;
        }
        
        // Получаем квадраты - только если ячейка не пустая и значение > 0
        let paint = null;
        let shpon = null;
        let plyonka = null;
        
        if (kvCol !== null) {
            const kvCell = row[kvCol];
            // Проверяем, что ячейка не пустая и не содержит только пробелы
            if (kvCell !== null && kvCell !== undefined && kvCell !== '' && String(kvCell).trim() !== '') {
                // Заменяем запятую на точку для правильного парсинга (русская локаль использует запятую)
                const normalizedCell = String(kvCell).replace(',', '.');
                const kvValue = parseFloat(normalizedCell);
                // Добавляем только если значение валидное и строго больше 0
                if (!isNaN(kvValue) && isFinite(kvValue) && kvValue > 0) {
                    paint = kvValue; // "Кв" - это краска
                }
            }
        }
        
        if (shponCol !== null) {
            const shponCell = row[shponCol];
            // Проверяем, что ячейка не пустая и не содержит только пробелы
            if (shponCell !== null && shponCell !== undefined && shponCell !== '' && String(shponCell).trim() !== '') {
                // Заменяем запятую на точку для правильного парсинга (русская локаль использует запятую)
                const normalizedCell = String(shponCell).replace(',', '.');
                const shponValue = parseFloat(normalizedCell);
                // Добавляем только если значение валидное и строго больше 0
                if (!isNaN(shponValue) && isFinite(shponValue) && shponValue > 0) {
                    shpon = shponValue;
                }
            }
        }
        
        if (plenkaCol !== null) {
            const plenkaCell = row[plenkaCol];
            
            // Детальное логирование для отладки
            console.log(`Заказ ${orderNum}: Читаем пленку из столбца ${plenkaCol}, значение=[${plenkaCell}], тип=${typeof plenkaCell}`);
            
            // Проверяем, что ячейка не пустая и не содержит только пробелы
            const cellStr = plenkaCell !== null && plenkaCell !== undefined ? String(plenkaCell).trim() : '';
            if (cellStr !== '') {
                // Заменяем запятую на точку для правильного парсинга (русская локаль использует запятую)
                const normalizedCell = String(plenkaCell).replace(',', '.');
                const plenkaValue = parseFloat(normalizedCell);
                console.log(`Заказ ${orderNum}: Пленка после нормализации="${normalizedCell}", parseFloat=${plenkaValue}, isNaN=${isNaN(plenkaValue)}, isFinite=${isFinite(plenkaValue)}`);
                
                // Добавляем только если значение валидное и строго больше 0
                if (!isNaN(plenkaValue) && isFinite(plenkaValue) && plenkaValue > 0) {
                    plyonka = plenkaValue;
                    console.log(`Заказ ${orderNum}: Пленка УСТАНОВЛЕНА = ${plyonka}`);
                } else {
                    console.log(`Заказ ${orderNum}: Пленка не прошла проверку (значение=${plenkaValue}, isNaN=${isNaN(plenkaValue)}, isFinite=${isFinite(plenkaValue)}, >0=${plenkaValue > 0})`);
                }
            } else {
                console.log(`Заказ ${orderNum}: Пленка - ячейка пустая`);
            }
        } else {
            console.log(`Заказ ${orderNum}: Столбец пленки не найден (plenkaCol = null)`);
        }
        
        // Получаем имя исполнителя
        let customerName = 'Не указан';
        if (customerNameCol !== null && row[customerNameCol] !== null && row[customerNameCol] !== undefined && row[customerNameCol] !== '') {
            customerName = String(row[customerNameCol]).trim();
        }
        
        // Создаем объект заказа
        const orderObj = {
            orderNumber: orderNum,
            customerName: customerName,
            orderDate: currentDate || null,
            paint: paint,
            shpon: shpon,
            plyonka: plyonka
        };
        
        // Логируем финальные значения перед добавлением
        console.log(`Заказ ${orderNum} создан:`, {
            paint: orderObj.paint,
            shpon: orderObj.shpon,
            plyonka: orderObj.plyonka
        });
        
        orders.push(orderObj);
    }
    
    return orders;
}



