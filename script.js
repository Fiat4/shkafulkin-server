let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null;

let isSyncing = false;
let calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    startDate: null,
    endDate: null,
    startMonth: null,
    endMonth: null,
    startYear: null,
    endYear: null,
    view: 'days'
};

const orderForm = document.getElementById('orderForm');
const ordersList = document.getElementById('ordersList');
const searchInput = document.getElementById('searchInput');

function formatDate(dateString) {
    if (!dateString) return '';
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

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

function calculateStatistics(filteredOrders) {
    let totalShpon = 0;
    let totalPlyonka = 0;
    let totalPaint = 0;
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

function displayStatistics(stats) {
    document.getElementById('ordersCount').textContent = stats.count;
    document.getElementById('totalSquares').textContent = stats.totalSquares;
    document.getElementById('totalShpon').textContent = stats.totalShpon;
    document.getElementById('totalPlyonka').textContent = stats.totalPlyonka;
    document.getElementById('totalPaint').textContent = stats.totalPaint;
}

function filterOrdersByDateRange(fromDate, toDate) {
    if (!fromDate || !toDate) return orders;
    return orders.filter(order => {
        if (!order.orderDate) return false;
        return order.orderDate >= fromDate && order.orderDate <= toDate;
    });
}

function filterOrdersBySingleDate(date) {
    if (!date) return orders;
    return orders.filter(order => {
        if (!order.orderDate) return false;
        return order.orderDate === date;
    });
}

function filterOrdersByMonthRange(fromMonth, toMonth) {
    if (!fromMonth || !toMonth) return orders;
    return orders.filter(order => {
        if (!order.orderDate) return false;
        const orderMonth = order.orderDate.substring(0, 7);
        return orderMonth >= fromMonth && orderMonth <= toMonth;
    });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthName(month) {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                   'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[month];
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');
    const calendarContainer = document.getElementById('calendarContainer');
    const monthPicker = document.getElementById('monthPicker');
    const yearPicker = document.getElementById('yearPicker');
    
    if (!calendarDays) return;
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

function renderDays() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');
    if (!calendarDays) return;
    
    if (calendarMonth) calendarMonth.textContent = getMonthName(calendarState.currentMonth);
    if (calendarYear) calendarYear.textContent = calendarState.currentYear;
    
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1);
    const lastDay = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    calendarDays.innerHTML = '';
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        // Добавляем обработчик клика на пустую область для сброса
        emptyDay.addEventListener('click', () => {
            if (calendarState.startDate || calendarState.endDate) {
                calendarState.startDate = null;
                calendarState.endDate = null;
                updateStatistics();
                renderDays();
            }
        });
        calendarDays.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(calendarState.currentYear, calendarState.currentMonth, day);
        const dateString = formatDateForInput(currentDate);
        if (calendarState.startDate && calendarState.endDate) {
            if (calendarState.startDate === calendarState.endDate) {
                // Один день выбран
                if (dateString === calendarState.startDate) {
                    dayElement.classList.add('start-date');
                    dayElement.classList.add('end-date');
                }
            } else {
                // Диапазон выбран
                if (dateString >= calendarState.startDate && dateString <= calendarState.endDate) {
                    dayElement.classList.add('in-range');
                }
                if (dateString === calendarState.startDate) {
                    dayElement.classList.add('start-date');
                }
                if (dateString === calendarState.endDate) {
                    dayElement.classList.add('end-date');
                }
            }
        }
        
        dayElement.addEventListener('click', () => selectDate(dateString));
        calendarDays.appendChild(dayElement);
    }
    
    updateSelectedRangeDisplay();
}

function selectDate(dateString) {
    if (calendarState.startDate && calendarState.endDate) {
        if (dateString === calendarState.startDate || dateString === calendarState.endDate) {
            calendarState.startDate = null;
            calendarState.endDate = null;
            updateStatistics();
            renderDays();
            return;
        }
    } else if (calendarState.startDate && !calendarState.endDate) {
        if (dateString === calendarState.startDate) {
            calendarState.startDate = null;
            calendarState.endDate = null;
            updateStatistics();
            renderDays();
            return;
        }
    }
    
    if (!calendarState.startDate) {
        calendarState.startDate = dateString;
        calendarState.endDate = dateString;
        updateStatistics();
    } else if (calendarState.startDate === calendarState.endDate) {
        if (dateString < calendarState.startDate) {
            calendarState.endDate = calendarState.startDate;
            calendarState.startDate = dateString;
        } else {
            calendarState.endDate = dateString;
        }
        updateStatistics();
    } else {
        calendarState.startDate = dateString;
        calendarState.endDate = dateString;
        updateStatistics();
    }
    renderDays();
}

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

function updateSelectedRangeDisplay() {
    const selectedRange = document.getElementById('selectedRange');
    if (!selectedRange) return;
    
    if (calendarState.startDate && calendarState.endDate) {
        const startFormatted = formatDate(calendarState.startDate);
        const endFormatted = formatDate(calendarState.endDate);
        if (calendarState.startDate === calendarState.endDate) {
            selectedRange.textContent = `Выбрано: ${startFormatted}`;
        } else {
            selectedRange.textContent = `Выбрано: ${startFormatted} - ${endFormatted}`;
        }
        selectedRange.style.display = 'block';
    } else {
        selectedRange.style.display = 'none';
    }
}

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

function formatMonth(monthString) {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function goToPrevMonth() {
    changeMonth(-1);
}

function goToNextMonth() {
    changeMonth(1);
}

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
    }
}

