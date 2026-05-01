// Supabase Configuration
const supabaseUrl = 'https://awotfselbqtovxwxoxeu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3b3Rmc2VsYnF0b3Z4d3hveGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQ3NjksImV4cCI6MjA5MzA0MDc2OX0.PDxtXswBrwbTGSg1uQgd86PyqKYRDsM-jL8Zf-_ga7w';

if (!window.supabase) {
    console.error("Supabase library failed to load!");
}

// Rename to supabaseClient to avoid collision with window.supabase
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
console.log("Supabase Client initialized.");

const App = {
    init: async function() {
        // Initialize Auth listener and check initial state
        this.checkAuthStatus();
        
        // If page requires auth, handle it
        if (document.body.hasAttribute('data-require-auth')) {
            await this.requireAuth();
        }

        // Start Global Clock
        this.startClock();
    },

    // Require user to be logged in to access page
    requireAuth: async function() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (!session) {
                window.location.replace('login.html');
                return null;
            }
            return session.user;
        } catch (e) {
            console.error("Auth check failed:", e);
            window.location.replace('login.html');
            return null;
        }
    },

    // UI Updates based on Supabase auth status
    checkAuthStatus: async function() {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        // 1. Optimistic UI Check (from Cache)
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
            try {
                const profile = JSON.parse(cachedProfile);
                this.renderUserMenu(profile, { id: profile.id }); // Mock user object for rendering
            } catch (e) {
                localStorage.removeItem('user_profile');
            }
        }

        // 2. Initial Check (Network)
        const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
        this.updateUserMenu(initialSession ? initialSession.user : null);

        // 3. Listen for state changes (Future)
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('user_profile');
            }
            this.updateUserMenu(session ? session.user : null);
        });
    },

    updateUserMenu: async function(user) {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        if (user) {
            try {
                const { data: profile, error } = await supabaseClient
                    .from('profiles')
                    .select('id, role, full_name')
                    .eq('id', user.id)
                    .single();

                if (profile && !error) {
                    localStorage.setItem('user_profile', JSON.stringify(profile));
                    this.renderUserMenu(profile, user);
                } else {
                    this.renderUserMenu(null, user);
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
                this.renderUserMenu(null, user);
            }
        } else {
            localStorage.removeItem('user_profile');
            navRight.innerHTML = `
                <a href="login.html" class="btn btn-outline-light me-2">Login</a>
                <a href="register.html" class="btn btn-warning fw-bold text-dark">Register</a>
            `;
            navRight.style.opacity = "1"; // Ensure visible if logged out
        }
    },

    renderUserMenu: function(profile, user) {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        const role = profile ? profile.role : 'resident';
        const name = profile ? (profile.full_name || user.email) : user.email;

        if (role === 'admin') {
            navRight.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="dropdown me-3">
                        <button class="btn btn-link text-white position-relative p-0" type="button" data-bs-toggle="dropdown" id="notifBtn">
                            <i class="fa-regular fa-bell fs-5"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-primary" id="notifBadge" style="display:none; font-size: 10px; padding: 4px 6px;">0</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-0 rounded-4 overflow-hidden" id="notifDropdown" style="width: 320px;">
                            <li class="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 fw-bold text-dark">System Alerts</h6>
                                <span class="badge bg-primary-soft text-primary rounded-pill small">Admin</span>
                            </li>
                            <div id="notifList" style="max-height: 350px; overflow-y: auto;">
                                <li class="p-4 text-center text-muted small">Loading alerts...</li>
                            </div>
                        </ul>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-warning fw-bold dropdown-toggle rounded-pill px-3 shadow-sm" type="button" data-bs-toggle="dropdown">
                            <i class="fa-solid fa-user-shield me-1"></i> Admin ${name ? name.split(' ')[0] : ''}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2">
                            <li><a class="dropdown-item py-2" href="dashboard.html"><i class="fa-solid fa-chart-line me-2 text-muted"></i>Dashboard</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" onclick="App.logout()"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i>Logout</a></li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            navRight.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="dropdown me-3">
                        <button class="btn btn-link text-white position-relative p-0" type="button" data-bs-toggle="dropdown" id="notifBtn">
                            <i class="fa-regular fa-bell fs-5"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-primary" id="notifBadge" style="display:none; font-size: 10px; padding: 4px 6px;">0</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-0 rounded-4 overflow-hidden" id="notifDropdown" style="width: 320px;">
                            <li class="p-3 border-bottom bg-light">
                                <h6 class="mb-0 fw-bold text-dark">My Notifications</h6>
                            </li>
                            <div id="notifList" style="max-height: 350px; overflow-y: auto;">
                                <li class="p-4 text-center text-muted small">Loading notifications...</li>
                            </div>
                        </ul>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-light rounded-pill px-3 dropdown-toggle text-primary fw-bold" type="button" data-bs-toggle="dropdown">
                            <i class="fa-solid fa-circle-user me-1"></i> ${name ? name.split(' ')[0] : 'Resident'}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2">
                            <li><a class="dropdown-item py-2" href="resident-dashboard.html"><i class="fa-solid fa-id-card me-2 text-muted"></i>My Profile</a></li>
                            <li><a class="dropdown-item py-2" href="services.html"><i class="fa-solid fa-file-invoice me-2 text-muted"></i>Request Service</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" onclick="App.logout()"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i>Logout</a></li>
                        </ul>
                    </div>
                </div>
            `;
        }
        navRight.style.opacity = "1";
        this.initNotifications(user.id, role);
    },

    initNotifications: async function(userId, role) {
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        if (!badge || !list) return;

        const lastRead = parseInt(localStorage.getItem(`notif_read_${userId}`)) || 0;

        try {
            let allNotifs = [];

            if (role === 'admin') {
                // Admin sees global Pending items
                const { data: reqs } = await supabaseClient.from('requests').select('*').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5);
                const { data: comps } = await supabaseClient.from('complaints').select('*').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5);

                (reqs || []).forEach(r => {
                    allNotifs.push({
                        title: 'New Document Request',
                        text: `${r.user_name} requested ${r.type}`,
                        time: new Date(r.created_at),
                        timestamp: new Date(r.created_at).getTime(),
                        icon: 'fa-file-invoice',
                        color: 'text-primary',
                        link: 'dashboard.html'
                    });
                });

                (comps || []).forEach(c => {
                    allNotifs.push({
                        title: 'New Incident Report',
                        text: `${c.user_name} reported ${c.category}`,
                        time: new Date(c.created_at),
                        timestamp: new Date(c.created_at).getTime(),
                        icon: 'fa-triangle-exclamation',
                        color: 'text-danger',
                        link: 'dashboard.html'
                    });
                });
            } else {
                // Resident sees status updates
                const { data: reqs } = await supabaseClient.from('requests').select('*').eq('user_id', userId).neq('status', 'Pending').order('created_at', { ascending: false }).limit(5);
                const { data: comps } = await supabaseClient.from('complaints').select('*').eq('user_id', userId).neq('status', 'Pending').order('created_at', { ascending: false }).limit(5);

                (reqs || []).forEach(r => {
                    allNotifs.push({
                        title: 'Document Update',
                        text: `Your ${r.type} is now <strong>${r.status}</strong>`,
                        time: new Date(r.updated_at || r.created_at),
                        timestamp: new Date(r.updated_at || r.created_at).getTime(),
                        icon: 'fa-file-invoice',
                        color: 'text-success',
                        link: 'resident-dashboard.html'
                    });
                });

                (comps || []).forEach(c => {
                    allNotifs.push({
                        title: 'Report Update',
                        text: `Your ${c.category} is <strong>${c.status}</strong>`,
                        time: new Date(c.updated_at || c.created_at),
                        timestamp: new Date(c.updated_at || c.created_at).getTime(),
                        icon: 'fa-circle-check',
                        color: 'text-info',
                        link: 'resident-dashboard.html'
                    });
                });
            }

            allNotifs.sort((a, b) => b.timestamp - a.timestamp);
            const displayNotifs = allNotifs.slice(0, 8);

            const unreadCount = displayNotifs.filter(n => n.timestamp > lastRead).length;
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }

            if (displayNotifs.length > 0) {
                list.innerHTML = displayNotifs.map(n => `
                    <li class="p-0 border-bottom ${n.timestamp > lastRead ? 'bg-light bg-opacity-50' : ''}">
                        <a href="${n.link}" class="dropdown-item p-3 d-flex align-items-start text-wrap">
                            <div class="bg-white border rounded-circle p-2 me-3 shadow-sm" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid ${n.icon} ${n.color}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <p class="mb-0 fw-bold small text-dark">${n.title}</p>
                                    ${n.timestamp > lastRead ? '<span class="badge bg-primary" style="font-size: 8px;">NEW</span>' : ''}
                                </div>
                                <p class="mb-0 text-muted extra-small" style="font-size: 12px;">${n.text}</p>
                                <p class="mb-0 text-primary mt-1" style="font-size: 10px; opacity: 0.8;">${this.formatTime(n.time)}</p>
                            </div>
                        </a>
                    </li>
                `).join('');
                
                // Mark as read when dropdown opened
                document.getElementById('notifBtn').addEventListener('show.bs.dropdown', () => {
                    localStorage.setItem(`notif_read_${userId}`, displayNotifs[0].timestamp);
                    badge.style.display = 'none';
                });
            } else {
                list.innerHTML = '<li class="p-5 text-center text-muted"><i class="fa-solid fa-bell-slash fs-2 mb-2 opacity-25"></i><p class="small mb-0">No notifications yet</p></li>';
            }

        } catch (err) {
            console.error("Notification init error:", err);
        }
    },

    formatTime: function(date) {
        const now = new Date();
        const diff = (now - date) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    logout: async function() {
        localStorage.removeItem('user_profile');
        await supabaseClient.auth.signOut();
        window.location.replace('index.html');
    },

    startClock: function() {
        // Find navbar container or brand
        const brand = document.querySelector('.navbar-brand');
        if (!brand) return;

        // Check if clock already exists
        if (document.getElementById('navClock')) return;

        // Create Clock Element
        const clockSpan = document.createElement('div');
        clockSpan.id = 'navClock';
        clockSpan.className = 'ms-3 d-none d-md-flex flex-column justify-content-center border-start ps-3 border-white border-opacity-25';
        clockSpan.style.fontSize = '11px';
        clockSpan.style.lineHeight = '1.2';
        clockSpan.style.color = 'rgba(255,255,255,0.8)';
        
        brand.parentElement.insertBefore(clockSpan, brand.nextSibling);

        const updateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', options);
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            clockSpan.innerHTML = `
                <div class="fw-bold text-white" style="letter-spacing: 0.5px;">${timeStr}</div>
                <div style="opacity: 0.7;">${dateStr}</div>
            `;
        };

        updateTime();
        setInterval(updateTime, 1000);
    },

    // Helper for generating random Tracking ID
    generateTrackingId: function(prefix) {
        return prefix + '-' + Math.floor(100000 + Math.random() * 900000);
    }
};

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
