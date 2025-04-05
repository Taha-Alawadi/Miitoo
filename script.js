document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const STORAGE_KEY = 'miitoo_locations_v4';
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80';
    const credentials = {
        username: "miitooAdmin2025",
        password: "securePass@321"
    };

    // State variables
    let isAuthenticated = false;
    let locations = [];
    let locationToDelete = null;
    let currentView = 'card'; // Default view: card, table, map
    let isDarkMode = localStorage.getItem('miitoo_dark_mode') === 'true';
    let map = null;
    let markers = [];

    // DOM Elements
    const modal = document.getElementById('confirmationModal');
    const imageModal = document.getElementById('imageModal');
    const mapModal = document.getElementById('mapModal');
    const cardView = document.getElementById('cardView');
    const tableView = document.getElementById('tableView');
    const mapView = document.getElementById('mapView');
    const cardViewBtn = document.getElementById('cardViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const themeToggle = document.getElementById('themeToggle');
    const snowContainer = document.getElementById('snowContainer');

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
                    mapLink: 'https://maps.app.goo.gl/ZZqUdfhTcsYVR18YA',
                    image: DEFAULT_IMAGE,
                    rating: 4.5,
                    ratingCount: 28
                },
                {
                    name: 'إب هاري',
                    address: 'شارع الجامعة - بجانب مركز التسوق',
                    mapLink: 'https://maps.app.goo.gl/S4D37ZzMZuCXD4CN7',
                    image: 'https://images.unsplash.com/photo-1582560475093-ba66accbc7f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
                    rating: 4.2,
                    ratingCount: 15
                },
                {
                    name: 'سوبر ماركت الأمير',
                    address: 'حي النزهة - تقاطع شارع الأمير',
                    mapLink: 'https://maps.app.goo.gl/example3',
                    image: 'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
                    rating: 5,
                    ratingCount: 32
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
            clearMapMarkers();
        } else {
            document.getElementById('noResults').style.display = 'none';
            
            // Render card view
            renderCardView(filteredLocations);
            
            // Render table view
            renderTableView(filteredLocations);
            
            // Render map view if active
            if (currentView === 'map' && map) {
                renderMapMarkers(filteredLocations);
            }
        }
    }

    // Render card view
    function renderCardView(locations) {
        cardView.innerHTML = locations.map((location, index) => {
            // Generate star rating HTML
            const fullStars = Math.floor(location.rating);
            const hasHalfStar = location.rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fas fa-star star"></i>';
            }
            if (hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt star"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<i class="far fa-star star"></i>';
            }
            
            return `
                <div class="location-card" data-index="${index}">
                    <div class="card-image">
                        <img src="${location.image || DEFAULT_IMAGE}" alt="${location.name}" loading="lazy" onclick="showImageModal('${location.image || DEFAULT_IMAGE}', '${location.name}')">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${location.name}</h3>
                        <div class="card-rating">
                            <div class="stars">${starsHtml}</div>
                            <span class="rating-count">(${location.ratingCount || 0})</span>
                        </div>
                        <div class="card-address">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${location.address}</span>
                        </div>
                        <div class="card-actions">
                            <a class="map-link" href="${location.mapLink}" target="_blank" onclick="event.stopPropagation(); showMapModal('${location.mapLink}', '${location.name}')">
                                <i class="fas fa-map-marked-alt"></i> عرض الخريطة
                            </a>
                            <button class="remove" onclick="event.stopPropagation();">
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
            // Generate star rating HTML
            const fullStars = Math.floor(location.rating);
            const hasHalfStar = location.rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<i class="fas fa-star star"></i>';
            }
            if (hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt star"></i>';
            }
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<i class="far fa-star star"></i>';
            }
            
            return `
                <tr data-index="${index}">
                    <td>${location.name}</td>
                    <td>${location.address}</td>
                    <td>
                        <div class="stars">${starsHtml}</div>
                    </td>
                    <td><a class="map-link" href="${location.mapLink}" target="_blank" onclick="event.preventDefault(); showMapModal('${location.mapLink}', '${location.name}')"><i class="fas fa-external-link-alt"></i> عرض الخريطة</a></td>
                    <td><button class="remove"><i class="fas fa-trash-alt"></i> حذف</button></td>
                </tr>
            `;
        }).join('');

        // Show/hide delete buttons based on authentication
        document.querySelectorAll('.remove').forEach(btn => {
            btn.style.display = isAuthenticated ? 'inline-flex' : 'none';
        });
    }

    // Initialize Google Map
    window.initMap = function() {
        if (document.getElementById('mapContainer')) {
            map = new google.maps.Map(document.getElementById('mapContainer'), {
                center: { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh
                zoom: 10
            });
            
            if (currentView === 'map') {
                renderMapMarkers(filterLocations());
            }
        }
    };

    // Render map markers
    function renderMapMarkers(locations) {
        // Clear existing markers
        clearMapMarkers();
        
        // Add markers for each location
        locations.forEach((location, index) => {
            // Extract coordinates from Google Maps link or use default
            let lat = 24.7136 + (Math.random() * 0.1 - 0.05);
            let lng = 46.6753 + (Math.random() * 0.1 - 0.05);
            
            // Try to extract coordinates from map link
            const mapLinkMatch = location.mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (mapLinkMatch && mapLinkMatch.length >= 3) {
                lat = parseFloat(mapLinkMatch[1]);
                lng = parseFloat(mapLinkMatch[2]);
            }
            
            const marker = new google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: location.name,
                animation: google.maps.Animation.DROP
            });
            
            // Create info window
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="text-align: right; direction: rtl; padding: 10px; max-width: 300px;">
                        <h3 style="margin-top: 0; color: #0077b6;">${location.name}</h3>
                        <p style="margin: 5px 0;"><strong>العنوان:</strong> ${location.address}</p>
                        <p style="margin: 5px 0;"><strong>التقييم:</strong> ${location.rating} (${location.ratingCount || 0} تقييم)</p>
                        <a href="${location.mapLink}" target="_blank" style="color: #0077b6; text-decoration: none; display: block; margin-top: 10px;">فتح في خرائط جوجل</a>
                    </div>
                `
            });
            
            // Add click event to marker
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
            markers.push(marker);
        });
        
        // Fit map to markers if there are any
        if (markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => bounds.extend(marker.getPosition()));
            map.fitBounds(bounds);
            
            // Don't zoom in too far
            const listener = google.maps.event.addListener(map, 'idle', function() {
                if (map.getZoom() > 16) map.setZoom(16);
                google.maps.event.removeListener(listener);
            });
        }
    }

    // Clear map markers
    function clearMapMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
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

    // Show image modal
    window.showImageModal = function(imageSrc, title) {
        document.getElementById('modalImage').src = imageSrc;
        document.getElementById('modalImage').alt = title;
        imageModal.style.display = 'flex';
    };

    // Show map modal
    window.showMapModal = function(mapLink, title) {
        document.getElementById('mapModalTitle').textContent = title;
        
        // Extract Google Maps embed URL
        let embedUrl = mapLink;
        if (mapLink.includes('maps.app.goo.gl') || mapLink.includes('goo.gl')) {
            // For short URLs, we need to use them directly
            embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(title)}&t=m&z=15&output=embed&iwloc=near`;
        } else if (mapLink.includes('google.com/maps')) {
            // Convert regular URL to embed URL
            embedUrl = mapLink.replace(/^https?:\/\/www\.google\.com\/maps\/(place\/|@)/, 'https://maps.google.com/maps?q=');
            embedUrl = embedUrl.split('&')[0] + '&output=embed';
        }
        
        // Create iframe
        document.getElementById('modalMapContainer').innerHTML = `
            <iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
        `;
        
        mapModal.style.display = 'flex';
    };

    // View toggle buttons
    cardViewBtn.addEventListener('click', () => {
        setCurrentView('card');
    });

    tableViewBtn.addEventListener('click', () => {
        setCurrentView('table');
    });

    mapViewBtn.addEventListener('click', () => {
        setCurrentView('map');
        
        // Initialize map if not already done
        if (!map && window.google && window.google.maps) {
            initMap();
        }
    });

    // Set current view
    function setCurrentView(view) {
        currentView = view;
        
        // Update active button
        cardViewBtn.classList.toggle('active', view === 'card');
        tableViewBtn.classList.toggle('active', view === 'table');
        mapViewBtn.classList.toggle('active', view === 'map');
        
        // Show/hide views
        cardView.style.display = view === 'card' ? 'grid' : 'none';
        tableView.style.display = view === 'table' ? 'block' : 'none';
        mapView.style.display = view === 'map' ? 'block' : 'none';
        
        // Render map markers if map view is active
        if (view === 'map' && map) {
            renderMapMarkers(filterLocations());
        }
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

    // Table and card click event for delete buttons
    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove') && !e.target.parentElement.classList.contains('remove')) return;
        if (!isAuthenticated) return;
        
        const button = e.target.classList.contains('remove') ? e.target : e.target.parentElement;
        const container = button.closest('[data-index]');
        locationToDelete = parseInt(container.dataset.index);
        
        // Show confirmation modal
        modal.style.display = 'flex';
    });

    // Modal events
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            imageModal.style.display = 'none';
            mapModal.style.display = 'none';
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

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
        if (e.target === mapModal) {
            mapModal.style.display = 'none';
        }
    });

    // Clear search button
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        renderLocations();
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
        const imageUrl = document.getElementById('imageUrl').value.trim();
        const rating = parseFloat(document.getElementById('ratingValue').value);

        if (!storeName || !address || !mapLink) {
            showNotification('يرجى ملء جميع الحقول المطلوبة!', 'error');
            return;
        }

        // Validate map link
        if (!mapLink.startsWith('http')) {
            showNotification('يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://', 'error');
            return;
        }

        locations.push({ 
            name: storeName, 
            address, 
            mapLink, 
            image: imageUrl || DEFAULT_IMAGE,
            rating: rating || 5,
            ratingCount: Math.floor(Math.random() * 30) + 5 // Random rating count for demo
        });
        
        saveLocations();
        renderLocations();
        e.target.reset();
        
        // Reset rating stars
        document.querySelectorAll('.stars-input i').forEach(star => {
            star.classList.add('active');
        });
        document.getElementById('ratingValue').value = 5;
        
        showNotification('تمت إضافة الموقع بنجاح!', 'success');
    });

    // Rating stars input
    document.querySelectorAll('.stars-input i').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            document.getElementById('ratingValue').value = rating;
            
            // Update stars visual
            document.querySelectorAll('.stars-input i').forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
            });
        });
        
        // Hover effect
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            document.querySelectorAll('.stars-input i').forEach(s => {
                s.classList.toggle('hover', parseInt(s.dataset.rating) <= rating);
            });
        });
        
        star.addEventListener('mouseleave', () => {
            document.querySelectorAll('.stars-input i').forEach(s => {
                s.classList.remove('hover');
            });
        });
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

    // Add CSS for rating stars input
    const ratingStyles = `
        .rating-input {
            display: flex;
            align-items: center;
            margin-top: 10px;
        }
        
        .stars-input {
            display: flex;
            flex-direction: row-reverse;
            justify-content: flex-end;
        }
        
        .stars-input i {
            color: #ccc;
            font-size: 24px;
            margin-left: 5px;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .stars-input i.active,
        .stars-input i.hover {
            color: #ffd700;
        }
        
        .dark-mode .stars-input i {
            color: #4a6278;
        }
        
        .dark-mode .stars-input i.active,
        .dark-mode .stars-input i.hover {
            color: #ffd700;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = ratingStyles;
    document.head.appendChild(styleElement);

    // Initialize
    loadLocations();
});
