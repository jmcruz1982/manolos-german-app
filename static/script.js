// Global variables
let currentWords = [];
let currentWord = null;
let currentMode = null;
let currentDirection = 'de_to_en';
let wordType = 'verbs';
let sessionStats = {
    correct: 0,
    incorrect: 0,
    total: 0
};

// Utility functions
function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

function hideAllSections() {
    ['mainMenu', 'modeSelection', 'practiceArea', 'addForm'].forEach(hideElement);
}

// Navigation functions
function showMainMenu() {
    hideAllSections();
    showElement('mainMenu');
}

function startLearning(type) {
    wordType = type;
    hideAllSections();
    showElement('modeSelection');
    
    document.getElementById('modeTitle').textContent = 
        type === 'verbs' ? 'Learn German Verbs' : 'Learn German Nouns';
    
    // Setup mode buttons
    const modes = type === 'verbs' ? 
        [
            {id: 'flashcard', name: 'Flashcards', desc: 'See word and reveal answer'},
            {id: 'multiple_choice', name: 'Multiple Choice', desc: 'Choose from 4 options'},
            {id: 'typing', name: 'Type Answer', desc: 'Type the correct translation'},
            {id: 'conjugation', name: 'Präteritum and Perfekt Tenses Practice', desc: 'Practice verb tenses'}
        ] :
        [
            {id: 'flashcard', name: 'Flashcards', desc: 'See word and reveal answer'},
            {id: 'multiple_choice', name: 'Multiple Choice', desc: 'Choose from 4 options'},
            {id: 'typing', name: 'Type Answer', desc: 'Type the correct translation'}
        ];
    
    const modeButtons = document.getElementById('modeButtons');
    modeButtons.innerHTML = modes.map(mode => `
        <button class="btn" onclick="startPractice('${mode.id}')" style="margin: 10px;">
            ${mode.name}<br><small>${mode.desc}</small>
        </button>
    `).join('');
}

async function startPractice(mode) {
    currentMode = mode;
    currentDirection = document.querySelector('input[name="direction"]:checked').value;
    sessionStats = { correct: 0, incorrect: 0, total: 0 };
    
    // Load words
    const endpoint = wordType === 'verbs' ? '/get_verbs' : '/get_nouns';
    const response = await fetch(endpoint);
    currentWords = await response.json();
    
    if (currentWords.length === 0) {
        alert('No words available! Please add some words first.');
        showMainMenu();
        return;
    }
    
    hideAllSections();
    showElement('practiceArea');
    nextWord();
}

function nextWord() {
    // Simple random selection (you can implement weighted selection later)
    currentWord = currentWords[Math.floor(Math.random() * currentWords.length)];
    
    if (currentDirection === 'random') {
        currentDirection = Math.random() < 0.5 ? 'de_to_en' : 'en_to_de';
    }
    
    updateStatsDisplay();
    
    switch (currentMode) {
        case 'flashcard':
            showFlashcard();
            break;
        case 'multiple_choice':
            showMultipleChoice();
            break;
        case 'typing':
            showTyping();
            break;
        case 'conjugation':
            showConjugation();
            break;
    }
}

function updateStatsDisplay() {
    const accuracy = sessionStats.total > 0 ? 
        (sessionStats.correct / sessionStats.total * 100).toFixed(1) : 0;
    document.getElementById('statsText').textContent = 
        `Correct: ${sessionStats.correct} | Incorrect: ${sessionStats.incorrect} | Accuracy: ${accuracy}%`;
}

function showFlashcard() {
    let question, hint, answer;
    
    if (wordType === 'verbs') {
        if (currentDirection === 'de_to_en') {
            question = currentWord.infinitiv;
            hint = `(Präteritum: ${currentWord.präteritum}, Perfekt: ${currentWord.perfekt})`;
            answer = currentWord.english;
        } else {
            question = currentWord.english;
            hint = "(German infinitive)";
            answer = currentWord.infinitiv;
        }
    } else {
        if (currentDirection === 'de_to_en') {
            question = `${currentWord.article} ${currentWord.nomen}`;
            hint = `(Plural: ${currentWord.plural})`;
            answer = currentWord.english;
        } else {
            question = currentWord.english;
            hint = "(German noun with article)";
            answer = `${currentWord.article} ${currentWord.nomen}`;
        }
    }
    
    document.getElementById('practiceContent').innerHTML = `
        <div class="flashcard">
            <div class="question">${question}</div>
            <div class="hint">${hint}</div>
            <div class="answer" id="flashcardAnswer"></div>
            <button class="btn" id="revealBtn" onclick="revealAnswer('${answer}')">Reveal Answer</button>
        </div>
    `;
}

