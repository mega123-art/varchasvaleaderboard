// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCAiwaEP3EiTb2mgfTeOjENIjliinIA6hE",
    authDomain: "varchasvaleaderboard.firebaseapp.com",
    projectId: "varchasvaleaderboard",
    storageBucket: "varchasvaleaderboard.firebasestorage.app",
    messagingSenderId: "711369603628",
    appId: "1:711369603628:web:82881121a316fc1993af89",
    measurementId: "G-0B6H0G6550"
  };

try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization failed:", error);
}
const db = firebase.firestore();

// Predefined departments
const DEPARTMENTS = [
    "COMPUTER SCIENCE", "ECE", "EEE", "MEC",
    "CHEM MINE", "META", "CIVIL", "ARCHI"
];

// Data storage
let leaderboards = { main: [], enthu: [] };
let events = [];

// DOM elements
const leaderboardSection = document.getElementById('leaderboard-section');
const eventsSection = document.getElementById('events-section');
const adminSection = document.getElementById('admin-section');
const leaderboardDisplay = document.getElementById('leaderboard-display');
const leaderboardTitle = document.getElementById('leaderboard-title');
const leaderboardBody = document.getElementById('leaderboard-body');
const eventsList = document.getElementById('events-list');
const leaderboardOption = document.getElementById('leaderboard-option');
const eventsOption = document.getElementById('events-option');
const adminOption = document.getElementById('admin-option');
const mainBtn = document.getElementById('main-btn');
const enthuBtn = document.getElementById('enthu-btn');
const editEnthuBtn = document.getElementById('edit-enthu-btn');
const editEventsBtn = document.getElementById('edit-events-btn');
const addEventBtn = document.getElementById('add-event-btn');
const enthuEditorForm = document.getElementById('enthu-editor-form');
const enthuPointsInputs = document.getElementById('enthu-points-inputs');
const enthuPointsForm = document.getElementById('enthu-points-form');
const addEventForm = document.getElementById('add-event-form');
const newEventForm = document.getElementById('new-event-form');
const eventEditorForm = document.getElementById('event-editor-form');
const eventSelect = document.getElementById('event-select');
const eventEditForm = document.getElementById('event-edit-form');
const deleteEventBtn = document.getElementById('delete-event-btn');

// Initialize Firestore with departments if empty
async function initializeLeaderboards() {
    try {
        for (const type of ['main', 'enthu']) {
            const snapshot = await db.collection('leaderboards').doc(type).collection('departments').get();
            if (snapshot.empty) {
                console.log(`Initializing ${type} leaderboard with departments:`, DEPARTMENTS);
                const batch = db.batch();
                DEPARTMENTS.forEach(dept => {
                    const deptRef = db.collection('leaderboards').doc(type).collection('departments').doc(dept);
                    batch.set(deptRef, { points: 0 });
                });
                await batch.commit();
                console.log(`${type} leaderboard initialized successfully`);
            } else {
                console.log(`${type} leaderboard already has data`);
            }
        }
    } catch (error) {
        console.error("Error initializing leaderboards:", error);
    }
}