function changeYear(direction) {
    if (calendarState.view === 'months') {
        const currentYearNum = typeof calendarState.currentYear === 'number' 
            ? calendarState.currentYear 
            : parseInt(calendarState.currentYear);
        calendarState.currentYear = currentYearNum + direction;
        renderMonths();
    }
}

function changeYearRange(direction) {
    if (calendarState.view === 'years') {
        calendarState.currentYear += direction * 10;
        renderYears();
    }
}


function updateStatistics() {
    let filteredOrders = orders;
    if (calendarState.startDate && calendarState.endDate) {
        if (calendarState.startDate === calendarState.endDate) {
            filteredOrders = filterOrdersBySingleDate(calendarState.startDate);
        } else {
            filteredOrders = filterOrdersByDateRange(calendarState.startDate, calendarState.endDate);
        }
    } else if (calendarState.startMonth && calendarState.endMonth) {
        filteredOrders = filterOrdersByMonthRange(calendarState.startMonth, calendarState.endMonth);
    } else if (calendarState.startYear && calendarState.endYear) {
        filteredOrders = orders.filter(order => {
            if (!order.orderDate) return false;
            const orderYear = order.orderDate.substring(0, 4);
            return orderYear >= calendarState.startYear && orderYear <= calendarState.endYear;
        });
    }
    
    const stats = calculateStatistics(filteredOrders);
    displayStatistics(stats);
}

const AUTH_PASSWORD_HASH = '189eb066f73b1fa3cae1eff724e4d0093186c2362ed123cd516310b9c5fd315e';
const AUTH_STORAGE_KEY = 'orderPlatformAuth';
const AUTH_VERSION_KEY = 'orderPlatformAuthVersion';

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function verifyPassword(inputPassword, storedHash) {
    const inputHash = await hashPassword(inputPassword);
    return inputHash === storedHash;
}

function checkAuth() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedVersion = localStorage.getItem(AUTH_VERSION_KEY);
    
    if (savedVersion && savedVersion !== AUTH_PASSWORD_HASH) {
        console.log('Пароль был изменен, сбрасываем все сессии');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.setItem(AUTH_VERSION_KEY, AUTH_PASSWORD_HASH);
        return false;
    }
    
    if (authData) {
        try {
            const { hash, timestamp } = JSON.parse(authData);
            const sessionDuration = 24 * 60 * 60 * 1000;
            if (hash === AUTH_PASSWORD_HASH && Date.now() - timestamp < sessionDuration) {
                if (!savedVersion || savedVersion !== AUTH_PASSWORD_HASH) {
                    localStorage.setItem(AUTH_VERSION_KEY, AUTH_PASSWORD_HASH);
                }
                return true;
            }
        } catch (e) {
        }
    }
    return false;
}

