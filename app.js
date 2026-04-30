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

        // 1. Initial Check (Immediate)
        const { data: { session: initialSession } } = await supabaseClient.auth.getSession();
        this.updateUserMenu(initialSession ? initialSession.user : null);

        // 2. Listen for state changes (Future)
        supabaseClient.auth.onAuthStateChange((event, session) => {
            this.updateUserMenu(session ? session.user : null);
        });
    },

    updateUserMenu: async function(user) {
        const navRight = document.getElementById('userMenu');
        if (!navRight) return;

        if (user) {
            try {
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();

                const role = profile ? profile.role : 'resident';
                const name = profile ? (profile.full_name || user.email) : user.email;

                if (role === 'admin') {
                    navRight.innerHTML = `
                        <div class="dropdown">
                            <button class="btn btn-warning fw-bold dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fa-solid fa-user-shield me-1"></i> Admin Panel
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="App.logout()">Logout</a></li>
                            </ul>
                        </div>
                    `;
                } else {
                    navRight.innerHTML = `
                        <div class="dropdown">
                            <button class="btn btn-light fw-bold dropdown-toggle text-primary" type="button" data-bs-toggle="dropdown">
                                <i class="fa-solid fa-circle-user me-1"></i> ${name.split(' ')[0]}
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                <li><a class="dropdown-item" href="resident-dashboard.html">My Profile</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="App.logout()">Logout</a></li>
                            </ul>
                        </div>
                    `;
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
            }
        } else {
            // Keep original Login/Register buttons
            navRight.innerHTML = `
                <a href="login.html" class="btn btn-outline-light me-2">Login</a>
                <a href="register.html" class="btn btn-warning fw-bold text-dark">Register</a>
            `;
        }
    },

    logout: async function() {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    },

    // Helper for generating random Tracking ID
    generateTrackingId: function(prefix) {
        return prefix + '-' + Math.floor(100000 + Math.random() * 900000);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