// Load data from Firestore
async function loadData() {
    try {
        leaderboards.main = [];
        leaderboards.enthu = [];
        events = [];

        const mainSnapshot = await db.collection('leaderboards').doc('main').collection('departments').get();
        mainSnapshot.forEach(doc => leaderboards.main.push({ name: doc.id, points: doc.data().points || 0 }));

        const enthuSnapshot = await db.collection('leaderboards').doc('enthu').collection('departments').get();
        enthuSnapshot.forEach(doc => leaderboards.enthu.push({ name: doc.id, points: doc.data().points || 0 }));

        const eventsSnapshot = await db.collection('events').get();
        eventsSnapshot.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
        
        console.log("Data loaded successfully");
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Update leaderboard with points
async function updateLeaderboard(type, results, oldResults = null) {
    try {
        const leaderboard = leaderboards[type];
        const addPoints = async (name, points) => {
            const deptRef = db.collection('leaderboards').doc(type).collection('departments').doc(name);
            const deptDoc = await deptRef.get();
            const currentPoints = deptDoc.exists ? deptDoc.data().points : 0;
            await deptRef.set({ points: currentPoints + points });
            const dept = leaderboard.find(d => d.name === name);
            if (dept) dept.points += points;
            else leaderboard.push({ name, points });
        };
        const subtractPoints = async (name, points) => {
            const deptRef = db.collection('leaderboards').doc(type).collection('departments').doc(name);
            const deptDoc = await deptRef.get();
            const currentPoints = deptDoc.exists ? deptDoc.data().points : 0;
            await deptRef.set({ points: Math.max(0, currentPoints - points) });
            const dept = leaderboard.find(d => d.name === name);
            if (dept) dept.points = Math.max(0, dept.points - points);
        };

        if (oldResults) {
            await Promise.all([
                subtractPoints(oldResults.first, oldResults.points.first),
                subtractPoints(oldResults.second, oldResults.points.second),
                subtractPoints(oldResults.third, oldResults.points.third)
            ]);
        }
        if (results) {
            await Promise.all([
                addPoints(results.first, results.points.first),
                addPoints(results.second, results.points.second),
                addPoints(results.third, results.points.third)
            ]);
        }
        await loadData();
    } catch (error) {
        console.error("Error updating leaderboard:", error);
    }
}

// Show leaderboard section
function showLeaderboardSection() {
    leaderboardSection.style.display = 'block';
    eventsSection.style.display = 'none';
    adminSection.style.display = 'none';
    leaderboardDisplay.style.display = 'none';
}

// Show specific leaderboard
function showLeaderboard(type) {
    leaderboardDisplay.style.display = 'block';
    leaderboardTitle.textContent = type === 'main' ? 'Main Leaderboard' : 'Enthu Leaderboard';
    const data = leaderboards[type].sort((a, b) => b.points - a.points);
    leaderboardBody.innerHTML = '';
    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Rank">${index + 1}</td>
            <td data-label="Department">${entry.name}</td>
            <td data-label="Points">${entry.points}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

// Show events section
function showEventsSection() {
    leaderboardSection.style.display = 'none';
    eventsSection.style.display = 'block';
    adminSection.style.display = 'none';
    eventsList.innerHTML = '';
    events.forEach(event => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${event.name} - ${event.date}<br>
            1st: ${event.results.first} (${event.results.points.first} pts)<br>
            2nd: ${event.results.second} (${event.results.points.second} pts)<br>
            3rd: ${event.results.third} (${event.results.points.third} pts)
        `;
        eventsList.appendChild(li);
    });
}

// Show admin section
function showAdminSection() {
    leaderboardSection.style.display = 'none';
    eventsSection.style.display = 'none';
    adminSection.style.display = 'block';
    enthuEditorForm.style.display = 'none';
    addEventForm.style.display = 'none';
    eventEditorForm.style.display = 'none';
}

// Show Enthu Leaderboard editor
function showEnthuEditor() {
    enthuEditorForm.style.display = 'block';
    addEventForm.style.display = 'none';
    eventEditorForm.style.display = 'none';
    enthuPointsInputs.innerHTML = '';
    const data = leaderboards.enthu;
    DEPARTMENTS.forEach(dept => {
        const currentPoints = data.find(d => d.name === dept)?.points || 0;
        const div = document.createElement('div');
        div.innerHTML = `
            <label>${dept}: </label>
            <input type="number" name="${dept}" value="${currentPoints}" min="0" required>
        `;
        enthuPointsInputs.appendChild(div);
    });
}

// Save Enthu Leaderboard points
enthuPointsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = new FormData(enthuPointsForm);
        const batch = db.batch();
        DEPARTMENTS.forEach(dept => {
            const points = parseInt(formData.get(dept)) || 0;
            const deptRef = db.collection('leaderboards').doc('enthu').collection('departments').doc(dept);
            batch.set(deptRef, { points });
        });
        await batch.commit();
        await loadData();
        if (leaderboardDisplay.style.display === 'block' && leaderboardTitle.textContent === 'Enthu Leaderboard') {
            showLeaderboard('enthu');
        }
        enthuEditorForm.style.display = 'none';
        console.log("Enthu points saved successfully");
    } catch (error) {
        console.error("Error saving Enthu points:", error);
    }
});

// Show add event form
function showAddEventForm() {
    enthuEditorForm.style.display = 'none';
    addEventForm.style.display = 'block';
    eventEditorForm.style.display = 'none';
    document.getElementById('new-event-name').value = '';
    document.getElementById('new-event-date').value = '';
    document.getElementById('new-leaderboard-type').value = '';
    document.getElementById('new-first-place').value = '';
    document.getElementById('new-first-points').value = '';
    document.getElementById('new-second-place').value = '';
    document.getElementById('new-second-points').value = '';
    document.getElementById('new-third-place').value = '';
    document.getElementById('new-third-points').value = '';
}

// Add new event
newEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const newEvent = {
            name: document.getElementById('new-event-name').value,
            date: document.getElementById('new-event-date').value,
            leaderboard: document.getElementById('new-leaderboard-type').value,
            results: {
                first: document.getElementById('new-first-place').value,
                second: document.getElementById('new-second-place').value,
                third: document.getElementById('new-third-place').value,
                points: {
                    first: parseInt(document.getElementById('new-first-points').value) || 0,
                    second: parseInt(document.getElementById('new-second-points').value) || 0,
                    third: parseInt(document.getElementById('new-third-points').value) || 0
                }
            }
        };
        const docRef = await db.collection('events').add(newEvent);
        await updateLeaderboard(newEvent.leaderboard, newEvent.results);
        await loadData();
        if (eventsSection.style.display === 'block') showEventsSection();
        addEventForm.style.display = 'none';
        console.log("Event added successfully with ID:", docRef.id);
    } catch (error) {
        console.error("Error adding event:", error);
    }
});

// Show event editor
function showEventEditor() {
    enthuEditorForm.style.display = 'none';
    addEventForm.style.display = 'none';
    eventEditorForm.style.display = 'block';
    eventSelect.innerHTML = '<option value="" disabled selected>Select an Event to Edit</option>';
    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = `${event.name} - ${event.date}`;
        eventSelect.appendChild(option);
    });
}

// Populate event edit form
eventSelect.addEventListener('change', (e) => {
    const eventId = e.target.value;
    if (!eventId) return;
    const event = events.find(ev => ev.id === eventId);
    if (event) {
        eventEditForm.style.display = 'block';
        document.getElementById('edit-event-name').value = event.name;
        document.getElementById('edit-event-date').value = event.date;
        document.getElementById('edit-leaderboard-type').value = event.leaderboard;
        document.getElementById('edit-first-place').value = event.results.first;
        document.getElementById('edit-first-points').value = event.results.points.first;
        document.getElementById('edit-second-place').value = event.results.second;
        document.getElementById('edit-second-points').value = event.results.points.second;
        document.getElementById('edit-third-place').value = event.results.third;
        document.getElementById('edit-third-points').value = event.results.points.third;
    }
});

// Save edited event
eventEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const eventId = eventSelect.value;
        if (!eventId) return;
        const oldEvent = events.find(ev => ev.id === eventId);
        const updatedEvent = {
            name: document.getElementById('edit-event-name').value,
            date: document.getElementById('edit-event-date').value,
            leaderboard: document.getElementById('edit-leaderboard-type').value,
            results: {
                first: document.getElementById('edit-first-place').value,
                second: document.getElementById('edit-second-place').value,
                third: document.getElementById('edit-third-place').value,
                points: {
                    first: parseInt(document.getElementById('edit-first-points').value),
                    second: parseInt(document.getElementById('edit-second-points').value),
                    third: parseInt(document.getElementById('edit-third-points').value)
                }
            }
        };
        await db.collection('events').doc(eventId).set(updatedEvent);
        if (oldEvent.leaderboard === updatedEvent.leaderboard) {
            await updateLeaderboard(updatedEvent.leaderboard, updatedEvent.results, oldEvent.results);
        } else {
            await updateLeaderboard(oldEvent.leaderboard, null, oldEvent.results);
            await updateLeaderboard(updatedEvent.leaderboard, updatedEvent.results);
        }
        await loadData();
        if (eventsSection.style.display === 'block') showEventsSection();
        eventEditForm.style.display = 'none';
        eventSelect.value = '';
        console.log("Event updated successfully");
    } catch (error) {
        console.error("Error saving event changes:", error);
    }
});

// Delete event
deleteEventBtn.addEventListener('click', async () => {
    try {
        const eventId = eventSelect.value;
        if (!eventId) return;
        const eventToDelete = events.find(ev => ev.id === eventId);
        if (confirm(`Are you sure you want to delete "${eventToDelete.name}"?`)) {
            await db.collection('events').doc(eventId).delete();
            await updateLeaderboard(eventToDelete.leaderboard, null, eventToDelete.results);
            await loadData();
            if (eventsSection.style.display === 'block') showEventsSection();
            eventEditForm.style.display = 'none';
            eventSelect.value = '';
            console.log("Event deleted successfully");
        }
    } catch (error) {
        console.error("Error deleting event:", error);
    }
});

// Button events
leaderboardOption.addEventListener('click', showLeaderboardSection);
eventsOption.addEventListener('click', showEventsSection);
adminOption.addEventListener('click', showAdminSection);
mainBtn.addEventListener('click', () => showLeaderboard('main'));
enthuBtn.addEventListener('click', () => showLeaderboard('enthu'));
editEnthuBtn.addEventListener('click', showEnthuEditor);
editEventsBtn.addEventListener('click', showEventEditor);
addEventBtn.addEventListener('click', showAddEventForm);

// Initial load
initializeLeaderboards().then(() => {
    loadData().then(() => {
        showLeaderboardSection();
    });
});