async function saveAuth(inputPassword) {
    const hash = await hashPassword(inputPassword);
    const authData = {
        hash: hash,
        timestamp: Date.now()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem(AUTH_VERSION_KEY, AUTH_PASSWORD_HASH);
}

function initAuth() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.getElementById('mainContainer');
    const authPassword = document.getElementById('authPassword');
    const authSubmit = document.getElementById('authSubmit');
    const authError = document.getElementById('authError');

    if (checkAuth()) {
        authModal.style.display = 'none';
        mainContainer.style.display = 'block';
        setTimeout(() => {
            initializeAppData();
        }, 100);
        return true;
    } else {
        authModal.style.display = 'flex';
        mainContainer.style.display = 'none';
        
        const handleAuth = async () => {
            const password = authPassword.value.trim();
            const isValid = await verifyPassword(password, AUTH_PASSWORD_HASH);
            if (isValid) {
                await saveAuth(password);
                authModal.style.display = 'none';
                mainContainer.style.display = 'block';
                authError.style.display = 'none';
                authPassword.value = '';
                
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

function isAuthorized() {
    return checkAuth();
}

function initializeAppData() {
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
    
    if (window.firebaseDatabase) {
        initializeData();
    } else {
        window.addEventListener('firebaseReady', initializeData, { once: true });
        
        const waitForFirebase = setInterval(() => {
            if (window.firebaseDatabase) {
                clearInterval(waitForFirebase);
                initializeData();
            }
        }, 100);
        
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
    
    initializeCalendarAndHandlers();
}

let handlersInitialized = false;
const handlerFunctions = {};

function initializeCalendarAndHandlers() {
    if (handlersInitialized) {
        return;
    }
    handlersInitialized = true;
    
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
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarYear = document.getElementById('calendarYear');
    const prevYear = document.getElementById('prevYear');
    const nextYear = document.getElementById('nextYear');
    const prevYearRange = document.getElementById('prevYearRange');
    const nextYearRange = document.getElementById('nextYearRange');
    
    if (calendarState) {
        calendarState.view = 'days';
        renderCalendar();
    }
    
    if (calendarMonth) {
        handlerFunctions.handleCalendarMonth = () => {
            calendarState.view = 'months';
            renderCalendar();
        };
        calendarMonth.addEventListener('click', handlerFunctions.handleCalendarMonth);
    }
    
    if (calendarYear) {
        handlerFunctions.handleCalendarYear = () => {
            calendarState.view = 'years';
            renderCalendar();
        };
        calendarYear.addEventListener('click', handlerFunctions.handleCalendarYear);
    }
    
    if (prevMonth) {
        prevMonth.addEventListener('click', goToPrevMonth);
    }
    if (nextMonth) {
        nextMonth.addEventListener('click', goToNextMonth);
    }
    
    handlerFunctions.handlePrevYear = () => changeYear(-1);
    handlerFunctions.handleNextYear = () => changeYear(1);
    
    if (prevYear) {
        prevYear.addEventListener('click', handlerFunctions.handlePrevYear);
    }
    if (nextYear) {
        nextYear.addEventListener('click', handlerFunctions.handleNextYear);
    }
    
    handlerFunctions.handlePrevYearRange = () => changeYearRange(-1);
    handlerFunctions.handleNextYearRange = () => changeYearRange(1);
    
    if (prevYearRange) {
        prevYearRange.addEventListener('click', handlerFunctions.handlePrevYearRange);
    }
    if (nextYearRange) {
        nextYearRange.addEventListener('click', handlerFunctions.handleNextYearRange);
    }
    
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
    
    const importExcelBtn = document.getElementById('importExcelBtn');
    const excelFileInput = document.getElementById('excelFileInput');
    
    if (importExcelBtn && excelFileInput) {
        importExcelBtn.addEventListener('click', () => {
            if (!isAuthorized()) {
                alert('Для импорта заказов необходимо авторизоваться');
                initAuth();
                return;
            }
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
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllOrders);
    }
    
    const calendarContainer = document.getElementById('calendarContainer');
    const calendarDays = document.getElementById('calendarDays');
    if (calendarDays) {
        calendarDays.addEventListener('click', (e) => {
            if (e.target === calendarDays) {
                if (calendarState.startDate || calendarState.endDate) {
                    calendarState.startDate = null;
                    calendarState.endDate = null;
                    updateStatistics();
                    renderDays();
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!initAuth()) {
        return;
    }
    
    initializeAppData();
});

function handleFormSubmit(e) {
    e.preventDefault();
    
    const orderNumber = document.getElementById('orderNumber').value;
    const customerName = document.getElementById('customerName').value;
    const orderDate = document.getElementById('orderDate').value;
    let orderStatus = document.getElementById('orderStatus').value;
    const squareShpon = document.getElementById('squareShpon').value;
    const squarePlyonka = document.getElementById('squarePlyonka').value;
    const squarePaint = document.getElementById('squarePaint').value;
    
    if (!orderStatus || orderStatus === '') {
        orderStatus = 'в работе';
    }
    
    const squares = {
        shpon: squareShpon ? parseFloat(squareShpon) : null,
        plyonka: squarePlyonka ? parseFloat(squarePlyonka) : null,
        paint: squarePaint ? parseFloat(squarePaint) : null
    };
    
    if (editingOrderId !== null) {
        const orderIndex = orders.findIndex(order => order.id === editingOrderId);
        if (orderIndex !== -1) {
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
        const existingOrder = orders.find(order => order.orderNumber === parseInt(orderNumber));
        if (existingOrder) {
            alert(`Заказ с номером ${orderNumber} уже существует!`);
            return;
        }
        
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
    updateStatistics();
    orderForm.reset();
    setDefaultDate();
}

function saveOrders() {
    fixDuplicateIds();
    
    localStorage.setItem('orders', JSON.stringify(orders));
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

function loadOrdersFromFirebase() {
    if (!window.firebaseDatabase) {
        console.log('Firebase не доступен, загружаем из localStorage');
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        fixDuplicateIds();
        renderOrders();
        updateStatistics();
        return;
    }
    
    const ordersRef = window.firebaseRef(window.firebaseDatabase, 'orders');
    
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
            localStorage.setItem('orders', JSON.stringify(orders));
        } else {
            console.log('В Firebase нет данных, загружаем из localStorage');
            orders = JSON.parse(localStorage.getItem('orders')) || [];
            fixDuplicateIds();
            renderOrders();
            updateStatistics();
        }
    }, (error) => {
        console.error('Ошибка загрузки из Firebase:', error);
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        fixDuplicateIds();
        renderOrders();
        updateStatistics();
    });
}

function fixDuplicateIds() {
    const idMap = new Map();
    let hasDuplicates = false;
    
    orders.forEach((order, index) => {
        if (idMap.has(order.id)) {
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
    
    if (!confirm('Последнее предупреждение! Все заказы будут удалены безвозвратно. Продолжить?')) {
        return;
    }
    
    orders = [];
    
    localStorage.removeItem('orders');
    
    renderOrders();
    updateStatistics();
    
    alert(`Все заказы (${orderCount} шт.) успешно удалены.`);
}

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

function editOrder(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для редактирования заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    console.log('editOrder вызвана с id:', id, 'тип:', typeof id, 'orderNumber:', orderNumber);
    
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
    
    if (order.squares) {
        document.getElementById('squareShpon').value = order.squares.shpon || '';
        document.getElementById('squarePlyonka').value = order.squares.plyonka || '';
        document.getElementById('squarePaint').value = order.squares.paint || '';
    } else {
        document.getElementById('squareShpon').value = '';
        document.getElementById('squarePlyonka').value = '';
        document.getElementById('squarePaint').value = '';
    }
    
    editingOrderId = order.id;
    
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Сохранить изменения';
}

function markAsReady(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для изменения статуса заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    console.log('markAsReady вызвана с id:', id, 'тип:', typeof id, 'orderNumber:', orderNumber);
    
    const normalizedId = String(id);
    
    console.log('Нормализованный ID:', normalizedId);
    console.log('Все заказы:', orders.map(o => ({ 
        id: o.id, 
        idType: typeof o.id, 
        idString: String(o.id),
        orderNumber: o.orderNumber, 
        status: o.status 
    })));
    
    let orderIndex = -1;
    
    orderIndex = orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
        orderIndex = orders.findIndex(order => String(order.id) === normalizedId);
    }
    
    if (orderIndex === -1 && !isNaN(Number(id))) {
        orderIndex = orders.findIndex(order => {
            const orderIdNum = Number(order.id);
            const searchIdNum = Number(id);
            return !isNaN(orderIdNum) && orderIdNum === searchIdNum;
        });
    }
    
    if (orderIndex === -1) {
        orderIndex = orders.findIndex(order => order.id == id);
    }
    
    if (orderIndex === -1 && orderNumber !== null) {
        orderIndex = orders.findIndex(order => order.orderNumber === orderNumber || order.orderNumber == orderNumber);
    }
    
    console.log('Найденный индекс:', orderIndex);
    
    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        console.log('Найден заказ:', order.orderNumber, 'текущий статус:', order.status);
        
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

function deleteOrder(id, orderNumber = null) {
    if (!isAuthorized()) {
        alert('Для удаления заказов необходимо авторизоваться');
        initAuth();
        return;
    }
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
        let orderToDelete = null;
        let orderIndex = -1;
        
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
        
        orderToDelete = orders[orderIndex];
        const orderIdToDelete = orderToDelete.id;
        
        orders.splice(orderIndex, 1);
        saveOrders();
        
        if (window.firebaseDatabase) {
            const orderRef = window.firebaseRef(window.firebaseDatabase, `orders/${orderIdToDelete}`);
            window.firebaseRemove(orderRef).catch(error => {
                console.error('Ошибка удаления из Firebase:', error);
            });
        }
        
        renderOrders();
        updateStatistics();
        
        if (editingOrderId === id || Number(editingOrderId) === Number(id) || String(editingOrderId) === String(id)) {
            editingOrderId = null;
            orderForm.reset();
            const submitButton = orderForm.querySelector('button[type="submit"]');
            submitButton.textContent = 'Добавить заказ';
        }
    }
}

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

orderForm.addEventListener('reset', () => {
    editingOrderId = null;
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Добавить заказ';
});

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('Файл не выбран');
        return;
    }
    
    console.log('Начало импорта файла:', file.name);
    
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
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            console.log('Данные конвертированы, строк:', jsonData.length);
            
            const importedOrders = parseExcelData(jsonData);
            console.log('Найдено заказов:', importedOrders.length);
            
            if (importedOrders.length === 0) {
                alert('Не удалось найти заказы в файле. Проверьте формат файла.\n\nУбедитесь, что в файле есть столбец "№ Заказа" и данные начинаются после этой ячейки.');
                return;
            }
            
            const confirmMessage = `Найдено заказов: ${importedOrders.length}\n\nИмпортировать их в платформу?`;
            if (!confirm(confirmMessage)) {
                return;
            }
            
            let importedCount = 0;
            let skippedCount = 0;
            
            importedOrders.forEach(order => {
                const existingOrder = orders.find(o => o.orderNumber == order.orderNumber);
                if (existingOrder) {
                    skippedCount++;
                    return;
                }
                
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
            
            event.target.value = '';
            
        } catch (error) {
            console.error('Ошибка при импорте:', error);
            alert('Ошибка при чтении файла: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function parseExcelData(jsonData) {
    const orders = [];
    let orderNumCol = null;
    let kvCol = null;
    let plenkaCol = null;
    let shponCol = null;
    let dateCol = null;
    let customerNameCol = null;
    
    let currentDate = null;
    
    console.log('Начинаем поиск заголовков...');
    for (let i = 0; i < Math.min(30, jsonData.length); i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        for (let j = 0; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim();
            
            if ((cellValue === '№ Заказа' || cellValue === '№ заказа' || cellValue.includes('№ Заказа')) && orderNumCol === null) {
                orderNumCol = j;
                console.log(`Найден столбец "№ Заказа" в строке ${i}, колонке ${j}`);
            }
            if ((cellValue === 'Кв' || cellValue === 'кв') && kvCol === null) {
                kvCol = j;
                console.log(`Найден столбец "Кв" в строке ${i}, колонке ${j}`);
            }
            if ((cellValue.includes('Пленка') || cellValue.includes('Плёнка')) && j >= 6) {
                console.log(`Найдено совпадение с "Пленка" в строке ${i}, колонке ${j}: "${cellValue}"`);
                if (plenkaCol === null) {
                    plenkaCol = j;
                    console.log(`✓ Столбец "Пленка" УСТАНОВЛЕН в колонке ${j} (начиная с G)`);
                } else {
                    console.log(`⚠ ВНИМАНИЕ: Найдено еще одно совпадение "Пленка" в колонке ${j}, но уже используется колонка ${plenkaCol}`);
                }
            } else if ((cellValue.includes('Пленка') || cellValue.includes('Плёнка')) && j < 6) {
                console.log(`⚠ Игнорируем "Пленка" в колонке ${j} (до столбца G), ищем только начиная с G`);
            }
            if (cellValue.includes('Шпон') && shponCol === null) {
                shponCol = j;
                console.log(`Найден столбец "Шпон" в строке ${i}, колонке ${j}`);
            }
            if (cellValue === 'Число' && dateCol === null) {
                dateCol = j;
                console.log(`Найден столбец "Число" в строке ${i}, колонке ${j}`);
            }
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
    
    if (kvCol === null && orderNumCol !== null) {
        const candidateCols = {};
        
        for (let i = dataStartRow; i < Math.min(dataStartRow + 20, jsonData.length); i++) {
            const row = jsonData[i];
            if (!row) continue;
            
            const orderNum = row[orderNumCol];
            if (!orderNum || isNaN(orderNum)) continue;
            
            for (let j = orderNumCol + 1; j < Math.min(orderNumCol + 20, row.length); j++) {
                if (row[j] !== null && row[j] !== undefined && row[j] !== '') {
                    const value = parseFloat(row[j]);
                    if (!isNaN(value) && value > 0.1 && value < 1000) {
                        if (!candidateCols[j]) {
                            candidateCols[j] = 0;
                        }
                        candidateCols[j]++;
                    }
                }
            }
        }
        
        let maxCount = 0;
        for (const [col, count] of Object.entries(candidateCols)) {
            if (count > maxCount) {
                maxCount = count;
                kvCol = parseInt(col);
            }
        }
    }
    
    for (let i = dataStartRow; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;
        
        if (dateCol !== null && row[dateCol] !== null && row[dateCol] !== undefined && row[dateCol] !== '') {
            const dateValue = row[dateCol];
            let dateStr = null;
            
            if (dateValue instanceof Date) {
                const year = dateValue.getFullYear();
                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                const day = String(dateValue.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
            } 
            else if (typeof dateValue === 'string') {
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
            else if (typeof dateValue === 'number' && dateValue > 1 && dateValue < 100000) {
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
        
        const orderNumber = row[orderNumCol];
        if (!orderNumber || orderNumber === '' || isNaN(orderNumber)) {
            continue;
        }
        
        const orderNum = parseInt(orderNumber);
        if (isNaN(orderNum)) {
            continue;
        }
        
        let paint = null;
        let shpon = null;
        let plyonka = null;
        
        if (kvCol !== null) {
            const kvCell = row[kvCol];
            if (kvCell !== null && kvCell !== undefined && kvCell !== '' && String(kvCell).trim() !== '') {
                const normalizedCell = String(kvCell).replace(',', '.');
                const kvValue = parseFloat(normalizedCell);
                if (!isNaN(kvValue) && isFinite(kvValue) && kvValue > 0) {
                    paint = kvValue;
                }
            }
        }
        
        if (shponCol !== null) {
            const shponCell = row[shponCol];
            if (shponCell !== null && shponCell !== undefined && shponCell !== '' && String(shponCell).trim() !== '') {
                const normalizedCell = String(shponCell).replace(',', '.');
                const shponValue = parseFloat(normalizedCell);
                if (!isNaN(shponValue) && isFinite(shponValue) && shponValue > 0) {
                    shpon = shponValue;
                }
            }
        }
        
        if (plenkaCol !== null) {
            const plenkaCell = row[plenkaCol];
            
            console.log(`Заказ ${orderNum}: Читаем пленку из столбца ${plenkaCol}, значение=[${plenkaCell}], тип=${typeof plenkaCell}`);
            
            const cellStr = plenkaCell !== null && plenkaCell !== undefined ? String(plenkaCell).trim() : '';
            if (cellStr !== '') {
                const normalizedCell = String(plenkaCell).replace(',', '.');
                const plenkaValue = parseFloat(normalizedCell);
                console.log(`Заказ ${orderNum}: Пленка после нормализации="${normalizedCell}", parseFloat=${plenkaValue}, isNaN=${isNaN(plenkaValue)}, isFinite=${isFinite(plenkaValue)}`);
                
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
        
        let customerName = 'Не указан';
        if (customerNameCol !== null && row[customerNameCol] !== null && row[customerNameCol] !== undefined && row[customerNameCol] !== '') {
            customerName = String(row[customerNameCol]).trim();
        }
        
        const orderObj = {
            orderNumber: orderNum,
            customerName: customerName,
            orderDate: currentDate || null,
            paint: paint,
            shpon: shpon,
            plyonka: plyonka
        };
        
        console.log(`Заказ ${orderNum} создан:`, {
            paint: orderObj.paint,
            shpon: orderObj.shpon,
            plyonka: orderObj.plyonka
        });
        
        orders.push(orderObj);
    }
    
    return orders;
}

