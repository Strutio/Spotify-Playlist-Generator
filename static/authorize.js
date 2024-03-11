document.getElementById('authorization-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // This prevents the default form submission behavior

    window.location.href = 'http://127.0.0.1:8888/login';
});
