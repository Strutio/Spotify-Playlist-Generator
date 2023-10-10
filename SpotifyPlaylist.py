import spotipy
import spotipy.util as util
import pandas as pd
from spotipy.oauth2 import SpotifyOAuth
from flask import Flask, request, jsonify
from flask_cors import CORS

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
CORS(app)
@app.route('/', methods=['POST'])
def create_playlist_route():
    data = request.get_json()

    artist_name = data.get('artist_name')
    playlist_name = data.get('playlist_name')
    num_songs = int(data.get('num_songs'))

    # Call the main function and get the playlist ID
    playlist_id = main(sp, username, artist_name, playlist_name, num_songs)

    return jsonify({'playlist_id': playlist_id})

if __name__ == '__main__':
    scope = "playlist-modify-public"
    # Your spotify username
    username = ''
    # Your client_id
    client_id = ''
    # Your client_secret
    client_secret = ''
    # Your redirect_uri, e.g. http://localhost:8888/callback/
    redirect_uri = ''

    token = util.prompt_for_user_token(username, scope, client_id, client_secret, redirect_uri)

    if token:
        sp = spotipy.Spotify(auth=token)
    else:
        print("Can't get token for", username)
    
    app.run(debug=True)
