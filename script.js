document.addEventListener('DOMContentLoaded', function() {
    const STORAGE_KEY = 'miitoo_locations_v3';
    const credentials = {
        username: "miitooAdmin2025",
        password: "securePass@321"
    };

    let isAuthenticated = false;
    let locations = [];
    let locationToDelete = null;
    const modal = document.getElementById('confirmationModal');

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Load locations from localStorage
    function loadLocations() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            locations = JSON.parse(savedData);
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

    // Render locations table
    function renderLocations() {
        const tbody = document.querySelector('#locationsTable tbody');
        const filteredLocations = filterLocations();
        
        if (filteredLocations.length === 0) {
            tbody.innerHTML = '';
            document.getElementById('noResults').style.display = 'block';
        } else {
            document.getElementById('noResults').style.display = 'none';
            tbody.innerHTML = filteredLocations.map((location, index) => `
                <tr data-index="${locations.indexOf(location)}">
                    <td>${location.name}</td>
                    <td>${location.address}</td>
                    <td><a class="map-link" href="${location.mapLink}" target="_blank"><i class="fas fa-external-link-alt"></i> عرض الخريطة</a></td>
                    <td><button class="remove"><i class="fas fa-trash-alt"></i> حذف</button></td>
                </tr>
            `).join('');
        }

        // Show/hide delete buttons based on authentication
        document.querySelectorAll('.remove').forEach(btn => {
            btn.style.display = isAuthenticated ? 'inline-flex' : 'none';
        });
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

    // Table click event for delete buttons
    document.querySelector('#locationsTable').addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove') && !e.target.parentElement.classList.contains('remove')) return;
        if (!isAuthenticated) return;
        
        const button = e.target.classList.contains('remove') ? e.target : e.target.parentElement;
        const row = button.closest('tr');
        locationToDelete = parseInt(row.dataset.index);
        
        // Show confirmation modal
        modal.style.display = 'flex';
    });

    // Modal events
    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
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

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Form submission for adding new location
    document.getElementById('accessForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            showNotification('يجب تسجيل الدخول أولاً!', 'error');
            return;
        }

        const storeName = document.getElementById('storeName').value.trim();
        const address = document.getElementById('address').value.trim();
        const mapLink = document.getElementById('mapLink').value.trim();

        if (!storeName || !address || !mapLink) {
            showNotification('يرجى ملء جميع الحقول!', 'error');
            return;
        }

        // Validate map link
        if (!mapLink.startsWith('http')) {
            showNotification('يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://', 'error');
            return;
        }

        locations.push({ name: storeName, address, mapLink });
        saveLocations();
        renderLocations();
        e.target.reset();
        showNotification('تمت إضافة الموقع بنجاح!', 'success');
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', renderLocations);

    // Notification function
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Add notification styles dynamically
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background-color: white;
            color: #333;
            padding: 15px 25px;
            border-radius: 50px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            z-index: 1000;
            transition: transform 0.3s ease;
            font-family: 'Tajawal', sans-serif;
        }
        
        .notification.show {
            transform: translateX(-50%) translateY(0);
        }
        
        .notification i {
            margin-left: 10px;
            font-size: 20px;
        }
        
        .notification.success {
            background-color: #4caf50;
            color: white;
        }
        
        .notification.error {
            background-color: #f44336;
            color: white;
        }
        
        .notification.info {
            background-color: #2196f3;
            color: white;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = notificationStyles;
    document.head.appendChild(styleElement);

    // Initialize
    loadLocations();
});
