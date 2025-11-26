// Простая интеграция Firebase для синхронизации данных
// Добавьте этот скрипт в index.html перед script.js

// Конфигурация Firebase для вашего проекта
// ⚠️ ВАЖНО: databaseURL зависит от региона базы данных!

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAX9VuMmBADg8ZFrLuVlTl5T704VqVrff8",
    authDomain: "server-shkaful.firebaseapp.com",
    // ⚠️ ВАЖНО: Для europe-west1 используйте URL с регионом!
    databaseURL: "https://server-shkaful-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "server-shkaful",
    storageBucket: "server-shkaful.firebasestorage.app",
    messagingSenderId: "348321104642",
    appId: "1:348321104642:web:bcbb2f5ef879b4c192b81b",
    measurementId: "G-1QGT7G301S"
};

// Инициализация Firebase (добавьте в index.html перед закрывающим </body>)
/*
<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getDatabase, ref, set, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
    
    const app = initializeApp(FIREBASE_CONFIG);
    const database = getDatabase(app);
    
    window.firebaseDatabase = database;
    window.firebaseRef = ref;
    window.firebaseSet = set;
    window.firebaseOnValue = onValue;
    window.firebaseRemove = remove;
    window.firebaseUpdate = update;
    
    console.log('Firebase инициализирован');
</script>
*/

// Модифицируйте эти функции в script.js:

/*
// Глобальная переменная для предотвращения циклов синхронизации
let isSyncing = false;

// Модифицированная функция saveOrders()
function saveOrders() {
    // Исправляем дубликаты ID перед сохранением
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

// Новая функция для загрузки из Firebase
function loadOrdersFromFirebase() {
    if (!window.firebaseDatabase) {
        // Если Firebase не доступен, загружаем из localStorage
        console.log('Firebase не доступен, загружаем из localStorage');
        orders = JSON.parse(localStorage.getItem('orders')) || [];
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
            renderOrders();
            updateStatistics();
        }
    }, (error) => {
        console.error('Ошибка загрузки из Firebase:', error);
        // В случае ошибки загружаем из localStorage
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        renderOrders();
        updateStatistics();
    });
}

// Модифицируйте deleteOrder() - добавьте удаление из Firebase:
function deleteOrder(id, orderNumber = null) {
    // ... существующий код поиска заказа ...
    
    if (orderIndex !== -1) {
        const orderId = orders[orderIndex].id;
        orders.splice(orderIndex, 1);
        saveOrders();
        
        // Удаляем из Firebase
        if (window.firebaseDatabase) {
            const orderRef = window.firebaseRef(window.firebaseDatabase, `orders/${orderId}`);
            window.firebaseRemove(orderRef).catch(error => {
                console.error('Ошибка удаления из Firebase:', error);
            });
        }
        
        renderOrders();
        updateStatistics();
    }
}

// В DOMContentLoaded замените загрузку заказов:
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем аутентификацию
    if (!initAuth()) {
        return;
    }
    
    // Загружаем заказы из Firebase (или localStorage)
    loadOrdersFromFirebase();
    
    // Остальной код...
    updateCurrentDate();
    setDefaultDate();
    // renderOrders() и updateStatistics() вызываются в loadOrdersFromFirebase()
    
    // ... остальные обработчики событий ...
});
*/

