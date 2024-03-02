import spotipy
import spotipy.util as util
import pandas as pd
from spotipy.oauth2 import SpotifyOAuth
from flask import Flask, request, jsonify, redirect, session, render_template
from flask_cors import CORS
import requests

def get_artist_id(sp, artist_name):
    # Search for the artist
    result = sp.search(artist_name, type='artist')
    
    # Extract and return the artist ID from the first result
    return result['artists']['items'][0]['id']

def get_similar_artists(sp, artist_id):
    # Get similar artists
    result = sp.artist_related_artists(artist_id)
    
    # Extract and return the artist IDs
    return [artist['id'] for artist in result['artists']]

def get_artist_top_tracks(sp, artist_ids, max_songs):
    track_ids = []
    
    for artist_id in artist_ids:
        # Get the artist's top tracks
        results = sp.artist_top_tracks(artist_id)
        
        # Extract the track IDs
        for track in results['tracks']:
            if len(track_ids) < max_songs:
                track_ids.append(track['id'])
            else:
                break

        # If we already have max_songs, no need to keep looking.
        if len(track_ids) >= max_songs:
            break

    return track_ids

def create_playlist(sp, username, playlist_name, track_ids):
    # Create the playlist
    playlist = sp.user_playlist_create(username, playlist_name)
    playlist_id = playlist['id']
    
    # Add the tracks in chunks of 100
    for i in range(0, len(track_ids), 100):
        sp.user_playlist_add_tracks(username, playlist_id, track_ids[i:i+100])
    
    return playlist_id

def main(sp, username, artist_name, playlist_name, num_songs):
    # Get the artist's ID
    artist_id = get_artist_id(sp, artist_name)
    
    # Get similar artists
    similar_artist_ids = get_similar_artists(sp, artist_id)
    
    # Add the original artist to the list of artists we're getting tracks from
    artist_ids = [artist_id] + similar_artist_ids
    
    # Get top tracks
    track_ids = get_artist_top_tracks(sp, artist_ids, num_songs)
    
    # Create the playlist and return its ID
    return create_playlist(sp, username, playlist_name, track_ids)

app = Flask(__name__)
# Choose your apps secret key
app.secret_key=''
CORS(app)
sp_oauth = SpotifyOAuth(
    scope = "playlist-modify-public playlist-modify-private",
    # Your client_id
    client_id = '',
    # Your client_secret
    client_secret = '',
    # Your redirect_uri, e.g. http://localhost:8888/callback/
    redirect_uri = ""
)

#Route for user to login to their Spotify account
@app.route('/login')
def login():

    # Creating an auth url to store in session
    auth_url = sp_oauth.get_authorize_url()
    session["token_info"] = sp_oauth.get_cached_token()
    
    return redirect(auth_url)

@app.route('/callback')
def callback():
    token_info = sp_oauth.get_access_token(request.args["code"])
    session["token_info"] = token_info

    return redirect("/") 

#Route to verify that the user has signed in before redirecting them to creating their playlist
@app.route('/')
def verify():
    token_info = session.get("token_info", None)
    
    if not token_info:
        return render_template('authorization.html')

    if sp_oauth.is_token_expired(token_info):
        # Refresh the token
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session["token_info"] = token_info

    return render_template('create-playlist.html')

@app.route('/get_spotify_token')
def get_spotify_token():
    token_info = session.get("token_info", None)

    if not token_info:
        # Handle the case where there's no valid token
        return jsonify({'error': 'No valid Spotify token'})

    if sp_oauth.is_token_expired(token_info):
        # Refresh the token
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session["token_info"] = token_info

    return jsonify({'access_token': token_info["access_token"]})


#Route for the generation of the actual playlist
@app.route('/create_playlist', methods=['POST'])
def create_playlist_route():
    token_info = session.get("token_info", None)

    # Checking if the token exists, otherwise we need to re-authorize
    if not token_info:
        return render_template("authorize.html")
    
    sp = spotipy.Spotify(auth=token_info["access_token"])
    user_info = sp.current_user()
    username = user_info['id']

    # Getting the json file that was generated from frontend.js containing the formData
    data = request.get_json()

    artist_name = data.get('artist_name')
    playlist_name = data.get('playlist_name')
    num_songs = int(data.get('num_songs'))

    # Call the main function and get the playlist ID
    playlist_id = main(sp, username, artist_name, playlist_name, num_songs)

    return jsonify({'playlist_id': playlist_id})


@app.route('/sign_out')
def sign_out():
    session.clear()

    # Redirect to the home page or login page
    return redirect('/')


if __name__ == '__main__':
    
    app.run(port=8888, debug=True)
