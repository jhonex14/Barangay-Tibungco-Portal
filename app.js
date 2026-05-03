// Supabase Configuration
const supabaseUrl = 'https://awotfselbqtovxwxoxeu.supabase.co';
const supabaseKey = 'sb_publishable_KME3YN1GzA5cQaqwNGsKzg_WSs_1qIo';

if (!window.supabase) {
    console.error("Supabase library failed to load!");
}

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
console.log("Supabase Client initialized.");

// Safety tool to prevent XSS attacks like the <img src=x> one you saw
const escapeHtml = (unsafe) => {
    return String(unsafe ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const App = {
    init: async function() {
        this.checkAuthStatus();
        this.startClock();

        if (document.body.hasAttribute('data-require-auth')) {
            await this.requireAuth();
        }
    },

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

    checkAuthStatus: async function() {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        // 1. Optimistic UI Check
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
            try {
                const profile = JSON.parse(cachedProfile);
                this.renderUserMenu(profile, { id: profile.id });
            } catch (e) {
                localStorage.removeItem('user_profile');
            }
        }

        // 2. Network Check (Forces a refresh of your role)
        const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
        this.updateUserMenu(initialSession ? initialSession.user : null);

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
                    .select('id, role, full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile && !error) {
                    console.log("Database Role Verified:", profile.role); // Useful for debugging
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
            navRight.style.opacity = "1";
        }
    },

    renderUserMenu: function(profile, user) {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        const role = profile ? profile.role : 'resident';
        const displayName = profile ? (profile.full_name || user.email) : user.email;
        const safeDisplayName = escapeHtml(displayName);
        const safeFirstName = escapeHtml((displayName || '').split(' ')[0] || '');
        const avatarUrl = profile?.avatar_url;
        const adminAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFirstName || 'A')}&background=ffc107&color=fff&size=32`;
        const residentAvatar = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(safeFirstName || 'R')}&background=0f4c81&color=fff&size=32`;

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
                        <button class="btn btn-warning fw-bold dropdown-toggle rounded-pill px-3 shadow-sm d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                            <img src="${adminAvatar}" alt="avatar" width="24" height="24" class="rounded-circle me-1" style="object-fit:cover;"> ${safeFirstName}
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
                        <button class="btn btn-light rounded-pill px-3 dropdown-toggle text-primary fw-bold d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                            <img src="${residentAvatar}" alt="avatar" width="24" height="24" class="rounded-circle me-1" style="object-fit:cover;"> ${safeFirstName || 'Resident'}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2">
                            <li><a class="dropdown-item py-2" href="resident-dashboard.html"><i class="fa-solid fa-id-card me-2 text-muted"></i>My Profile</a></li>
                            <li><a class="dropdown-item py-2" href="services.html"><i class="fa-solid fa-file-invoice me-2 text-muted"></i>Request Service</a></li>
                            <li><a class="dropdown-item py-2" href="#" onclick="App.openSettingsModal()"><i class="fa-solid fa-gear me-2 text-muted"></i>Settings</a></li>
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

    // Notification Sound System (Web Audio API - no files needed)
    playNotificationSound: function(type) {
        // Check if sound is enabled
        const isAdmin = window.location.pathname.includes('dashboard.html') && !window.location.pathname.includes('resident');
        const prefsKey = isAdmin ? 'admin_prefs' : 'user_prefs';
        const prefs = JSON.parse(localStorage.getItem(prefsKey) || '{}');
        if (prefs.sound === false) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();

            if (type === 'admin') {
                // Admin: authoritative two-tone chime (lower pitch)
                const playTone = (freq, start, dur) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, ctx.currentTime + start);
                    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + dur);
                };
                playTone(587.33, 0, 0.2);    // D5
                playTone(880, 0.15, 0.3);     // A5
                playTone(1174.66, 0.3, 0.4);  // D6
            } else {
                // Resident: gentle soft bell
                const playTone = (freq, start, dur) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, ctx.currentTime + start);
                    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + dur);
                };
                playTone(784, 0, 0.25);     // G5
                playTone(1046.5, 0.2, 0.35); // C6
            }

            // Clean up context after sounds finish
            setTimeout(() => ctx.close(), 2000);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    initNotifications: async function(userId, role) {
        const badge = document.getElementById('notifBadge');
        const list = document.getElementById('notifList');
        if (!badge || !list) return;

        const lastRead = parseInt(localStorage.getItem(`notif_read_${userId}`)) || 0;

        try {
            let allNotifs = [];

            if (role === 'admin') {
                const { data: reqs } = await supabaseClient.from('requests').select('*').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5);
                const { data: comps } = await supabaseClient.from('complaints').select('*').eq('status', 'Pending').order('created_at', { ascending: false }).limit(5);

                (reqs || []).forEach(r => {
                    allNotifs.push({
                        title: 'New Document Request',
                        text: `${escapeHtml(r.user_name)} requested ${escapeHtml(r.type)}`,
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
                        text: `${escapeHtml(c.user_name)} reported ${escapeHtml(c.category)}`,
                        time: new Date(c.created_at),
                        timestamp: new Date(c.created_at).getTime(),
                        icon: 'fa-triangle-exclamation',
                        color: 'text-danger',
                        link: 'dashboard.html'
                    });
                });
            } else {
                const { data: reqs } = await supabaseClient.from('requests').select('*').eq('user_id', userId).neq('status', 'Pending').order('created_at', { ascending: false }).limit(5);
                const { data: comps } = await supabaseClient.from('complaints').select('*').eq('user_id', userId).neq('status', 'Pending').order('created_at', { ascending: false }).limit(5);

                (reqs || []).forEach(r => {
                    allNotifs.push({
                        title: 'Document Update',
                        text: `Your ${escapeHtml(r.type)} is now <strong>${escapeHtml(r.status)}</strong>`,
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
                        text: `Your ${escapeHtml(c.category)} is <strong>${escapeHtml(c.status)}</strong>`,
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
                // Play sound for new notifications (only on first load)
                if (!this._soundPlayed) {
                    this._soundPlayed = true;
                    this.playNotificationSound(role === 'admin' ? 'admin' : 'resident');
                }
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
                
                document.getElementById('notifBtn').addEventListener('show.bs.dropdown', () => {
                    localStorage.setItem(`notif_read_${userId}`, displayNotifs[0].timestamp);
                    badge.style.display = 'none';
                });
            } else {
                list.innerHTML = '<li class="p-5 text-center text-muted"><i class="fa-solid fa-bell-slash fs-2 mb-2 opacity-25"></i><p class="small mb-0">No notifications yet</p></li>';
            }

            // Real-time subscription for live notifications
            this.subscribeToLiveNotifications(userId, role);

        } catch (err) {
            console.error("Notification init error:", err);
        }
    },

    subscribeToLiveNotifications: function(userId, role) {
        if (this._subscribed) return;
        this._subscribed = true;

        const self = this;

        const handleNew = (payload) => {
            const badge = document.getElementById('notifBadge');
            const list = document.getElementById('notifList');
            const record = payload.new;

            // Update badge count
            if (badge) {
                const current = parseInt(badge.textContent) || 0;
                badge.textContent = current + 1;
                badge.style.display = 'block';
                // Animate the bell
                const bellBtn = document.getElementById('notifBtn');
                if (bellBtn) {
                    bellBtn.style.animation = 'bellShake 0.8s ease-in-out';
                    setTimeout(() => bellBtn.style.animation = '', 1000);
                }
            }

            // Build notification item for the dropdown
            let title, text, icon, color, link;
            if (role === 'admin') {
                if (payload.table === 'requests' || record.type) {
                    title = 'New Document Request';
                    text = `${record.user_name || 'Someone'} requested ${record.type || 'a document'}`;
                    icon = 'fa-file-invoice';
                    color = 'text-primary';
                    link = 'dashboard.html';
                } else {
                    title = 'New Incident Report';
                    text = `${record.user_name || 'Someone'} reported ${record.category || 'an issue'}`;
                    icon = 'fa-triangle-exclamation';
                    color = 'text-danger';
                    link = 'dashboard.html';
                }
            } else {
                title = 'Request Updated';
                text = `Your request status changed to <strong>${record.status || 'updated'}</strong>`;
                icon = 'fa-circle-check';
                color = 'text-success';
                link = 'resident-dashboard.html';
            }

            // Prepend new notification to dropdown list
            if (list) {
                const emptyMsg = list.querySelector('.fa-bell-slash');
                if (emptyMsg) list.innerHTML = '';

                const newItem = `
                    <li class="p-0 border-bottom bg-light bg-opacity-50">
                        <a href="${link}" class="dropdown-item p-3 d-flex align-items-start text-wrap">
                            <div class="bg-white border rounded-circle p-2 me-3 shadow-sm" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid ${icon} ${color}"></i>
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <p class="mb-0 fw-bold small text-dark">${title}</p>
                                    <span class="badge bg-primary" style="font-size: 8px;">NEW</span>
                                </div>
                                <p class="mb-0 text-muted extra-small" style="font-size: 12px;">${text}</p>
                                <p class="mb-0 text-primary mt-1" style="font-size: 10px; opacity: 0.8;">Just now</p>
                            </div>
                        </a>
                    </li>`;
                list.insertAdjacentHTML('afterbegin', newItem);
            }

            // Play notification sound
            self.playNotificationSound(role === 'admin' ? 'admin' : 'resident');

            // Show toast notification
            self.showToast(payload, role);
        };

        if (role === 'admin') {
            supabaseClient.channel('admin-requests')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, handleNew)
                .subscribe((status) => { console.log('Admin requests channel:', status); });
            supabaseClient.channel('admin-complaints')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complaints' }, handleNew)
                .subscribe((status) => { console.log('Admin complaints channel:', status); });
        } else {
            supabaseClient.channel('user-requests')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `user_id=eq.${userId}` }, handleNew)
                .subscribe((status) => { console.log('User requests channel:', status); });
            supabaseClient.channel('user-complaints')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `user_id=eq.${userId}` }, handleNew)
                .subscribe((status) => { console.log('User complaints channel:', status); });
        }
    },

    showToast: function(payload, role) {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const record = payload.new;
        let title, message, icon, color;

        if (role === 'admin') {
            if (payload.table === 'requests') {
                title = 'New Document Request';
                message = `${record.user_name || 'Someone'} requested a ${record.type || 'document'}`;
                icon = 'fa-file-invoice';
                color = 'text-primary';
            } else {
                title = 'New Incident Report';
                message = `${record.user_name || 'Someone'} reported an issue`;
                icon = 'fa-triangle-exclamation';
                color = 'text-danger';
            }
        } else {
            title = 'Request Updated';
            message = `Your request status changed to ${record.status || 'updated'}`;
            icon = 'fa-circle-check';
            color = 'text-success';
        }

        const toastId = 'toast_' + Date.now();
        const toastHtml = `
        <div id="${toastId}" class="toast show shadow-lg border-0 rounded-4 mb-2" role="alert" style="min-width: 320px; animation: slideInRight 0.4s ease;">
            <div class="toast-header border-0 bg-white rounded-top-4 py-2 px-3">
                <div class="rounded-circle p-1 me-2 d-flex align-items-center justify-content-center" style="width:28px;height:28px;background:rgba(37,99,235,0.1);">
                    <i class="fa-solid ${icon} ${color} small"></i>
                </div>
                <strong class="me-auto small">${title}</strong>
                <small class="text-muted">Just now</small>
                <button type="button" class="btn-close btn-close-sm ms-2" onclick="document.getElementById('${toastId}').remove()"></button>
            </div>
            <div class="toast-body small py-2 px-3 text-muted">${message}</div>
        </div>`;

        document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHtml);

        // Auto-remove after 6 seconds
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.style.animation = 'slideOutRight 0.4s ease';
                setTimeout(() => toast.remove(), 400);
            }
        }, 6000);
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

    openSettingsModal: function() {
        // Remove old modal if exists to refresh data
        const oldModal = document.getElementById('userSettingsModal');
        if (oldModal) { oldModal.remove(); }

        const modalHtml = `
        <div class="modal fade" id="userSettingsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div class="modal-header bg-primary text-white border-0 py-3 px-4">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-gear me-2"></i>Account Settings</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">
                        <div id="userSettingsAlert" class="alert d-none" role="alert"></div>
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="card border-0 bg-light rounded-4 h-100">
                                    <div class="card-body p-4">
                                        <h6 class="fw-bold mb-3"><i class="fa-solid fa-lock me-2 text-primary"></i>Change Password</h6>
                                        <form id="userChangePasswordForm">
                                            <div class="mb-3">
                                                <label class="form-label fw-semibold small text-muted">New Password</label>
                                                <div class="input-group">
                                                    <span class="input-group-text bg-white border-end-0"><i class="fa-solid fa-key text-muted"></i></span>
                                                    <input type="password" class="form-control border-start-0" id="userNewPassword" required minlength="6" placeholder="Min. 6 characters">
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label fw-semibold small text-muted">Confirm New Password</label>
                                                <div class="input-group">
                                                    <span class="input-group-text bg-white border-end-0"><i class="fa-solid fa-check-double text-muted"></i></span>
                                                    <input type="password" class="form-control border-start-0" id="userConfirmPassword" required minlength="6" placeholder="Re-enter password">
                                                </div>
                                            </div>
                                            <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold w-100"><i class="fa-solid fa-shield-halved me-2"></i>Update Password</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-0 bg-light rounded-4 h-100">
                                    <div class="card-body p-4">
                                        <h6 class="fw-bold mb-3"><i class="fa-solid fa-user-pen me-2 text-warning"></i>Update Profile</h6>
                                        <!-- Avatar Upload -->
                                        <div class="text-center mb-3">
                                            <div class="position-relative d-inline-block">
                                                <img src="https://ui-avatars.com/api/?name=U&background=0f4c81&color=fff&size=80" id="userAvatarPreview" alt="Avatar" class="rounded-circle shadow" style="width:80px;height:80px;object-fit:cover;border:3px solid #ffc107;">
                                                <label for="userAvatarUpload" class="position-absolute bottom-0 end-0 bg-warning rounded-circle d-flex align-items-center justify-content-center shadow" style="width:28px;height:28px;cursor:pointer;">
                                                    <i class="fa-solid fa-camera text-dark" style="font-size:11px;"></i>
                                                </label>
                                                <input type="file" id="userAvatarUpload" accept="image/*" class="d-none">
                                            </div>
                                            <div id="userAvatarStatus" class="small text-muted mt-1"></div>
                                        </div>
                                        <form id="userUpdateNameForm">
                                            <div class="mb-3">
                                                <label class="form-label fw-semibold small text-muted">Full Name</label>
                                                <input type="text" class="form-control" id="userSettingsName" required>
                                            </div>
                                            <div class="row g-2 mb-3">
                                                <div class="col-6">
                                                    <label class="form-label fw-semibold small text-muted">Phone</label>
                                                    <input type="tel" class="form-control" id="userSettingsPhone" placeholder="09XXXXXXXXX">
                                                </div>
                                                <div class="col-6">
                                                    <label class="form-label fw-semibold small text-muted">Email</label>
                                                    <input type="email" class="form-control" id="userSettingsEmail" disabled>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label fw-semibold small text-muted">Purok / Zone</label>
                                                <input type="text" class="form-control" id="userSettingsPurok" placeholder="e.g. Purok 1">
                                            </div>
                                            <button type="submit" class="btn btn-warning rounded-pill px-4 fw-bold text-dark w-100"><i class="fa-solid fa-floppy-disk me-2"></i>Save Changes</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-0 bg-light rounded-4 h-100">
                                    <div class="card-body p-4">
                                        <h6 class="fw-bold mb-3"><i class="fa-solid fa-sliders me-2 text-info"></i>Preferences</h6>
                                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <div><div class="fw-semibold small">Desktop Notifications</div><small class="text-muted" style="font-size:11px;">Get alerts for request updates</small></div>
                                            <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="userNotifToggle" checked style="width:2.5em;height:1.3em;"></div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                                            <div><div class="fw-semibold small">Sound Alerts</div><small class="text-muted" style="font-size:11px;">Play sound on new notifications</small></div>
                                            <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="userSoundToggle" style="width:2.5em;height:1.3em;"></div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center py-2">
                                            <div><div class="fw-semibold small">Email Updates</div><small class="text-muted" style="font-size:11px;">Receive email for status changes</small></div>
                                            <div class="form-check form-switch"><input class="form-check-input" type="checkbox" id="userEmailToggle" checked style="width:2.5em;height:1.3em;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card border-0 bg-light rounded-4 h-100">
                                    <div class="card-body p-4">
                                        <h6 class="fw-bold mb-3"><i class="fa-solid fa-clock-rotate-left me-2 text-success"></i>Account Info</h6>
                                        <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Role</span><span class="badge bg-success rounded-pill px-3" id="userSettingsRole">Resident</span></div>
                                        <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Account Created</span><span class="fw-semibold small" id="userSettingsCreated">\u2014</span></div>
                                        <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted small">Last Sign In</span><span class="fw-semibold small" id="userSettingsLastLogin">\u2014</span></div>
                                        <div class="d-flex justify-content-between py-2"><span class="text-muted small">User ID</span><span class="font-monospace small text-muted" id="userSettingsUid" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">\u2014</span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="card border-danger border-opacity-25 bg-light rounded-4">
                                    <div class="card-body p-3 d-flex justify-content-between align-items-center">
                                        <div><h6 class="fw-bold mb-0 text-danger"><i class="fa-solid fa-triangle-exclamation me-2"></i>Danger Zone</h6><small class="text-muted">Clear cached data. You will stay logged in.</small></div>
                                        <button class="btn btn-outline-danger rounded-pill px-3 fw-bold btn-sm" onclick="if(confirm('Clear all cached data?')){localStorage.clear();location.reload();}"><i class="fa-solid fa-broom me-1"></i>Clear Cache</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Password handler
        document.getElementById('userChangePasswordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const alertBox = document.getElementById('userSettingsAlert');
            const newPass = document.getElementById('userNewPassword').value;
            const confirmPass = document.getElementById('userConfirmPassword').value;
            if (newPass !== confirmPass) { alertBox.className = 'alert alert-danger'; alertBox.innerHTML = '<i class="fa-solid fa-circle-xmark me-2"></i>Passwords do not match.'; alertBox.classList.remove('d-none'); return; }
            if (newPass.length < 6) { alertBox.className = 'alert alert-danger'; alertBox.innerHTML = '<i class="fa-solid fa-circle-xmark me-2"></i>Password must be at least 6 characters.'; alertBox.classList.remove('d-none'); return; }
            const btn = this.querySelector('button'); btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            const { error } = await supabaseClient.auth.updateUser({ password: newPass });
            if (error) { alertBox.className = 'alert alert-danger'; alertBox.innerHTML = '<i class="fa-solid fa-circle-xmark me-2"></i>' + error.message; }
            else { alertBox.className = 'alert alert-success'; alertBox.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i>Password updated successfully!'; this.reset(); }
            alertBox.classList.remove('d-none'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-shield-halved me-2"></i>Update Password';
            setTimeout(() => alertBox.classList.add('d-none'), 4000);
        });

        // Profile handler
        document.getElementById('userUpdateNameForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const alertBox = document.getElementById('userSettingsAlert');
            const btn = this.querySelector('button'); btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
            const { data: { user } } = await supabaseClient.auth.getUser();
            const { error } = await supabaseClient.from('profiles').update({ full_name: document.getElementById('userSettingsName').value, phone: document.getElementById('userSettingsPhone').value || null, purok: document.getElementById('userSettingsPurok').value || null }).eq('id', user.id);
            if (error) { alertBox.className = 'alert alert-danger'; alertBox.innerHTML = '<i class="fa-solid fa-circle-xmark me-2"></i>' + error.message; }
            else { alertBox.className = 'alert alert-success'; alertBox.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i>Profile updated!'; localStorage.removeItem('user_profile'); }
            alertBox.classList.remove('d-none'); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i>Save Changes';
            setTimeout(() => alertBox.classList.add('d-none'), 4000);
        });

        // Preferences handler
        document.querySelectorAll('#userNotifToggle, #userSoundToggle, #userEmailToggle').forEach(t => {
            t.addEventListener('change', () => { localStorage.setItem('user_prefs', JSON.stringify({ notifications: document.getElementById('userNotifToggle').checked, sound: document.getElementById('userSoundToggle').checked, email: document.getElementById('userEmailToggle').checked })); });
        });

        // Avatar Upload Handler
        document.getElementById('userAvatarUpload').addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { document.getElementById('userAvatarStatus').innerHTML = '<span class="text-danger">Max 2MB</span>'; return; }

            const status = document.getElementById('userAvatarStatus');
            status.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading...';

            const { data: { user } } = await supabaseClient.auth.getUser();
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-xmark me-1"></i>${uploadError.message}</span>`;
                return;
            }

            const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl + '?t=' + Date.now();

            await supabaseClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

            document.getElementById('userAvatarPreview').src = publicUrl;
            localStorage.removeItem('user_profile');
            status.innerHTML = '<span class="text-success"><i class="fa-solid fa-check me-1"></i>Photo updated!</span>';
            setTimeout(() => status.innerHTML = '', 3000);
        });

        // Load data
        (async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                document.getElementById('userSettingsEmail').value = user.email || '';
                document.getElementById('userSettingsUid').textContent = user.id;
                document.getElementById('userSettingsCreated').textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '\u2014';
                document.getElementById('userSettingsLastLogin').textContent = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';
                const { data: profile } = await supabaseClient.from('profiles').select('full_name, phone, purok, role, avatar_url').eq('id', user.id).single();
                if (profile) {
                    document.getElementById('userSettingsName').value = profile.full_name || '';
                    document.getElementById('userSettingsPhone').value = profile.phone || '';
                    document.getElementById('userSettingsPurok').value = profile.purok || '';
                    document.getElementById('userSettingsRole').textContent = (profile.role || 'resident').charAt(0).toUpperCase() + (profile.role || 'resident').slice(1);
                    document.getElementById('userSettingsRole').className = profile.role === 'admin' ? 'badge bg-primary rounded-pill px-3' : 'badge bg-success rounded-pill px-3';
                    // Load avatar
                    const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=0f4c81&color=fff&size=80`;
                    document.getElementById('userAvatarPreview').src = profile.avatar_url || avatarFallback;
                }
                const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
                document.getElementById('userNotifToggle').checked = prefs.notifications !== false;
                document.getElementById('userSoundToggle').checked = prefs.sound === true;
                document.getElementById('userEmailToggle').checked = prefs.email !== false;
            }
        })();

        new bootstrap.Modal(document.getElementById('userSettingsModal')).show();
    },

    startClock: function() {
        if (document.getElementById('navClock')) return;

        const clockSpan = document.createElement('div');
        clockSpan.id = 'navClock';
        clockSpan.style.fontSize = '11px';
        clockSpan.style.lineHeight = '1.2';
        
        const updateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', options);
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            if (clockSpan.classList.contains('text-dark')) {
                clockSpan.innerHTML = `
                    <div class="fw-bold" style="letter-spacing: 0.5px;">${timeStr}</div>
                    <div style="opacity: 0.7;">${dateStr}</div>
                `;
            } else {
                clockSpan.innerHTML = `
                    <div class="fw-bold text-white" style="letter-spacing: 0.5px;">${timeStr}</div>
                    <div style="opacity: 0.7;">${dateStr}</div>
                `;
            }
        };

        const brand = document.querySelector('.navbar-brand');
        const adminHeader = document.querySelector('header .gap-3');
        
        if (brand) {
            clockSpan.className = 'ms-3 d-none d-md-flex flex-column justify-content-center border-start ps-3 border-white border-opacity-25';
            clockSpan.style.color = 'rgba(255,255,255,0.8)';
            brand.parentElement.insertBefore(clockSpan, brand.nextSibling);
        } else if (adminHeader) {
            clockSpan.className = 'me-3 d-none d-md-flex flex-column justify-content-center border-end pe-3 border-dark border-opacity-25 text-dark text-end';
            adminHeader.insertBefore(clockSpan, adminHeader.firstChild);
        } else {
            return;
        }

        updateTime();
        setInterval(updateTime, 1000);
    },

    generateTrackingId: function(prefix) {
        return prefix + '-' + Math.floor(100000 + Math.random() * 900000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});