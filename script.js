// Constants
const STORAGE_KEY = 'miitoo_locations_v4';
const credentials = {
    username: "miitooAdmin2025",
    password: "securePass@321"
};

// State variables
let isAuthenticated = false;
let locations = [];
let locationToDelete = null;
let currentView = 'card'; // Default view: card, table
let isDarkMode = localStorage.getItem('miitoo_dark_mode') === 'true';

// DOM Elements
const modal = document.getElementById('confirmationModal');
const cardView = document.getElementById('cardView');
const tableView = document.getElementById('tableView');
const cardViewBtn = document.getElementById('cardViewBtn');
const tableViewBtn = document.getElementById('tableViewBtn');
const themeToggle = document.getElementById('themeToggle');
const snowContainer = document.getElementById('snowContainer');

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark mode if saved
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Initialize snow effect
    initSnowEffect();

    // Load locations from localStorage
    loadLocations();

    // Set up search functionality
    document.getElementById('searchInput').addEventListener('input', renderLocations);
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        renderLocations();
    });

    // Set up form submission
    document.getElementById('accessForm').addEventListener('submit', handleFormSubmit);
});

// Load locations from localStorage
function loadLocations() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        locations = JSON.parse(savedData);
        
        // إزالة حقول الصور والتقييمات من البيانات المخزنة
        locations = locations.map(location => {
            const { image, rating, ratingCount, ...rest } = location;
            return rest;
        });
        
        saveLocations();
    } else {
        // Default locations if none exist
        locations = [
            {
                name: 'هاي كلاس',
                address: 'الحي الراقي - شارع الملك فهد',
                mapLink: 'https://maps.app.goo.gl/ZZqUdfhTcsYVR18YA'
            },
            {
                name: 'إب هاري',
                address: 'شارع الجامعة - بجانب مركز التسوق',
                mapLink: 'https://maps.app.goo.gl/S4D37ZzMZuCXD4CN7'
            },
            {
                name: 'سوبر ماركت الأمير',
                address: 'حي النزهة - تقاطع شارع الأمير',
                mapLink: 'https://maps.app.goo.gl/example3'
            }
        ];
        saveLocations();
    }
    renderLocations();
}

// Save locations to localStorage
function saveLocations() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

// Render locations based on current view
function renderLocations() {
    const filteredLocations = filterLocations();
    
    if (filteredLocations.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        cardView.innerHTML = '';
        document.querySelector('#locationsTable tbody').innerHTML = '';
    } else {
        document.getElementById('noResults').style.display = 'none';
        
        // Render card view
        renderCardView(filteredLocations);
        
        // Render table view
        renderTableView(filteredLocations);
    }
}

