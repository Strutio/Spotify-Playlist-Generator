document.getElementById('authorization-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // This prevents the default form submission behavior

    window.location.href = 'http://localhost:8888/login';
});