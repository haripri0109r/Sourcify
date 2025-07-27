// Login Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loginForms = document.querySelectorAll('.login-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            loginForms.forEach(form => form.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Form submission handlers
    const streetVendorForm = document.getElementById('streetVendorForm');
    const rawMaterialForm = document.getElementById('rawMaterialForm');
    const transportForm = document.getElementById('transportForm');

    streetVendorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('street-vendor');
    });

    rawMaterialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('raw-material');
    });

    transportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin('transport');
    });

    function handleLogin(userType) {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        // Simulate login process
        setTimeout(() => {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Redirect based on user type
            switch(userType) {
                case 'street-vendor':
                    window.location.href = 'street-vendor-dashboard.html';
                    break;
                case 'raw-material':
                    window.location.href = 'raw-material-dashboard.html';
                    break;
                case 'transport':
                    window.location.href = 'transport-dashboard.html';
                    break;
            }
        }, 1500);
    }

    // Input focus effects
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});