function revealAnswer(answer) {
    document.getElementById('flashcardAnswer').textContent = answer;
    document.getElementById('revealBtn').style.display = 'none';
    document.getElementById('practiceContent').innerHTML += `
        <div style="margin-top: 20px;">
            <button class="btn" onclick="recordResult(true)">I got it right!</button>
            <button class="btn" onclick="recordResult(false)">I got it wrong</button>
        </div>
    `;
}

function showMultipleChoice() {
    let question, correctAnswer;
    
    if (wordType === 'verbs') {
        if (currentDirection === 'de_to_en') {
            question = `What does '${currentWord.infinitiv}' mean?`;
            correctAnswer = currentWord.english;
        } else {
            question = `How do you say '${currentWord.english}' in German?`;
            correctAnswer = currentWord.infinitiv;
        }
    } else {
        if (currentDirection === 'de_to_en') {
            question = `What does '${currentWord.article} ${currentWord.nomen}' mean?`;
            correctAnswer = currentWord.english;
        } else {
            question = `How do you say '${currentWord.english}' in German?`;
            correctAnswer = `${currentWord.article} ${currentWord.nomen}`;
        }
    }
    
    // Generate options
    const options = [correctAnswer];
    const otherWords = currentWords.filter(w => w !== currentWord);
    
    for (let i = 0; i < Math.min(3, otherWords.length); i++) {
        const word = otherWords[Math.floor(Math.random() * otherWords.length)];
        let option;
        
        if (wordType === 'verbs') {
            option = currentDirection === 'de_to_en' ? word.english : word.infinitiv;
        } else {
            option = currentDirection === 'de_to_en' ? word.english : `${word.article} ${word.nomen}`;
        }
        
        if (!options.includes(option)) {
            options.push(option);
        }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    document.getElementById('practiceContent').innerHTML = `
        <div>
            <h3>${question}</h3>
            ${options.map(option => `
                <button class="choice-button" onclick="checkMultipleChoice('${option.replace(/'/g, "\\'")}', '${correctAnswer.replace(/'/g, "\\'")}')">${option}</button>
            `).join('')}
        </div>
    `;
}

function checkMultipleChoice(selected, correct) {
    const isCorrect = selected === correct;
    recordResult(isCorrect);
}

function showTyping() {
    let question, correctAnswer;
    
    if (wordType === 'verbs') {
        if (currentDirection === 'de_to_en') {
            question = `Type the English translation of:\n\n${currentWord.infinitiv}`;
            correctAnswer = currentWord.english;
        } else {
            question = `Type the German translation of:\n\n${currentWord.english}`;
            correctAnswer = currentWord.infinitiv;
        }
    } else {
        if (currentDirection === 'de_to_en') {
            question = `Type the English translation of:\n\n${currentWord.article} ${currentWord.nomen}`;
            correctAnswer = currentWord.english;
        } else {
            question = `Type the German translation of:\n\n${currentWord.english}`;
            correctAnswer = `${currentWord.article} ${currentWord.nomen}`;
        }
    }
    
    document.getElementById('practiceContent').innerHTML = `
        <div>
            <h3>${question}</h3>
            <input type="text" class="typing-input" id="typingInput" onkeypress="if(event.key==='Enter') checkTyping('${correctAnswer.replace(/'/g, "\\'")}')" autofocus>
            <button class="btn" onclick="checkTyping('${correctAnswer.replace(/'/g, "\\'")}')">Submit</button>
            <div id="typingFeedback"></div>
        </div>
    `;
    
    document.getElementById('typingInput').focus();
}

function checkTyping(correctAnswer) {
    const userAnswer = document.getElementById('typingInput').value.trim();
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    if (!isCorrect) {
        document.getElementById('typingFeedback').innerHTML = 
            `<p class="incorrect">Correct answer: ${correctAnswer}</p>`;
    }
    
    recordResult(isCorrect);
}

function showConjugation() {
    const tenses = ['präteritum', 'perfekt'];
    const selectedTenses = Math.random() < 0.5 ? [tenses[Math.floor(Math.random() * 2)]] : tenses;
    
    let formHtml = `
        <div>
            <h3>Conjugate: ${currentWord.infinitiv}</h3>
            <p>English: ${currentWord.english}</p>
            <div class="conjugation-grid">
    `;
    
    selectedTenses.forEach(tense => {
        const displayName = tense.charAt(0).toUpperCase() + tense.slice(1);
        formHtml += `
            <div class="conjugation-label">${displayName}:</div>
            <input type="text" class="form-group input" id="${tense}Input" data-tense="${tense}">
        `;
    });
    
    formHtml += `
            </div>
            <button class="btn" onclick="checkConjugation([${selectedTenses.map(t => `'${t}'`).join(',')}])">Check Answer</button>
            <div id="conjugationFeedback"></div>
        </div>
    `;
    
    document.getElementById('practiceContent').innerHTML = formHtml;
    document.querySelector('.conjugation-grid input').focus();
}

