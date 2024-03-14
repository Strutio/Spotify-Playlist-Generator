const steps = [
    { id: 1, label: 'Artist Name', type: 'text', name: 'artist_name' },
    { id: 2, label: 'Playlist Name', type: 'text', name: 'playlist_name' },
    { id: 3, label: 'Number of Songs', type: 'number', name: 'num_songs' },
    // Add more steps as needed
];

let currentStep = 0;
let formData = {};

function createForm(step) {
    const container = document.getElementById('playlist-form-container');
    container.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'playlist-form';
    form.method = 'POST';

    const currentStepData = steps[step];
    if (currentStepData) {
        const label = document.createElement('label');
        label.for = currentStepData.name;
        label.textContent = currentStepData.label;
        form.appendChild(label);

        const input = document.createElement('input');
        input.type = currentStepData.type;
        input.id = currentStepData.name;
        input.name = currentStepData.name;
        // Populating with saved data
        input.value = formData[currentStepData.name] || '';
        // Updating data on input
        input.addEventListener('input', (e) => {
            formData[currentStepData.name] = e.target.value;
            
            if (currentStepData.name === 'artist_name') {
                handleArtistNameInputSuggestions(e.target);
            }
        });
        form.appendChild(input);

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'autocomplete-suggestions';
        suggestionsContainer.classList.add('autocomplete-suggestions');
        form.appendChild(suggestionsContainer);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        form.appendChild(buttonContainer);

        // If we are past the first step, introduce the back button
        if (currentStep > 0) {
            const backButton = document.createElement('button');
            backButton.type = 'button';
            backButton.textContent = 'Back';
            backButton.classList.add('back-button');
            backButton.addEventListener('click', () => navigate('back'));
            buttonContainer.appendChild(backButton); // Append the back button to the button container
        }

        // Buttons for submission and going to the next step
        if (currentStep === steps.length - 1) {
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Create Playlist';
            submitButton.classList.add('submit-button');
            form.appendChild(submitButton);
        } else {
            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.textContent = 'Next';
            nextButton.classList.add('next-button');
            nextButton.addEventListener('click', () => navigate('next'));
            buttonContainer.appendChild(nextButton); // Append the next button to the button container
        }

        container.appendChild(form);
    }
}

function handleArtistNameInputSuggestions(input) {
    const suggestionsContainer = document.getElementById('autocomplete-suggestions');
    const nextButton = document.querySelector('.next-button');

    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';

    // Get user input
    const query = input.value.trim();

    console.log('Query:', query);

    // Fetch artist suggestions
    if (query.length >= 3) {
        fetchArtistSuggestions(query)
            .then(suggestions => {
                console.log('Suggestions:', suggestions);

                // Display suggestions
                suggestions.forEach(suggestion => {
                    const suggestionElement = document.createElement('div');
                    suggestionElement.classList.add('suggestion');

                    // Create a container for the artist info
                    const artistContainer = document.createElement('div');
                    artistContainer.classList.add('artist-container');

                    // Create an image element for the artist
                    if (suggestion.image) {
                        const artistImage = document.createElement('img');
                        artistImage.src = suggestion.image;
                        artistImage.alt = suggestion.name;
                        artistImage.classList.add('artist-image');
                        // Apply styling changes here
                        artistImage.style.width = '50px'; // Adjust the width as needed
                        artistImage.style.height = '50px'; // Adjust the height as needed
                        artistContainer.appendChild(artistImage);
                    }

                    // Create a span element for the artist name
                    const artistName = document.createElement('span');
                    artistName.textContent = suggestion.name;
                    artistContainer.appendChild(artistName);

                    suggestionElement.appendChild(artistContainer);

                    suggestionElement.addEventListener('click', () => {
                        // Set the selected suggestion in the input field
                        input.value = suggestion.name;
                        // Clear suggestions
                        suggestionsContainer.innerHTML = '';

                        // Reset the position of the next button
                        if (nextButton) {
                            nextButton.style.marginTop = '0';
                        }

                        // Hide the suggestions container
                        suggestionsContainer.classList.remove('show');
                    });

                    suggestionsContainer.appendChild(suggestionElement);
                });

                // Show the suggestions container
                suggestionsContainer.classList.add('show');
                // Move the next button down
                if (nextButton) {
                    nextButton.style.marginTop = '50px';
                }
            })
            .catch(error => {
                console.error('Error fetching artist suggestions:', error);
            });
    } else {
        suggestionsContainer.classList.remove('show');
        if (nextButton) {
            nextButton.style.marginTop = '0';
        }
    }
}

// Function to ensure we keep track of the proper steps
function navigate(direction) {
    if (direction === 'next') {
        currentStep++;
    } else if (direction === 'back') {
        currentStep--;
    }

    if (currentStep >= 0 && currentStep < steps.length) {
        createForm(currentStep);
    }
}

// Event listener for form submission
document.getElementById('playlist-form-container').addEventListener('submit', function (e) {
    e.preventDefault();

    fetch('http://127.0.0.1:8888/create_playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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

// Event listener for sign-out
document.getElementById('sign-out').addEventListener('click', function (e) {
    e.preventDefault();

    fetch('/sign_out', {
        method: 'GET',
    })
        .then(response => {
            if (response.ok) {
                // Clear local data (session storage, cookies, etc.)
                localStorage.removeItem('spotifyToken'); // Example: clear local storage
                // Redirect to the home page or login page
                window.location.href = '/';
            } else {
                console.error('Failed to sign out');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

// Initialize form on page load
createForm(currentStep);

// Event listener for artist name input
const artistNameInput = document.getElementById('artist_name'); // Change 'artist_name' if your input has a different ID
artistNameInput.addEventListener('input', (e) => {
    formData['artist_name'] = e.target.value;
    handleArtistNameInputSuggestions(artistNameInput);
});


// Function to fetch artist suggestions from Spotify API
async function fetchArtistSuggestions(query) {
    const accessToken = localStorage.getItem('spotifyToken');

    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const data = await response.json();

    if (data.artists && data.artists.items) {
        return data.artists.items.map(artist => {
            return {
                name: artist.name,
                id: artist.id,
                image: artist.images.length > 0 ? artist.images[0].url : null,
            };
        });
    } else {
        return [];
    }
}
