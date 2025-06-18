import os
import json
import base64
import requests
import logging
from datetime import datetime

# GitHub configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPO', 'YOUR_USERNAME/manolos-german-app')
PROGRESS_FILE = 'data/progress.json'

def get_progress_from_github():
    """Fetch progress from GitHub"""
    if not GITHUB_TOKEN:
        logging.warning("No GitHub token, using local progress")
        return load_local_progress()
    
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{PROGRESS_FILE}"
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            content = response.json()
            decoded_content = base64.b64decode(content['content']).decode('utf-8')
            progress_data = json.loads(decoded_content)
            
            # Cache locally
            save_local_progress(progress_data)
            return progress_data
        elif response.status_code == 404:
            # File doesn't exist yet
            return {'progress': {}, 'last_updated': datetime.now().isoformat()}
        else:
            logging.error(f"GitHub API error: {response.status_code}")
            return load_local_progress()
            
    except Exception as e:
        logging.error(f"Error fetching from GitHub: {e}")
        return load_local_progress()

def save_progress_to_github(progress_data):
    """Save progress to GitHub"""
    if not GITHUB_TOKEN:
        logging.warning("No GitHub token, saving locally only")
        save_local_progress(progress_data)
        return False
    
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{PROGRESS_FILE}"
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        # Get current file SHA (if exists)
        sha = None
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            sha = response.json()['sha']
        
        # Prepare content
        progress_data['last_updated'] = datetime.now().isoformat()
        content = json.dumps(progress_data, indent=2)
        encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        
        # Create/Update file
        data = {
            'message': f'Update progress - {datetime.now().strftime("%Y-%m-%d %H:%M")}',
            'content': encoded_content,
            'branch': 'main'
        }
        
        if sha:
            data['sha'] = sha
        
        response = requests.put(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            # Cache locally
            save_local_progress(progress_data)
            return True
        else:
            logging.error(f"GitHub save error: {response.status_code} - {response.text}")
            save_local_progress(progress_data)
            return False
            
    except Exception as e:
        logging.error(f"Error saving to GitHub: {e}")
        save_local_progress(progress_data)
        return False

def load_local_progress():
    """Load progress from local file (fallback)"""
    try:
        if os.path.exists(PROGRESS_FILE):
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        logging.error(f"Error loading local progress: {e}")
    
    return {'progress': {}, 'last_updated': datetime.now().isoformat()}

def save_local_progress(progress_data):
    """Save progress to local file (fallback)"""
    try:
        os.makedirs(os.path.dirname(PROGRESS_FILE), exist_ok=True)
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(progress_data, f, indent=2)
    except Exception as e:
        logging.error(f"Error saving local progress: {e}")

def update_word_progress(word_type, word):
    """Update progress for a specific word"""
    progress_data = get_progress_from_github()
    
    key = f"{word_type}_{word}"
    if 'progress' not in progress_data:
        progress_data['progress'] = {}
    
    current_count = progress_data['progress'].get(key, 0)
    progress_data['progress'][key] = current_count + 1
    
    save_progress_to_github(progress_data)
    return True

def get_word_progress(word_type, word):
    """Get progress for a specific word"""
    progress_data = get_progress_from_github()
    key = f"{word_type}_{word}"
    return progress_data.get('progress', {}).get(key, 0)

def get_all_progress():
    """Get all progress data"""
    progress_data = get_progress_from_github()
    return progress_data.get('progress', {})
