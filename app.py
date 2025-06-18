import os
import json
from flask import Flask, render_template, jsonify, request
import csv
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'manolo-german-app-secret-2024')

# Create data directory if it doesn't exist
if not os.path.exists('data'):
    os.makedirs('data')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_verbs')
def get_verbs():
    verbs = []
    try:
        with open('data/verbs.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            
            if not headers:
                return jsonify([])
            
            # Ensure we have all expected headers
            if 'learned_count' not in headers:
                headers.append('learned_count')
            
            for row in reader:
                # Skip empty rows
                if not row or all(cell.strip() == '' for cell in row):
                    continue
                
                # Pad row to match headers length
                while len(row) < len(headers):
                    row.append('')
                
                # Create dictionary with cleaned values
                verb_dict = {}
                for i, header in enumerate(headers):
                    value = row[i] if i < len(row) else ''
                    # Clean the value - convert None to empty string
                    if value is None:
                        value = ''
                    else:
                        value = str(value).strip()
                    
                    # Special handling for learned_count
                    if header == 'learned_count':
                        try:
                            verb_dict[header] = int(value) if value else 0
                        except ValueError:
                            verb_dict[header] = 0
                    else:
                        verb_dict[header] = value
                
                verbs.append(verb_dict)
                
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:
        print(f"Error reading verbs: {e}")
        return jsonify([])
    
    return jsonify(verbs)

@app.route('/get_nouns')
def get_nouns():
    nouns = []
    try:
        with open('data/nouns.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            
            if not headers:
                return jsonify([])
            
            # Ensure we have all expected headers
            if 'learned_count' not in headers:
                headers.append('learned_count')
            
            for row in reader:
                # Skip empty rows
                if not row or all(cell.strip() == '' for cell in row):
                    continue
                
                # Pad row to match headers length
                while len(row) < len(headers):
                    row.append('')
                
                # Create dictionary with cleaned values
                noun_dict = {}
                for i, header in enumerate(headers):
                    value = row[i] if i < len(row) else ''
                    # Clean the value - convert None to empty string
                    if value is None:
                        value = ''
                    else:
                        value = str(value).strip()
                    
                    # Special handling for learned_count
                    if header == 'learned_count':
                        try:
                            noun_dict[header] = int(value) if value else 0
                        except ValueError:
                            noun_dict[header] = 0
                    else:
                        noun_dict[header] = value
                
                nouns.append(noun_dict)
                
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:
        print(f"Error reading nouns: {e}")
        return jsonify([])
    
    return jsonify(nouns)

@app.route('/add_verb', methods=['POST'])
def add_verb():
    data = request.json
    
    # Validate required fields
    required_fields = ['infinitiv', 'präteritum', 'perfekt', 'english']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    try:
        # Check if learned_count column exists
        add_learned_count = False
        with open('data/verbs.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            add_learned_count = 'learned_count' in headers
        
        with open('data/verbs.csv', 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            row = [
                data['infinitiv'],
                data['präteritum'],
                data['perfekt'],
                data['english']
            ]
            if add_learned_count:
                row.append('0')
            writer.writerow(row)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/add_noun', methods=['POST'])
def add_noun():
    data = request.json
    
    # Validate required fields
    required_fields = ['article', 'nomen', 'plural', 'english']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
    
    try:
        # Check if learned_count column exists
        add_learned_count = False
        with open('data/nouns.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            add_learned_count = 'learned_count' in headers
        
        with open('data/nouns.csv', 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            row = [
                data['article'],
                data['nomen'],
                data['plural'],
                data['english']
            ]
            if add_learned_count:
                row.append('0')
            writer.writerow(row)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/update_learned_count', methods=['POST'])
def update_learned_count():
    data = request.json
    word_type = data.get('type')
    word = data.get('word')
    
    if not word_type or not word:
        return jsonify({'success': False, 'error': 'Missing required fields'}), 400
    
    try:
        if word_type == 'verb':
            # Read all verbs
            verbs = []
            headers = []
            with open('data/verbs.csv', 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader)
                
                # Add learned_count if not present
                if 'learned_count' not in headers:
                    headers.append('learned_count')
                
                for row in reader:
                    # Pad row if needed
                    while len(row) < len(headers):
                        row.append('0')
                    
                    if row[0] == word:  # infinitiv is first column
                        learned_idx = headers.index('learned_count')
                        try:
                            current_count = int(row[learned_idx])
                        except:
                            current_count = 0
                        row[learned_idx] = str(current_count + 1)
                    verbs.append(row)
            
            # Write back
            with open('data/verbs.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                writer.writerows(verbs)
        
        elif word_type == 'noun':
            # Read all nouns
            nouns = []
            headers = []
            with open('data/nouns.csv', 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                headers = next(reader)
                
                # Add learned_count if not present
                if 'learned_count' not in headers:
                    headers.append('learned_count')
                
                for row in reader:
                    # Pad row if needed
                    while len(row) < len(headers):
                        row.append('0')
                    
                    if row[1] == word:  # nomen is second column
                        learned_idx = headers.index('learned_count')
                        try:
                            current_count = int(row[learned_idx])
                        except:
                            current_count = 0
                        row[learned_idx] = str(current_count + 1)
                    nouns.append(row)
            
            # Write back
            with open('data/nouns.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                writer.writerows(nouns)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/get_progress')
def get_progress():
    progress = {
        'verbs': {'total': 0, 'learned': 0},
        'nouns': {'total': 0, 'learned': 0}
    }
    
    try:
        # Count verbs
        with open('data/verbs.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            learned_idx = headers.index('learned_count') if 'learned_count' in headers else -1
            
            for row in reader:
                if not row or all(cell.strip() == '' for cell in row):
                    continue
                progress['verbs']['total'] += 1
                if learned_idx >= 0 and len(row) > learned_idx:
                    try:
                        if int(row[learned_idx]) > 0:
                            progress['verbs']['learned'] += 1
                    except:
                        pass
    except FileNotFoundError:
        pass
    
    try:
        # Count nouns
        with open('data/nouns.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            learned_idx = headers.index('learned_count') if 'learned_count' in headers else -1
            
            for row in reader:
                if not row or all(cell.strip() == '' for cell in row):
                    continue
                progress['nouns']['total'] += 1
                if learned_idx >= 0 and len(row) > learned_idx:
                    try:
                        if int(row[learned_idx]) > 0:
                            progress['nouns']['learned'] += 1
                    except:
                        pass
    except FileNotFoundError:
        pass
    
    return jsonify(progress)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)