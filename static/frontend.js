document.getElementById('playlist-form').addEventListener('submit', function(e) {
    e.preventDefault();

    fetch('http://localhost:8888/create_playlist', {
        
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'artist_name': document.getElementById('artist_name').value,
            'playlist_name': document.getElementById('playlist_name').value,
            'num_songs': document.getElementById('num_songs').value
            
        })
        
    })
    .then(response => response.json())
    .then(data => {
        alert('Playlist created with ID: ' + data.playlist_id);

        // Assuming you have an iframe with id='spotify-embed' in your HTML
        var spotifyEmbed = document.getElementById('spotify-embed');
        spotifyEmbed.src = `https://open.spotify.com/embed/playlist/${data.playlist_id}`;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});