function checkConjugation(tenses) {
    let allCorrect = true;
    let feedback = '';
    
    tenses.forEach(tense => {
        const input = document.getElementById(`${tense}Input`);
        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = currentWord[tense].toLowerCase();
        
        if (userAnswer === correctAnswer) {
            feedback += `<p class="correct">✓ ${tense}: Correct!</p>`;
        } else {
            feedback += `<p class="incorrect">✗ ${tense}: ${currentWord[tense]}</p>`;
            allCorrect = false;
        }
    });
    document.getElementById('conjugationFeedback').innerHTML = feedback;
    
    setTimeout(() => {
        recordResult(allCorrect);
    }, 2000);
}

async function recordResult(isCorrect) {
    sessionStats.total++;
    if (isCorrect) {
        sessionStats.correct++;
    } else {
        sessionStats.incorrect++;
    }
    
    updateStatsDisplay();
    
    // Update progress tracking
    const wordId = wordType === 'verbs' ? currentWord.infinitiv : currentWord.nomen;
    await fetch('/update_learned_count', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            type: wordType === 'verbs' ? 'verb' : 'noun',
            word: wordId
        })
    });
    
    // Show feedback and move to next word
    const feedbackText = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    const feedbackColor = isCorrect ? 'green' : 'red';
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = `text-align: center; font-size: 18px; font-weight: bold; color: ${feedbackColor}; margin-top: 20px;`;
    feedbackDiv.textContent = feedbackText;
    document.getElementById('practiceContent').appendChild(feedbackDiv);
    
    setTimeout(nextWord, 1500);
}

function endSession() {
    hideAllSections();
    showElement('modeSelection');
}

// Add word functions
function showAddForm(type) {
    wordType = type;
    hideAllSections();
    showElement('addForm');
	    document.getElementById('addFormTitle').textContent = 
        type === 'verbs' ? 'Add New German Verb' : 'Add New German Noun';
    
    let formFields = '';
    
    if (type === 'verbs') {
        formFields = `
            <div class="form-group">
                <label for="infinitiv">Infinitiv:</label>
                <input type="text" id="infinitiv" name="infinitiv" required placeholder="e.g., gehen">
            </div>
            <div class="form-group">
                <label for="präteritum">Präteritum:</label>
                <input type="text" id="präteritum" name="präteritum" required placeholder="e.g., ging">
            </div>
            <div class="form-group">
                <label for="perfekt">Perfekt:</label>
                <input type="text" id="perfekt" name="perfekt" required placeholder="e.g., ist gegangen">
            </div>
            <div class="form-group">
                <label for="english">English:</label>
                <input type="text" id="english" name="english" required placeholder="e.g., to go">
            </div>
        `;
    } else {
        formFields = `
            <div class="form-group">
                <label for="article">Article:</label>
                <select id="article" name="article" required>
                    <option value="der">der</option>
                    <option value="die">die</option>
                    <option value="das">das</option>
                </select>
            </div>
            <div class="form-group">
                <label for="nomen">Noun:</label>
                <input type="text" id="nomen" name="nomen" required placeholder="e.g., Mann">
            </div>
            <div class="form-group">
                <label for="plural">Plural:</label>
                <input type="text" id="plural" name="plural" required placeholder="e.g., Männer">
            </div>
            <div class="form-group">
                <label for="english">English:</label>
                <input type="text" id="english" name="english" required placeholder="e.g., man">
            </div>
        `;
    }
    
    document.getElementById('formFields').innerHTML = formFields;
    
    // Set up form submission
    document.getElementById('wordForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveWord();
    };
}

async function saveWord() {
    const formData = {};
    const inputs = document.getElementById('wordForm').querySelectorAll('input, select');
    
    inputs.forEach(input => {
        formData[input.name] = input.value;
    });
    
    try {
        const endpoint = wordType === 'verbs' ? '/add_verb' : '/add_noun';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`${wordType === 'verbs' ? 'Verb' : 'Noun'} added successfully!`);
            clearForm();
        } else {
            alert(result.error || 'Error adding word');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function clearForm() {
    document.getElementById('wordForm').reset();
}