// Render card view
function renderCardView(locations) {
    cardView.innerHTML = locations.map((location, index) => {
        return `
            <div class="location-card" data-index="${index}">
                <div class="card-content">
                    <h3 class="card-title">${location.name}</h3>
                    <div class="card-address">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.address}</span>
                    </div>
                    <div class="card-actions">
                        <a class="map-link" href="${location.mapLink}" target="_blank">
                            <i class="fas fa-map-marked-alt"></i> عرض الخريطة
                        </a>
                        <button class="remove" onclick="handleDelete(${index})">
                            <i class="fas fa-trash-alt"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Show/hide delete buttons based on authentication
    document.querySelectorAll('.remove').forEach(btn => {
        btn.style.display = isAuthenticated ? 'inline-flex' : 'none';
    });

    // Add 3D tilt effect to cards
    addTiltEffectToCards();
}

// Render table view
function renderTableView(locations) {
    const tbody = document.querySelector('#locationsTable tbody');
    tbody.innerHTML = locations.map((location, index) => {
        return `
            <tr data-index="${index}">
                <td>${location.name}</td>
                <td>${location.address}</td>
                <td><a class="map-link" href="${location.mapLink}" target="_blank"><i class="fas fa-external-link-alt"></i> عرض الخريطة</a></td>
                <td><button class="remove" onclick="handleDelete(${index})"><i class="fas fa-trash-alt"></i> حذف</button></td>
            </tr>
        `;
    }).join('');

    // Show/hide delete buttons based on authentication
    document.querySelectorAll('.remove').forEach(btn => {
        btn.style.display = isAuthenticated ? 'inline-flex' : 'none';
    });
}

// Add 3D tilt effect to cards
function addTiltEffectToCards() {
    document.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('mousemove', handleTilt);
        card.addEventListener('mouseleave', resetTilt);
    });
}

// Handle tilt effect
function handleTilt(e) {
    const card = this;
    const cardRect = card.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const mouseX = e.clientX - cardCenterX;
    const mouseY = e.clientY - cardCenterY;
    
    // Calculate rotation based on mouse position
    const rotateY = (mouseX / (cardRect.width / 2)) * 5; // Max 5 degrees
    const rotateX = -(mouseY / (cardRect.height / 2)) * 5; // Max 5 degrees
    
    // Apply transform
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
}

// Reset tilt effect
function resetTilt() {
    this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
}

// Initialize snow effect
function initSnowEffect() {
    // Create snowflakes
    for (let i = 0; i < 50; i++) {
        createSnowflake();
    }
    
    // Create new snowflakes periodically
    setInterval(() => {
        if (snowContainer.children.length < 50) {
            createSnowflake();
        }
    }, 500);
}

// Create a single snowflake
function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄';
    snowflake.style.left = Math.random() * 100 + 'vw';
    snowflake.style.opacity = Math.random();
    snowflake.style.fontSize = (Math.random() * 10 + 5) + 'px';
    
    // Set animation duration and delay
    const animationDuration = Math.random() * 5 + 5;
    snowflake.style.animationDuration = animationDuration + 's';
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    
    // Add to container
    snowContainer.appendChild(snowflake);
    
    // Remove after animation completes
    setTimeout(() => {
        snowflake.remove();
    }, (animationDuration + 5) * 1000);
}

// View toggle buttons
cardViewBtn.addEventListener('click', () => {
    setCurrentView('card');
});

tableViewBtn.addEventListener('click', () => {
    setCurrentView('table');
});

// Set current view
function setCurrentView(view) {
    currentView = view;
    
    // Update active button
    cardViewBtn.classList.toggle('active', view === 'card');
    tableViewBtn.classList.toggle('active', view === 'table');
    
    // Show/hide views
    cardView.style.display = view === 'card' ? 'grid' : 'none';
    tableView.style.display = view === 'table' ? 'block' : 'none';
}

// Theme toggle
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('miitoo_dark_mode', isDarkMode);
});

// Admin login button event
document.getElementById('adminLoginBtn').addEventListener('click', () => {
    if (isAuthenticated) {
        // If already logged in, log out
        isAuthenticated = false;
        document.getElementById('managementSection').style.display = 'none';
        document.getElementById('adminLoginBtn').innerHTML = '<i class="fas fa-lock"></i><span>الدخول إلى لوحة التحكم</span>';
        renderLocations();
        showNotification('تم تسجيل الخروج بنجاح', 'info');
    } else {
        // Login process
        const user = prompt("اسم المستخدم:");
        if (user === null) return; // User canceled
        
        const pass = prompt("كلمة المرور:");
        if (pass === null) return; // User canceled
        
        if (user === credentials.username && pass === credentials.password) {
            isAuthenticated = true;
            document.getElementById('managementSection').style.display = 'block';
            document.getElementById('adminLoginBtn').innerHTML = '<i class="fas fa-unlock"></i><span>تسجيل الخروج</span>';
            renderLocations();
            showNotification('مرحبا بك في لوحة التحكم!', 'success');
        } else {
            showNotification('بيانات الدخول غير صحيحة!', 'error');
        }
    }
});

// Handle delete function (global function to be called from both views)
function handleDelete(index) {
    if (!isAuthenticated) return;
    locationToDelete = index;
    modal.style.display = 'flex';
}

// Modal events
document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    modal.style.display = 'none';
});

document.getElementById('confirmDelete').addEventListener('click', () => {
    if (locationToDelete !== null) {
        locations.splice(locationToDelete, 1);
        saveLocations();
        renderLocations();
        modal.style.display = 'none';
        showNotification('تم حذف الموقع بنجاح!', 'success');
        locationToDelete = null;
    }
});

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) return;
    
    const name = document.getElementById('storeName').value.trim();
    const address = document.getElementById('address').value.trim();
    const mapLink = document.getElementById('mapLink').value.trim();
    
    if (!name || !address || !mapLink) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // Add new location
    locations.push({
        name,
        address,
        mapLink
    });
    
    // Save and render
    saveLocations();
    renderLocations();
    
    // Reset form
    e.target.reset();
    
    showNotification('تمت إضافة الموقع بنجاح!', 'success');
}

// Filter locations based on search input
function filterLocations() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!searchTerm) return locations;
    
    return locations.filter(location => 
        location.name.toLowerCase().includes(searchTerm) || 
        location.address.toLowerCase().includes(searchTerm)
    );
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 3000);
}

// Close notification when clicked
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('notification')) {
        e.target.style.opacity = '0';
        setTimeout(() => {
            e.target.style.display = 'none';
        }, 500);
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Handle keyboard events
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        modal.style.display = 'none';
    }
});
