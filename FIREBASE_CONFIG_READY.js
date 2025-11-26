// ✅ ГОТОВАЯ КОНФИГУРАЦИЯ FIREBASE ДЛЯ ВАШЕГО ПРОЕКТА
// Скопируйте этот код в ваш index.html перед закрывающим тегом </body>

// Добавьте в index.html перед </body>:
/*
<script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getDatabase, ref, set, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
    
    // Конфигурация Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAX9VuMmBADg8ZFrLuVlTl5T704VqVrff8",
        authDomain: "server-shkaful.firebaseapp.com",
        // ⚠️ ВАЖНО: URL с регионом europe-west1
        databaseURL: "https://server-shkaful-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "server-shkaful",
        storageBucket: "server-shkaful.firebasestorage.app",
        messagingSenderId: "348321104642",
        appId: "1:348321104642:web:bcbb2f5ef879b4c192b81b",
        measurementId: "G-1QGT7G301S"
    };
    
    // Инициализация Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    
    // Экспортируем функции в глобальную область видимости
    window.firebaseDatabase = database;
    window.firebaseRef = ref;
    window.firebaseSet = set;
    window.firebaseOnValue = onValue;
    window.firebaseRemove = remove;
    window.firebaseUpdate = update;
    
    console.log('✅ Firebase инициализирован с databaseURL:', firebaseConfig.databaseURL);
</script>
*/

// ⚠️ ВАЖНО: 
// - databaseURL должен быть с регионом: europe-west1.firebasedatabase.app
// - НЕ используйте старый формат: firebaseio.com (он не работает для региональных баз данных)

